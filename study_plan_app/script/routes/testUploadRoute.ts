import fs from "fs";
import path from "path";

//Run file: npx tsx script/testSummaryRoute.ts

//TODO: updaten - file wird nicht mehr direkt gesendet
async function testUpload(){
const fileBuffer = fs.readFileSync(path.join(__dirname, "test_files", "klr_slides.pdf"));
const formData = new FormData();
formData.append("file", new Blob([fileBuffer]), "klr_slides.pdf");
formData.append("courseId", String(5));

 const res = await fetch("http://localhost:3000/api/upload/uploadPost", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Error occured while processing the file");
      const data = await res.json();

      if(data.title && data.summary){
      console.log("=============TEST UPLOAD==============");
      console.log("TITLE: " + data.title);
      console.log("SUMMARY: " + data.summary);
      console.log("STUDYPLAN: " + data.studyplan)
      }
}

testUpload().catch((err) => {
  console.error("#Error :", err);
});
