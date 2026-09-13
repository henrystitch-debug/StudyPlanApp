import { Calender, CalenderItem } from "@/types/calender";
import { FullTopicIndex } from "@/types/topicIndex";
import { aiStudyplanResponse, studyplanResponseSchema } from "@/types/studyplan";
import { promptStudyplan } from "@/utils/prompts";
import { StudyplanResult } from "@/types/studyplan";
import { withRetry } from "@/utils/retryApiCall";
import { GEMINI_MODEL } from "./config";
import { ai } from "./client";


export async function createStudyplan(startDate: Date, endDate: Date, calendarEvents: Calender, topicIndeces: FullTopicIndex[], capacity: number): Promise<StudyplanResult>{

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

    const parsedJSON = JSON.parse(response.text);
    const items = aiStudyplanResponse.parse(parsedJSON.items);

    // study_plan_item.upload_id hat einen Foreign-Key auf upload.upload_id - die
    // KI kann trotz Anweisung gelegentlich ein uploadId zurückgeben, das nicht zu
    // den mitgeschickten Themen-Gruppen gehört (Halluzination/Tippfehler). Ohne
    // diese Absicherung würde das den Speichervorgang mit einem FK-Fehler crashen.
    const validUploadIds = new Set(topicIndeces.map((group) => group.uploadId));
    const fallbackUploadId = topicIndeces[0]?.uploadId;

    const fullItems = items.map((item) => ({
        ...item,
        uploadId: validUploadIds.has(item.uploadId) ? item.uploadId : fallbackUploadId,
        isCompleted: false,
    }));

    return {success: true, studyplan: fullItems};
}