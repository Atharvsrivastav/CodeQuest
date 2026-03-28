export type Difficulty = "beginner" | "intermediate" | "advanced";
export type CodeLanguage = "js" | "python";
export type SpokenLanguage = "Spanish" | "French" | "German" | "Japanese";

export type CodingChallenge = {
  id: string;
  category: "coding";
  title: string;
  description: string;
  language: CodeLanguage;
  difficulty: Difficulty;
  starterCode: string;
  hint: string;
  tags: string[];
  xp: number;
  testCases: Array<{
    input: string;
    expected: string;
  }>;
};

export type LanguageExercise = {
  prompt: string;
  answer: string;
  alt?: string[];
};

export type LanguageLesson = {
  id: string;
  category: "language";
  lang: SpokenLanguage;
  nativeName: string;
  flag: string;
  difficulty: Difficulty;
  topic: string;
  description: string;
  xp: number;
  hint: string;
  exercises: LanguageExercise[];
};

export type LearnlyProgress = {
  completedIds: string[];
  xp: number;
};

const STORAGE_KEY = "learnly_progress";
export const progressEventName = "learnly-progress-updated";

export const diffBadge: Record<Difficulty, string> = {
  beginner: "badge-green",
  intermediate: "badge-amber",
  advanced: "badge-red"
};

export const codingChallenges: CodingChallenge[] = [
  {
    id: "hello-world",
    category: "coding",
    title: "Hello World",
    description: "Print the exact phrase Hello, world! to the console.",
    language: "js",
    difficulty: "beginner",
    starterCode: 'console.log("Hello, world!");',
    hint: "Use console.log with the exact capitalization and punctuation.",
    tags: ["output", "basics", "console"],
    xp: 20,
    testCases: [
      {
        input: "Run the script once",
        expected: "Console output is exactly Hello, world!"
      }
    ]
  },
  {
    id: "sum-two-numbers",
    category: "coding",
    title: "Sum Two Numbers",
    description: "Complete a function that returns the sum of two input numbers.",
    language: "js",
    difficulty: "beginner",
    starterCode:
      "function sum(a, b) {\n  // return the sum of a and b\n}\n\nconsole.log(sum(2, 3));",
    hint: "The function should return a value, not just print it.",
    tags: ["functions", "math", "return"],
    xp: 30,
    testCases: [
      {
        input: "sum(2, 3)",
        expected: "5"
      },
      {
        input: "sum(-4, 9)",
        expected: "5"
      },
      {
        input: "sum(0, 0)",
        expected: "0"
      }
    ]
  },
  {
    id: "palindrome-check",
    category: "coding",
    title: "Palindrome Check",
    description: "Return true when a string reads the same forward and backward.",
    language: "js",
    difficulty: "beginner",
    starterCode:
      'function isPalindrome(text) {\n  // return true when text is a palindrome\n}\n\nconsole.log(isPalindrome("level"));',
    hint: "Compare the original string with a reversed version of it.",
    tags: ["strings", "arrays", "logic"],
    xp: 40,
    testCases: [
      {
        input: 'isPalindrome("level")',
        expected: "true"
      },
      {
        input: 'isPalindrome("learnly")',
        expected: "false"
      },
      {
        input: 'isPalindrome("racecar")',
        expected: "true"
      }
    ]
  },
  {
    id: "fizzbuzz",
    category: "coding",
    title: "FizzBuzz",
    description: "Return an array from 1 to n, swapping multiples of 3 and 5 for words.",
    language: "js",
    difficulty: "beginner",
    starterCode:
      "function fizzBuzz(n) {\n  // return an array of fizzbuzz values from 1 to n\n}\n\nconsole.log(fizzBuzz(15));",
    hint: "Check divisibility for 15 before checking 3 or 5 by themselves.",
    tags: ["loops", "conditionals", "arrays"],
    xp: 50,
    testCases: [
      {
        input: "fizzBuzz(5)",
        expected: '[1, 2, "Fizz", 4, "Buzz"]'
      },
      {
        input: "fizzBuzz(15)",
        expected:
          '[1, 2, "Fizz", 4, "Buzz", "Fizz", 7, 8, "Fizz", "Buzz", 11, "Fizz", 13, 14, "FizzBuzz"]'
      }
    ]
  },
  {
    id: "list-comprehension",
    category: "coding",
    title: "List Comprehension",
    description: "Build a list of squared even numbers using Python list comprehension.",
    language: "python",
    difficulty: "intermediate",
    starterCode:
      "def squared_evens(numbers):\n    # return a list of squared even numbers\n    pass\n\nprint(squared_evens([1, 2, 3, 4, 5, 6]))",
    hint: "Filter the list first and square each even number in the same expression.",
    tags: ["python", "list-comprehension", "filtering"],
    xp: 70,
    testCases: [
      {
        input: "squared_evens([1, 2, 3, 4, 5, 6])",
        expected: "[4, 16, 36]"
      },
      {
        input: "squared_evens([1, 3, 5])",
        expected: "[]"
      },
      {
        input: "squared_evens([8])",
        expected: "[64]"
      }
    ]
  },
  {
    id: "debounce",
    category: "coding",
    title: "Debounce",
    description: "Return a debounced function that delays execution until calls stop for a wait period.",
    language: "js",
    difficulty: "advanced",
    starterCode:
      "function debounce(fn, wait) {\n  // return a debounced version of fn\n}\n\nconst save = debounce((value) => console.log(value), 300);",
    hint: "Store a timeout id in a closure and clear the previous timeout before creating a new one.",
    tags: ["timers", "closures", "events"],
    xp: 100,
    testCases: [
      {
        input: "Call the debounced function three times quickly with values A, B, and C",
        expected: "Only one callback runs after the wait period using the latest value C"
      },
      {
        input: "Call the debounced function, then call it again before the delay finishes",
        expected: "The first scheduled callback is canceled"
      },
      {
        input: "Use the debounced wrapper as a method with an object context",
        expected: "The original callback receives the latest arguments and preserves this"
      }
    ]
  }
];

