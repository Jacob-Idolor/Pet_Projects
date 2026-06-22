/** In-browser kubectl simulator — no real cluster, no downloads */

export type PodStatus = "Running" | "Pending" | "CrashLoopBackOff" | "ImagePullBackOff" | "Error";

export interface SimPod {
  name: string;
  namespace: string;
  status: PodStatus;
  image: string;
  restarts: number;
  node: string;
  labels: Record<string, string>;
  logs: string;
  events: string[];
}

export interface SimDeployment {
  name: string;
  namespace: string;
  replicas: number;
  ready: number;
  image: string;
  labels: Record<string, string>;
}

export interface SimService {
  name: string;
  namespace: string;
  type: "ClusterIP" | "NodePort";
  clusterIP: string;
  port: number;
  selector: Record<string, string>;
}

export interface ClusterState {
  namespace: string;
  pods: SimPod[];
  deployments: SimDeployment[];
  services: SimService[];
}

export function defaultCluster(): ClusterState {
  return {
    namespace: "default",
    pods: [
      {
        name: "nginx",
        namespace: "default",
        status: "Running",
        image: "nginx:1.25",
        restarts: 0,
        node: "kind-control-plane",
        labels: { app: "nginx" },
        logs: "2026/06/20 12:00:00 [notice] nginx/1.25.0 started",
        events: ["Normal  Scheduled  Successfully assigned default/nginx to kind-control-plane"],
      },
    ],
    deployments: [],
    services: [],
  };
}

export function lab02Cluster(): ClusterState {
  return {
    namespace: "default",
    pods: [
      { name: "web-7d4f8b9c6-xk2jp", namespace: "default", status: "Running", image: "nginx:1.25", restarts: 0, node: "kind-control-plane", labels: { app: "web", "pod-template-hash": "7d4f8b9c6" }, logs: "nginx ready", events: [] },
      { name: "web-7d4f8b9c6-m9pqr", namespace: "default", status: "Running", image: "nginx:1.25", restarts: 0, node: "kind-control-plane", labels: { app: "web", "pod-template-hash": "7d4f8b9c6" }, logs: "nginx ready", events: [] },
      { name: "web-7d4f8b9c6-z8nlm", namespace: "default", status: "Running", image: "nginx:1.25", restarts: 0, node: "kind-control-plane", labels: { app: "web", "pod-template-hash": "7d4f8b9c6" }, logs: "nginx ready", events: [] },
    ],
    deployments: [{ name: "web", namespace: "default", replicas: 3, ready: 3, image: "nginx:1.25", labels: { app: "web" } }],
    services: [{ name: "web", namespace: "default", type: "ClusterIP", clusterIP: "10.96.42.10", port: 80, selector: { app: "web" } }],
  };
}

export function brokenEndpointsCluster(): ClusterState {
  return {
    namespace: "default",
    pods: [
      { name: "api-abc12", namespace: "default", status: "Running", image: "myapi:1.0", restarts: 0, node: "kind-control-plane", labels: { app: "api" }, logs: "listening :8080", events: [] },
    ],
    deployments: [{ name: "api", namespace: "default", replicas: 1, ready: 1, image: "myapi:1.0", labels: { app: "api" } }],
    services: [{ name: "api-svc", namespace: "default", type: "ClusterIP", clusterIP: "10.96.88.1", port: 80, selector: { app: "apiservice" } }],
  };
}

export function crashLoopCluster(): ClusterState {
  return {
    namespace: "default",
    pods: [
      {
        name: "crash-demo",
        namespace: "default",
        status: "CrashLoopBackOff",
        image: "busybox:1.36",
        restarts: 5,
        node: "kind-control-plane",
        labels: { app: "crash-demo" },
        logs: "sh: can't execute 'exit 1': No such file or directory",
        events: ["Warning BackOff  Back-off restarting failed container", "Normal Pulled  Container image busybox:1.36 already present"],
      },
    ],
    deployments: [],
    services: [],
  };
}

