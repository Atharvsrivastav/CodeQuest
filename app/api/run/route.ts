import { NextResponse } from "next/server";

import { getChallengeById } from "@/lib/challenges";
import { callGemini } from "@/lib/gemini";

type RunRequestBody = {
  code?: string;
  challengeId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RunRequestBody;
    const challengeId = typeof body.challengeId === "string" ? body.challengeId : "";
    const code = typeof body.code === "string" ? body.code.trimEnd() : "";
    const challenge = challengeId ? getChallengeById(challengeId) : undefined;

    if (!challengeId || !code) {
      return NextResponse.json(
        {
          status: "error" as const,
          output: "Both challengeId and code are required."
        },
        { status: 400 }
      );
    }

    if (!challenge) {
      return NextResponse.json(
        {
          status: "error" as const,
          output: "Unknown challenge id."
        },
        { status: 404 }
      );
    }

    const output = await callGemini({
      mode: "editor",
      context: {
        challengeId: challenge.id,
        title: challenge.title,
        description: challenge.description,
        language: challenge.language,
        testCases: challenge.testCases
      },
      messages: [
        {
          role: "user",
          content: [
            `Simulate the raw console output for this ${challenge.language} challenge submission.`,
            "Return only the output text with no explanation.",
            "If the code would raise an error or fail to run, return the raw error text only.",
            "If nothing is printed, return (no output).",
            "Student code:",
            code
          ].join("\n\n")
        }
      ],
      maxTokens: 700
    });

    return NextResponse.json({
      status: "ok" as const,
      output
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error" as const,
        output: error instanceof Error ? error.message : "Unable to run this submission."
      },
      { status: 500 }
    );
  }
}
