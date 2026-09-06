import fs from "fs";
import path from "path";

//Run file: npx tsx script/testStudyplanRoute.ts
 
//anpassen zur route, request??
async function testStudyplan() {
  const mockPayload = {
    startDate: "2026-09-08",
    endDate: "2026-09-28",
    capacityHoursPerWeek: 6,
    calendarEvents: [
      {
        title: "Mathe 2 Vorlesung",
        start: "2026-09-10T10:00:00",
        end: "2026-09-10T12:00:00",
      },
      {
        title: "Mathe 2 Prüfung",
        start: "2026-09-25T09:00:00",
        end: "2026-09-25T11:00:00",
      },
      {
        title: "BWL Tutorium",
        start: "2026-09-15T14:00:00",
        end: "2026-09-15T15:30:00",
      },
    ],
    topicIndex: [
      {
        title: "Integralrechnung",
        description: "Grundlagen der Integration, Stammfunktionen, bestimmte und unbestimmte Integrale.",
        estimatedEffort: "hoch",
        location: "Mathe2_Kapitel3.pdf",
      },
      {
        title: "Kostenrechnung",
        description: "Fixkosten vs. variable Kosten, Break-Even-Analyse.",
        estimatedEffort: "mittel",
        location: "BWL_Skript_Woche5.pdf",
      },
      {
        title: "Hypothesentests",
        description: "t-Test, Signifikanzniveau, p-Wert-Interpretation.",
        estimatedEffort: "niedrig",
        location: "Statistik_Zusammenfassung.md",
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
