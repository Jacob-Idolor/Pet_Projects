/** Completion certificate — driven by local Tracker progress */

import type { ProgressData } from "./progress-store";
import { isComplete } from "./progress-store";
import type { Trackable } from "../data/trackables";

export const CERTIFICATE_NAME_KEY = "k8s-lab-certificate-name";

/** Hub labs — minimum for core certificate (excludes learn-curriculum overview card) */
export const CORE_LAB_IDS = [
  "docker-fundamentals", "docker-exited", "docker-wrongport",
  "mod-c1-containers", "mod-c2-images", "mod-c3-dockerfile", "mod-c4-docker-cli",
  "mod-c5-debug-docker", "mod-c6-orchestration",
  "mod-k1-overview", "mod-k2-pods", "mod-k3-pod-debug", "mod-k4-deployments",
  "mod-k5-services", "mod-k6-config", "mod-k7-networking", "mod-k8-storage-rbac",
  "mod-k9-production",
  "kubectl-sandbox",
  "ts-crashloop", "ts-endpoints", "ts-imagepull", "ts-pending",
  "local-00", "local-01", "local-02", "local-03", "local-04",
  "local-05", "local-06", "local-07",
];

export const PROGRAM_TITLE = "Kubernetes & Docker Hands-On Lab";
export const PROGRAM_SUBTITLE = "Containers, Kubernetes, and Production Troubleshooting";
export const ISSUER = "K8s Practice Lab (Open Source)";
export const REPO_URL = "https://github.com/Jacob-Idolor/Pet_Projects/tree/main/kubernetes";

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
  return `K8SLAB-${year}-${simpleHash(payload)}`;
}

export function getCertificateStatus(
  data: ProgressData,
  allTrackables: Trackable[]
): CertificateStatus {
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

  const completedIds = allTrackables.filter((t) => isComplete(data, t.id)).map((t) => t.id);
  const completedTitles = allTrackables.filter((t) => isComplete(data, t.id)).map((t) => t.title);

  const completionDate = eligible
    ? getCompletionDate(data, fullComplete ? allTrackables.map((t) => t.id) : CORE_LAB_IDS)
    : null;

  const credentialId = eligible
    ? generateCredentialId(data, fullComplete ? allTrackables.map((t) => t.id) : CORE_LAB_IDS)
    : null;

  return {
    coreDone,
    coreTotal,
    corePct,
    fullDone,
    fullTotal,
    fullPct,
    coreComplete,
    fullComplete,
    eligible,
    tier,
    completedTitles,
    completionDate,
    credentialId,
  };
}

export function linkedInCertificationText(status: CertificateStatus, name: string): string {
  const tierLabel = status.tier === "full" ? "Full Program (with advanced challenges)" : "Core Lab Program";
  return `${PROGRAM_TITLE} — ${tierLabel}

Completed self-paced, hands-on training covering Docker containerization, Kubernetes fundamentals, local cluster labs (kind), and production troubleshooting scenarios.

• ${status.fullDone}/${status.fullTotal} training tasks completed
• Docker, kubectl, Deployments, Services, ConfigMaps, Ingress, Storage, RBAC, Helm
• Browser simulators + local kind cluster labs

Open-source curriculum: ${REPO_URL}`;
}

export function linkedInPostText(status: CertificateStatus, name: string): string {
  return `I completed the ${PROGRAM_TITLE} — a hands-on Docker & Kubernetes training program I built and worked through end-to-end.

✅ ${status.coreDone}/${status.coreTotal} core labs
✅ Browser simulators + real kind cluster practice
✅ Troubleshooting scenarios (CrashLoop, ImagePull, networking, and more)

Skills practiced: Docker, Kubernetes, kubectl, Helm, troubleshooting, containerization

#Kubernetes #Docker #DevOps #CloudNative #LearningInPublic`;
}

export function linkedInSkills(): string[] {
  return [
    "Kubernetes",
    "Docker",
    "Containerization",
    "kubectl",
    "Helm",
    "DevOps",
    "Cloud Native",
    "Troubleshooting",
  ];
}
