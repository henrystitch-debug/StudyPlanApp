import { createSummary } from "../../../lib/ai/summary";

function parsePDF(file: File){ return ""} //Platzhalter
function parseWordFile(file: File){ return ""} //Platzhalter

export async function POST (request: Request){
    try{
        const formData = await request.formData(); 
        const file = formData.get("file") as File | null;

        if(!file){
            return Response.json(
            {error: "File not found"},
            {status: 400}
         )
        }


        let text = "";

        switch (file.type) {
            case "text/plain": text = await file.text();

            case "application/pdf": text = await parsePDF(file);

            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": text = await parseWordFile(file);
        }
        
        if (text == ""){
            return Response.json(
            {error: "File empty / type not known (only .txt, .pdf, .word"},
            {status: 400}
         )
        }

        const responseAI = await createSummary(text);

        if(!responseAI){
            return Response.json(
            { error: "Error while extracting file" },
            { status: 500})
          }

          return Response.json({
            title: responseAI.title,
            summary: responseAI.summary,
            difficulty: responseAI.difficulty
            });
        }

    catch(err){
        console.error(err);
        return Response.json(
            { error: "Error while extracting file" },
            { status: 500})
        }
}