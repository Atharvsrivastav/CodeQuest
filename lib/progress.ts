"use client";

import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "./firebase";
import {
  canAwardChallengeSolve,
  computeNextStreakState,
  getChallengeSolveEvents,
  getTotalSolvedXp,
  getXpFromEvents,
  isKnownChallengeId
} from "./gamification";
import {
  type ChallengePerformance,
  type TopicPerformance,
  applyAttemptToPersonalization,
  maxRecentAttemptOutcomes,
  normalizeTopic,
  type AttemptOutcome
} from "./personalization";

export type AppProgress = {
  completedIds: string[];
  xp: number;
  streak: number;
  lastSolvedDate: string | null;
  challengeStats: Record<string, ChallengePerformance>;
  topicStats: Record<string, TopicPerformance>;
  recentAttemptOutcomes: AttemptOutcome[];
};

export const progressEventName = "codequest-progress-updated";

export const emptyProgress: AppProgress = {
  completedIds: [],
  xp: 0,
  streak: 0,
  lastSolvedDate: null,
  challengeStats: {},
  topicStats: {},
  recentAttemptOutcomes: []
};

let currentProgress: AppProgress = emptyProgress;

export function getProgress(): AppProgress {
  return currentProgress;
}

export function markComplete(id: string): AppProgress {
  const current = getProgress();

  if (!canAwardChallengeSolve(current, id)) {
    return current;
  }

  const next = applyCompletionReward(current, id);

  setProgressState(next, true);
  return next;
}

export function recordEvaluation(challengeId: string, passed: boolean): AppProgress {
  const current = getProgress();

  if (!isKnownChallengeId(challengeId)) {
    return current;
  }

  let next = sanitizeProgress({
    ...current,
    ...applyAttemptToPersonalization(current, challengeId, passed)
  });

  if (passed && canAwardChallengeSolve(next, challengeId)) {
    next = applyCompletionReward(next, challengeId);
  }

  setProgressState(next, true);
  return next;
}

export function resetProgress() {
  setProgressState(emptyProgress, true);
  return emptyProgress;
}

export function isComplete(id: string, progress: AppProgress) {
  return progress.completedIds.includes(id);
}

export async function syncProgressForUser(user: User): Promise<AppProgress> {
  try {
    const ref = doc(db, "users", user.uid);
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
      await saveProgressForUser(user, emptyProgress, true);
      setProgressState(emptyProgress, false);
      return emptyProgress;
    }

    const remoteProgress = sanitizeProgress(snapshot.data() as Partial<AppProgress>);
    setProgressState(remoteProgress, false);
    return remoteProgress;
  } catch {
    setProgressState(emptyProgress, false);
    return emptyProgress;
  }
}

export function clearProgressState() {
  setProgressState(emptyProgress, false);
}

function sanitizeProgress(value: Partial<AppProgress>): AppProgress {
  const completedIds = Array.isArray(value.completedIds)
    ? [...new Set(value.completedIds.filter((id): id is string => isKnownChallengeId(id)))]
    : [];
  const lastSolvedDate =
    typeof value.lastSolvedDate === "string" && isDateLike(value.lastSolvedDate)
      ? value.lastSolvedDate
      : null;
  const solvedXp = getTotalSolvedXp(completedIds);
  const xpFromValue =
    typeof value.xp === "number" && Number.isFinite(value.xp)
      ? Math.max(0, Math.floor(value.xp))
      : solvedXp;
  const streakFromValue = typeof value.streak === "number" && value.streak >= 0 ? value.streak : 0;
  const challengeStats = sanitizeChallengeStats(value.challengeStats);
  const topicStats = sanitizeTopicStats(value.topicStats);
  const recentAttemptOutcomes = sanitizeRecentAttemptOutcomes(value.recentAttemptOutcomes);

  return {
    completedIds,
    xp: Math.max(solvedXp, xpFromValue),
    streak: streakFromValue,
    lastSolvedDate,
    challengeStats,
    topicStats,
    recentAttemptOutcomes
  };
}

