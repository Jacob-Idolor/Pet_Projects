/** In-browser Terraform simulator — no real cloud, no downloads */

export type ResourceStatus = "planned" | "created" | "drifted" | "destroyed";

export interface SimResource {
  address: string;
  type: string;
  name: string;
  attributes: Record<string, string>;
  status: ResourceStatus;
}

export interface TerraformState {
  initialized: boolean;
  workspace: string;
  applied: boolean;
  locked: boolean;
  lockId: string;
  hasValidationError: boolean;
  resources: SimResource[];
  outputs: Record<string, string>;
  lastPlan: string | null;
}

export interface Mission {
  id: string;
  title: string;
  hint: string;
  scenario?: string;
  validate: (cmd: string, state: TerraformState) => boolean;
}

export interface BestPractice {
  icon: string;
  title: string;
  body: string;
}

export function defaultState(): TerraformState {
  return {
    initialized: false,
    workspace: "default",
    applied: false,
    locked: false,
    lockId: "",
    hasValidationError: false,
    resources: [],
    outputs: {},
    lastPlan: null,
  };
}

export function freshWorkspaceState(): TerraformState {
  return {
    ...defaultState(),
    initialized: false,
    hasValidationError: false,
    resources: [
      {
        address: "local_file.hello",
        type: "local_file",
        name: "hello",
        attributes: { filename: "hello.txt", content: "Hello from Terraform!" },
        status: "planned",
      },
    ],
    outputs: { message: "Wrote hello.txt with Terraform" },
  };
}

export function initializedState(): TerraformState {
  const s = freshWorkspaceState();
  s.initialized = true;
  return s;
}

export function appliedState(): TerraformState {
  const s = initializedState();
  s.applied = true;
  s.resources = s.resources.map((r) => ({ ...r, status: "created" as ResourceStatus }));
  return s;
}

export function driftState(): TerraformState {
  const s = appliedState();
  s.resources = s.resources.map((r) => ({
    ...r,
    status: "drifted" as ResourceStatus,
    attributes: { ...r.attributes, content: "Modified outside Terraform!" },
  }));
  return s;
}

export function validationErrorState(): TerraformState {
  const s = freshWorkspaceState();
  s.hasValidationError = true;
  return s;
}

export function stateLockState(): TerraformState {
  const s = initializedState();
  s.locked = true;
  s.lockId = "sim-lock-7f3a9b2c";
  return s;
}

function normalizeCmd(cmd: string): string {
  return cmd.trim().replace(/\s+/g, " ");
}

function parseArgs(cmd: string): string[] {
  return normalizeCmd(cmd).split(" ");
}

export function runTerraform(state: TerraformState, cmd: string): { state: TerraformState; output: string } {
  const args = parseArgs(cmd);
  const bin = args[0]?.toLowerCase();

  if (bin !== "terraform") {
    return { state, output: `bash: ${args[0]}: command not found\nTry: terraform <command>` };
  }

  const sub = args[1]?.toLowerCase() ?? "";
  const flags = args.slice(2);

  switch (sub) {
    case "init":
      return handleInit(state, flags);
    case "validate":
      return handleValidate(state);
    case "fmt":
      return handleFmt(flags);
    case "plan":
      return handlePlan(state, flags);
    case "apply":
      return handleApply(state, flags);
    case "destroy":
      return handleDestroy(state, flags);
    case "show":
      return handleShow(state);
    case "output":
      return handleOutput(state, flags);
    case "state":
      return handleState(state, flags);
    case "workspace":
      return handleWorkspace(state, flags);
    case "import":
      return handleImport(state, flags);
    case "force-unlock":
      return handleForceUnlock(state, flags);
    case "version":
      return { state, output: "Terraform v1.9.8\non linux_amd64" };
    case "providers":
      return handleProviders(state);
    case "":
      return { state, output: "Usage: terraform <command> [args]\n\nCommands: init, validate, fmt, plan, apply, destroy, show, output, state, workspace, import" };
    default:
      return { state, output: `Unknown command: ${sub}\nRun: terraform -help` };
  }
}

