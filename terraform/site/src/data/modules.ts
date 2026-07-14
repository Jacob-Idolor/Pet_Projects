export interface QuizQ {
  question: string;
  options: string[];
  correct: number;
  explain: string;
}

export type LessonPhase = "fundamentals" | "production";

export interface LessonSection {
  heading: string;
  body: string;
  type?: "concept" | "analogy" | "try-it" | "tip";
  tryCommand?: string;
}

export interface Module {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  order: number;
  phase: LessonPhase;
  scenario?: "default" | "initialized" | "applied" | "drift" | "validation" | "state-lock";
  sections: LessonSection[];
  quiz: QuizQ[];
  practiceGoal: string;
}

export const phaseLabels: Record<LessonPhase, { title: string; desc: string }> = {
  fundamentals: {
    title: "Part 1 — Terraform fundamentals",
    desc: "IaC mindset, HCL, workflow, variables, state, and modules.",
  },
  production: {
    title: "Part 2 — Production patterns",
    desc: "Remote state, workspaces, CI/CD, drift, and production safeguards.",
  },
};

export const modules: Module[] = [
  {
    id: "t1-iac",
    title: "What is Infrastructure as Code?",
    subtitle: "Declarative config that Terraform reconciles with reality",
    time: "8 min",
    order: 1,
    phase: "fundamentals",
    sections: [
      { heading: "IaC in plain English", body: "You write <strong>configuration files</strong> describing desired infrastructure. Terraform compares that to what exists and makes a <strong>plan</strong> to close the gap.", type: "concept" },
      { heading: "Declarative vs imperative", body: "Imperative: \"create bucket, then attach policy.\" Declarative: \"here is the bucket I want\" — Terraform figures out the steps.", type: "analogy" },
      { heading: "Why teams use it", body: "Version control, code review, reproducible environments, and audit trails. Same reason you don't click around production consoles.", type: "tip" },
    ],
    quiz: [{ question: "Terraform is primarily:", options: ["Imperative shell scripts", "Declarative desired-state config", "A container runtime", "A CI server"], correct: 1, explain: "You declare desired state; Terraform reconciles." }],
    practiceGoal: "Run terraform version in the simulator.",
  },
  {
    id: "t2-hcl",
    title: "HCL basics",
    subtitle: "Resources, variables, outputs, and providers",
    time: "10 min",
    order: 2,
    phase: "fundamentals",
    sections: [
      { heading: "Core blocks", body: "<code>resource</code> — things to manage<br><code>variable</code> — inputs<br><code>output</code> — exported values<br><code>provider</code> — API plugin (AWS, Azure, local)", type: "concept" },
      { heading: "Resource address", body: "Format: <code>type.name</code> — e.g. <code>local_file.hello</code>. This address appears in state and CLI commands.", type: "concept" },
      { heading: "First look", body: "Open <code>examples/minimal/main.tf</code> in the repo. One resource, one provider — the simplest valid stack.", type: "try-it", tryCommand: "terraform validate" },
    ],
    quiz: [{ question: "Resource address for a local_file named hello?", options: ["file.hello", "local_file.hello", "resource.hello", "hello.local_file"], correct: 1, explain: "Type dot name — local_file.hello" }],
    practiceGoal: "Run terraform validate after init.",
  },
  {
    id: "t3-workflow",
    title: "Init, plan, apply",
    subtitle: "The workflow you'll run hundreds of times",
    time: "10 min",
    order: 3,
    phase: "fundamentals",
    scenario: "default",
    sections: [
      { heading: "The golden sequence", body: "<code>init</code> → <code>validate</code> → <code>plan</code> → <code>apply</code>. Never skip plan in production.", type: "concept", tryCommand: "terraform init" },
      { heading: "Plan symbols", body: "<code>+</code> create · <code>~</code> update · <code>-</code> destroy · <code>-/+</code> replace", type: "tip" },
      { heading: "Idempotency", body: "Run apply twice — second time shows <em>No changes</em>. Terraform converges to desired state.", type: "analogy", tryCommand: "terraform plan" },
    ],
    quiz: [{ question: "First command on a fresh clone?", options: ["terraform apply", "terraform init", "terraform destroy", "terraform import"], correct: 1, explain: "init downloads providers and configures backend." }],
    practiceGoal: "Complete init → validate → plan → apply in the simulator.",
  },
  {
    id: "t4-variables",
    title: "Variables & outputs",
    subtitle: "Parameterize stacks and expose results",
    time: "10 min",
    order: 4,
    phase: "fundamentals",
    scenario: "initialized",
    sections: [
      { heading: "Input variables", body: "Define in <code>variables.tf</code>. Set via <code>terraform.tfvars</code>, <code>-var</code>, or <code>TF_VAR_name</code> env vars.", type: "concept" },
      { heading: "Outputs", body: "Expose values after apply — bucket ARN, CloudFront URL. Other stacks can consume via <code>terraform_remote_state</code>.", type: "concept", tryCommand: "terraform output" },
      { heading: "Sensitive values", body: "Mark outputs <code>sensitive = true</code>. Never commit <code>terraform.tfvars</code> with secrets — use <code>.example</code> files.", type: "tip" },
    ],
    quiz: [{ question: "Best way to pass a DB password?", options: ["Hardcode in main.tf", "TF_VAR_db_password env var", "Commit terraform.tfvars", "Put in README"], correct: 1, explain: "Environment variables keep secrets out of git." }],
    practiceGoal: "Run terraform output after apply.",
  },
  {
    id: "t5-state",
    title: "State fundamentals",
    subtitle: "How Terraform remembers what it manages",
    time: "10 min",
    order: 5,
    phase: "fundamentals",
    scenario: "applied",
    sections: [
      { heading: "What is state?", body: "<code>terraform.tfstate</code> maps resource addresses to real-world IDs. Required for updates and destroys.", type: "concept" },
      { heading: "Never share state casually", body: "Local state on one laptop doesn't scale. Teams use <strong>remote backends</strong> with locking.", type: "tip", tryCommand: "terraform state list" },
      { heading: "Inspect state", body: "<code>terraform show</code> and <code>terraform state list</code> — your audit trail after apply.", type: "try-it" },
    ],
    quiz: [{ question: "Why is state required?", options: ["Faster fmt", "Map config to real resource IDs", "Download providers", "Run tests"], correct: 1, explain: "State links HCL addresses to cloud resource IDs." }],
    practiceGoal: "Run terraform state list and terraform show.",
  },
  {
    id: "t6-modules",
    title: "Modules",
    subtitle: "Reusable, composable infrastructure packages",
    time: "10 min",
    order: 6,
    phase: "fundamentals",
    scenario: "applied",
    sections: [
      { heading: "Module call", body: "<code>module \"vpc\" { source = \"./modules/vpc\" ... }</code> — child module with its own variables and outputs.", type: "concept" },
      { heading: "Composition", body: "Root module calls networking, compute, database modules. Each owns one concern.", type: "analogy" },
      { heading: "Version pinning", body: "Registry modules: <code>source = \"terraform-aws-modules/vpc/aws?ref=v5.1.0\"</code> — pin versions in production.", type: "tip" },
    ],
    quiz: [{ question: "Why use modules?", options: ["Faster init", "Reuse and standardize patterns", "Skip state", "Avoid providers"], correct: 1, explain: "Modules encapsulate reusable infrastructure." }],
    practiceGoal: "Explore examples/modules/networking/ in the repo.",
  },
  {
    id: "t7-providers",
    title: "Providers & data sources",
    subtitle: "Plugins that talk to cloud APIs",
    time: "10 min",
    order: 7,
    phase: "production",
    scenario: "initialized",
    sections: [
      { heading: "Providers", body: "AWS, Azure, GCP, Kubernetes, and 3000+ more. Configured in <code>versions.tf</code> and provider blocks.", type: "concept", tryCommand: "terraform providers" },
      { heading: "Data sources", body: "<code>data \"aws_caller_identity\" \"current\"</code> — read-only lookups. No lifecycle, not destroyed.", type: "concept" },
      { heading: "Version constraints", body: "<code>~> 5.0</code> allows 5.x patches. Pin major versions to avoid surprise breaking changes.", type: "tip" },
    ],
    quiz: [{ question: "Data sources are:", options: ["Created and destroyed", "Read-only lookups", "Same as resources", "Only for AWS"], correct: 1, explain: "Data sources fetch existing info without managing lifecycle." }],
    practiceGoal: "Run terraform providers in the simulator.",
  },
  {
    id: "t8-remote-state",
    title: "Remote state & locking",
    subtitle: "Collaborate safely with S3 + DynamoDB",
    time: "10 min",
    order: 8,
    phase: "production",
    sections: [
      { heading: "Remote backend", body: "S3 stores state. DynamoDB provides <strong>locking</strong> so two applies can't run at once.", type: "concept" },
      { heading: "Bootstrap problem", body: "Create state bucket + lock table first (often a tiny separate bootstrap stack).", type: "tip" },
      { heading: "Encryption", body: "Enable SSE on state bucket. State contains resource attributes — treat as sensitive.", type: "try-it" },
    ],
    quiz: [{ question: "State locking prevents:", options: ["Syntax errors", "Concurrent writes corrupting state", "High costs", "Drift"], correct: 1, explain: "Locks serialize plan/apply operations." }],
    practiceGoal: "Read backend.tf.example in examples/aws-static-site/.",
  },
  {
    id: "t9-workspaces",
    title: "Workspaces & environments",
    subtitle: "Isolate state namespaces",
    time: "10 min",
    order: 9,
    phase: "production",
    scenario: "applied",
    sections: [
      { heading: "Workspaces", body: "<code>terraform workspace select staging</code> — same code, separate state files.", type: "concept", tryCommand: "terraform workspace list" },
      { heading: "Not a silver bullet", body: "Workspaces share backend config. Production often uses <strong>separate state per environment</strong>.", type: "tip" },
      { heading: "Directory per env", body: "Alternative: <code>envs/staging/</code> and <code>envs/prod/</code> with different backends.", type: "analogy" },
    ],
    quiz: [{ question: "Before production apply, always check:", options: ["terraform version", "Current workspace", "Git branch only", "Provider logo"], correct: 1, explain: "Wrong workspace can destroy the wrong environment." }],
    practiceGoal: "Run terraform workspace list and workspace select staging.",
  },
  {
    id: "t10-ci",
    title: "CI/CD integration",
    subtitle: "Plan on PR, apply from protected branches",
    time: "10 min",
    order: 10,
    phase: "production",
    sections: [
      { heading: "CI pipeline", body: "<code>fmt -check</code> → <code>validate</code> → <code>plan</code> on every PR. Apply only after merge + approval.", type: "concept" },
      { heading: "No auto-approve in prod", body: "Humans or policy gates review plan output. Atlantis, Terraform Cloud, or custom GitHub Actions.", type: "tip" },
      { heading: "This repo's CI", body: "See <code>.github/workflows/terraform-validate.yml</code> — validates all example stacks.", type: "try-it" },
    ],
    quiz: [{ question: "PR should run:", options: ["apply -auto-approve", "plan only", "destroy", "force-unlock"], correct: 1, explain: "Plan shows intent without changing infrastructure." }],
    practiceGoal: "Run make validate-all from terraform/ directory.",
  },
  {
    id: "t11-drift",
    title: "Drift & import",
    subtitle: "When reality diverges from state",
    time: "10 min",
    order: 11,
    phase: "production",
    scenario: "drift",
    sections: [
      { heading: "Drift", body: "Manual console edits cause <code>~</code> in plan. Terraform wants to reconcile.", type: "concept", tryCommand: "terraform plan" },
      { heading: "Import", body: "<code>terraform import aws_s3_bucket.site bucket-name</code> — adopt existing resources into state.", type: "try-it" },
      { heading: "Policy", body: "Deny console edits on tagged resources. Scheduled drift detection in CI.", type: "tip" },
    ],
    quiz: [{ question: "Plan shows unexpected ~ update. Likely cause?", options: ["Bad init", "Drift — resource changed outside Terraform", "Wrong provider", "Need fmt"], correct: 1, explain: "Drift means real infra differs from state/config." }],
    practiceGoal: "Practice on /practice-drift.html — detect and fix drift.",
  },
  {
    id: "t12-production",
    title: "Production patterns",
    subtitle: "Safeguards, tags, budgets, and teardown discipline",
    time: "10 min",
    order: 12,
    phase: "production",
    scenario: "applied",
    sections: [
      { heading: "Safeguard checks", body: "<code>check</code> blocks, <code>allowed_account_ids</code>, validation rules on variables — fail before apply.", type: "concept" },
      { heading: "prevent_destroy", body: "On state buckets, databases. Requires deliberate edit before destroy.", type: "tip" },
      { heading: "Cost controls", body: "Budget alerts, PriceClass_100 on CloudFront, lifecycle rules on S3.", type: "try-it" },
    ],
    quiz: [{ question: "Static site bucket should be:", options: ["Public read for simplicity", "Private with CloudFront OAC", "Open to 0.0.0.0/0", "Unencrypted"], correct: 1, explain: "OAC lets CloudFront read without public S3 ACLs." }],
    practiceGoal: "Review safeguards.tf in examples/aws-static-site/.",
  },
];

export function getModule(id: string) {
  return modules.find((m) => m.id === id);
}

export function getModulesByPhase(phase: LessonPhase) {
  return modules.filter((m) => m.phase === phase);
}
