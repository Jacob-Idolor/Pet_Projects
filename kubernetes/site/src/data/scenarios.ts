export interface Scenario {
  id: string;
  title: string;
  symptom: string;
  skill: string;
  type: "docker" | "kubernetes";
  difficulty: "beginner" | "intermediate" | "advanced";
  href: string;
  commands: string[];
  fix: string;
}

export const scenarios: Scenario[] = [
  {
    id: "docker-exited",
    title: "Container exited immediately",
    symptom: "docker ps shows nothing; app crashed on startup.",
    skill: "docker logs, docker inspect, exit codes",
    type: "docker",
    difficulty: "beginner",
    href: "/practice-docker-exited.html",
    commands: ["docker ps -a", "docker logs api", "docker inspect api --format='{{.State.ExitCode}}'"],
    fix: "Read logs for missing env vars or bad entrypoint. Fix Dockerfile or pass -e at run time.",
  },
  {
    id: "docker-wrongport",
    title: "Wrong port mapping",
    symptom: "Container running but curl to localhost:8080 fails.",
    skill: "Understanding -p host:container",
    type: "docker",
    difficulty: "beginner",
    href: "/practice-docker-wrongport.html",
    commands: ["docker ps", "curl localhost:9090"],
    fix: "PORTS column shows 9090->80. Map host port to container port correctly: -p 8080:80.",
  },
  {
    id: "k8s-crashloop",
    title: "CrashLoopBackOff",
    symptom: "Pod keeps restarting; STATUS shows CrashLoopBackOff.",
    skill: "kubectl get, describe, logs",
    type: "kubernetes",
    difficulty: "beginner",
    href: "/practice-crash.html",
    commands: ["kubectl get pods", "kubectl describe pod crash-demo", "kubectl logs crash-demo"],
    fix: "Container command exits immediately. Fix command/args or env in manifest.",
  },
  {
    id: "k8s-endpoints",
    title: "Service with no endpoints",
    symptom: "Service exists but traffic goes nowhere.",
    skill: "Label selectors, endpoints debugging",
    type: "kubernetes",
    difficulty: "intermediate",
    href: "/practice-broken.html",
    commands: ["kubectl get endpoints", "kubectl describe svc", "kubectl get pods --show-labels"],
    fix: "Service selector must match Pod labels exactly.",
  },
  {
    id: "k8s-imagepull",
    title: "ImagePullBackOff",
    symptom: "Pod stuck pulling a non-existent image tag.",
    skill: "Image names, tags, registry auth",
    type: "kubernetes",
    difficulty: "beginner",
    href: "/practice-imagepull.html",
    commands: ["kubectl get pods", "kubectl describe pod broken-app", "kubectl get events"],
    fix: "Fix image tag or load image into kind with kind load docker-image.",
  },
  {
    id: "k8s-pending",
    title: "Pod stuck Pending",
    symptom: "Pod never schedules; STATUS stays Pending.",
    skill: "Resource requests, node capacity",
    type: "kubernetes",
    difficulty: "intermediate",
    href: "/practice-pending.html",
    commands: ["kubectl describe pod hungry-pod", "kubectl get events"],
    fix: "Lower CPU/memory requests or add node capacity. Read Events section.",
  },
];

export const scenariosByType = {
  docker: scenarios.filter((s) => s.type === "docker"),
  kubernetes: scenarios.filter((s) => s.type === "kubernetes"),
};
