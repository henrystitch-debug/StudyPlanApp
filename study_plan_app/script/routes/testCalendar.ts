//Run file: npx tsx script/routes/testCalendar.ts

async function testGetAllEvents() {
  const userId = 27;

  const url = new URL("http://localhost:3000/api/calendar/eventsAll");
  url.searchParams.set("userId", `${userId}`);

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error("Error occurred while fetching events");

  const data = await res.json();

  console.log("=============TEST CALENDAR==============");
  const events = data.events; 
  events.forEach((event: any) => {
    console.log(event);
  });
}

testGetAllEvents().catch((err) => {
  console.error("#Error:", err);
});