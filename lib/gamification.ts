import { codingChallenges } from "./challenges";

export type XpEventType = "challenge_solved" | "streak_bonus" | "badge_bonus";

export type XpEvent = {
  type: XpEventType;
  xp: number;
};

type StreakState = {
  streak: number;
  lastSolvedDate: string;
};

export type ProgressSnapshot = {
  completedIds: string[];
  streak: number;
  lastSolvedDate: string | null;
};

export const gamificationRules = {
  xp: {
    challengeSolved: "challenge-defined",
    failedAttempt: 0,
    streakBonus: {
      enabled: false,
      everyDays: 7,
      xp: 25
    },
    badgeBonus: {
      enabled: false
    }
  }
} as const;

const challengeXpById = new Map(codingChallenges.map((challenge) => [challenge.id, challenge.xp]));

export function isKnownChallengeId(id: string) {
  return challengeXpById.has(id);
}

export function canAwardChallengeSolve(
  progress: Pick<ProgressSnapshot, "completedIds">,
  challengeId: string
) {
  return isKnownChallengeId(challengeId) && !progress.completedIds.includes(challengeId);
}

export function computeNextStreakState(
  progress: Pick<ProgressSnapshot, "streak" | "lastSolvedDate">,
  today: string
): StreakState {
  if (!progress.lastSolvedDate) {
    return {
      streak: 1,
      lastSolvedDate: today
    };
  }

  if (progress.lastSolvedDate === today) {
    return {
      streak: progress.streak,
      lastSolvedDate: today
    };
  }

  const dayDiff = dayDifference(progress.lastSolvedDate, today);

  if (dayDiff === 1) {
    return {
      streak: progress.streak + 1,
      lastSolvedDate: today
    };
  }

  return {
    streak: 1,
    lastSolvedDate: today
  };
}

export function getChallengeSolveEvents(challengeId: string, nextStreak: number): XpEvent[] {
  const challengeXp = challengeXpById.get(challengeId);

  if (challengeXp === undefined) {
    return [];
  }

  const events: XpEvent[] = [{ type: "challenge_solved", xp: challengeXp }];
  const streakBonusXp = getStreakBonusXp(nextStreak);

  if (streakBonusXp > 0) {
    events.push({ type: "streak_bonus", xp: streakBonusXp });
  }

  return events;
}

export function getXpFromEvents(events: XpEvent[]) {
  return events.reduce((total, event) => total + event.xp, 0);
}

export function getTotalSolvedXp(completedIds: string[]) {
  return [...new Set(completedIds)].reduce((total, challengeId) => {
    return total + (challengeXpById.get(challengeId) ?? 0);
  }, 0);
}

function getStreakBonusXp(nextStreak: number) {
  const streakRule = gamificationRules.xp.streakBonus;

  if (!streakRule.enabled) {
    return 0;
  }

  if (nextStreak > 0 && nextStreak % streakRule.everyDays === 0) {
    return streakRule.xp;
  }

  return 0;
}

function dayDifference(from: string, to: string) {
  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T00:00:00.000Z`);
  const millisecondsInDay = 24 * 60 * 60 * 1000;

  return Math.floor((toDate.getTime() - fromDate.getTime()) / millisecondsInDay);
}