function requireInit(state: TerraformState): string | null {
  if (!state.initialized) {
    return "Error: Backend not initialized. Run: terraform init";
  }
  return null;
}

function checkLock(state: TerraformState): string | null {
  if (state.locked) {
    return `Error: Error acquiring the state lock\n\nLock Info:\n  ID:        ${state.lockId}\n  Operation: OperationTypeApply\n  Who:       other-user@workstation\n\nUse: terraform force-unlock ${state.lockId}`;
  }
  return null;
}

function handleInit(state: TerraformState, flags: string[]): { state: TerraformState; output: string } {
  if (state.initialized && !flags.includes("-migrate-state") && !flags.includes("-reconfigure")) {
    return {
      state,
      output: "Terraform has been successfully initialized!\n\nYou may now begin working with Terraform. Try running terraform plan.",
    };
  }
  const next = { ...state, initialized: true };
  return {
    state: next,
    output: `Initializing the backend...
Initializing provider plugins...
- Finding hashicorp/local versions matching "~> 2.5"...
- Installing hashicorp/local v2.5.1...
Terraform has been successfully initialized!`,
  };
}

function handleValidate(state: TerraformState): { state: TerraformState; output: string } {
  const err = requireInit(state);
  if (err) return { state, output: err };
  if (state.hasValidationError) {
    return {
      state,
      output: `Error: Missing required argument

  on main.tf line 4, in resource "local_file" "hello":
   4: resource "local_file" "hello" {

The argument "content" is required, but no definition was found.`,
    };
  }
  return { state, output: "Success! The configuration is valid." };
}

function handleFmt(flags: string[]): { state: TerraformState; output: string } {
  if (flags.includes("-check")) {
    return { state: defaultState(), output: "" };
  }
  return { state: defaultState(), output: "main.tf\nvariables.tf\noutputs.tf" };
}

function handlePlan(state: TerraformState, flags: string[]): { state: TerraformState; output: string } {
  const err = requireInit(state) ?? checkLock(state);
  if (err) return { state, output: err };

  const toCreate = state.resources.filter((r) => r.status === "planned");
  const toUpdate = state.resources.filter((r) => r.status === "drifted");
  const toDestroy = flags.includes("-destroy") ? state.resources.filter((r) => r.status === "created") : [];

  if (toCreate.length === 0 && toUpdate.length === 0 && toDestroy.length === 0) {
    return { state: { ...state, lastPlan: "no-changes" }, output: "No changes. Your infrastructure matches the configuration." };
  }

  let output = "Terraform used the selected providers to generate the following execution plan.\n\n";
  if (toCreate.length) {
    output += "Plan: " + toCreate.length + " to add";
    if (toUpdate.length) output += ", " + toUpdate.length + " to change";
    output += ", 0 to destroy.\n\n";
    toCreate.forEach((r) => {
      output += `  # ${r.address} will be created\n  + resource "${r.type}" "${r.name}" {\n`;
      Object.entries(r.attributes).forEach(([k, v]) => {
        output += `      + ${k} = "${v}"\n`;
      });
      output += "    }\n\n";
    });
  }
  if (toUpdate.length) {
    output += `Plan: 0 to add, ${toUpdate.length} to change, 0 to destroy.\n\n`;
    toUpdate.forEach((r) => {
      output += `  # ${r.address} has been changed\n  ~ resource "${r.type}" "${r.name}" {\n`;
      output += `      ~ content = "Hello from Terraform!" -> "${r.attributes.content}"\n`;
      output += "    }\n\n";
    });
  }
  if (toDestroy.length) {
    output += `Plan: 0 to add, 0 to change, ${toDestroy.length} to destroy.\n\n`;
    toDestroy.forEach((r) => {
      output += `  # ${r.address} will be destroyed\n  - resource "${r.type}" "${r.name}"\n\n`;
    });
  }

  return { state: { ...state, lastPlan: "pending" }, output };
}

