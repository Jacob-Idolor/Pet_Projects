export interface QuizQ {
  question: string;
  options: string[];
  correct: number;
  explain: string;
}

export type LessonPhase = "containers" | "kubernetes";

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
  cluster: "default" | "lab02" | "broken" | "crash" | "imagepull" | "pending";
  terminal?: "docker" | "kubectl";
  sections: LessonSection[];
  quiz: QuizQ[];
  practiceGoal: string;
}

export const phaseLabels: Record<LessonPhase, { title: string; desc: string }> = {
  containers: {
    title: "Part 1 — Containers & Docker",
    desc: "Building blocks: images, containers, Dockerfile, and debugging. Master this before Kubernetes.",
  },
  kubernetes: {
    title: "Part 2 — Kubernetes",
    desc: "Orchestration: Pods, Deployments, Services, config, networking, and production patterns.",
  },
};

export const modules: Module[] = [
  // ─── PART 1: CONTAINERS ───────────────────────────────────────────
  {
    id: "c1-containers",
    title: "What is a container?",
    subtitle: "The building block everything else sits on",
    time: "8 min",
    order: 1,
    phase: "containers",
    terminal: "docker",
    sections: [
      {
        heading: "Containers in plain English",
        body: "A <strong>container</strong> is your app running in a isolated box — it includes your code, runtime, and dependencies. It shares the host OS kernel (unlike a VM which bundles a whole OS).",
        type: "concept",
      },
      {
        heading: "VM vs container",
        body: "A <strong>VM</strong> virtualizes hardware — heavy, minutes to boot. A <strong>container</strong> virtualizes the OS — lightweight, starts in seconds. That's why modern apps use containers.",
        type: "analogy",
      },
      {
        heading: "Why this matters for Kubernetes",
        body: "Kubernetes doesn't replace containers — it <strong>runs</strong> them. You still build container images; K8s schedules and heals them across machines.",
        type: "tip",
      },
    ],
    quiz: [
      {
        question: "How is a container different from a VM?",
        options: ["Containers include a full guest OS", "Containers share the host kernel and start faster", "VMs are always smaller", "There is no difference"],
        correct: 1,
        explain: "Containers share the kernel; VMs virtualize hardware with their own OS.",
      },
    ],
    practiceGoal: "Run docker ps to see a running container in the simulator.",
  },
  {
    id: "c2-images",
    title: "Images & layers",
    subtitle: "Immutable templates you build once and run many times",
    time: "10 min",
    order: 2,
    phase: "containers",
    terminal: "docker",
    sections: [
      {
        heading: "Image vs container",
        body: "<strong>Image</strong> = read-only template (stacked layers). <strong>Container</strong> = running instance of that image. One image → many containers.",
        type: "concept",
      },
      {
        heading: "Think of it like a cookie cutter",
        body: "The <strong>image</strong> is the cutter (shape never changes). Each <strong>container</strong> is a cookie you stamp out — same shape, independent copies.",
        type: "analogy",
      },
      {
        heading: "Registries",
        body: "Images live in registries: Docker Hub, GHCR, ECR. You <code>docker pull</code> to download and <code>docker push</code> to publish. Kubernetes pulls from the same registries.",
        type: "concept",
        tryCommand: "docker images",
      },
    ],
    quiz: [
      {
        question: "What is the relationship between an image and a container?",
        options: ["Same thing", "Image is template; container is a running copy", "Container comes first", "Images only exist in Kubernetes"],
        correct: 1,
        explain: "Build an image once, run many containers from it.",
      },
    ],
    practiceGoal: "Run docker images to list local images.",
  },
  {
    id: "c3-dockerfile",
    title: "Dockerfile & build",
    subtitle: "How you create an image from code",
    time: "10 min",
    order: 3,
    phase: "containers",
    terminal: "docker",
    sections: [
      {
        heading: "The pipeline",
        body: "<code>Dockerfile</code> (recipe) → <code>docker build -t myapp:1.0 .</code> → <strong>Image</strong> → <code>docker run myapp:1.0</code> → <strong>Container</strong>",
        type: "concept",
      },
      {
        heading: "Key Dockerfile instructions",
        body: "<code>FROM</code> base image · <code>COPY</code> files in · <code>RUN</code> build steps · <code>EXPOSE</code> port · <code>CMD</code> or <code>ENTRYPOINT</code> what runs at start",
        type: "concept",
      },
      {
        heading: "Multi-stage builds",
        body: "Compile in a <strong>builder</strong> stage, copy only the binary to a slim runtime image. Smaller = faster deploys, smaller attack surface.",
        type: "tip",
        tryCommand: "docker build -t myapp:1.0 .",
      },
    ],
    quiz: [
      {
        question: "What does docker build -t myapp:1.0 . do?",
        options: ["Runs a container", "Builds an image from the Dockerfile here", "Pushes to Docker Hub", "Creates a Pod"],
        correct: 1,
        explain: "-t tags the image; . is the build context directory.",
      },
    ],
    practiceGoal: "Run docker build -t myapp:1.0 . in the simulator.",
  },
  {
    id: "c4-docker-cli",
    title: "Essential Docker commands",
    subtitle: "The CLI you'll use every day",
    time: "10 min",
    order: 4,
    phase: "containers",
    terminal: "docker",
    sections: [
      {
        heading: "See what's running",
        body: "<code>docker ps</code> — running containers only<br><code>docker ps -a</code> — includes stopped/exited",
        type: "concept",
        tryCommand: "docker ps",
      },
      {
        heading: "Inspect and logs",
        body: "<code>docker logs NAME</code> — app output<br><code>docker inspect NAME</code> — full config, exit code, ports",
        type: "concept",
        tryCommand: "docker logs web",
      },
      {
        heading: "Port mapping",
        body: "<code>docker run -p 8080:80 myapp</code> — host port 8080 → container port 80. Format is always <strong>host:container</strong>.",
        type: "try-it",
        tryCommand: "docker inspect web --format='{{.State.Status}}'",
      },
    ],
    quiz: [
      {
        question: "What does -p 8080:80 mean?",
        options: ["Container 8080 → host 80", "Host 8080 → container 80", "Both must match", "HTTPS only"],
        correct: 1,
        explain: "Traffic to localhost:8080 reaches port 80 inside the container.",
      },
    ],
    practiceGoal: "Run docker ps, docker logs web, and docker images.",
  },
  {
    id: "c5-debug-docker",
    title: "Debugging containers",
    subtitle: "When things crash or ports don't work",
    time: "10 min",
    order: 5,
    phase: "containers",
    terminal: "docker",
    sections: [
      {
        heading: "Container exited?",
        body: "It won't show in <code>docker ps</code> — use <code>docker ps -a</code>. Then <code>docker logs</code> and <code>docker inspect --format='{{.State.ExitCode}}'</code>.",
        type: "concept",
        tryCommand: "docker ps -a",
      },
      {
        heading: "curl fails but container runs?",
        body: "Check the <strong>PORTS</strong> column in <code>docker ps</code>. You might be curling the wrong host port.",
        type: "tip",
      },
      {
        heading: "Same skills in Kubernetes",
        body: "Pod won't start? Same mindset: logs + describe + events. You already know half of kubectl debugging from Docker.",
        type: "analogy",
      },
    ],
    quiz: [
      {
        question: "Container crashed — first two commands?",
        options: ["docker rm && docker run", "docker ps -a then docker logs", "docker push", "kubectl delete pod"],
        correct: 1,
        explain: "Find exited container, then read logs for the error.",
      },
    ],
    practiceGoal: "Practice on /practice-docker-exited.html — debug a crashed container.",
  },
  {
    id: "c6-orchestration",
    title: "Why orchestration?",
    subtitle: "The bridge from Docker to Kubernetes",
    time: "8 min",
    order: 6,
    phase: "containers",
    terminal: "docker",
    sections: [
      {
        heading: "Docker's limit",
        body: "Docker runs containers on <strong>one machine</strong>. Production needs dozens of apps across many servers — with restarts, rollouts, and networking handled automatically.",
        type: "concept",
      },
      {
        heading: "What Kubernetes adds",
        body: "Scheduling · self-healing · scaling · service discovery · load balancing · config management · storage · rollouts. It orchestrates containers you already know how to build.",
        type: "concept",
      },
      {
        heading: "You're ready for Part 2",
        body: "You understand images, containers, and the CLI. Next: how Kubernetes wraps containers in <strong>Pods</strong> and manages them at scale.",
        type: "tip",
      },
    ],
    quiz: [
      {
        question: "Why use Kubernetes instead of only Docker?",
        options: ["K8s builds images faster", "K8s orchestrates many containers with healing and rollouts", "Docker can't run in prod", "K8s replaces images"],
        correct: 1,
        explain: "K8s adds orchestration; you still use container images.",
      },
    ],
    practiceGoal: "Mark Part 1 complete in Tracker — start Part 2: Kubernetes overview.",
  },

  // ─── PART 2: KUBERNETES ───────────────────────────────────────────
  {
    id: "k1-overview",
    title: "Kubernetes overview",
    subtitle: "What a cluster is and how the pieces fit",
    time: "8 min",
    order: 7,
    phase: "kubernetes",
    cluster: "default",
    sections: [
      {
        heading: "What is Kubernetes?",
        body: "An <strong>orchestrator</strong> for containers. You declare desired state (\"run 3 copies of nginx:1.25\"); Kubernetes makes it happen and keeps it that way.",
        type: "concept",
      },
      {
        heading: "Cluster parts",
        body: "<strong>Control plane</strong> — schedules work, stores state.<br><strong>Nodes</strong> — machines that run your containers.<br><strong>kubectl</strong> — CLI you use to talk to the cluster.",
        type: "concept",
        tryCommand: "kubectl get nodes",
      },
      {
        heading: "Declarative mindset",
        body: "You write YAML describing <em>what</em> you want, not step-by-step how. Kubernetes reconciles reality to match — same idea as git declaring desired file state.",
        type: "analogy",
      },
    ],
    quiz: [
      {
        question: "What does kubectl do?",
        options: ["Builds Docker images", "Talks to the Kubernetes API to manage resources", "Replaces Docker", "Only works on AWS"],
        correct: 1,
        explain: "kubectl is the CLI for your cluster.",
      },
    ],
    practiceGoal: "Run kubectl get nodes in the simulator.",
  },
  {
    id: "k2-pods",
    title: "Pods explained",
    subtitle: "The smallest thing Kubernetes schedules",
    time: "10 min",
    order: 8,
    phase: "kubernetes",
    cluster: "default",
    sections: [
      {
        heading: "Pod = container wrapper",
        body: "A <strong>Pod</strong> wraps one or more containers with shared network and storage. Usually one app container per Pod. Kubernetes schedules <strong>Pods</strong>, not containers directly.",
        type: "concept",
      },
      {
        heading: "Ephemeral by design",
        body: "Pods get new IPs when recreated. Don't rely on Pod names or IPs staying stable — that's what Services are for (later lesson).",
        type: "tip",
      },
      {
        heading: "First command",
        body: "<code>kubectl get pods</code> shows Pod name, status, restarts, and age. The STATUS column is your first debug clue.",
        type: "try-it",
        tryCommand: "kubectl get pods",
      },
    ],
    quiz: [
      {
        question: "Smallest deployable unit in Kubernetes?",
        options: ["Container", "Pod", "Deployment", "Node"],
        correct: 1,
        explain: "Pods wrap containers; Deployments manage Pods.",
      },
    ],
    practiceGoal: "Run kubectl get pods and kubectl describe pod nginx.",
  },
  {
    id: "k3-pod-debug",
    title: "Debugging Pods",
    subtitle: "The on-call workflow you'll use constantly",
    time: "10 min",
    order: 9,
    phase: "kubernetes",
    cluster: "default",
    sections: [
      {
        heading: "Memorize this order",
        body: "1. <code>kubectl get pods</code> — STATUS<br>2. <code>kubectl describe pod</code> — Events at bottom<br>3. <code>kubectl logs</code> — app output<br>4. <code>kubectl logs --previous</code> — last crash",
        type: "concept",
      },
      {
        heading: "Status meanings",
        body: "<code>ImagePullBackOff</code> — bad image tag<br><code>CrashLoopBackOff</code> — container keeps exiting<br><code>Pending</code> — can't schedule (resources, PVC)",
        type: "tip",
      },
      {
        heading: "Practice now",
        body: "Run the sequence on the nginx pod below. In real clusters, <strong>Events</strong> at the bottom of describe are gold.",
        type: "try-it",
        tryCommand: "kubectl describe pod nginx",
      },
    ],
    quiz: [
      {
        question: "Pod shows CrashLoopBackOff — best next step?",
        options: ["Delete the namespace", "kubectl describe then kubectl logs", "Restart your laptop", "kubectl apply again"],
        correct: 1,
        explain: "describe for Events; logs for why the process exited.",
      },
    ],
    practiceGoal: "Run kubectl logs nginx after describe.",
  },
  {
    id: "k4-deployments",
    title: "Deployments",
    subtitle: "Self-healing, scalable app management",
    time: "10 min",
    order: 10,
    phase: "kubernetes",
    cluster: "lab02",
    sections: [
      {
        heading: "Deployment → ReplicaSet → Pod",
        body: "You edit a <strong>Deployment</strong>. It owns a <strong>ReplicaSet</strong> that keeps N Pods running. Delete a Pod manually — it comes back.",
        type: "concept",
      },
      {
        heading: "Control loop again",
        body: "Desired replicas: 3. Actual: 2 (one died). Deployment creates a replacement. You declare state; Kubernetes enforces it.",
        type: "analogy",
      },
      {
        heading: "Rollouts",
        body: "<code>kubectl rollout status</code> · <code>kubectl rollout undo</code> — bad image? Undo in seconds.",
        type: "try-it",
        tryCommand: "kubectl get deploy",
      },
    ],
    quiz: [
      {
        question: "What heals a deleted Pod in production?",
        options: ["Nothing — it's gone", "Deployment via ReplicaSet", "ConfigMap", "Ingress"],
        correct: 1,
        explain: "ReplicaSet maintains desired Pod count.",
      },
    ],
    practiceGoal: "Run kubectl get deploy and kubectl get pods.",
  },
  {
    id: "k5-services",
    title: "Services & endpoints",
    subtitle: "Stable network access to ephemeral Pods",
    time: "10 min",
    order: 11,
    phase: "kubernetes",
    cluster: "lab02",
    sections: [
      {
        heading: "The problem Services solve",
        body: "Pod IPs change. A <strong>Service</strong> gives a stable DNS name and virtual IP that routes to healthy Pods matching a label selector.",
        type: "concept",
      },
      {
        heading: "Endpoints",
        body: "<code>kubectl get endpoints</code> shows Pod IPs behind a Service. <code>&lt;none&gt;</code> = selector doesn't match any Pod labels — #1 networking bug.",
        type: "try-it",
        tryCommand: "kubectl get endpoints",
      },
      {
        heading: "Service types",
        body: "<strong>ClusterIP</strong> — internal (default)<br><strong>NodePort</strong> — port on each node<br><strong>LoadBalancer</strong> — cloud LB",
        type: "tip",
      },
    ],
    quiz: [
      {
        question: "Service has no endpoints. First check?",
        options: ["Ingress", "Pod labels vs Service selector", "Helm version", "PVC size"],
        correct: 1,
        explain: "Selector must match Pod labels exactly.",
      },
    ],
    practiceGoal: "Run kubectl get svc and kubectl get endpoints.",
  },
  {
    id: "k6-config",
    title: "Config & Secrets",
    subtitle: "Externalize configuration from images",
    time: "10 min",
    order: 12,
    phase: "kubernetes",
    cluster: "default",
    sections: [
      {
        heading: "ConfigMap",
        body: "Non-sensitive config — env vars or files mounted into Pods. Same image, different config per environment.",
        type: "concept",
      },
      {
        heading: "Secret",
        body: "Sensitive data (tokens, passwords). Base64 in etcd — not encryption. Use external vaults in production.",
        type: "concept",
      },
      {
        heading: "After config changes",
        body: "Many apps need a <code>kubectl rollout restart deployment/NAME</code> to pick up new ConfigMap values.",
        type: "tip",
        tryCommand: "kubectl explain pod.spec.containers",
      },
    ],
    quiz: [
      {
        question: "Where should production API keys live?",
        options: ["Dockerfile", "ConfigMap", "Secret or external vault", "Pod name"],
        correct: 2,
        explain: "Secrets + RBAC minimum; vault for prod.",
      },
    ],
    practiceGoal: "Explore the API with kubectl explain.",
  },
  {
    id: "k7-networking",
    title: "Networking & Ingress",
    subtitle: "How traffic reaches your apps",
    time: "10 min",
    order: 13,
    phase: "kubernetes",
    cluster: "broken",
    sections: [
      {
        heading: "Debug path",
        body: "Pod Running? → Endpoints populated? → Ingress rules correct? → DNS/TLS? Work top to bottom.",
        type: "concept",
      },
      {
        heading: "Ingress",
        body: "HTTP routing into the cluster. Requires an <strong>Ingress controller</strong> installed — the YAML alone does nothing without one.",
        type: "concept",
        tryCommand: "kubectl get endpoints",
      },
      {
        heading: "Broken selector practice",
        body: "This cluster has a Service with no backends. Find the label mismatch — same skill as Docker port debugging, different layer.",
        type: "try-it",
      },
    ],
    quiz: [
      {
        question: "curl to Service fails but Pod logs fine. Likely cause?",
        options: ["Bad image", "Service selector mismatch", "Node down", "Wrong kubectl version"],
        correct: 1,
        explain: "No matching endpoints = traffic goes nowhere.",
      },
    ],
    practiceGoal: "Find the broken selector with kubectl get endpoints.",
  },
  {
    id: "k8-storage-rbac",
    title: "Storage & RBAC",
    subtitle: "Persistent data and permissions",
    time: "10 min",
    order: 14,
    phase: "kubernetes",
    cluster: "default",
    sections: [
      {
        heading: "PersistentVolumeClaim",
        body: "Data that survives Pod deletion. Pod claims storage via <strong>PVC</strong>; cluster provisions a <strong>PV</strong> via StorageClass.",
        type: "concept",
      },
      {
        heading: "RBAC",
        body: "<strong>Role</strong> + <strong>RoleBinding</strong> + <strong>ServiceAccount</strong> = who can do what. Least privilege always.",
        type: "concept",
      },
      {
        heading: "Verify access",
        body: "<code>kubectl auth can-i get pods --as=system:serviceaccount:ns:sa</code> — test before debugging Forbidden errors.",
        type: "try-it",
        tryCommand: "kubectl get ns",
      },
    ],
    quiz: [
      {
        question: "Data must survive Pod deletion?",
        options: ["emptyDir", "PersistentVolumeClaim", "ConfigMap", "Bigger CPU"],
        correct: 1,
        explain: "PVC-backed volumes persist beyond Pod lifecycle.",
      },
    ],
    practiceGoal: "Run kubectl get ns — namespaces scope resources and RBAC.",
  },
  {
    id: "k9-production",
    title: "Production patterns",
    subtitle: "Probes, resources, Helm, and rollbacks",
    time: "10 min",
    order: 15,
    phase: "kubernetes",
    cluster: "crash",
    sections: [
      {
        heading: "Health probes",
        body: "<strong>Liveness</strong> — restart if dead.<br><strong>Readiness</strong> — remove from Service if not ready.<br>Don't hit liveness too aggressively on slow starters.",
        type: "concept",
      },
      {
        heading: "Resources",
        body: "<code>requests</code> = scheduling guarantee. <code>limits</code> = cap (OOM kill if exceeded). Always set in prod.",
        type: "tip",
      },
      {
        heading: "CrashLoop practice",
        body: "This cluster has a crashing Pod. get → describe → logs. Same workflow as Docker debugging, Kubernetes edition.",
        type: "try-it",
        tryCommand: "kubectl get pods",
      },
    ],
    quiz: [
      {
        question: "Bad deploy in prod — fastest rollback?",
        options: ["Delete namespace", "kubectl rollout undo deployment/NAME", "Restart node", "Delete all pods"],
        correct: 1,
        explain: "rollout undo reverts to previous template.",
      },
    ],
    practiceGoal: "Debug crash-demo: get pods, describe, logs.",
  },
];

export function getModule(id: string) {
  return modules.find((m) => m.id === id);
}

export function getModulesByPhase(phase: LessonPhase) {
  return modules.filter((m) => m.phase === phase);
}
