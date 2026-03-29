"use client";

import { useEffect, useState } from "react";

import { type AppProgress, getProgress, progressEventName } from "./progress";

const defaultProgress: AppProgress = {
  completedIds: [],
  xp: 0,
  streak: 0,
  lastSolvedDate: null,
  challengeStats: {},
  topicStats: {},
  recentAttemptOutcomes: []
};

export function useProgress() {
  const [progress, setProgress] = useState<AppProgress>(defaultProgress);

  useEffect(() => {
    const sync = () => {
      setProgress(getProgress());
    };

    sync();
    window.addEventListener(progressEventName, sync);

    return () => {
      window.removeEventListener(progressEventName, sync);
    };
  }, []);

  return progress;
}
