import type { Metadata } from "next";

import AdaptiveTutorClient from "@/components/adaptive-tutor/AdaptiveTutorClient";

export const metadata: Metadata = {
  title: "AI Adaptive Learning Tutor | CodeQuest",
  description:
    "Adaptive multilingual programming quiz with AI explanations, streak tracking, and dynamic difficulty."
};

export default function AdaptiveTutorPage() {
  return <AdaptiveTutorClient />;
}
