import fs from "fs";
import path from "path";

//Run file: npx tsx script/routes/testQuiz.ts
 
//TODO: updaten - file wird nicht mehr direkt gesendet

async function testUpload(){
const fileBuffer = fs.readFileSync(path.join(__dirname, "test_files", "Buckelwal.txt"));
const formData = new FormData();
formData.append("file", new Blob([fileBuffer]), "Buckelwal.txt");

 const res = await fetch("http://localhost:3000/api/quiz/quizCreate", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Error occured while processing the file");
      const data = await res.json();

    if (data) {
  console.log("========== FLASHCARDS ==========");

  data.flashcards?.forEach((card, index: number) => {
    console.log(
      `#${index + 1} question: ${card.question} | answer: ${card.answer}`
    );
  });

  console.log("========== MCQ ==========");

  data.mcq?.forEach((question, index: number) => {
    console.log(`#${index + 1} question: ${question.question}`);
    console.log(`  A: ${question.options[0]}`);
    console.log(`  B: ${question.options[1]}`);
    console.log(`  C: ${question.options[2]}`);
    console.log(`  D: ${question.options[3]}`);
    console.log(`  correct: ${question.correctIndex}`);
  });

  console.log("========== OPEN TEXT ==========");

  data.openText?.forEach((question, index: number) => {
    console.log(
      `#${index + 1} question: ${question.question} | answer: ${question.modelAnswer}`
    );
  });
 }
}

testUpload().catch((err) => {
  console.error("Error :", err);
});
