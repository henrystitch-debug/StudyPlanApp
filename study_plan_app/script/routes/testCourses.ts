//Run file: npx tsx script/routes/testCourses.ts

async function testGetCourses() {
  const userId = 27;

  const url = new URL("http://localhost:3000/api/course/coursesAll");
  url.searchParams.set("userId", `${userId}`);

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error("Error occurred while fetching events");

  const data = await res.json();

  console.log("=============TEST COURSES==============");
  const courses = data.courses ?? data; 
  courses.forEach((course: any) => {
    console.log(course);
  });
}

testGetCourses().catch((err) => {
  console.error("#Error:", err);
});