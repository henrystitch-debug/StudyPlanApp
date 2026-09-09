export async function getStreakByUserId(uid: number) {
  //TODO: implement db call - aus den täglichen Study-Session-Logs berechnen

  return {
    currentStreak: 0,
    longestStreak: 5,
    totalStudyDays: 12,
    // Aktivität der letzten 5 Wochen (0 = kein Lernen, 1 = wenig, 2 = mittel, 3 = viel)
    activityWeeks: [
      [0, 1, 0, 2, 1, 0, 0],
      [1, 2, 3, 2, 1, 0, 1],
      [0, 0, 1, 1, 2, 3, 2],
      [2, 2, 1, 0, 0, 1, 0],
      [0, 0, 0, 0, 1, 0, 0],
    ],
  };
}
