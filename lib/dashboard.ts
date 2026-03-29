import { codingChallenges, type Difficulty } from "./challenges";
import { getWeakTopics } from "./personalization";

type CompactStats = {
  attempts: number;
  passed: number;
  failed: number;
};

export type DashboardProgressSnapshot = {
  completedIds: string[];
  xp: number;
  challengeStats: Record<string, CompactStats>;
  topicStats: Record<string, CompactStats>;
};

export type DifficultyAccuracy = {
  difficulty: Difficulty;
  attempts: number;
  solved: number;
  accuracyPercent: number;
};

export type WeakTopicSummary = {
  topic: string;
  attempts: number;
  errorRatePercent: number;
};

export type DashboardSummary = {
  solvedCount: number;
  totalChallenges: number;
  solvedPercent: number;
  accuracyPercent: number;
  xp: number;
  weakTopics: WeakTopicSummary[];
  difficultyAccuracy: DifficultyAccuracy[];
};

const difficultyOrder: Difficulty[] = ["beginner", "intermediate", "advanced"];
const challengeDifficultyById = new Map(
  codingChallenges.map((challenge) => [challenge.id, challenge.difficulty])
);

export function buildDashboardSummary(progress: DashboardProgressSnapshot): DashboardSummary {
  const knownCompletedIds = [...new Set(progress.completedIds.filter((id) => challengeDifficultyById.has(id)))];
  const solvedCount = knownCompletedIds.length;
  const totalChallenges = codingChallenges.length;

  const totalAttempts = sumValues(Object.values(progress.challengeStats), "attempts");
  const totalPassed = sumValues(Object.values(progress.challengeStats), "passed");

  const solvedPercent = totalChallenges > 0 ? Math.round((solvedCount / totalChallenges) * 100) : 0;
  const accuracyPercent = totalAttempts > 0 ? Math.round((totalPassed / totalAttempts) * 100) : 0;

  const weakTopics = getWeakTopics({ topicStats: progress.topicStats }, 5).map((topic) => ({
    topic: topic.topic,
    attempts: topic.attempts,
    errorRatePercent: Math.round((1 - topic.passRate) * 100)
  }));

  const difficultyBuckets = new Map<Difficulty, { attempts: number; passed: number; solved: number }>(
    difficultyOrder.map((difficulty) => [difficulty, { attempts: 0, passed: 0, solved: 0 }])
  );

  for (const challengeId of knownCompletedIds) {
    const difficulty = challengeDifficultyById.get(challengeId);

    if (!difficulty) {
      continue;
    }

    const bucket = difficultyBuckets.get(difficulty);

    if (bucket) {
      bucket.solved += 1;
    }
  }

  for (const [challengeId, stats] of Object.entries(progress.challengeStats)) {
    const difficulty = challengeDifficultyById.get(challengeId);

    if (!difficulty) {
      continue;
    }

    const bucket = difficultyBuckets.get(difficulty);

    if (!bucket) {
      continue;
    }

    bucket.attempts += stats.attempts;
    bucket.passed += stats.passed;
  }

  const difficultyAccuracy: DifficultyAccuracy[] = difficultyOrder.map((difficulty) => {
    const bucket = difficultyBuckets.get(difficulty) ?? { attempts: 0, passed: 0, solved: 0 };

    return {
      difficulty,
      attempts: bucket.attempts,
      solved: bucket.solved,
      accuracyPercent: bucket.attempts > 0 ? Math.round((bucket.passed / bucket.attempts) * 100) : 0
    };
  });

  return {
    solvedCount,
    totalChallenges,
    solvedPercent,
    accuracyPercent,
    xp: Math.max(0, Math.floor(progress.xp)),
    weakTopics,
    difficultyAccuracy
  };
}

export function sanitizeDashboardProgress(input: unknown): DashboardProgressSnapshot {
  if (!isRecord(input)) {
    return emptyDashboardProgress;
  }

  const completedIds = Array.isArray(input.completedIds)
    ? input.completedIds.filter((value): value is string => typeof value === "string")
    : [];
  const xp = toNonNegativeInt(input.xp);
  const challengeStats = sanitizeCompactStatsMap(input.challengeStats);
  const topicStats = sanitizeCompactStatsMap(input.topicStats);

  return {
    completedIds,
    xp,
    challengeStats,
    topicStats
  };
}

const emptyDashboardProgress: DashboardProgressSnapshot = {
  completedIds: [],
  xp: 0,
  challengeStats: {},
  topicStats: {}
};

function sanitizeCompactStatsMap(input: unknown): Record<string, CompactStats> {
  if (!isRecord(input)) {
    return {};
  }

  const output: Record<string, CompactStats> = {};

  for (const [key, value] of Object.entries(input)) {
    if (!isRecord(value)) {
      continue;
    }

    const attempts = toNonNegativeInt(value.attempts);
    const passed = toNonNegativeInt(value.passed);
    const failed = toNonNegativeInt(value.failed);
    const normalizedAttempts = Math.max(attempts, passed + failed);

    output[key] = {
      attempts: normalizedAttempts,
      passed,
      failed
    };
  }

  return output;
}

function sumValues(items: CompactStats[], key: keyof CompactStats) {
  return items.reduce((total, item) => total + item[key], 0);
}

function toNonNegativeInt(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