function pad(s: string, n: number) {
  return s.padEnd(n);
}

function filterNs<T extends { namespace: string }>(items: T[], ns: string, all: boolean) {
  return all ? items : items.filter((i) => i.namespace === ns);
}

export function runKubectl(state: ClusterState, input: string): { output: string; state: ClusterState } {
  const line = input.trim();
  if (!line) return { output: "", state };

  const parts = line.split(/\s+/);
  if (parts[0] !== "kubectl") {
    return { output: `bash: ${parts[0]}: command not found`, state };
  }

  const cmd = parts[1];
  const args = parts.slice(2);

  // kubectl get ...
  if (cmd === "get") {
    const resourceArg = args.find((a) => !a.startsWith("-")) || "pods";
    const allNs = args.includes("-A") || args.includes("--all-namespaces");
    const ns = state.namespace;

    if (resourceArg.includes(",")) {
      const outputs: string[] = [];
      for (const r of resourceArg.split(",")) {
        const sub = runKubectl(state, `kubectl get ${r.trim()}`);
        outputs.push(sub.output);
        state = sub.state;
      }
      return { output: outputs.filter(Boolean).join("\n\n"), state };
    }

    const resource = resourceArg;

    if (resource === "pods" || resource === "pod" || resource === "po") {
      const pods = filterNs(state.pods, ns, allNs);
      if (!pods.length) return { output: "No resources found.", state };
      const header = `${pad("NAME", 28)}${pad("READY", 8)}${pad("STATUS", 20)}RESTARTS   AGE`;
      const rows = pods.map(
        (p) =>
          `${pad(p.name, 28)}${pad("1/1", 8)}${pad(p.status, 20)}${p.restarts}        5m`
      );
      return { output: [header, ...rows].join("\n"), state };
    }

    if (resource === "deploy" || resource === "deployments" || resource === "deployment") {
      const deps = filterNs(state.deployments, ns, allNs);
      if (!deps.length) return { output: "No resources found.", state };
      const header = `${pad("NAME", 20)}${pad("READY", 12)}UP-TO-DATE   AVAILABLE`;
      const rows = deps.map((d) => `${pad(d.name, 20)}${pad(`${d.ready}/${d.replicas}`, 12)}${d.replicas}           ${d.ready}`);
      return { output: [header, ...rows].join("\n"), state };
    }

    if (resource === "svc" || resource === "services" || resource === "service") {
      const svcs = filterNs(state.services, ns, allNs);
      if (!svcs.length) return { output: "No resources found.", state };
      const header = `${pad("NAME", 20)}TYPE        CLUSTER-IP     PORT(S)`;
      const rows = svcs.map((s) => `${pad(s.name, 20)}${pad(s.type, 12)}${s.clusterIP}    ${s.port}/TCP`);
      return { output: [header, ...rows].join("\n"), state };
    }

    if (resource === "ns" || resource === "namespaces" || resource === "namespace") {
      return { output: "NAME              STATUS   AGE\ndefault           Active   10d\nkube-system       Active   10d", state };
    }

    if (resource === "nodes" || resource === "node") {
      return { output: "NAME                 STATUS   ROLES           AGE   VERSION\nkind-control-plane   Ready    control-plane   10d   v1.29.0", state };
    }

    if (resource === "endpoints" || resource === "ep") {
      const svcs = filterNs(state.services, ns, allNs);
      if (!svcs.length) return { output: "No resources found.", state };
      const rows = svcs.map((s) => {
        const match = state.pods.filter(
          (p) => p.namespace === s.namespace && Object.entries(s.selector).every(([k, v]) => p.labels[k] === v)
        );
        const ep = match.length ? match.map((p) => `${p.name}:8080`).join(",") : "<none>";
        return `${pad(s.name, 20)}${ep}`;
      });
      return { output: `NAME                 ENDPOINTS\n${rows.join("\n")}`, state };
    }

    return { output: `error: the server doesn't have a resource type "${resource}"`, state };
  }

  // kubectl describe pod NAME
  if (cmd === "describe" && (args[0] === "pod" || args[0] === "pods") && args[1]) {
    const pod = state.pods.find((p) => p.name === args[1] && p.namespace === state.namespace);
    if (!pod) return { output: `Error from server (NotFound): pods "${args[1]}" not found`, state };
    const labels = Object.entries(pod.labels).map(([k, v]) => `    ${k}=${v}`).join("\n");
    const events = pod.events.length ? pod.events.map((e) => `  ${e}`).join("\n") : "  <none>";
    return {
      output: `Name:         ${pod.name}
Namespace:    ${pod.namespace}
Status:       ${pod.status}
Node:         ${pod.node}
Image:        ${pod.image}
Restart Count: ${pod.restarts}
Labels:
${labels}
Events:
${events}`,
      state,
    };
  }

  // kubectl logs NAME
  if (cmd === "logs" && args[0]) {
    const pod = state.pods.find((p) => p.name === args[0] && p.namespace === state.namespace);
    if (!pod) return { output: `error: error from server (NotFound): pods "${args[0]}" not found in namespace "${state.namespace}"`, state };
    return { output: pod.logs, state };
  }

  // kubectl explain pod
  if (cmd === "explain" && args[0]) {
    if (args[0] === "pod" && !args[1]) {
      return { output: "KIND:       Pod\nVERSION:    v1\nDESCRIPTION: Pod is a collection of containers...", state };
    }
    if (args[0] === "pod" && args[1] === "spec" && args[2] === "containers") {
      return { output: "FIELD: containers <[]Container>\nDESCRIPTION: List of containers belonging to the pod.", state };
    }
    return { output: `error: field "${args.slice(1).join(".")}" does not exist`, state };
  }

  // kubectl create namespace
  if (cmd === "create" && args[0] === "namespace" && args[1]) {
    return { output: `namespace/${args[1]} created`, state };
  }

  // kubectl config set-context --current --namespace=x
  if (cmd === "config" && args[0] === "set-context") {
    const nsIdx = args.indexOf("--namespace");
    if (nsIdx >= 0 && args[nsIdx + 1]) {
      const ns = args[nsIdx + 1];
      return { output: `Context "kind-practice" modified.`, state: { ...state, namespace: ns } };
    }
  }

  if (cmd === "cluster-info") {
    return { output: "Kubernetes control plane is running at https://kind-control-plane:6443", state };
  }

  if (cmd === "version" || (cmd === "version" && args[0] === "--client")) {
    return { output: "Client Version: v1.29.0\nKustomize Version: v5.0.0", state };
  }

  if (cmd === "help" || cmd === "--help" || !cmd) {
    return {
      output: `Simulated kubectl — try:
  kubectl get pods
  kubectl get deploy,svc
  kubectl describe pod <name>
  kubectl logs <name>
  kubectl get endpoints
  kubectl explain pod`,
      state,
    };
  }

  return { output: `error: unknown command "${cmd}" — type kubectl help`, state };
}

export const missions = [
  {
    id: "m1",
    title: "List running pods",
    hint: "Use kubectl get to see pods in the current namespace.",
    validate: (cmd: string) => /^kubectl\s+get\s+(pods?|po)\b/.test(cmd.trim()),
  },
  {
    id: "m2",
    title: "Inspect a pod",
    hint: "Pick the pod name from get pods, then describe it.",
    validate: (cmd: string) => /^kubectl\s+describe\s+pod\s+\S+/.test(cmd.trim()),
  },
  {
    id: "m3",
    title: "Read container logs",
    hint: "kubectl logs <pod-name>",
    validate: (cmd: string) => /^kubectl\s+logs\s+\S+/.test(cmd.trim()),
  },
  {
    id: "m4",
    title: "Check service endpoints",
    hint: "When a Service has no backends, endpoints show <none>. Try kubectl get endpoints",
    validate: (cmd: string) => /^kubectl\s+get\s+(endpoints|ep)\b/.test(cmd.trim()),
    cluster: "broken" as const,
  },
];
