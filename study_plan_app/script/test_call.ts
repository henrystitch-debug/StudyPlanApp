import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

//Run file: npx tsx script/test_call.ts

import { createSummary } from "../src/lib/ai/summary";

console.log("Key vorhanden:", !!process.env.GROQ_API_KEY);

async function main() {
  const result = await createSummary("I know what you are sayin");
  console.log(result);
}

main().catch((err) => {
  console.error("Fehler beim Ausführen:", err);
});