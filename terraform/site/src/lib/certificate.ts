/** Completion certificate — driven by local Tracker progress */

import type { ProgressData } from "./progress-store";
import { isComplete } from "./progress-store";
import type { Trackable } from "../data/trackables";

export const CERTIFICATE_NAME_KEY = "tf-lab-certificate-name";

export const CORE_LAB_IDS = [
  "terraform-fundamentals",
  "mod-t1-iac", "mod-t2-hcl", "mod-t3-workflow", "mod-t4-variables",
  "mod-t5-state", "mod-t6-modules", "mod-t7-providers", "mod-t8-remote-state",
  "mod-t9-workspaces", "mod-t10-ci", "mod-t11-drift", "mod-t12-production",
  "tf-sandbox",
  "ts-validation", "ts-drift", "ts-state-lock",
  "local-00", "local-01", "local-02", "local-03", "local-04",
  "local-05", "local-06", "local-07",
];

export const PROGRAM_TITLE = "Terraform Practice Lab";
export const PROGRAM_SUBTITLE = "Infrastructure as Code — fundamentals through production";
export const ISSUER = "Terraform Practice Lab (Open Source)";
export const REPO_URL = "https://github.com/Jacob-Idolor/Pet_Projects/tree/main/terraform";

export interface CertificateStatus {
  coreDone: number;
  coreTotal: number;
  corePct: number;
  fullDone: number;
  fullTotal: number;
  fullPct: number;
  coreComplete: boolean;
  fullComplete: boolean;
  eligible: boolean;
  tier: "none" | "core" | "full";
  completedTitles: string[];
  completionDate: string | null;
  credentialId: string | null;
}

function simpleHash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36).toUpperCase().padStart(8, "0").slice(0, 8);
}

export function getCompletionDate(data: ProgressData, ids: string[]): string | null {
  const dates = ids
    .filter((id) => data.completed[id])
    .map((id) => data.completed[id].completedAt)
    .sort();
  return dates.length ? dates[dates.length - 1]!.slice(0, 10) : null;
}

export function generateCredentialId(data: ProgressData, ids: string[]): string {
  const payload = ids
    .filter((id) => isComplete(data, id))
    .sort()
    .map((id) => `${id}:${data.completed[id]!.completedAt.slice(0, 10)}`)
    .join("|");
  const year = new Date().getFullYear();
  return `TFLAB-${year}-${simpleHash(payload)}`;
}

export function getCertificateStatus(data: ProgressData, allTrackables: Trackable[]): CertificateStatus {
  const coreTotal = CORE_LAB_IDS.length;
  const coreDone = CORE_LAB_IDS.filter((id) => isComplete(data, id)).length;
  const corePct = coreTotal ? Math.round((coreDone / coreTotal) * 100) : 0;
  const fullTotal = allTrackables.length;
  const fullDone = allTrackables.filter((t) => isComplete(data, t.id)).length;
  const fullPct = fullTotal ? Math.round((fullDone / fullTotal) * 100) : 0;
  const coreComplete = coreDone === coreTotal;
  const fullComplete = fullDone === fullTotal;
  const eligible = coreComplete;
  let tier: CertificateStatus["tier"] = "none";
  if (fullComplete) tier = "full";
  else if (coreComplete) tier = "core";
  const completedTitles = allTrackables.filter((t) => isComplete(data, t.id)).map((t) => t.title);
  const completionDate = eligible
    ? getCompletionDate(data, fullComplete ? allTrackables.map((t) => t.id) : CORE_LAB_IDS)
    : null;
  const credentialId = eligible
    ? generateCredentialId(data, fullComplete ? allTrackables.map((t) => t.id) : CORE_LAB_IDS)
    : null;
  return { coreDone, coreTotal, corePct, fullDone, fullTotal, fullPct, coreComplete, fullComplete, eligible, tier, completedTitles, completionDate, credentialId };
}

export function linkedInCertificationText(status: CertificateStatus): string {
  const tierLabel = status.tier === "full" ? "Full Program" : "Core Lab Program";
  return `${PROGRAM_TITLE} — ${tierLabel}

Completed self-paced Terraform training: IaC fundamentals, modules, remote state, CI/CD, drift detection, and production safeguards.

• ${status.fullDone}/${status.fullTotal} training tasks completed
• Browser simulator + local Terraform labs
• S3 + CloudFront production example

Open-source curriculum: ${REPO_URL}`;
}

export function linkedInPostText(status: CertificateStatus): string {
  return `I completed the ${PROGRAM_TITLE} — hands-on Infrastructure as Code training.

✅ ${status.coreDone}/${status.coreTotal} core labs
✅ Terraform simulator + real local labs
✅ Troubleshooting: validation, drift, state locks

Skills: Terraform, HCL, AWS, CI/CD, DevOps

#Terraform #IaC #DevOps #AWS #LearningInPublic`;
}

export function linkedInSkills(): string[] {
  return ["Terraform", "Infrastructure as Code", "AWS", "HCL", "DevOps", "CI/CD"];
}
