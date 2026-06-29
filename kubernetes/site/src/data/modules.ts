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
        heading: "What is a Pod?",
        body: "A <strong>Pod</strong> is the smallest object Kubernetes schedules. It wraps one or more containers that share network and storage. In practice, most Pods run a single app container plus optional sidecars (logging, proxies).",
      },
      {
        heading: "Pod lifecycle",
        body: "<strong>Pending</strong> — waiting to be scheduled or pulling image.<br><strong>Running</strong> — at least one container is active.<br><strong>Succeeded / Failed</strong> — terminal states for jobs.<br><code>CrashLoopBackOff</code> — container keeps exiting; kubelet backs off restart attempts.",
      },
      {
        heading: "Why Pods get replaced",
        body: "Pod IPs and names are ephemeral. When a node fails or you deploy a new version, Kubernetes creates <em>new</em> Pods — it does not restart the old one in place. That's why we use Deployments (next module) instead of managing Pods directly.",
      },
      {
        heading: "Essential commands",
        body: "<code>kubectl get pods</code> — list pods and STATUS column<br><code>kubectl describe pod NAME</code> — events, state, image, node<br><code>kubectl logs NAME</code> — stdout/stderr<br><code>kubectl logs NAME --previous</code> — logs from last crashed container<br><code>kubectl exec -it NAME -- sh</code> — shell inside container",
      },
      {
        heading: "Debugging order (memorize this)",
        body: "1. <code>kubectl get pods</code> — what does STATUS say?<br>2. <code>kubectl describe pod</code> — read <strong>Events</strong> at the bottom<br>3. <code>kubectl logs</code> — what did the app print?<br>4. <code>kubectl logs --previous</code> — if it crashed before current run",
      },
      {
        heading: "Status codes you'll see",
        body: "<code>ImagePullBackOff</code> — bad image name/tag or registry auth.<br><code>CrashLoopBackOff</code> — container starts then exits (bad command, missing config).<br><code>Pending</code> — not scheduled yet (resources, PVC, taints).",
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
      {
        question: "Why use Deployments instead of creating Pods directly?",
        options: ["Pods are deprecated", "Deployments self-heal, scale, and roll out updates", "Pods cannot run containers", "Deployments are faster to create"],
        correct: 1,
        explain: "Bare Pods aren't replaced if deleted; Deployments maintain desired state.",
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
        heading: "The control loop",
        body: "You declare <strong>desired state</strong> (3 replicas, image nginx:1.25). Kubernetes continuously compares desired vs actual state and fixes drift — recreating deleted Pods, scaling up, rolling out new images.",
      },
      {
        heading: "Deployment → ReplicaSet → Pod",
        body: "<strong>Deployment</strong> — what you edit (replicas, image, env).<br><strong>ReplicaSet</strong> — ensures N Pods match the template.<br><strong>Pod</strong> — runs the container. Delete a Pod manually and the ReplicaSet creates a replacement within seconds.",
      },
      {
        heading: "Service types",
        body: "<strong>ClusterIP</strong> — internal VIP + DNS (my-svc.default.svc.cluster.local). Default type.<br><strong>NodePort</strong> — opens a port on every node (30000–32767).<br><strong>LoadBalancer</strong> — cloud provider provisions external LB.<br>Services route by <strong>labels</strong> — selector must match Pod labels exactly.",
      },
      {
        heading: "Endpoints",
        body: "<code>kubectl get endpoints</code> shows Pod IPs behind a Service. If you see <code>&lt;none&gt;</code>, traffic has nowhere to go — almost always a label/selector mismatch, not an app bug.",
      },
      {
        heading: "Rollouts and rollback",
        body: "<code>kubectl set image deployment/web web=nginx:1.24</code> — trigger update<br><code>kubectl rollout status deployment/web</code> — wait for completion<br><code>kubectl rollout history deployment/web</code> — see revisions<br><code>kubectl rollout undo deployment/web</code> — revert to previous version",
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
      {
        question: "You pushed a bad image to production. Fastest recovery?",
        options: ["Delete all Pods", "kubectl rollout undo deployment/NAME", "Restart the node", "Delete the namespace"],
        correct: 1,
        explain: "rollout undo reverts to the previous ReplicaSet template safely.",
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
        heading: "Twelve-factor config",
        body: "Store config in the environment, not in the image. Kubernetes ConfigMaps and Secrets let you inject config at deploy time — same image runs in dev, staging, and prod with different config.",
      },
      {
        heading: "ConfigMap",
        body: "Key/value pairs or file contents for <strong>non-sensitive</strong> settings (feature flags, URLs, config files). Mount as env vars or as files in a volume. Updating a ConfigMap does not automatically reload running Pods unless the app watches for changes or you restart.",
      },
      {
        heading: "Secret",
        body: "Same mechanisms as ConfigMap but intended for sensitive data. Stored base64-encoded in etcd — <strong>not encrypted by default</strong>. Restrict access with RBAC. In production use Sealed Secrets, External Secrets Operator, or HashiCorp Vault.",
      },
      {
        heading: "Mount vs environment variable",
        body: "<strong>Env vars</strong> — simple, good for flags and connection strings apps read at startup.<br><strong>Volume mount</strong> — good for config files, TLS certs, or apps that hot-reload from disk.<br>Wrong key reference in YAML often causes silent failures or CrashLoop.",
      },
      {
        heading: "After changing config",
        body: "<code>kubectl rollout restart deployment/NAME</code> — force Pods to recreate and pick up new ConfigMap/Secret values when the app doesn't reload automatically.",
      },
    ],
    quiz: [
      {
        question: "Where should production API keys live?",
        options: ["Dockerfile ENV", "ConfigMap", "Kubernetes Secret or external vault", "Deployment name"],
        correct: 2,
        explain: "Secrets + RBAC at minimum; sealed-secrets, External Secrets, or Vault for prod.",
      },
      {
        question: "You changed a ConfigMap but the app still shows old values. Likely fix?",
        options: ["Delete the namespace", "Rollout restart the Deployment", "Rebuild the Docker image", "Delete the ConfigMap"],
        correct: 1,
        explain: "Pods often read config only at startup; restart picks up new values.",
      },
      {
        question: "ConfigMap vs Secret — when use Secret?",
        options: ["Always — Secrets are faster", "For passwords, tokens, and TLS keys", "Only for files over 1MB", "Never in Kubernetes"],
        correct: 1,
        explain: "Secrets signal sensitive data and enable stricter RBAC policies.",
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
        heading: "Pod network model",
        body: "Every Pod gets its own IP address in the cluster. Containers in the same Pod share that IP and can talk via <code>localhost</code>. Pods talk to other Pods across nodes via the cluster network (CNI plugin).",
      },
      {
        heading: "Services — stable front door",
        body: "Pods come and go; Services provide a stable DNS name and virtual IP. Other Pods reach your app at <code>my-svc.namespace.svc.cluster.local</code> instead of chasing ephemeral Pod IPs.",
      },
      {
        heading: "How traffic flows",
        body: "Client → Service VIP → kube-proxy (or eBPF) → Pod IP:port. <code>kubectl get endpoints</code> lists which Pod IPs are registered for each Service.",
      },
      {
        heading: "Ingress",
        body: "Layer 7 HTTP/S routing: hostnames, paths, TLS termination. Requires an <strong>Ingress controller</strong> (nginx, traefik, etc.) installed in the cluster. Ingress rules point to Services, not Pods directly.",
      },
      {
        heading: "Debug checklist",
        body: "1. Pod <code>Running</code>? 2. Service <code>endpoints</code> populated? 3. Labels match selector? 4. Ingress rules correct? 5. DNS / TLS / Host header correct?<br>This module's simulator has a broken selector — practice finding it.",
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
        heading: "Why persistent storage?",
        body: "Container filesystems are ephemeral — data dies with the Pod. Databases, uploads, and stateful apps need volumes that outlive Pod restarts and reschedules.",
      },
      {
        heading: "PVC, PV, StorageClass",
        body: "<strong>PersistentVolumeClaim (PVC)</strong> — Pod requests storage (&quot;I need 10Gi&quot;).<br><strong>PersistentVolume (PV)</strong> — the actual storage resource.<br><strong>StorageClass</strong> — template for dynamic provisioning (cloud disk created on demand).",
      },
      {
        heading: "Access modes",
        body: "<strong>ReadWriteOnce (RWO)</strong> — one node can mount read-write (typical for block storage).<br><strong>ReadWriteMany (RWX)</strong> — multiple nodes (shared file systems). Choose based on whether replicas need shared data.",
      },
      {
        heading: "RBAC model",
        body: "<strong>ServiceAccount</strong> — identity for Pods or automation.<br><strong>Role</strong> — permissions in a namespace.<br><strong>RoleBinding</strong> — attaches Role to Subject.<br><strong>ClusterRole / ClusterRoleBinding</strong> — cluster-wide. Principle: least privilege.",
      },
      {
        heading: "Verify permissions",
        body: "<code>kubectl auth can-i create pods --as=system:serviceaccount:ns:sa-name -n ns</code> — test what an identity can do before debugging mysterious &quot;Forbidden&quot; errors.",
      },
    ],
    quiz: [
      {
        question: "Data must survive Pod deletion. You need?",
        options: ["EmptyDir volume", "PersistentVolumeClaim", "ConfigMap", "Larger CPU limit"],
        correct: 1,
        explain: "PVC-backed volumes persist beyond Pod lifecycle.",
      },
      {
        question: "A Pod needs to read ConfigMaps but not create Pods. You create?",
        options: ["ClusterRoleBinding to cluster-admin", "Role with get/list on configmaps + RoleBinding to SA", "Secret", "NetworkPolicy"],
        correct: 1,
        explain: "Role scopes permissions; RoleBinding ties them to the ServiceAccount.",
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
        heading: "Production readiness",
        body: "Production means: pinned images, resource requests/limits, health probes, config externalized, RBAC locked down, rollouts tested, and an on-call debug workflow you can execute under pressure.",
      },
      {
        heading: "Resources",
        body: "<strong>requests</strong> — guaranteed CPU/memory for scheduling (Pod won't land on a node without capacity).<br><strong>limits</strong> — hard cap; exceed memory limit → OOMKilled. Always set both in production.",
      },
      {
        heading: "Health probes",
        body: "<strong>liveness</strong> — restart container if failing (deadlock detection).<br><strong>readiness</strong> — remove from Service endpoints if failing (don't send traffic until ready).<br><strong>startup</strong> — for slow-starting apps, disable liveness until startup succeeds.",
      },
      {
        heading: "Helm",
        body: "Package manager for Kubernetes — charts templatize YAML with values.yaml. <code>helm install / upgrade / rollback</code> map to revision history like Deployment rollouts. GitOps tools (Argo CD, Flux) often deploy Helm charts from git.",
      },
      {
        heading: "On-call: CrashLoopBackOff",
        body: "1. <code>kubectl get pods</code> 2. <code>kubectl describe pod</code> — Events 3. <code>kubectl logs</code> 4. Fix manifest or <code>rollout undo</code>. Practice this flow in the simulator below.",
      },
    ],
    quiz: [
      {
        question: "Bad deployment pushed to prod. Fastest safe rollback?",
        options: ["Delete namespace", "kubectl rollout undo deployment/NAME", "Restart laptop", "Delete all pods manually"],
        correct: 1,
        explain: "rollout undo reverts to previous ReplicaSet template.",
      },
      {
        question: "Readiness probe fails. What happens?",
        options: ["Pod is deleted", "Pod removed from Service endpoints", "Node is drained", "Deployment scales to zero"],
        correct: 1,
        explain: "Readiness controls traffic; liveness controls restarts.",
      },
      {
        question: "Memory limit exceeded. Kubernetes will?",
        options: ["Ignore it", "OOMKill the container", "Scale the node", "Throttle CPU only"],
        correct: 1,
        explain: "Cgroups enforce memory limits; excess usage kills the container.",
      },
    ],
    practiceGoal: "Debug crash-demo: get pods, describe, logs — find why it crashes.",
  },
];

export function getModule(id: string) {
  return modules.find((m) => m.id === id);
}
