/** In-browser Docker simulator — no real daemon required */

export type ContainerStatus = "running" | "exited" | "created" | "restarting";

export interface SimContainer {
  id: string;
  name: string;
  image: string;
  status: ContainerStatus;
  ports: string;
  exitCode: number;
  command: string;
  logs: string;
  created: string;
}

export interface SimImage {
  repository: string;
  tag: string;
  id: string;
  size: string;
  created: string;
}

export interface DockerState {
  containers: SimContainer[];
  images: SimImage[];
}

export function defaultDocker(): DockerState {
  return {
    containers: [
      {
        id: "a1b2c3d4e5f6",
        name: "web",
        image: "practice-app:1.0",
        status: "running",
        ports: "0.0.0.0:8080->8080/tcp",
        exitCode: 0,
        command: "./server",
        logs: "2026/06/20 12:00:00 listening on :8080\n2026/06/20 12:00:01 GET /health 200",
        created: "2 minutes ago",
      },
    ],
    images: [
      { repository: "practice-app", tag: "1.0", id: "abc123def456", size: "12.4MB", created: "5 minutes ago" },
      { repository: "nginx", tag: "1.25-alpine", id: "nginx789", size: "48.2MB", created: "2 weeks ago" },
      { repository: "alpine", tag: "3.19", id: "alp321", size: "7.4MB", created: "3 weeks ago" },
    ],
  };
}

export function exitedDocker(): DockerState {
  return {
    containers: [
      {
        id: "deadbeef1234",
        name: "api",
        image: "practice-app:1.0",
        status: "exited",
        ports: "",
        exitCode: 1,
        command: "./server",
        logs: "Error: missing required env DATABASE_URL\npanic: connection refused",
        created: "10 minutes ago",
      },
    ],
    images: [
      { repository: "practice-app", tag: "1.0", id: "abc123def456", size: "12.4MB", created: "15 minutes ago" },
    ],
  };
}

export function wrongPortDocker(): DockerState {
  return {
    containers: [
      {
        id: "portbad9999",
        name: "web",
        image: "nginx:1.25-alpine",
        status: "running",
        ports: "0.0.0.0:9090->80/tcp",
        exitCode: 0,
        command: "nginx -g daemon off;",
        logs: "2026/06/20 12:00:00 [notice] nginx/1.25.0 started",
        created: "1 minute ago",
      },
    ],
    images: [
      { repository: "nginx", tag: "1.25-alpine", id: "nginx789", size: "48.2MB", created: "2 weeks ago" },
    ],
  };
}

function pad(s: string, n: number) {
  return s.padEnd(n);
}

function findContainer(state: DockerState, name: string) {
  return state.containers.find((c) => c.name === name || c.id.startsWith(name));
}

