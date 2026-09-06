import { GoogleGenAI } from "@google/genai";
import { Calender } from "@/src/types/calender";
import { TopicIndex } from "@/src/types/topicIndex";
import { aiStudyplanResponse, studyItem, Studyplan, studyplanResponseSchema } from "@/src/types/studyplan";
import { promptStudyplan } from "@/src/utils/prompts";
import { StudyplanResult } from "@/src/types/studyplan";

const ai = new GoogleGenAI({});

export async function createStudyplan(startDate: Date, endDate: Date, calendarEvents: Calender, topicIndex: TopicIndex, capacity: number): Promise<StudyplanResult>{

      const userPrompt = `  Start date: ${startDate}
                            End date: ${endDate}

                            Existing calendar entries in this period (do NOT schedule over these):
                            ${JSON.stringify(calendarEvents, null, 2)}

                            Topics to cover (from the student's uploaded materials):
                            ${JSON.stringify(topicIndex, null, 2)}

                            Available study capacity: ${capacity} hours per week.

                            Generate a full study plan covering all topics above within the given date range.`;

     const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ text: userPrompt }],
        config: {
        systemInstruction: promptStudyplan,
        responseMimeType: "application/json",
        responseSchema: studyplanResponseSchema,
        },
    });

    if(!response.text){
        return {
            success: false, error: "No studyplan received from API"
        }
    }

    const parsed = aiStudyplanResponse.parse(JSON.parse(response.text));

    const fullItems = parsed.items.map((item) => ({
        ...item,
        studyplanId: 0, //in DB durch richtige ID ersetzt werden!!
        isCompleted: false,
    }));

    return {success: true, studyplan: fullItems.map((item) => studyItem.parse(item))};

}