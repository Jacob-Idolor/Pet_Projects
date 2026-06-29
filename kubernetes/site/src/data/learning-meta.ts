export interface ModuleMeta {
  prerequisites: string[];
  keyTakeaways: string[];
  localLab?: { title: string; href: string; command?: string };
  browserLab?: string;
  reflection: string[];
  commonMistakes: string[];
}

export const moduleMeta: Record<string, ModuleMeta> = {
  "c1-containers": {
    prerequisites: ["Basic command line"],
    keyTakeaways: [
      "A container is an isolated process sharing the host kernel — not a full VM.",
      "Kubernetes runs containers; it does not replace them.",
    ],
    browserLab: "/docker.html",
    reflection: ["Can you explain VM vs container in one sentence?"],
    commonMistakes: ["Treating containers as tiny VMs — they share the host kernel."],
  },
  "c2-images": {
    prerequisites: ["Lesson 1: What is a container?"],
    keyTakeaways: [
      "Image = immutable template; container = running instance.",
      "Images live in registries (Docker Hub, GHCR, ECR).",
    ],
    browserLab: "/docker.html",
    reflection: ["Why can one image spawn many containers?"],
    commonMistakes: ["Confusing image tags with container names."],
  },
  "c3-dockerfile": {
    prerequisites: ["Lesson 2: Images & layers"],
    keyTakeaways: [
      "Dockerfile → docker build → image → docker run → container.",
      "Multi-stage builds keep production images small.",
    ],
    localLab: { title: "Lab 00 — Docker hands-on", href: "https://github.com/Jacob-Idolor/Pet_Projects/tree/main/kubernetes/labs/lab-00-docker", command: "make docker-lab" },
    browserLab: "/docker.html",
    reflection: ["What does each Dockerfile instruction do in your app?"],
    commonMistakes: ["Using :latest in production.", "Putting secrets in ENV — layers persist."],
  },
  "c4-docker-cli": {
    prerequisites: ["Lesson 3: Dockerfile & build"],
    keyTakeaways: [
      "docker ps / ps -a, logs, inspect are your daily tools.",
      "Port mapping is host:container (-p 8080:80).",
    ],
    browserLab: "/docker.html",
    reflection: ["What would you run first if a container won't respond on curl?"],
    commonMistakes: ["Mapping ports backwards (container:host)."],
  },
  "c5-debug-docker": {
    prerequisites: ["Lesson 4: Essential Docker commands"],
    keyTakeaways: [
      "Exited containers: ps -a → logs → inspect exit code.",
      "Wrong port mapping is the #1 'app won't load' Docker bug.",
    ],
    browserLab: "/practice-docker-exited.html",
    reflection: ["How does Docker debugging map to kubectl describe + logs?"],
    commonMistakes: ["Only checking docker ps (misses exited containers)."],
  },
  "c6-orchestration": {
    prerequisites: ["Lessons 1–5: Container fundamentals"],
    keyTakeaways: [
      "Docker excels on one machine; production needs orchestration.",
      "Kubernetes adds scheduling, healing, scaling, and rollouts.",
    ],
    reflection: ["What problems does K8s solve that Docker alone cannot?"],
    commonMistakes: ["Jumping to Kubernetes before understanding images and containers."],
  },
  "k1-overview": {
    prerequisites: ["Part 1 complete (Lessons 1–6)"],
    keyTakeaways: [
      "Control plane schedules work; nodes run containers; kubectl is the CLI.",
      "Declarative YAML — describe desired state, K8s reconciles.",
    ],
    localLab: { title: "Lab 01 — First pod", href: "https://github.com/Jacob-Idolor/Pet_Projects/tree/main/kubernetes/labs/lab-01-first-pod", command: "make local-lab" },
    reflection: ["What is the difference between imperative and declarative?"],
    commonMistakes: ["Expecting kubectl to build images — it manages cluster state."],
  },
  "k2-pods": {
    prerequisites: ["Lesson 7: Kubernetes overview"],
    keyTakeaways: [
      "Pod = smallest schedulable unit; usually one app container.",
      "Pod IPs are ephemeral — don't rely on them staying stable.",
    ],
    localLab: { title: "Lab 01 — First pod", href: "https://github.com/Jacob-Idolor/Pet_Projects/tree/main/kubernetes/labs/lab-01-first-pod", command: "make local-lab" },
    reflection: ["Why schedule Pods instead of bare containers?"],
    commonMistakes: ["Creating bare Pods in production instead of Deployments."],
  },
  "k3-pod-debug": {
    prerequisites: ["Lesson 8: Pods explained"],
    keyTakeaways: [
      "Debug order: get → describe (Events) → logs → logs --previous.",
      "ImagePullBackOff, CrashLoopBackOff, Pending each mean something specific.",
    ],
    browserLab: "/practice-crash.html",
    reflection: ["What do Events at the bottom of describe tell you?"],
    commonMistakes: ["Deleting Pods before reading describe Events."],
  },
  "k4-deployments": {
    prerequisites: ["Lesson 9: Debugging Pods"],
    keyTakeaways: [
      "Deployment → ReplicaSet → Pod with self-healing.",
      "kubectl rollout undo is the fastest bad-deploy recovery.",
    ],
    localLab: { title: "Lab 02 — Deployments & services", href: "https://github.com/Jacob-Idolor/Pet_Projects/tree/main/kubernetes/labs/lab-02-deployments-services", command: "make local-lab" },
    reflection: ["What happens when you delete a Pod owned by a Deployment?"],
    commonMistakes: ["Scaling by creating Pods manually."],
  },
  "k5-services": {
    prerequisites: ["Lesson 10: Deployments"],
    keyTakeaways: [
      "Services provide stable DNS/IP; Pods do not.",
      "Empty endpoints = selector doesn't match Pod labels.",
    ],
    localLab: { title: "Lab 02 — Deployments & services", href: "https://github.com/Jacob-Idolor/Pet_Projects/tree/main/kubernetes/labs/lab-02-deployments-services", command: "make local-lab" },
    browserLab: "/practice-broken.html",
    reflection: ["Why check endpoints before blaming the app?"],
    commonMistakes: ["Service selector typo — labels must match exactly."],
  },
  "k6-config": {
    prerequisites: ["Lesson 11: Services & endpoints"],
    keyTakeaways: [
      "ConfigMap = non-sensitive; Secret = sensitive (protect with RBAC).",
      "Config changes may need rollout restart to take effect.",
    ],
    localLab: { title: "Lab 03 — ConfigMaps & secrets", href: "https://github.com/Jacob-Idolor/Pet_Projects/tree/main/kubernetes/labs/lab-03-config-secrets", command: "make local-lab" },
    reflection: ["When mount as file vs env var?"],
    commonMistakes: ["Storing prod credentials in plain ConfigMap."],
  },
  "k7-networking": {
    prerequisites: ["Lesson 11: Services & endpoints"],
    keyTakeaways: [
      "Debug path: Pod Running → endpoints → Ingress → DNS/TLS.",
      "Ingress needs a controller installed — YAML alone does nothing.",
    ],
    localLab: { title: "Lab 04 — Networking & ingress", href: "https://github.com/Jacob-Idolor/Pet_Projects/tree/main/kubernetes/labs/lab-04-networking-ingress", command: "make local-lab" },
    browserLab: "/practice-broken.html",
    reflection: ["NodePort vs Ingress — when use each?"],
    commonMistakes: ["Debugging Ingress before confirming Service endpoints."],
  },
  "k8-storage-rbac": {
    prerequisites: ["Lesson 8: Pods explained"],
    keyTakeaways: [
      "PVC data survives Pod deletion; emptyDir does not.",
      "Role + RoleBinding + ServiceAccount = least privilege.",
    ],
    localLab: { title: "Lab 05 — Storage", href: "https://github.com/Jacob-Idolor/Pet_Projects/tree/main/kubernetes/labs/lab-05-storage", command: "make local-lab" },
    reflection: ["When Role vs ClusterRole?"],
    commonMistakes: ["Using emptyDir for data that must persist."],
  },
  "k9-production": {
    prerequisites: ["Lessons 7–14"],
    keyTakeaways: [
      "Liveness vs readiness probes — restart vs remove from Service.",
      "Set requests and limits; use rollout undo for bad deploys.",
    ],
    localLab: { title: "Lab 07 — Helm", href: "https://github.com/Jacob-Idolor/Pet_Projects/tree/main/kubernetes/labs/lab-07-helm", command: "make local-lab" },
    browserLab: "/practice-crash.html",
    reflection: ["What's your on-call flow for CrashLoopBackOff?"],
    commonMistakes: ["Aggressive liveness probe killing slow starters."],
  },
};

