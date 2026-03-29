export type Difficulty = "beginner" | "intermediate" | "advanced";
export type ChallengeLanguage = "js" | "python";

export type CodingChallenge = {
  id: string;
  title: string;
  description: string;
  language: ChallengeLanguage;
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

export const diffBadge: Record<Difficulty, string> = {
  beginner: "badge-green",
  intermediate: "badge-amber",
  advanced: "badge-red"
};

export const codingChallenges: CodingChallenge[] = [
  {
    id: "hello-world",
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

export const totalChallengeXp = codingChallenges.reduce((total, challenge) => total + challenge.xp, 0);

export function getChallengeById(id: string) {
  return codingChallenges.find((challenge) => challenge.id === id);
}
