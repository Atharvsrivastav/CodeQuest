import { NextResponse } from "next/server";

import { getChallengeById } from "@/lib/challenges";
import { callGemini, extractJsonObject } from "@/lib/gemini";

type EvaluateRequestBody = {
  code?: string;
  challengeId?: string;
};

type RawEvaluationResult = {
  passed?: boolean;
  passedTests?: number;
  totalTests?: number;
  feedback?: string;
  suggestion?: string;
  results?: Array<{
    input?: string;
    expected?: string;
    actual?: string;
    passed?: boolean;
  }>;
};

type EvaluationTestResult = {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EvaluateRequestBody;
    const challengeId = typeof body.challengeId === "string" ? body.challengeId : "";
    const code = typeof body.code === "string" ? body.code.trimEnd() : "";
    const challenge = challengeId ? getChallengeById(challengeId) : undefined;

    if (!challengeId || !code) {
      return NextResponse.json(
        { error: "Both challengeId and code are required." },
        { status: 400 }
      );
    }

    if (!challenge) {
      return NextResponse.json(
        { error: "Unknown challenge id." },
        { status: 404 }
      );
    }

    const prompt = [
      "You are evaluating a student's programming submission for CodeQuest.",
      `Language: ${challenge.language}`,
      `Challenge title: ${challenge.title}`,
      `Description: ${challenge.description}`,
      `Hint for context: ${challenge.hint}`,
      `Tags: ${challenge.tags.join(", ")}`,
      "Test cases:",
      JSON.stringify(challenge.testCases, null, 2),
      "Student code:",
      code,
      'Respond with ONLY a JSON object using this exact shape: {"passed": boolean, "passedTests": number, "totalTests": number, "feedback": string, "suggestion": string, "results": [{"input": string, "expected": string, "actual": string, "passed": boolean}]}.',
      'Evaluate each test case independently. The "results" array must contain one item per provided test case in the same order.',
      'Always include an "actual" value. If the behavior cannot be inferred confidently, set "actual" to "unclear from submission" and mark that test as failed.',
      "If anything is unclear or likely incorrect, be conservative and mark the failing tests accordingly.",
      "Do not use markdown fences."
    ].join("\n\n");

    const message = await callGemini({
      mode: "evaluation",
      context:
        "This is a private coding evaluation task. Compare the code against the supplied challenge details and return valid JSON only.",
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
          },
          results: {
            type: "array",
            description: "Per-test evaluation details in the same order as the provided test cases.",
            items: {
              type: "object",
              properties: {
                input: {
                  type: "string"
                },
                expected: {
                  type: "string"
                },
                actual: {
                  type: "string"
                },
                passed: {
                  type: "boolean"
                }
              },
              required: ["input", "expected", "actual", "passed"],
              additionalProperties: false
            }
          }
        },
        required: ["passed", "passedTests", "totalTests", "feedback", "suggestion", "results"],
        additionalProperties: false
      }
    });

    const result = extractJsonObject<RawEvaluationResult>(message);
    const rawResults = Array.isArray(result.results) ? result.results : [];
    const results: EvaluationTestResult[] = challenge.testCases.map((testCase, index) => {
      const raw = rawResults[index];

      return {
        input: testCase.input,
        expected: testCase.expected,
        actual:
          typeof raw?.actual === "string" && raw.actual.trim()
            ? raw.actual
            : "unclear from submission",
        passed: Boolean(raw?.passed)
      };
    });
    const passedTests = results.filter((item) => item.passed).length;
    const totalTests = challenge.testCases.length;

    return NextResponse.json({
      passed: results.length > 0 && passedTests === totalTests,
      passedTests,
      totalTests,
      feedback: String(result.feedback ?? ""),
      suggestion: String(result.suggestion ?? ""),
      results
    });
  } catch (error) {
    return NextResponse.json(
      {
        passed: false,
        passedTests: 0,
        totalTests: 0,
        feedback: error instanceof Error ? error.message : "Unable to evaluate this submission.",
        suggestion: "Try running the evaluation again after checking the Gemini API configuration.",
        results: []
      },
      { status: 500 }
    );
  }
}
