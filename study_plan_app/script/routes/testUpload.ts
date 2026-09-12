import fs from "fs";
import path from "path";

//Run file: npx tsx script/routes/testUpload.ts

async function testUpload(){
const fileBuffer = fs.readFileSync(path.join(__dirname, "test_files", "prolo_case.pdf"));
const formData = new FormData();
formData.append("file", new Blob([fileBuffer]), "prolo_case.pdf");
formData.append("courseId", String(5));

 const res = await fetch("http://localhost:3000/api/upload/uploadPost", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Error occured while processing the file");
      const data = await res.json();

      if(data){
      console.log("=============TEST UPLOAD==============");
      console.log("Upload ID: " + JSON.stringify(data.response.upload_id));
      console.log("File name: " + JSON.stringify(data.response.file_name));
      console.log("File type: " + JSON.stringify(data.response.mime_type));
      }
}

testUpload().catch((err) => {
  console.error("#Error :", err);
});
