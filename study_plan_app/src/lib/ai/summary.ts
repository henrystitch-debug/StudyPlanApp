import { aiReplySummary } from "@/src/types/summary";
import { promptSummary } from "@/src/utils/prompts";

// create new summary from AI

export async function createSummary(text: string) {

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.GROQ_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            promptSummary
        },
        {
          role: "user",
          content:
            "Summarize this text and give it a title: \n\n" +
            text,
        },
      ],
    }),
  });

  const data = await response.json();
  console.log("Complete response-status:", response.status);
  console.log("Complete groq-answer:", JSON.stringify(data, null, 2));

  const rawContent = data.choices?.[0]?.message?.content;

  if (!rawContent) return;

  let parsedContent: unknown;
  try {
    parsedContent = JSON.parse(rawContent);
  } catch {
    return;
  }

  console.log("Von Groq erhalten:", parsedContent);

  const result = aiReplySummary.safeParse(parsedContent);
  if (!result.success) {
    console.log("Zod-Error:", result.error);
    return;
  }

  return {
    title: result.data.title,
    summary: result.data.summary,
  };
}