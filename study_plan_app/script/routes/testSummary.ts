//Run file: npx tsx script/routes/testSummary.ts

async function testUpload(){

 const res = await fetch("http://localhost:3000/api/summary/summaryCreate", { method: "POST", body: JSON.stringify({ uploadId: 8 }) });
      if (!res.ok) throw new Error("Error occured while processing the file");
      const data = await res.json();

      if(data.title && data.summary && data.topicIndex){
      console.log("=============TEST SUMMARY==============");
      console.log("TITLE: " + JSON.stringify(data.title));
      console.log("SUMMARY: " + JSON.stringify(data.summary));
      console.log("TOPIC INDEX: " + JSON.stringify(data.topicIndex));
      }
}

testUpload().catch((err) => {
  console.error("#Error :", err);
});
