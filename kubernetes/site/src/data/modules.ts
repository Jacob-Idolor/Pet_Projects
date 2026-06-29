export interface QuizQ {
  question: string;
  options: string[];
  correct: number;
  explain: string;
}

export interface Module {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  order: number;
  cluster: "default" | "lab02" | "broken" | "crash" | "imagepull" | "pending";
  terminal?: "docker" | "kubectl";
  sections: { heading: string; body: string }[];
  quiz: QuizQ[];
  practiceGoal: string;
}

export const modules: Module[] = [
  {
    id: "containers",
    title: "Containers & Docker",
    subtitle: "Images, containers, Dockerfile best practices — the foundation of Kubernetes",
    time: "35 min",
    order: 1,
    cluster: "default",
    terminal: "docker",
    sections: [
      {
        heading: "What is a container?",
        body: "A container is a running instance of an image — your app plus everything it needs to run, isolated from other processes. Unlike a VM, containers share the host kernel.",
      },
      {
        heading: "Image vs container",
        body: "<strong>Image</strong> = immutable template (layers). <strong>Container</strong> = running copy. You build once, run many times. Registry stores images (Docker Hub, ECR, GHCR).",
      },
      {
        heading: "The build pipeline",
        body: "<code>Dockerfile</code> → <code>docker build -t myapp:1.0 .</code> → Image → <code>docker run -p 8080:8080 myapp:1.0</code> → Container. Kubernetes pulls the same image into Pods.",
      },
      {
        heading: "Essential Docker commands",
        body: "<code>docker ps</code> / <code>docker ps -a</code> — running vs all containers<br><code>docker logs NAME</code> — stdout/stderr<br><code>docker inspect NAME</code> — config, exit code, ports<br><code>docker images</code> — local images<br><code>docker build -t TAG .</code> — build from Dockerfile",
      },
      {
        heading: "Dockerfile best practices",
        body: "Pin tags (not <code>latest</code> in prod). Multi-stage builds for smaller images. Non-root <code>USER</code>. <code>.dockerignore</code> to exclude junk. Never put secrets in layers — use runtime env or K8s Secrets.",
      },
      {
        heading: "Debugging containers",
        body: "Container gone from <code>docker ps</code>? Use <code>docker ps -a</code>. Crashed? <code>docker logs</code> then <code>docker inspect --format='{{.State.ExitCode}}'</code>. Wrong port? Check PORTS column — <code>-p HOST:CONTAINER</code>.",
      },
      {
        heading: "Why Kubernetes?",
        body: "Docker runs one container. Production needs dozens or thousands — restart failures, roll out updates, expose services, mount storage. Kubernetes orchestrates containers across machines.",
      },
    ],
    quiz: [
      {
        question: "What does docker build -t myapp:1.0 . do?",
        options: ["Runs a container", "Builds an image tagged myapp:1.0 from the Dockerfile in the current directory", "Pushes to Docker Hub", "Creates a Kubernetes Pod"],
        correct: 1,
        explain: "build creates an image from a Dockerfile; -t sets the name:tag.",
      },
      {
        question: "What does -p 8080:80 mean in docker run?",
        options: ["Container port 8080 maps to host 80", "Host port 8080 maps to container port 80", "Both ports must be 8080", "Enables HTTPS"],
        correct: 1,
        explain: "Format is host:container — traffic to localhost:8080 reaches port 80 inside the container.",
      },
      {
        question: "Why use multi-stage Docker builds?",
        options: ["Faster docker run", "Smaller final image — build tools stay in earlier stages", "Required by Kubernetes", "Enables root access"],
        correct: 1,
        explain: "Compile in a builder stage; copy only the binary to the runtime image.",
      },
      {
        question: "What is the smallest deployable unit in Kubernetes?",
        options: ["Container", "Pod", "Deployment", "Node"],
        correct: 1,
        explain: "A Pod wraps one or more containers. Deployments manage Pods.",
      },
      {
        question: "Why use Kubernetes instead of only Docker?",
        options: ["Kubernetes builds images faster", "Kubernetes orchestrates many containers with healing, scaling, and networking", "Docker cannot run in production", "Kubernetes replaces the need for images"],
        correct: 1,
        explain: "K8s adds scheduling, self-healing, service discovery, and declarative rollouts.",
      },
    ],
    practiceGoal: "Switch to the Docker tab on /docker.html — run docker ps, docker images, and docker logs web.",
  },
  {
    id: "pods",
    title: "Pods",
    subtitle: "The building block of everything in Kubernetes",
    time: "25 min",
    order: 2,
    cluster: "default",
    sections: [
      {
        heading: "Pod lifecycle",
        body: "Pending → Running → Succeeded/Failed. <code>CrashLoopBackOff</code> means the container keeps exiting and kubelet backs off restarts.",
      },
      {
        heading: "First commands to learn",
        body: "<code>kubectl get pods</code> — list pods<br><code>kubectl describe pod NAME</code> — events, state, image<br><code>kubectl logs NAME</code> — stdout/stderr<br><code>kubectl exec -it NAME -- sh</code> — shell (simulated in real clusters)",
      },
      {
        heading: "Debugging order",
        body: "1. <code>kubectl get pods</code> — status column<br>2. <code>kubectl describe</code> — Events at bottom<br>3. <code>kubectl logs</code> — app output<br>4. <code>kubectl logs --previous</code> — last crash",
      },
    ],
    quiz: [
      {
        question: "A pod shows ImagePullBackOff. Most likely cause?",
        options: ["Wrong Service selector", "Bad or missing image name/tag", "PVC not bound", "RBAC denied"],
        correct: 1,
        explain: "Kubelet cannot pull the container image from the registry.",
      },
      {
        question: "Which command shows scheduling events and restart count?",
        options: ["kubectl logs", "kubectl get svc", "kubectl describe pod", "kubectl apply"],
        correct: 2,
        explain: "describe includes Events, conditions, and container state.",
      },
    ],
    practiceGoal: "Describe the nginx pod and read its logs in the terminal below.",
  },
  {
    id: "deployments",
    title: "Deployments & Services",
    subtitle: "How real apps are deployed and exposed",
    time: "30 min",
    order: 3,
    cluster: "lab02",
    sections: [
      {
        heading: "Deployment",
        body: "Declarative way to run N copies of a Pod template. Handles rolling updates and rollbacks. You rarely create Pods directly in production.",
      },
      {
        heading: "ReplicaSet",
        body: "Deployment owns ReplicaSets; ReplicaSets own Pods. If you delete a Pod, the ReplicaSet recreates it to match desired replicas.",
      },
      {
        heading: "Service types",
        body: "<strong>ClusterIP</strong> — internal only (default). <strong>NodePort</strong> — port on each node. <strong>LoadBalancer</strong> — cloud LB. Service selects Pods by labels — selector must match Pod labels exactly.",
      },
      {
        heading: "Rollouts",
        body: "<code>kubectl rollout status deployment/NAME</code><br><code>kubectl rollout undo deployment/NAME</code><br>Bad image? Undo. This is how pros recover without panic.",
      },
    ],
    quiz: [
      {
        question: "Service has no endpoints. First thing to check?",
        options: ["Ingress annotations", "Pod labels vs Service selector", "PVC size", "Helm version"],
        correct: 1,
        explain: "Endpoints are Pod IPs matching the Service selector. Mismatch = empty endpoints.",
      },
      {
        question: "What manages Pod count for a stateless app?",
        options: ["Pod directly", "Deployment", "ConfigMap", "Ingress"],
        correct: 1,
        explain: "Deployment scales and heals Pods via ReplicaSet.",
      },
    ],
    practiceGoal: "Run kubectl get deploy,svc and kubectl get endpoints.",
  },
  {
    id: "config",
    title: "Config & Secrets",
    subtitle: "ConfigMaps, Secrets, and twelve-factor config",
    time: "25 min",
    order: 4,
    cluster: "default",
    sections: [
      {
        heading: "ConfigMap",
        body: "Non-sensitive config — env vars or files mounted into Pods. Change ConfigMap → often need Pod restart to pick up changes.",
      },
      {
        heading: "Secret",
        body: "Sensitive data (tokens, passwords). Base64 in etcd — not encryption by default. Use external secret managers in production. Never commit Secrets to git.",
      },
      {
        heading: "Mount vs env",
        body: "Env vars: simple key/value. Volumes: config files apps read from disk. Choose based on how your app loads config.",
      },
    ],
    quiz: [
      {
        question: "Where should production API keys live?",
        options: ["Dockerfile ENV", "ConfigMap", "Kubernetes Secret or external vault", "Deployment name"],
        correct: 2,
        explain: "Secrets + RBAC at minimum; sealed-secrets, External Secrets, or Vault for prod.",
      },
    ],
    practiceGoal: "Run kubectl explain pod.spec.containers to explore the API.",
  },
  {
    id: "networking",
    title: "Networking & Ingress",
    subtitle: "How traffic reaches your Pods",
    time: "25 min",
    order: 5,
    cluster: "broken",
    sections: [
      {
        heading: "Cluster networking",
        body: "Every Pod gets an IP. Services provide stable DNS name + virtual IP. kube-proxy routes Service traffic to Pod endpoints.",
      },
      {
        heading: "Ingress",
        body: "HTTP/S routing into the cluster. Requires an Ingress controller (nginx, traefik). Maps hostnames and paths to Services.",
      },
      {
        heading: "Debug pattern",
        body: "App unreachable? Check: Pod Running → Service endpoints populated → Ingress rules → DNS/TLS. This module's cluster has a broken selector — find it with <code>kubectl get endpoints</code>.",
      },
    ],
    quiz: [
      {
        question: "curl to Service fails but Pod logs look fine. Likely issue?",
        options: ["Pod not scheduled", "Service selector doesn't match Pod labels", "Image wrong tag", "Node out of disk"],
        correct: 1,
        explain: "No matching endpoints = Service routes nowhere.",
      },
    ],
    practiceGoal: "Use kubectl get endpoints and compare Service selector to Pod labels in describe output.",
  },
  {
    id: "storage",
    title: "Storage & RBAC",
    subtitle: "Persistent data and who can do what",
    time: "25 min",
    order: 6,
    cluster: "default",
    sections: [
      {
        heading: "PVC / PV",
        body: "Pod claims storage via PersistentVolumeClaim. PV is the actual storage. StorageClass enables dynamic provisioning.",
      },
      {
        heading: "RBAC",
        body: "Role + RoleBinding + ServiceAccount = what identities can do in a namespace. Principle of least privilege for apps and humans.",
      },
    ],
    quiz: [
      {
        question: "Data must survive Pod deletion. You need?",
        options: ["EmptyDir volume", "PersistentVolumeClaim", "ConfigMap", "Larger CPU limit"],
        correct: 1,
        explain: "PVC-backed volumes persist beyond Pod lifecycle.",
      },
    ],
    practiceGoal: "Review kubectl get ns — namespaces isolate resources and RBAC scope.",
  },
  {
    id: "production",
    title: "Production patterns",
    subtitle: "Helm, rollouts, and deploying like a pro",
    time: "20 min",
    order: 7,
    cluster: "crash",
    sections: [
      {
        heading: "Helm",
        body: "Package manager for Kubernetes — charts templatize YAML. install / upgrade / rollback. GitOps (Argo CD) often deploys Helm charts from git.",
      },
      {
        heading: "Requests & limits",
        body: "requests = scheduling guarantee. limits = cap (OOM kill if memory exceeded). Always set in production.",
      },
      {
        heading: "CrashLoopBackOff",
        body: "This module loads a crashing pod. Practice: get pods → describe → logs. That's the on-call workflow.",
      },
    ],
    quiz: [
      {
        question: "Bad deployment pushed to prod. Fastest safe rollback?",
        options: ["Delete namespace", "kubectl rollout undo deployment/NAME", "Restart laptop", "Delete all pods manually"],
        correct: 1,
        explain: "rollout undo reverts to previous ReplicaSet template.",
      },
    ],
    practiceGoal: "Debug crash-demo: get pods, describe, logs — find why it crashes.",
  },
];

export function getModule(id: string) {
  return modules.find((m) => m.id === id);
}