export function runDocker(state: DockerState, input: string): { output: string; state: DockerState } {
  const line = input.trim();
  if (!line) return { output: "", state };

  const parts = line.split(/\s+/);
  if (parts[0] !== "docker") {
    return { output: `bash: ${parts[0]}: command not found`, state };
  }

  const cmd = parts[1];
  const args = parts.slice(2);

  if (cmd === "ps") {
    const all = args.includes("-a");
    const list = all ? state.containers : state.containers.filter((c) => c.status === "running");
    if (!list.length) return { output: all ? "CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES" : "CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES", state };
    const header = `${pad("CONTAINER ID", 14)}${pad("IMAGE", 22)}${pad("STATUS", 16)}PORTS     NAMES`;
    const rows = list.map((c) => {
      const status = c.status === "running" ? `Up ${c.created}` : `Exited (${c.exitCode}) ${c.created} ago`;
      return `${pad(c.id.slice(0, 12), 14)}${pad(c.image, 22)}${pad(status, 16)}${pad(c.ports, 10)}${c.name}`;
    });
    return { output: [header, ...rows].join("\n"), state };
  }

  if (cmd === "images") {
    if (!state.images.length) return { output: "REPOSITORY   TAG       IMAGE ID       CREATED         SIZE", state };
    const header = `${pad("REPOSITORY", 18)}${pad("TAG", 12)}${pad("IMAGE ID", 14)}${pad("CREATED", 16)}SIZE`;
    const rows = state.images.map(
      (i) => `${pad(i.repository, 18)}${pad(i.tag, 12)}${pad(i.id.slice(0, 12), 14)}${pad(i.created, 16)}${i.size}`
    );
    return { output: [header, ...rows].join("\n"), state };
  }

  if (cmd === "logs" && args[0]) {
    const c = findContainer(state, args[0]);
    if (!c) return { output: `Error response from daemon: No such container: ${args[0]}`, state };
    return { output: c.logs, state };
  }

  if (cmd === "inspect" && args[0]) {
    const c = findContainer(state, args[0]);
    if (!c) return { output: `Error: No such object: ${args[0]}`, state };
    const formatIdx = args.indexOf("--format");
    if (formatIdx >= 0 && args[formatIdx + 1]) {
      const fmt = args[formatIdx + 1].replace(/^'|'$/g, "").replace(/^"|"$/g, "");
      if (fmt.includes("ExitCode")) return { output: String(c.exitCode), state };
      if (fmt.includes("State.Status")) return { output: c.status, state };
    }
    return {
      output: `[{"Id":"${c.id}","Name":"${c.name}","State":{"Status":"${c.status}","ExitCode":${c.exitCode}},"Config":{"Image":"${c.image}","Cmd":["${c.command}"]},"NetworkSettings":{"Ports":{"8080/tcp":[{"HostPort":"8080"}]}}}]`,
      state,
    };
  }

  if (cmd === "build") {
    const tagIdx = args.indexOf("-t");
    const tag = tagIdx >= 0 ? args[tagIdx + 1] : "myapp:latest";
    const [repo, ver = "latest"] = tag.split(":");
    const exists = state.images.some((i) => i.repository === repo && i.tag === ver);
    if (!exists) {
      state = {
        ...state,
        images: [{ repository: repo, tag: ver, id: "built" + Date.now(), size: "12.4MB", created: "just now" }, ...state.images],
      };
    }
    return {
      output: `[+] Building 2.1s (12/12) FINISHED\n => exporting to image\n => naming to ${tag}\nSuccessfully tagged ${tag}`,
      state,
    };
  }

  if (cmd === "run") {
    return { output: "Simulated: container started. Use docker ps to verify.", state };
  }

  if (cmd === "stop" && args[0]) {
    const c = findContainer(state, args[0]);
    if (!c) return { output: `Error: No such container: ${args[0]}`, state };
    return { output: args[0], state };
  }

  if (cmd === "exec") {
    return { output: "# sh-5.1$ (interactive exec simulated — type 'exit' to leave)", state };
  }

  if (cmd === "history" && args[0]) {
    return {
      output: `IMAGE          CREATED BY                                      SIZE\n<missing>      /bin/sh -c CGO_ENABLED=0 go build -o /server .   11.2MB\n<missing>      /bin/sh -c go mod download                       4.1MB\n<missing>      COPY . .                                         12KB\n<missing>      FROM alpine:3.19                                 7.4MB`,
      state,
    };
  }

  if (cmd === "system" && args[0] === "df") {
    return {
      output: `TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE\nImages          ${state.images.length}         ${state.images.length}         68MB      20MB (29%)\nContainers      ${state.containers.length}         ${state.containers.filter((c) => c.status === "running").length}         4.1kB     0B\nLocal Volumes   0         0         0B        0B`,
      state,
    };
  }

  if (cmd === "version") {
    return { output: "Client: Docker Engine 24.0\n Version: 24.0.7\nServer: Docker Engine 24.0\n Version: 24.0.7", state };
  }

  if (cmd === "help" || cmd === "--help" || !cmd) {
    return {
      output: `Simulated docker — try:
  docker ps / docker ps -a
  docker images
  docker logs <name>
  docker inspect <name>
  docker inspect <name> --format='{{.State.ExitCode}}'
  docker build -t myapp:1.0 .
  docker history practice-app:1.0
  docker system df`,
      state,
    };
  }

  return { output: `docker: unknown command: docker ${cmd}\nRun 'docker help' for usage`, state };
}

export const dockerMissions = [
  {
    id: "d1",
    title: "List running containers",
    hint: "docker ps shows only running containers.",
    validate: (cmd: string) => /^docker\s+ps\b/.test(cmd.trim()) && !/\s-a\b/.test(cmd.trim()),
    cluster: "default" as const,
  },
  {
    id: "d2",
    title: "View container logs",
    hint: "docker logs <container-name>",
    validate: (cmd: string) => /^docker\s+logs\s+\S+/.test(cmd.trim()),
  },
  {
    id: "d3",
    title: "List local images",
    hint: "docker images",
    validate: (cmd: string) => /^docker\s+images\b/.test(cmd.trim()),
  },
  {
    id: "d4",
    title: "Find exit code of crashed container",
    hint: "docker inspect api --format='{{.State.ExitCode}}'",
    validate: (cmd: string) => /^docker\s+inspect\s+\S+.*ExitCode/.test(cmd.trim()),
    cluster: "exited" as const,
  },
  {
    id: "d5",
    title: "See stopped containers",
    hint: "docker ps -a includes exited containers.",
    validate: (cmd: string) => /^docker\s+ps\s+-a\b/.test(cmd.trim()),
    cluster: "exited" as const,
  },
  {
    id: "d6",
    title: "Check port mapping",
    hint: "docker ps — PORTS column shows host:container mapping.",
    validate: (cmd: string) => /^docker\s+ps\b/.test(cmd.trim()),
    cluster: "wrongport" as const,
  },
];

export const dockerBestPractices = [
  {
    title: "Pin image tags",
    body: "Use nginx:1.25-alpine, not nginx:latest. Reproducible builds and safer rollbacks.",
    icon: "🏷️",
  },
  {
    title: "Multi-stage builds",
    body: "Compile in a builder stage; copy only the binary to a slim runtime image.",
    icon: "📦",
  },
  {
    title: "Run as non-root",
    body: "Add a USER directive. Kubernetes securityContext can enforce this at deploy time.",
    icon: "🔒",
  },
  {
    title: "Use .dockerignore",
    body: "Exclude node_modules, .git, and secrets from build context — faster builds, smaller images.",
    icon: "🚫",
  },
  {
    title: "Health checks",
    body: "HEALTHCHECK in Dockerfile or liveness/readiness probes in Kubernetes catch bad deploys early.",
    icon: "💓",
  },
  {
    title: "Never bake secrets",
    body: "Layers are permanent. Use env vars at runtime, Docker secrets, or Kubernetes Secrets.",
    icon: "🔑",
  },
];
