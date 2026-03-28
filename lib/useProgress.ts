"use client";

import { useEffect, useState } from "react";

import { type LearnlyProgress, getProgress, progressEventName } from "./data";

const defaultProgress: LearnlyProgress = {
  completedIds: [],
  xp: 0
};

export function useLearnlyProgress() {
  const [progress, setProgress] = useState<LearnlyProgress>(defaultProgress);

  useEffect(() => {
    const sync = () => {
      setProgress(getProgress());
    };

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(progressEventName, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(progressEventName, sync);
    };
  }, []);

  return progress;
}
