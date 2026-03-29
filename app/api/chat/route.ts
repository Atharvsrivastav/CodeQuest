import { NextResponse } from "next/server";

import { callGemini, type AiMessage, type AiMode } from "@/lib/gemini";

type ChatRequestBody = {
  messages?: AiMessage[];
  mode?: AiMode;
  context?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody;
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const mode = body.mode ?? "coding";

    if (!messages.length) {
      return NextResponse.json({ error: "Messages are required." }, { status: 400 });
    }

    const message = await callGemini({
      messages,
      mode,
      context: body.context,
      maxTokens: 1024
    });

    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to complete the chat request."
      },
      { status: 500 }
    );
  }
}
