export interface Scenario {
  id: string;
  title: string;
  description: string;
  symptoms: string[];
  href: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  commands: string[];
}

export const scenarios: Scenario[] = [
  {
    id: "validation",
    title: "Validation error",
    description: "terraform validate fails — fix HCL syntax before plan.",
    symptoms: ["Error: Missing required argument", "validate fails on fresh clone"],
    href: "/practice-validation.html",
    difficulty: "beginner",
    commands: ["terraform init", "terraform validate", "terraform fmt"],
  },
  {
    id: "drift",
    title: "Configuration drift",
    description: "Plan shows unexpected ~ changes — resource modified outside Terraform.",
    symptoms: ["terraform plan shows update in-place", "No HCL changes made"],
    href: "/practice-drift.html",
    difficulty: "intermediate",
    commands: ["terraform plan", "terraform apply"],
  },
  {
    id: "state-lock",
    title: "State lock held",
    description: "Another process holds the state lock — diagnose before force-unlock.",
    symptoms: ["Error acquiring the state lock", "CI job may still be running"],
    href: "/practice-state-lock.html",
    difficulty: "intermediate",
    commands: ["terraform force-unlock LOCK_ID"],
  },
];

export const scenariosByType = {
  fundamentals: scenarios.filter((s) => s.difficulty === "beginner"),
  production: scenarios.filter((s) => s.difficulty !== "beginner"),
};
