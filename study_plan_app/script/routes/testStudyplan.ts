
//Run file: npx tsx script/routes/testStudyplan.ts
 
//TODO: updaten - file wird nicht mehr direkt gesendet

async function testStudyplan() {
  const mockPayload = {
    courseId: 1,
    startDate: "2026-09-08",
    endDate: "2026-09-28",
    capacity: 6,
    events: [
      {
        date: "2026-09-14",
        title: "Math 2 Lecture",
        startTime: "9am",
        endTime: "11am",
      },
      {
        date: "2026-09-25",
        title: "Math 2 Exam",
        start: "8am",
        end: "10am",
      },
      {
        date: "2026-09-18",
        title: "Business Tutorial",
        start: "2pm",
        end: "5pm",
      },
      {
        date: "2026-09-22",
        title: "Piano Lesson",
        start: "1pm",
        end: "3pm",
      },
    ],
    topicIndex: [ //update: mehrere topic indices
      {
        title: "Integralcalculation",
        description: "Basics of Integration, Derivatives, defined and undefined Integrals.",
        effort: "high",
        location: "Math2_Section3.pdf, p.22",
      },
      {
        title: "Cost Calculation",
        description: "Fixed costs vs. variable costs, Break-Even-Analysis.",
        effort: "middle",
        location: "Businnes_script_week_5.pdf, p.32-36",
      },
      {
        title: "Hypothesistests",
        description: "t-Test, Significancelevel, p-value-interpretation.",
        effort: "low",
        location: "Statistic_Summary.md, p.8-11",
      },
    ],
  };

  const res = await fetch("http://localhost:3000/api/studyplan/studyplanCreate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mockPayload),
  });

  const data = await res.json();
  console.log("Status:", res.status);
  console.log(JSON.stringify(data, null, 2));
}

testStudyplan();
