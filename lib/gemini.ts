export type AiMode = "coding" | "editor" | "evaluation";

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
    "You are CodeQuest's coding tutor. Be patient, concise, and encouraging. Teach with hints, debugging guidance, decomposition, and tiny illustrative snippets only. Do not provide complete solutions or fully solved final code unless the user explicitly asks for one outside of a challenge context.",
  editor:
    "You simulate console output for CodeQuest's editor. Return only the requested output with no explanation, markdown, or extra framing. If nothing prints, respond with (no output).",
  evaluation:
    "You evaluate programming submissions for CodeQuest. Follow the requested response format exactly, stay conservative when code behavior is unclear, and do not add markdown fences."
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

export function extractJsonObject<T>(text: string): T {
  const cleaned = text.replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new Error("Gemini response did not contain a JSON object.");
  }

  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

function serializeContext(context: unknown) {
  if (typeof context === "string") {
    return context;
  }

  return JSON.stringify(context, null, 2);
}
