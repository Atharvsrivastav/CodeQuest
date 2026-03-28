import { NextResponse } from "next/server";

import { callGemini, extractJsonObject } from "@/lib/gemini";
import type { CodingChallenge } from "@/lib/data";

type EvaluateRequestBody = {
  code?: string;
  challenge?: CodingChallenge;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EvaluateRequestBody;

    if (!body.code || !body.challenge) {
      return NextResponse.json(
        { error: "Both code and challenge are required." },
        { status: 400 }
      );
    }

    const prompt = [
      "You are evaluating a student's programming submission for Learnly.",
      `Language: ${body.challenge.language}`,
      `Challenge title: ${body.challenge.title}`,
      `Description: ${body.challenge.description}`,
      `Hint for context: ${body.challenge.hint}`,
      `Tags: ${body.challenge.tags.join(", ")}`,
      "Test cases:",
      JSON.stringify(body.challenge.testCases, null, 2),
      "Student code:",
      body.code,
      'Respond with ONLY a JSON object using this exact shape: {"passed": boolean, "passedTests": number, "totalTests": number, "feedback": string, "suggestion": string}.',
      "If anything is unclear or likely incorrect, be conservative and mark the failing tests accordingly.",
      "Do not use markdown fences."
    ].join("\n\n");

    const message = await callGemini({
      mode: "general",
      context:
        "This is a private evaluation task. Compare the code against the test cases and return valid JSON only.",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      maxTokens: 700,
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: "object",
        description: "Result of evaluating a student's code submission.",
        properties: {
          passed: {
            type: "boolean",
            description: "Whether the submission passes the challenge overall."
          },
          passedTests: {
            type: "integer",
            description: "How many tests passed."
          },
          totalTests: {
            type: "integer",
            description: "Total number of evaluated tests."
          },
          feedback: {
            type: "string",
            description: "Short evaluation summary for the student."
          },
          suggestion: {
            type: "string",
            description: "One actionable next step or fix suggestion."
          }
        },
        required: ["passed", "passedTests", "totalTests", "feedback", "suggestion"],
        additionalProperties: false
      }
    });

    const result = extractJsonObject(message);

    return NextResponse.json({
      passed: Boolean(result.passed),
      passedTests: Number(result.passedTests ?? 0),
      totalTests: Number(result.totalTests ?? body.challenge.testCases.length),
      feedback: String(result.feedback ?? ""),
      suggestion: String(result.suggestion ?? "")
    });
  } catch (error) {
    return NextResponse.json(
      {
        passed: false,
        passedTests: 0,
        totalTests: 0,
        feedback: error instanceof Error ? error.message : "Unable to evaluate this submission.",
        suggestion: "Try running the evaluation again after checking the Gemini API configuration."
      },
      { status: 500 }
    );
  }
}
