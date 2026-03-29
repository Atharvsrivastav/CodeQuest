import { codingChallenges, getChallengeById, type CodingChallenge, type Difficulty } from "./challenges";

export type AttemptOutcome = "passed" | "failed";

export type ChallengePerformance = {
  attempts: number;
  passed: number;
  failed: number;
  lastOutcome: AttemptOutcome | null;
  lastAttemptAt: string | null;
};

export type TopicPerformance = {
  attempts: number;
  passed: number;
  failed: number;
};

export type PersonalizationState = {
  challengeStats: Record<string, ChallengePerformance>;
  topicStats: Record<string, TopicPerformance>;
  recentAttemptOutcomes: AttemptOutcome[];
};

export type ProgressForPersonalization = PersonalizationState & {
  completedIds: string[];
};

export type WeakTopic = {
  topic: string;
  attempts: number;
  passRate: number;
  weakness: number;
};

export const maxRecentAttemptOutcomes = 12;

export const personalizationDefaults: PersonalizationState = {
  challengeStats: {},
  topicStats: {},
  recentAttemptOutcomes: []
};

const difficultyRank: Record<Difficulty, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2
};

const challengeOrder = new Map(codingChallenges.map((challenge, index) => [challenge.id, index]));

export function applyAttemptToPersonalization(
  state: PersonalizationState,
  challengeId: string,
  passed: boolean,
  attemptedAtIso = new Date().toISOString()
): PersonalizationState {
  const challenge = getChallengeById(challengeId);

  if (!challenge) {
    return state;
  }

  const outcome: AttemptOutcome = passed ? "passed" : "failed";
  const previousChallenge = state.challengeStats[challenge.id] ?? {
    attempts: 0,
    passed: 0,
    failed: 0,
    lastOutcome: null,
    lastAttemptAt: null
  };
  const nextChallengeStats = {
    ...state.challengeStats,
    [challenge.id]: {
      attempts: previousChallenge.attempts + 1,
      passed: previousChallenge.passed + (passed ? 1 : 0),
      failed: previousChallenge.failed + (passed ? 0 : 1),
      lastOutcome: outcome,
      lastAttemptAt: attemptedAtIso
    }
  };

  const nextTopicStats = { ...state.topicStats };

  for (const tag of challenge.tags) {
    const topic = normalizeTopic(tag);
    const previousTopic = nextTopicStats[topic] ?? { attempts: 0, passed: 0, failed: 0 };

    nextTopicStats[topic] = {
      attempts: previousTopic.attempts + 1,
      passed: previousTopic.passed + (passed ? 1 : 0),
      failed: previousTopic.failed + (passed ? 0 : 1)
    };
  }

  const recentAttemptOutcomes = [...state.recentAttemptOutcomes, outcome].slice(
    -maxRecentAttemptOutcomes
  );

  return {
    challengeStats: nextChallengeStats,
    topicStats: nextTopicStats,
    recentAttemptOutcomes
  };
}

export function getAdaptiveDifficulty(progress: ProgressForPersonalization): Difficulty {
  const outcomes = progress.recentAttemptOutcomes;
  const solvedCount = progress.completedIds.length;

  if (!outcomes.length) {
    if (solvedCount >= 8) {
      return "advanced";
    }

    if (solvedCount >= 3) {
      return "intermediate";
    }

    return "beginner";
  }

  const passCount = outcomes.filter((outcome) => outcome === "passed").length;
  const passRate = passCount / outcomes.length;

  if (passRate >= 0.8 && solvedCount >= 5) {
    return "advanced";
  }

  if (passRate >= 0.55 && solvedCount >= 2) {
    return "intermediate";
  }

  return "beginner";
}

export function getWeakTopics(
  progress: Pick<ProgressForPersonalization, "topicStats">,
  limit = 3
): WeakTopic[] {
  const topics = Object.entries(progress.topicStats)
    .map(([topic, stats]) => {
      const attempts = stats.attempts;
      const passRate = attempts > 0 ? stats.passed / attempts : 0;
      const failureRate = attempts > 0 ? stats.failed / attempts : 0;

      return {
        topic,
        attempts,
        passRate,
        weakness: failureRate * Math.log2(attempts + 1)
      };
    })
    .filter((topic) => topic.attempts >= 2 && topic.weakness > 0)
    .sort((a, b) => {
      if (b.weakness !== a.weakness) {
        return b.weakness - a.weakness;
      }

      if (b.attempts !== a.attempts) {
        return b.attempts - a.attempts;
      }

      return a.topic.localeCompare(b.topic);
    });

  return topics.slice(0, Math.max(limit, 0));
}

export function getSuggestedChallengeIds(
  progress: ProgressForPersonalization,
  limit = 3
): string[] {
  const weakTopics = new Set(getWeakTopics(progress, 3).map((topic) => topic.topic));
  const adaptiveDifficulty = getAdaptiveDifficulty(progress);
  const completed = new Set(progress.completedIds);

  const scored = codingChallenges
    .filter((challenge) => !completed.has(challenge.id))
    .map((challenge) => ({
      id: challenge.id,
      score: scoreChallenge(challenge, progress, adaptiveDifficulty, weakTopics)
    }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      const orderA = challengeOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const orderB = challengeOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });

  return scored.slice(0, Math.max(limit, 0)).map((item) => item.id);
}

function scoreChallenge(
  challenge: CodingChallenge,
  progress: ProgressForPersonalization,
  adaptiveDifficulty: Difficulty,
  weakTopics: Set<string>
) {
  const challengeRank = difficultyRank[challenge.difficulty];
  const targetRank = difficultyRank[adaptiveDifficulty];
  const distance = Math.abs(challengeRank - targetRank);

  let score = 0;

  if (distance === 0) {
    score += 40;
  } else if (distance === 1) {
    score += 20;
  } else {
    score += 6;
  }

  const matchingWeakTopics = challenge.tags.filter((tag) => weakTopics.has(normalizeTopic(tag))).length;
  score += matchingWeakTopics * 24;

  const stats = progress.challengeStats[challenge.id];

  if (!stats) {
    score += 10;
  } else {
    score += Math.min(stats.failed * 4, 16);
    score -= Math.min(stats.passed * 3, 6);
  }

  return score;
}

export function normalizeTopic(topic: string) {
  return topic.trim().toLowerCase();
}
