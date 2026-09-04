import fs from "fs";
import path from "path";

//Run file: npx tsx script/testQuizRoute.ts

async function testUpload(){
const fileBuffer = fs.readFileSync(path.join(__dirname, "test_files", "Buckelwal.txt"));
const formData = new FormData();
formData.append("file", new Blob([fileBuffer]), "Buckelwal.txt");

 const res = await fetch("http://localhost:3000/api/quiz/quizCreate", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Error occured while processing the file");
      const data = await res.json();

      if(data){
      console.log("################################");
      console.log("#FLASHCARDS: " + data.flashcards);
      console.log("#MCQ: " + data.mcq);
      console.log("#OPENTEXT: " + data.openText);
      console.log("################################");
      }
}

testUpload().catch((err) => {
  console.error("##### Error :", err);
});