export const learningPathOrder = [
  { step: 1, label: "Part 1 — Container lessons (1–6)", browser: "/learn.html#containers", local: "lab-00-docker" },
  { step: 2, label: "Docker simulator + Lab 00", browser: "/docker.html", local: "lab-00-docker" },
  { step: 3, label: "Part 2 — K8s overview & Pods (7–9)", browser: "/learn.html#kubernetes", local: "lab-01-first-pod" },
  { step: 4, label: "Deployments & Services (10–11) → Lab 02", browser: "/modules/k4-deployments.html", local: "lab-02-deployments-services" },
  { step: 5, label: "Config (12) → Lab 03", browser: "/modules/k6-config.html", local: "lab-03-config-secrets" },
  { step: 6, label: "Networking (13) → Lab 04", browser: "/modules/k7-networking.html", local: "lab-04-networking-ingress" },
  { step: 7, label: "Storage & RBAC (14) → Labs 05–06", browser: "/modules/k8-storage-rbac.html", local: "lab-05-storage" },
  { step: 8, label: "Production (15) + Helm → Lab 07", browser: "/modules/k9-production.html", local: "lab-07-helm" },
  { step: 9, label: "Troubleshoot scenarios", browser: "/troubleshoot.html", local: "manifests/broken/" },
];
