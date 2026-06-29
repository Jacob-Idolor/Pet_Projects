export interface ModuleMeta {
  prerequisites: string[];
  keyTakeaways: string[];
  localLab?: { title: string; href: string; command?: string };
  browserLab?: string;
  reflection: string[];
  commonMistakes: string[];
}

export const moduleMeta: Record<string, ModuleMeta> = {
  containers: {
    prerequisites: ["Basic command line", "Optional: complete /docker.html simulator first"],
    keyTakeaways: [
      "An image is immutable; a container is a running instance of that image.",
      "docker build → image → docker run → container is the same pipeline Kubernetes uses.",
      "Host:container port mapping (-p 8080:80) is a common source of 'app won't load' bugs.",
      "Multi-stage builds and non-root users are production defaults, not extras.",
    ],
    localLab: { title: "Lab 00 — Docker hands-on", href: "https://github.com/Jacob-Idolor/Pet_Projects/tree/main/kubernetes/labs/lab-00-docker", command: "make docker-lab" },
    browserLab: "/docker.html",
    reflection: [
      "Can you explain the difference between an image layer and a running container?",
      "What would you check first if curl to your container fails?",
    ],
    commonMistakes: [
      "Using :latest in production — pin tags for reproducibility.",
      "Mapping ports backwards (container:host instead of host:container).",
      "Putting secrets in Dockerfile ENV — layers persist forever.",
    ],
  },
  pods: {
    prerequisites: ["Module 1: Containers & Docker", "Optional: Lab 00"],
    keyTakeaways: [
      "A Pod is the smallest unit Kubernetes schedules — usually one app container.",
      "Pod IP is ephemeral; when a Pod dies, its replacement gets a new IP.",
      "Debugging order: get → describe (Events) → logs → logs --previous.",
      "CrashLoopBackOff means the container exits repeatedly; describe + logs reveal why.",
    ],
    localLab: { title: "Lab 01 — First pod", href: "https://github.com/Jacob-Idolor/Pet_Projects/tree/main/kubernetes/labs/lab-01-first-pod", command: "make local-lab" },
    reflection: [
      "Why shouldn't you create bare Pods in production instead of Deployments?",
      "What does ImagePullBackOff tell you before you even run describe?",
    ],
    commonMistakes: [
      "Skipping describe and going straight to deleting/recreating the Pod.",
      "Ignoring the Events section at the bottom of describe output.",
      "Assuming Pod name stays the same after delete — it won't with Deployments.",
    ],
  },
  deployments: {
    prerequisites: ["Module 2: Pods", "Lab 01 complete"],
    keyTakeaways: [
      "Deployment → ReplicaSet → Pod: declarative desired state with self-healing.",
      "Services provide stable DNS/IP; Pods do not — always expose via Service.",
      "Empty endpoints = Service selector doesn't match Pod labels. Check this first.",
      "rollout undo is the fastest safe recovery from a bad image push.",
    ],
    localLab: { title: "Lab 02 — Deployments & services", href: "https://github.com/Jacob-Idolor/Pet_Projects/tree/main/kubernetes/labs/lab-02-deployments-services", command: "make local-lab" },
    reflection: [
      "What happens when you delete a Pod managed by a Deployment?",
      "Why does ClusterIP not work from your laptop browser without port-forward?",
    ],
    commonMistakes: [
      "Service selector typo — app: web vs app:web (labels must match exactly).",
      "Scaling by creating Pods manually instead of kubectl scale / edit Deployment.",
      "Forgetting rollout status after image change.",
    ],
  },
  config: {
    prerequisites: ["Module 3: Deployments & Services"],
    keyTakeaways: [
      "ConfigMap = non-sensitive config; Secret = sensitive (still protect with RBAC).",
      "Changing a ConfigMap does not always reload running Pods — rollout restart may be needed.",
      "Mount as file when app reads config from disk; use env when app reads env vars.",
      "Never commit real Secrets to git — use Sealed Secrets, External Secrets, or Vault in prod.",
    ],
    localLab: { title: "Lab 03 — ConfigMaps & secrets", href: "https://github.com/Jacob-Idolor/Pet_Projects/tree/main/kubernetes/labs/lab-03-config-secrets", command: "make local-lab" },
    reflection: [
      "When would you choose a volume mount over an environment variable?",
      "Why is base64 in a Secret YAML not real encryption?",
    ],
    commonMistakes: [
      "Wrong key name in env valueFrom — silent empty string or crash.",
      "Expecting hot reload without app support or Pod restart.",
      "Storing production credentials in plain ConfigMap.",
    ],
  },
  networking: {
    prerequisites: ["Module 3: Deployments & Services", "Understand Services and labels"],
    keyTakeaways: [
      "Every Pod gets a cluster IP; Services group Pods behind one stable address.",
      "kube-proxy (or CNI) implements Service routing to Pod endpoints.",
      "Ingress = HTTP routing layer; needs an Ingress controller installed.",
      "Debug path: Pod Running → endpoints populated → Ingress rules → DNS/TLS.",
    ],
    localLab: { title: "Lab 04 — Networking & ingress", href: "https://github.com/Jacob-Idolor/Pet_Projects/tree/main/kubernetes/labs/lab-04-networking-ingress", command: "make local-lab" },
    browserLab: "/practice-broken.html",
    reflection: [
      "What is the difference between NodePort and Ingress?",
      "How would you verify a Service has backends before blaming the app?",
    ],
    commonMistakes: [
      "Installing Ingress resource without an Ingress controller — nothing routes traffic.",
      "Wrong host header or missing /etc/hosts entry when testing locally.",
      "Debugging Ingress before confirming Service endpoints exist.",
    ],
  },
  storage: {
    prerequisites: ["Module 2: Pods", "Basic volume concept"],
    keyTakeaways: [
      "emptyDir dies with the Pod; PVC data survives Pod deletion.",
      "PVC requests storage; PV provides it; StorageClass enables dynamic provisioning.",
      "ReadWriteOnce (RWO) = one node at a time — matters for multi-replica apps.",
      "RBAC: Role + RoleBinding + ServiceAccount = who can do what in a namespace.",
    ],
    localLab: { title: "Lab 05 — Storage", href: "https://github.com/Jacob-Idolor/Pet_Projects/tree/main/kubernetes/labs/lab-05-storage", command: "make local-lab" },
    reflection: [
      "Why can't two Pods on different nodes share a RWO volume?",
      "When would you use a Role vs ClusterRole?",
    ],
    commonMistakes: [
      "Using emptyDir for data that must survive restarts.",
      "PVC stuck Pending — no default StorageClass or wrong access mode.",
      "Granting cluster-admin to app ServiceAccounts.",
    ],
  },
  production: {
    prerequisites: ["Modules 1–6", "At least Labs 01–03 on local cluster"],
    keyTakeaways: [
      "Set requests (scheduling) and limits (cap) — unset memory limits risk OOM kills.",
      "Liveness = restart if dead; readiness = remove from Service if not ready.",
      "Helm packages YAML; upgrade/rollback map to Deployment rollout patterns.",
      "On-call flow for CrashLoop: get pods → describe → logs → fix manifest → rollout.",
    ],
    localLab: { title: "Lab 07 — Helm", href: "https://github.com/Jacob-Idolor/Pet_Projects/tree/main/kubernetes/labs/lab-07-helm", command: "make local-lab" },
    browserLab: "/practice-crash.html",
    reflection: [
      "What's the difference between liveness and readiness probes?",
      "When would helm rollback beat kubectl rollout undo?",
    ],
    commonMistakes: [
      "Liveness probe too aggressive — restarts healthy but slow-starting apps.",
      "No resource requests — Pod schedules anywhere, then gets OOMKilled under load.",
      "Panic-deleting namespace in prod instead of rollout undo.",
    ],
  },
};

export const learningPathOrder = [
  { step: 1, label: "Docker fundamentals", browser: "/docker.html", local: "lab-00-docker" },
  { step: 2, label: "Containers module + quiz", browser: "/modules/containers.html", local: "lab-00-docker" },
  { step: 3, label: "Pods module → Lab 01", browser: "/modules/pods.html", local: "lab-01-first-pod" },
  { step: 4, label: "Deployments module → Lab 02", browser: "/modules/deployments.html", local: "lab-02-deployments-services" },
  { step: 5, label: "Config module → Lab 03", browser: "/modules/config.html", local: "lab-03-config-secrets" },
  { step: 6, label: "Networking → Lab 04 + troubleshoot", browser: "/modules/networking.html", local: "lab-04-networking-ingress" },
  { step: 7, label: "Storage & RBAC → Labs 05–06", browser: "/modules/storage.html", local: "lab-05-storage" },
  { step: 8, label: "Production + Helm → Lab 07", browser: "/modules/production.html", local: "lab-07-helm" },
  { step: 9, label: "Advanced challenges", browser: "/troubleshoot.html", local: "manifests/broken/" },
];
