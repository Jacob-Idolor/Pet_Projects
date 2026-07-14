import type { LabCategory } from "./lab-hub";
import { labs } from "./lab-hub";

export type Difficulty = "beginner" | "intermediate" | "advanced";
export type TrackableKind = "lab" | "challenge" | "drill" | "mission";

export interface Trackable {
  id: string;
  title: string;
  description: string;
  category: LabCategory | "drills" | "challenges";
  difficulty: Difficulty;
  kind: TrackableKind;
  href: string;
  time?: string;
}

export const extraTrackables: Trackable[] = [
  {
    id: "extra-tf-missions",
    title: "All Terraform simulator missions",
    description: "Complete all 6 guided missions on the Terraform simulator.",
    category: "fundamentals",
    difficulty: "beginner",
    kind: "mission",
    href: "/terraform.html",
    time: "30 min",
  },
  {
    id: "extra-quiz-all",
    title: "Pass all lesson quizzes",
    description: "Score 100% on every lesson quiz (12 total).",
    category: "production",
    difficulty: "intermediate",
    kind: "challenge",
    href: "/learn.html",
    time: "45 min",
  },
  {
    id: "drill-tf-5",
    title: "Terraform command drill ×5",
    description: "Five clean runs of drills/terraform-commands.md without looking at answers.",
    category: "drills",
    difficulty: "intermediate",
    kind: "drill",
    href: "https://github.com/Jacob-Idolor/Pet_Projects/blob/main/terraform/drills/terraform-commands.md",
    time: "50 min",
  },
  {
    id: "challenge-validate-all",
    title: "Validate all examples",
    description: "Run make validate-all and fix any fmt/validate issues.",
    category: "challenges",
    difficulty: "intermediate",
    kind: "challenge",
    href: "https://github.com/Jacob-Idolor/Pet_Projects/tree/main/terraform/examples",
    time: "30 min",
  },
  {
    id: "challenge-production",
    title: "Production deploy milestone",
    description: "Deploy aws-static-site with safeguards, sync content, teardown cleanly.",
    category: "challenges",
    difficulty: "advanced",
    kind: "challenge",
    href: "https://github.com/Jacob-Idolor/Pet_Projects/blob/main/terraform/labs/lab-07-production/README.md",
    time: "90 min",
  },
];

export const allTrackables: Trackable[] = [
  ...labs.map((lab) => ({
    id: lab.id,
    title: lab.title,
    description: lab.description,
    category: lab.category,
    difficulty: (lab.difficulty ?? "beginner") as Difficulty,
    kind: "lab" as TrackableKind,
    href: lab.href,
    time: lab.time,
  })),
  ...extraTrackables,
];

export const categoryLabels: Record<string, string> = {
  fundamentals: "Fundamentals",
  production: "Production",
  troubleshoot: "Troubleshoot",
  local: "Local labs",
  practice: "Free practice",
  drills: "Command drills",
  challenges: "Advanced challenges",
};

export const difficultyLabels: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const difficultyOrder: Difficulty[] = ["beginner", "intermediate", "advanced"];
