import { aiReplySummary } from "@/src/types/summary";

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
            "Du bist ein Assistent, der Lerntexte zusammenfasst. Antworte NUR mit einem JSON-Objekt in genau diesem Format: " +
            '{"title": string, "summary": string, "difficulty": "easy" | "medium" | "hard"}. ' +
            "Kein zusätzlicher Text, keine Markdown-Codeblöcke.",
        },
        {
          role: "user",
          content:
            "Fasse den folgenden Text auf ca. ein Fünftel der ursprünglichen Länge zusammen und gib ihm einen Titel:\n\n" +
            text,
        },
      ],
    }),
  });

  const data = await response.json();
  console.log("Kompletter Response-Status:", response.status);
  console.log("Komplette Groq-Antwort:", JSON.stringify(data, null, 2));

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
    console.log("Zod-Fehler:", result.error);
    return;
  }

  return {
    title: result.data.title,
    summary: result.data.summary,
    difficulty: result.data.difficulty,
  };
}