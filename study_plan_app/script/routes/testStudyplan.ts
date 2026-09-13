//Run file: npx tsx script/routes/testStudyplan.ts

const userId = 27;
const courseId = 5; 
const startDate = "2026-09-11";
const endDate = "2026-09-20";
const capacity = 5;

async function testStudyplan() {

  const indexUrl = new URL("http://localhost:3000/api/topicItem/topicIndicesGet");
  indexUrl.searchParams.set("courseId", `${courseId}`);

  const resTopicIndices = await fetch(indexUrl, {
    method: "GET",
  });
  console.log("Topic Indices Status:", resTopicIndices.status, resTopicIndices.headers.get("content-type"));
  const topicIndices = await resTopicIndices.json();
  console.log("TOPIC INDICES: :" + JSON.stringify(topicIndices, null, 2));


  const eventsUrl = new URL("http://localhost:3000/api/calendar/calendarRangeEvents");
  eventsUrl.searchParams.set("userId", `${userId}`);
  eventsUrl.searchParams.set("startDate", startDate);
  eventsUrl.searchParams.set("endDate", endDate);

  const resEvents = await fetch(eventsUrl, {
    method: "GET",
  });
  console.log("events Status:", resEvents.status, resEvents.headers.get("content-type"));
  const events = await resEvents.json();
  console.log("EVENTS: :" + JSON.stringify(events, null, 2));

   const mockPayload = {
    userId: userId,
    courseId: courseId,
    startDate: startDate,
    endDate: endDate,
    capacity: capacity,
    events: events.events,
    topicIndices: topicIndices.topicIndices
  };


  const resStudyplan = await fetch("http://localhost:3000/api/studyplan/studyplanCreate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mockPayload),
  });

  console.log("Studyplan Status:", resStudyplan.status, resStudyplan.headers.get("content-type"));
  const studyplan = await resStudyplan.json();
  console.log("STUDYPLAN:" + JSON.stringify(studyplan, null, 2));
}

testStudyplan();