export const languageLessons: LanguageLesson[] = [
  {
    id: "spanish-greetings",
    category: "language",
    lang: "Spanish",
    nativeName: "Espanol",
    flag: "🇪🇸",
    difficulty: "beginner",
    topic: "Greetings",
    description: "Practice everyday Spanish greetings and polite conversation starters.",
    xp: 25,
    hint: "Think about common greetings you would hear in a cafe or classroom.",
    exercises: [
      {
        prompt: 'How do you say "Hello" in Spanish?',
        answer: "hola"
      },
      {
        prompt: 'Translate to English: "Buenos dias"',
        answer: "good morning",
        alt: ["morning"]
      },
      {
        prompt: 'How do you say "Nice to meet you" in Spanish?',
        answer: "mucho gusto"
      }
    ]
  },
  {
    id: "spanish-numbers",
    category: "language",
    lang: "Spanish",
    nativeName: "Espanol",
    flag: "🇪🇸",
    difficulty: "beginner",
    topic: "Numbers",
    description: "Count, recognize, and translate common Spanish numbers.",
    xp: 30,
    hint: "Watch for words that sound similar to their English roots, like ocho and octo.",
    exercises: [
      {
        prompt: 'What is the Spanish word for "two"?',
        answer: "dos"
      },
      {
        prompt: 'Translate to English: "siete"',
        answer: "seven"
      },
      {
        prompt: 'What is the Spanish word for "ten"?',
        answer: "diez"
      },
      {
        prompt: 'Translate to Spanish: "one"',
        answer: "uno"
      }
    ]
  },
  {
    id: "spanish-travel",
    category: "language",
    lang: "Spanish",
    nativeName: "Espanol",
    flag: "🇪🇸",
    difficulty: "intermediate",
    topic: "Travel",
    description: "Learn travel phrases for stations, hotels, and getting around town.",
    xp: 45,
    hint: "Focus on essential travel nouns like station, hotel, and ticket.",
    exercises: [
      {
        prompt: 'Translate to Spanish: "Where is the train station?"',
        answer: "donde esta la estacion de tren",
        alt: ["donde esta estacion de tren", "donde esta la estacion"]
      },
      {
        prompt: 'Translate to English: "Necesito un boleto"',
        answer: "i need a ticket",
        alt: ["i need one ticket"]
      },
      {
        prompt: 'How do you say "hotel" in Spanish?',
        answer: "hotel"
      }
    ]
  },
  {
    id: "french-greetings",
    category: "language",
    lang: "French",
    nativeName: "Francais",
    flag: "🇫🇷",
    difficulty: "beginner",
    topic: "Greetings",
    description: "Start conversations in French with simple greetings and responses.",
    xp: 25,
    hint: "Bonjour is your safest daytime greeting.",
    exercises: [
      {
        prompt: 'How do you say "Hello" in French?',
        answer: "bonjour"
      },
      {
        prompt: 'Translate to English: "Bonsoir"',
        answer: "good evening",
        alt: ["evening"]
      },
      {
        prompt: 'How do you say "See you soon" in French?',
        answer: "a bientot",
        alt: ["à bientot", "a bientot!"]
      }
    ]
  },
  {
    id: "french-food",
    category: "language",
    lang: "French",
    nativeName: "Francais",
    flag: "🇫🇷",
    difficulty: "intermediate",
    topic: "Food",
    description: "Practice useful food vocabulary for cafes, markets, and menus.",
    xp: 40,
    hint: "Remember that pain means bread, not discomfort, in French.",
    exercises: [
      {
        prompt: 'Translate to English: "fromage"',
        answer: "cheese"
      },
      {
        prompt: 'How do you say "bread" in French?',
        answer: "pain"
      },
      {
        prompt: 'Translate to French: "water"',
        answer: "eau"
      },
      {
        prompt: 'Translate to English: "Je voudrais un cafe"',
        answer: "i would like a coffee",
        alt: ["i would like coffee"]
      }
    ]
  },
  {
    id: "german-greetings",
    category: "language",
    lang: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    difficulty: "beginner",
    topic: "Greetings",
    description: "Build confidence with basic German greetings and polite phrases.",
    xp: 25,
    hint: "Hallo is a direct equivalent of hello.",
    exercises: [
      {
        prompt: 'How do you say "Hello" in German?',
        answer: "hallo"
      },
      {
        prompt: 'Translate to English: "Guten Morgen"',
        answer: "good morning"
      },
      {
        prompt: 'How do you say "Thank you" in German?',
        answer: "danke"
      }
    ]
  },
  {
    id: "japanese-hiragana",
    category: "language",
    lang: "Japanese",
    nativeName: "Nihongo",
    flag: "🇯🇵",
    difficulty: "beginner",
    topic: "Hiragana",
    description: "Recognize foundational hiragana sounds to begin reading Japanese.",
    xp: 35,
    hint: "Match each symbol to its simple vowel or consonant-vowel sound.",
    exercises: [
      {
        prompt: 'What sound does the hiragana "あ" make?',
        answer: "a"
      },
      {
        prompt: 'What sound does the hiragana "き" make?',
        answer: "ki"
      },
      {
        prompt: 'What sound does the hiragana "の" make?',
        answer: "no"
      },
      {
        prompt: 'What sound does the hiragana "め" make?',
        answer: "me"
      }
    ]
  }
];