function handleApply(state: TerraformState, flags: string[]): { state: TerraformState; output: string } {
  const err = requireInit(state) ?? checkLock(state);
  if (err) return { state, output: err };

  if (state.hasValidationError) {
    return { state, output: "Error: configuration invalid. Run terraform validate first." };
  }

  const autoApprove = flags.includes("-auto-approve");
  if (!autoApprove && state.lastPlan !== "pending") {
    return { state, output: "Warning: apply without plan file. Run terraform plan first, or use -auto-approve." };
  }

  const next = {
    ...state,
    applied: true,
    lastPlan: null,
    resources: state.resources.map((r) => ({
      ...r,
      status: "created" as ResourceStatus,
      attributes: r.status === "drifted"
        ? { filename: "hello.txt", content: "Hello from Terraform!" }
        : r.attributes,
    })),
  };

  const count = next.resources.length;
  return {
    state: next,
    output: `Apply complete! Resources: ${count} added, 0 changed, 0 destroyed.

Outputs:

message = "${next.outputs.message ?? ""}"
file_path = "${next.resources[0]?.attributes.filename ?? ""}"`,
  };
}

function handleDestroy(state: TerraformState, flags: string[]): { state: TerraformState; output: string } {
  const err = requireInit(state) ?? checkLock(state);
  if (err) return { state, output: err };
  if (!state.applied) {
    return { state, output: "No managed resources to destroy." };
  }
  const next = { ...defaultState(), initialized: state.initialized, workspace: state.workspace };
  return {
    state: next,
    output: `Destroy complete! Resources: ${state.resources.length} destroyed.`,
  };
}

function handleShow(state: TerraformState): { state: TerraformState; output: string } {
  const err = requireInit(state);
  if (err) return { state, output: err };
  if (!state.applied) {
    return { state, output: "No state.\n\nRun terraform apply to create resources." };
  }
  let output = "# local_file.hello:\n";
  const r = state.resources[0];
  if (r) {
    output += `resource "local_file" "hello" {\n`;
    Object.entries(r.attributes).forEach(([k, v]) => {
      output += `    ${k} = "${v}"\n`;
    });
    output += "}\n";
  }
  return { state, output };
}

function handleOutput(state: TerraformState, flags: string[]): { state: TerraformState; output: string } {
  const err = requireInit(state);
  if (err) return { state, output: err };
  if (!state.applied) return { state, output: "No outputs. Run terraform apply first." };
  const key = flags.find((f) => !f.startsWith("-"));
  if (key) {
    return { state, output: state.outputs[key] ?? `Output "${key}" not found` };
  }
  let output = "";
  Object.entries(state.outputs).forEach(([k, v]) => {
    output += `${k} = "${v}"\n`;
  });
  return { state, output: output.trim() };
}

function handleState(state: TerraformState, flags: string[]): { state: TerraformState; output: string } {
  const err = requireInit(state);
  if (err) return { state, output: err };
  const sub = flags[0];
  if (sub === "list") {
    if (!state.applied) return { state, output: "No state resources." };
    return { state, output: state.resources.map((r) => r.address).join("\n") };
  }
  return { state, output: "Usage: terraform state list | show <address>" };
}

function handleWorkspace(state: TerraformState, flags: string[]): { state: TerraformState; output: string } {
  const err = requireInit(state);
  if (err && flags[0] !== "list") return { state, output: err };
  const sub = flags[0];
  if (sub === "list" || !sub) {
    return { state, output: `  default\n* ${state.workspace}\n  staging\n  production` };
  }
  if (sub === "show") {
    return { state, output: state.workspace };
  }
  if (sub === "select") {
    const name = flags[1];
    if (!name) return { state, output: "Usage: terraform workspace select NAME" };
    return { state: { ...state, workspace: name }, output: `Switched to workspace "${name}".` };
  }
  if (sub === "new") {
    const name = flags[1];
    if (!name) return { state, output: "Usage: terraform workspace new NAME" };
    return { state: { ...state, workspace: name }, output: `Created and switched to workspace "${name}".` };
  }
  return { state, output: "Usage: terraform workspace list | select | new | show" };
}

