from __future__ import annotations

import json
import os
import random
from dataclasses import dataclass, field
from pathlib import Path
from threading import Lock
from typing import Literal
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover
    load_dotenv = None

try:
    from openai import OpenAI
except ImportError:  # pragma: no cover
    OpenAI = None

if load_dotenv is not None:
    env_local_path = Path(__file__).with_name(".env.local")
    env_path = Path(__file__).with_name(".env")
    if env_local_path.exists():
        load_dotenv(env_local_path)
    elif env_path.exists():
        load_dotenv(env_path)

Language = Literal["English", "Hindi", "German"]
Difficulty = Literal["easy", "medium", "hard"]

QUESTION_BANK_PATH = Path(__file__).with_name("question_bank.json")
TOTAL_QUESTIONS_PER_SESSION = 10
DIFFICULTY_FLOW: tuple[Difficulty, ...] = ("easy", "medium", "hard")
POINTS_BY_DIFFICULTY: dict[Difficulty, int] = {"easy": 10, "medium": 20, "hard": 30}

QUESTION_BANK = json.loads(QUESTION_BANK_PATH.read_text(encoding="utf-8"))
QUESTIONS_BY_ID = {question["id"]: question for question in QUESTION_BANK}
SESSION_LOCK = Lock()


@dataclass
class SessionState:
    language: Language
    difficulty: Difficulty = "easy"
    score: int = 0
    streak: int = 0
    correct_streak: int = 0
    wrong_streak: int = 0
    answered_count: int = 0
    total_questions: int = TOTAL_QUESTIONS_PER_SESSION
    served_question_ids: list[str] = field(default_factory=list)
    current_question_id: str | None = None


class StartRequest(BaseModel):
    language: Language


class AnswerRequest(BaseModel):
    session_id: str = Field(min_length=1)
    selected_option: str = Field(min_length=1)
    question_id: str = Field(min_length=1)
    language: Language


def build_openai_client() -> OpenAI | None:
    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    if not api_key or OpenAI is None:
        return None
    return OpenAI(api_key=api_key)


OPENAI_CLIENT = build_openai_client()
OPENAI_MODEL = (os.getenv("OPENAI_MODEL") or "gpt-5.4-mini").strip() or "gpt-5.4-mini"


def get_allowed_origins() -> list[str]:
    raw_origins = os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000"
    )
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


