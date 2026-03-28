export type AiMode = "coding" | "language" | "general";

export type AiMessage = {
  role: "user" | "assistant";
  content: string;
};

type JsonSchema =
  | {
      type: string | string[];
      properties?: Record<string, JsonSchema>;
      items?: JsonSchema;
      required?: string[];
      description?: string;
      additionalProperties?: boolean;
      enum?: Array<string | number | boolean>;
    }
  | Record<string, unknown>;

type CallGeminiOptions = {
  messages: AiMessage[];
  mode: AiMode;
  context?: unknown;
  maxTokens?: number;
  responseMimeType?: string;
  responseJsonSchema?: JsonSchema;
};

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const BASE_SYSTEM_PROMPTS: Record<AiMode, string> = {
  coding:
    "You are Learnly's coding tutor. Be patient, concise, and encouraging. Teach with hints, next steps, debugging guidance, and tiny illustrative snippets only. Do not provide complete solutions or fully solved final code. If a user asks for output simulation, return only the raw output they requested.",
  language:
    "You are Learnly's language tutor. Be friendly, clear, and motivating. Explain answers with translations, pronunciation help when useful, and short examples. Keep responses practical and easy to study.",
  general:
    "You are Learnly's general tutor for programming and spoken languages. Adapt to the user's topic, stay concise, and provide actionable explanations, examples, or guided practice."
};

export async function callGemini({
  messages,
  mode,
  context,
  maxTokens = 1024,
  responseMimeType,
  responseJsonSchema
}: CallGeminiOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  const systemInstruction = [BASE_SYSTEM_PROMPTS[mode], context ? `Context:\n${serializeContext(context)}` : ""]
    .filter(Boolean)
    .join("\n\n");

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey
    },
    cache: "no-store",
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: messages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }]
      })),
      generationConfig: {
        maxOutputTokens: maxTokens,
        ...(responseMimeType ? { responseMimeType } : {}),
        ...(responseJsonSchema ? { responseJsonSchema } : {})
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed with status ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text?.trim())
    .filter((part): part is string => Boolean(part))
    .join("\n\n");

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}

export function extractJsonObject(text: string) {
  const cleaned = text.replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new Error("Gemini response did not contain a JSON object.");
  }

  return JSON.parse(cleaned.slice(start, end + 1)) as {
    passed: boolean;
    passedTests: number;
    totalTests: number;
    feedback: string;
    suggestion: string;
  };
}

function serializeContext(context: unknown) {
  if (typeof context === "string") {
    return context;
  }

  return JSON.stringify(context, null, 2);
}
