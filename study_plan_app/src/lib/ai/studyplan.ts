import { GoogleGenAI } from "@google/genai";
import { Calender, CalenderItem } from "@/types/calender";
import { TopicIndices } from "@/types/topicIndex";
import { aiStudyplanResponse, studyplanResponseSchema } from "@/types/studyplan";
import { promptStudyplan } from "@/utils/prompts";
import { StudyplanResult } from "@/types/studyplan";
import { withRetry } from "@/utils/retryApiCall";
import { GEMINI_MODEL } from "./config";

const ai = new GoogleGenAI({});

export async function createStudyplan(startDate: Date, endDate: Date, calendarEvents: Calender, topicIndeces: TopicIndices, capacity: number): Promise<StudyplanResult>{

    const calenderJustInfo = calendarEvents.map((event: CalenderItem) => ({
                date: event.date,
                title: event.title, 
                startTime: event.startTime,
                endTime: event.endTime
            }));

      const userPrompt = `  Start date: ${startDate}
                            End date: ${endDate}

                            Existing calendar entries in this period (do NOT schedule over these):
                            ${JSON.stringify(calenderJustInfo, null, 2)}

                            Topics to cover (from the student's uploaded materials):
                            ${JSON.stringify(topicIndeces, null, 2)}

                            Available study capacity: ${capacity} hours per week.

                            Generate a full study plan covering all topics above within the given date range.`;

     const response = await withRetry(() =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ text: userPrompt }],
        config: {
        systemInstruction: promptStudyplan,
        responseMimeType: "application/json",
        responseSchema: studyplanResponseSchema,
        },
    }));

    if(!response.text){
        return {
            success: false, error: "No studyplan received from API"
        }
    }

    // Gemini liefert laut studyplanResponseSchema ein Objekt { items: [...] },
    // aiStudyplanResponse erwartet aber ein reines Array - vorher wurde hier
    // das ganze Objekt validiert, was immer mit einem ZodError fehlschlug.
    const parsed = aiStudyplanResponse.parse(JSON.parse(response.text).items);

    const fullItems = parsed.map((item) => ({
        ...item,
        isCompleted: false,
    }));

    return {success: true, studyplan: fullItems};
}