app = FastAPI(
    title="AI Adaptive Learning Tutor API",
    version="1.0.0",
    description="Adaptive quiz engine with multilingual explanations for the AI Adaptive Learning Tutor."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


SESSIONS: dict[str, SessionState] = {}


def get_session_or_404(session_id: str) -> SessionState:
    session = SESSIONS.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found. Start a new quiz session.")
    return session


def current_question_number(session: SessionState, question_present: bool) -> int:
    pending = 1 if question_present and session.answered_count < session.total_questions else 0
    return min(session.answered_count + pending, session.total_questions)


def serialize_question(question: dict[str, object]) -> dict[str, object]:
    return {
        "id": question["id"],
        "category": question["category"],
        "difficulty": question["difficulty"],
        "prompt": question["prompt"],
        "options": question["options"]
    }


def session_snapshot(session: SessionState) -> dict[str, object]:
    return {
        "language": session.language,
        "difficulty": session.difficulty,
        "score": session.score,
        "streak": session.streak,
        "answered_count": session.answered_count,
        "total_questions": session.total_questions,
        "quiz_complete": session.answered_count >= session.total_questions
    }


def choose_question(session: SessionState) -> dict[str, object] | None:
    if session.answered_count >= session.total_questions:
        return None

    if session.current_question_id:
        return QUESTIONS_BY_ID[session.current_question_id]

    unused_questions = [q for q in QUESTION_BANK if q["id"] not in session.served_question_ids]
    if not unused_questions:
        session.served_question_ids.clear()
        unused_questions = list(QUESTION_BANK)

    preferred_questions = [q for q in unused_questions if q["difficulty"] == session.difficulty]
    candidates = preferred_questions or unused_questions
    question = random.choice(candidates)
    session.served_question_ids.append(question["id"])
    session.current_question_id = question["id"]
    return question


def build_question_payload(session: SessionState, question: dict[str, object] | None) -> dict[str, object]:
    return {
        **session_snapshot(session),
        "question_number": current_question_number(session, question is not None),
        "question": serialize_question(question) if question else None
    }


def adjust_difficulty(session: SessionState) -> Literal["up", "down", "same"]:
    current_index = DIFFICULTY_FLOW.index(session.difficulty)

    if session.correct_streak >= 3 and current_index < len(DIFFICULTY_FLOW) - 1:
        session.difficulty = DIFFICULTY_FLOW[current_index + 1]
        session.correct_streak = 0
        session.wrong_streak = 0
        return "up"

    if session.wrong_streak >= 2 and current_index > 0:
        session.difficulty = DIFFICULTY_FLOW[current_index - 1]
        session.correct_streak = 0
        session.wrong_streak = 0
        return "down"

    return "same"


def extract_output_text(response: object) -> str:
    output_text = getattr(response, "output_text", "")
    if isinstance(output_text, str) and output_text.strip():
        return output_text.strip()

    parts: list[str] = []
    for item in getattr(response, "output", []) or []:
        if getattr(item, "type", None) != "message":
            continue
        for content in getattr(item, "content", []) or []:
            text_value = getattr(content, "text", None)
            if isinstance(text_value, str) and text_value.strip():
                parts.append(text_value.strip())

    return "\n".join(parts).strip()


def build_fallback_explanation(question: dict[str, object], language: Language) -> str:
    fallback_explanations = question.get("fallback_explanations", {})
    if not isinstance(fallback_explanations, dict):
        return "Explanation unavailable right now."
    value = fallback_explanations.get(language) or fallback_explanations.get("English")
    return str(value or "Explanation unavailable right now.")


def build_step_by_step_fallback(
    *,
    question: dict[str, object],
    selected_option: str,
    language: Language,
    correct: bool
) -> str:
    correct_option = str(question["correct_option"])
    base_reason = build_fallback_explanation(question, language)

    if language == "Hindi":
        if correct:
            return "\n".join(
                [
                    "स्टेप 1: पहले देखें कि सवाल किस coding rule या keyword को check कर रहा है।",
                    f"स्टेप 2: सही answer `{correct_option}` है, और आपने वही चुना।",
                    f"स्टेप 3: {base_reason}",
                    "स्टेप 4: इसी rule को याद रखें, क्योंकि ऐसे questions में exact syntax या concept बहुत important होता है।",
                ]
            )

        return "\n".join(
            [
                "स्टेप 1: पहले सवाल के मुख्य concept को पहचानें।",
                f"स्टेप 2: सही answer `{correct_option}` है, लेकिन आपने `{selected_option}` चुना।",
                f"स्टेप 3: {base_reason}",
                "स्टेप 4: अगली बार keyword, operator, या concept के exact meaning पर ध्यान दें।",
            ]
        )

    if language == "German":
        if correct:
            return "\n".join(
                [
                    "Schritt 1: Schau zuerst, welche Coding-Regel oder welches Keyword die Frage prueft.",
                    f"Schritt 2: Die richtige Antwort ist `{correct_option}`, und genau diese hast du ausgewaehlt.",
                    f"Schritt 3: {base_reason}",
                    "Schritt 4: Merke dir diese Regel, weil aehnliche Fragen oft auf genau diesem Syntaxpunkt aufbauen.",
                ]
            )

        return "\n".join(
            [
                "Schritt 1: Erkenne zuerst das Hauptkonzept der Frage.",
                f"Schritt 2: Die richtige Antwort ist `{correct_option}`, aber du hast `{selected_option}` gewaehlt.",
                f"Schritt 3: {base_reason}",
                "Schritt 4: Achte beim naechsten Mal besonders auf das genaue Keyword, den Operator oder die Regel.",
            ]
        )

    if correct:
        return "\n".join(
            [
                "Step 1: Identify the coding rule or keyword the question is testing.",
                f"Step 2: The correct answer is `{correct_option}`, and you selected it correctly.",
                f"Step 3: {base_reason}",
                "Step 4: Keep that rule in mind, because similar coding questions often depend on the exact syntax or concept.",
            ]
        )

    return "\n".join(
        [
            "Step 1: Start by spotting the main coding concept in the question.",
            f"Step 2: The correct answer is `{correct_option}`, but you selected `{selected_option}`.",
            f"Step 3: {base_reason}",
            "Step 4: Next time, focus on the exact keyword, operator, or behavior the question is checking.",
        ]
    )


def generate_explanation(
    *,
    question: dict[str, object],
    selected_option: str,
    language: Language,
    correct: bool
) -> str:
    fallback = build_step_by_step_fallback(
        question=question,
        selected_option=selected_option,
        language=language,
        correct=correct,
    )
    if OPENAI_CLIENT is None:
        return fallback

    options = question.get("options", [])
    options_text = ", ".join(str(option) for option in options)
    correctness_instruction = (
        "The learner was correct. Praise briefly, then teach the reasoning step by step like a coding tutor."
        if correct
        else "The learner was incorrect. Explain carefully, step by step, and keep the tone supportive."
    )
    prompt = (
        f"Question: {question['prompt']}\n"
        f"Options: {options_text}\n"
        f"Correct answer: {question['correct_option']}\n"
        f"User answer: {selected_option}\n"
        f"Instruction: Explain this in simple beginner-friendly {language}.\n"
        f"Additional instruction: {correctness_instruction}\n"
        "Use exactly 4 short steps. Mention why the correct answer works and what to notice next time."
    )

    try:
        response = OPENAI_CLIENT.responses.create(
            model=OPENAI_MODEL,
            instructions=(
                "You are a patient programming tutor. Be accurate, simple, and kind. "
                "Respect the requested language exactly. "
                "Return plain text only, with four short numbered steps."
            ),
            input=prompt
        )
        explanation = extract_output_text(response)
        return explanation or fallback
    except Exception:
        return fallback


@app.get("/")
def root() -> dict[str, str]:
    return {
        "message": "AI Adaptive Learning Tutor API is running.",
        "docs": "/docs"
    }


@app.get("/health")
def healthcheck() -> dict[str, object]:
    return {
        "status": "ok",
        "question_count": len(QUESTION_BANK),
        "openai_configured": OPENAI_CLIENT is not None
    }


@app.post("/start")
def start_quiz(request: StartRequest) -> dict[str, object]:
    session_id = str(uuid4())
    session = SessionState(language=request.language)
    question = choose_question(session)

    if question is None:
        raise HTTPException(status_code=500, detail="Question bank is empty.")

    with SESSION_LOCK:
        SESSIONS[session_id] = session

    return {
        "session_id": session_id,
        **build_question_payload(session, question)
    }


@app.get("/question")
def get_question(session_id: str = Query(..., min_length=1)) -> dict[str, object]:
    with SESSION_LOCK:
        session = get_session_or_404(session_id)
        question = choose_question(session)
        return build_question_payload(session, question)


@app.post("/answer")
def submit_answer(request: AnswerRequest) -> dict[str, object]:
    with SESSION_LOCK:
        session = get_session_or_404(request.session_id)
        session.language = request.language

        if session.current_question_id is None:
            raise HTTPException(status_code=409, detail="No active question. Request the next question first.")

        if session.current_question_id != request.question_id:
            raise HTTPException(
                status_code=409,
                detail="Question mismatch. Please answer the currently active question."
            )

        question = QUESTIONS_BY_ID.get(request.question_id)
        if question is None:
            raise HTTPException(status_code=404, detail="Question not found.")

        correct = request.selected_option == question["correct_option"]
        if correct:
            session.score += POINTS_BY_DIFFICULTY[question["difficulty"]]
            session.streak += 1
            session.correct_streak += 1
            session.wrong_streak = 0
        else:
            session.streak = 0
            session.correct_streak = 0
            session.wrong_streak += 1

        difficulty_direction = adjust_difficulty(session)
        session.answered_count += 1
        session.current_question_id = None

        response_payload = {
            "correct": correct,
            "next_difficulty": session.difficulty,
            "score": session.score,
            "streak": session.streak,
            "correct_option": question["correct_option"],
            "difficulty_direction": difficulty_direction,
            "question_number": session.answered_count,
            "total_questions": session.total_questions,
            "quiz_complete": session.answered_count >= session.total_questions,
            "language": session.language
        }

    response_payload["explanation"] = generate_explanation(
        question=question,
        selected_option=request.selected_option,
        language=request.language,
        correct=correct
    )

    return response_payload
