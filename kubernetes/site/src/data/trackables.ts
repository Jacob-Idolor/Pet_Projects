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

/** Extra trackables beyond the lab hub cards */
export const extraTrackables: Trackable[] = [
  {
    id: "extra-docker-missions",
    title: "All Docker simulator missions",
    description: "Complete all 6 guided missions on the Docker simulator.",
    category: "docker",
    difficulty: "beginner",
    kind: "mission",
    href: "/docker.html",
    time: "30 min",
  },
  {
    id: "extra-kubectl-missions",
    title: "All kubectl simulator missions",
    description: "Complete all 4 guided missions on the Practice page.",
    category: "practice",
    difficulty: "beginner",
    kind: "mission",
    href: "/practice.html",
    time: "20 min",
  },
  {
    id: "extra-quiz-all",
    title: "Pass all lesson quizzes",
    description: "Score 100% on every lesson quiz (15 total).",
    category: "kubernetes",
    difficulty: "intermediate",
    kind: "challenge",
    href: "/learn.html",
    time: "60 min",
  },
  {
    id: "drill-docker-5",
    title: "Docker command drill ×5",
    description: "Five clean runs of drills/docker-commands.md without looking at answers.",
    category: "drills",
    difficulty: "intermediate",
    kind: "drill",
    href: "https://github.com/Jacob-Idolor/Pet_Projects/blob/main/kubernetes/drills/docker-commands.md",
    time: "50 min",
  },
  {
    id: "drill-kubectl-5",
    title: "kubectl command drill ×5",
    description: "Five clean runs of drills/kubectl-commands.md from memory.",
    category: "drills",
    difficulty: "intermediate",
    kind: "drill",
    href: "https://github.com/Jacob-Idolor/Pet_Projects/blob/main/kubernetes/drills/kubectl-commands.md",
    time: "50 min",
  },
  {
    id: "challenge-broken-local",
    title: "Broken manifests on kind (all 5)",
    description: "Apply and fix every scenario in manifests/broken/ on your local cluster.",
    category: "challenges",
    difficulty: "advanced",
    kind: "challenge",
    href: "https://github.com/Jacob-Idolor/Pet_Projects/blob/main/kubernetes/drills/troubleshooting-scenarios.md",
    time: "90 min",
  },
  {
    id: "challenge-cka-drill",
    title: "CKA timed drill (under 20 min)",
    description: "Complete the 20-minute CKA-style drill without docs. Target: under 20 min by attempt 3.",
    category: "challenges",
    difficulty: "advanced",
    kind: "challenge",
    href: "https://github.com/Jacob-Idolor/Pet_Projects/blob/main/kubernetes/drills/troubleshooting-scenarios.md#scenario-7--cka-timed-drill",
    time: "20 min",
  },
  {
    id: "challenge-observability",
    title: "Observability stack lab",
    description: "Deploy Prometheus + Grafana and fix a missing metrics scrape.",
    category: "challenges",
    difficulty: "advanced",
    kind: "challenge",
    href: "https://github.com/Jacob-Idolor/Pet_Projects/tree/main/kubernetes/observability/lab-prometheus-grafana",
    time: "60 min",
  },
  {
    id: "challenge-portfolio",
    title: "Portfolio milestone",
    description: "Containerize an app, deploy to kind with health checks, add metrics or logging, write a runbook.",
    category: "challenges",
    difficulty: "advanced",
    kind: "challenge",
    href: "https://github.com/Jacob-Idolor/Pet_Projects/blob/main/kubernetes/PROGRESS.md#portfolio-milestone",
    time: "120 min",
  },
];

/** Labs from hub + extras — single list for the tracker */
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
  docker: "Docker",
  kubernetes: "Kubernetes",
  troubleshoot: "Troubleshoot",
  local: "Local cluster",
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
