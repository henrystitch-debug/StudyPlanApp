"use client";

import { useEffect } from "react";

export function useBubblyFonts() {
  useEffect(() => {
    if (document.getElementById("bubbly-font-link")) return;
    const link = document.createElement("link");
    link.id = "bubbly-font-link";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700&family=Quicksand:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}