function handleImport(state: TerraformState, flags: string[]): { state: TerraformState; output: string } {
  const err = requireInit(state);
  if (err) return { state, output: err };
  const address = flags[0];
  const id = flags[1];
  if (!address || !id) {
    return { state, output: "Usage: terraform import ADDRESS ID" };
  }
  const next = {
    ...state,
    applied: true,
    resources: [
      {
        address,
        type: address.split(".")[0] ?? "resource",
        name: address.split(".")[1] ?? "imported",
        attributes: { id },
        status: "created" as ResourceStatus,
      },
    ],
  };
  return { state: next, output: `Import successful!\n\nResources imported: 1` };
}

function handleForceUnlock(state: TerraformState, flags: string[]): { state: TerraformState; output: string } {
  const id = flags[0];
  if (!state.locked) {
    return { state, output: "No lock found." };
  }
  if (id !== state.lockId) {
    return { state, output: `Error: lock ID "${id}" does not match active lock ${state.lockId}` };
  }
  return { state: { ...state, locked: false, lockId: "" }, output: `Terraform state has been successfully unlocked!\n\nLock ID: ${id}` };
}

function handleProviders(state: TerraformState): { state: TerraformState; output: string } {
  if (!state.initialized) {
    return { state, output: "No providers. Run terraform init." };
  }
  return {
    state,
    output: `Providers required by configuration:\n    provider[registry.terraform.io/hashicorp/local]\n\nProviders used by state:\n    provider[registry.terraform.io/hashicorp/local]`,
  };
}

export const terraformMissions: Mission[] = [
  {
    id: "tf-init",
    title: "Initialize the workspace",
    hint: "terraform init",
    validate: (cmd, s) => normalizeCmd(cmd) === "terraform init" && s.initialized,
  },
  {
    id: "tf-validate",
    title: "Validate configuration",
    hint: "terraform validate",
    validate: (cmd) => normalizeCmd(cmd) === "terraform validate",
  },
  {
    id: "tf-plan",
    title: "Preview changes",
    hint: "terraform plan",
    validate: (cmd, s) => normalizeCmd(cmd) === "terraform plan" && s.lastPlan !== null,
  },
  {
    id: "tf-apply",
    title: "Apply infrastructure",
    hint: "terraform apply -auto-approve",
    validate: (cmd, s) => cmd.includes("apply") && s.applied,
  },
  {
    id: "tf-state",
    title: "List state resources",
    hint: "terraform state list",
    validate: (cmd) => normalizeCmd(cmd) === "terraform state list",
  },
  {
    id: "tf-output",
    title: "Read outputs",
    hint: "terraform output",
    validate: (cmd) => normalizeCmd(cmd).startsWith("terraform output"),
  },
];

export const terraformBestPractices: BestPractice[] = [
  { icon: "📋", title: "Plan before apply", body: "Always run terraform plan and review every +, ~, and - before applying to production." },
  { icon: "🔒", title: "Remote state + locking", body: "Use S3 + DynamoDB for team state. Never commit terraform.tfstate to git." },
  { icon: "📦", title: "Modules for reuse", body: "Extract repeated patterns into versioned modules with documented inputs/outputs." },
  { icon: "🏷️", title: "Default tags", body: "Tag every resource with Project, Environment, and ManagedBy for cost and ownership." },
  { icon: "🛡️", title: "Safeguards", body: "Use check blocks, allowed_account_ids, and prevent_destroy on critical resources." },
  { icon: "🔐", title: "Secrets via env", body: "Pass secrets with TF_VAR_* environment variables — never hardcode in .tf files." },
];

export function loadScenario(kind: string): TerraformState {
  switch (kind) {
    case "initialized": return initializedState();
    case "applied": return appliedState();
    case "drift": return driftState();
    case "validation": return validationErrorState();
    case "state-lock": return stateLockState();
    default: return freshWorkspaceState();
  }
}