export const allContent = [...codingChallenges, ...languageLessons];
export const totalAvailableXp = allContent.reduce((total, item) => total + item.xp, 0);

const emptyProgress: LearnlyProgress = {
  completedIds: [],
  xp: 0
};

export function getChallengeById(id: string) {
  return codingChallenges.find((challenge) => challenge.id === id);
}

export function getLanguageLessonById(id: string) {
  return languageLessons.find((lesson) => lesson.id === id);
}

export function getProgress(): LearnlyProgress {
  if (typeof window === "undefined") {
    return emptyProgress;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return emptyProgress;
    }

    const parsed = JSON.parse(stored) as Partial<LearnlyProgress>;
    const completedIds = Array.isArray(parsed.completedIds)
      ? parsed.completedIds.filter((value): value is string => typeof value === "string")
      : [];
    const xp = typeof parsed.xp === "number" ? parsed.xp : 0;

    return {
      completedIds,
      xp
    };
  } catch {
    return emptyProgress;
  }
}

export function markComplete(id: string, xp: number): LearnlyProgress {
  const current = getProgress();

  if (current.completedIds.includes(id)) {
    return current;
  }

  const next = {
    completedIds: [...current.completedIds, id],
    xp: current.xp + xp
  };

  persistProgress(next);
  return next;
}

export function resetProgress() {
  persistProgress(emptyProgress);
  return emptyProgress;
}

export function isComplete(id: string, progress: LearnlyProgress) {
  return progress.completedIds.includes(id);
}

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function persistProgress(progress: LearnlyProgress) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  window.dispatchEvent(new Event(progressEventName));
}