function sanitizeChallengeStats(value: unknown): Record<string, ChallengePerformance> {
  if (!isRecord(value)) {
    return {};
  }

  const sanitized: Record<string, ChallengePerformance> = {};

  for (const [challengeId, rawStats] of Object.entries(value)) {
    if (!isKnownChallengeId(challengeId) || !isRecord(rawStats)) {
      continue;
    }

    const passed = toNonNegativeInt(rawStats.passed);
    const failed = toNonNegativeInt(rawStats.failed);
    const attempts = Math.max(toNonNegativeInt(rawStats.attempts), passed + failed);
    const lastOutcome =
      rawStats.lastOutcome === "passed" || rawStats.lastOutcome === "failed"
        ? rawStats.lastOutcome
        : null;
    const lastAttemptAt =
      typeof rawStats.lastAttemptAt === "string" && rawStats.lastAttemptAt.length > 0
        ? rawStats.lastAttemptAt
        : null;

    sanitized[challengeId] = {
      attempts,
      passed,
      failed,
      lastOutcome,
      lastAttemptAt
    };
  }

  return sanitized;
}

function sanitizeTopicStats(value: unknown): Record<string, TopicPerformance> {
  if (!isRecord(value)) {
    return {};
  }

  const sanitized: Record<string, TopicPerformance> = {};

  for (const [rawTopic, rawStats] of Object.entries(value)) {
    if (!isRecord(rawStats)) {
      continue;
    }

    const topic = normalizeTopic(rawTopic);

    if (!topic) {
      continue;
    }

    const passed = toNonNegativeInt(rawStats.passed);
    const failed = toNonNegativeInt(rawStats.failed);
    const attempts = Math.max(toNonNegativeInt(rawStats.attempts), passed + failed);
    const previous = sanitized[topic] ?? { attempts: 0, passed: 0, failed: 0 };

    sanitized[topic] = {
      attempts: previous.attempts + attempts,
      passed: previous.passed + passed,
      failed: previous.failed + failed
    };
  }

  return sanitized;
}

function sanitizeRecentAttemptOutcomes(value: unknown): AttemptOutcome[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is AttemptOutcome => entry === "passed" || entry === "failed")
    .slice(-maxRecentAttemptOutcomes);
}

function setProgressState(progress: AppProgress, syncRemote: boolean) {
  currentProgress = progress;
  window.dispatchEvent(new Event(progressEventName));

  if (syncRemote && auth.currentUser) {
    void saveProgressForUser(auth.currentUser, progress);
  }
}

function formatDateUTC(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isDateLike(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function applyCompletionReward(progress: AppProgress, challengeId: string): AppProgress {
  const today = formatDateUTC(new Date());
  const streakState = computeNextStreakState(progress, today);
  const xpEvents = getChallengeSolveEvents(challengeId, streakState.streak);

  return sanitizeProgress({
    ...progress,
    completedIds: [...progress.completedIds, challengeId],
    streak: streakState.streak,
    lastSolvedDate: streakState.lastSolvedDate,
    xp: progress.xp + getXpFromEvents(xpEvents)
  });
}

function toNonNegativeInt(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function saveProgressForUser(user: User, progress: AppProgress, includeCreatedAt = false) {
  await setDoc(
    doc(db, "users", user.uid),
    {
      completedIds: progress.completedIds,
      xp: progress.xp,
      streak: progress.streak,
      lastSolvedDate: progress.lastSolvedDate,
      challengeStats: progress.challengeStats,
      topicStats: progress.topicStats,
      recentAttemptOutcomes: progress.recentAttemptOutcomes,
      displayName: user.displayName ?? null,
      email: user.email ?? null,
      photoURL: user.photoURL ?? null,
      updatedAt: serverTimestamp(),
      ...(includeCreatedAt ? { createdAt: serverTimestamp() } : {})
    },
    { merge: true }
  );
}
