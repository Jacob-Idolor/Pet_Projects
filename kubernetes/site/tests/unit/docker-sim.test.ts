import { describe, it, expect } from "vitest";
import {
  defaultDocker,
  exitedDocker,
  wrongPortDocker,
  runDocker,
  dockerMissions,
} from "../../src/lib/docker-sim";

describe("docker-sim", () => {
  it("lists running containers with docker ps", () => {
    const state = defaultDocker();
    const { output } = runDocker(state, "docker ps");
    expect(output).toContain("web");
    expect(output).toContain("Up");
    expect(output).not.toContain("Exited");
  });

  it("shows exited containers with docker ps -a", () => {
    const state = exitedDocker();
    const { output } = runDocker(state, "docker ps -a");
    expect(output).toContain("api");
    expect(output).toContain("Exited");
  });

  it("returns logs for a container", () => {
    const state = exitedDocker();
    const { output } = runDocker(state, "docker logs api");
    expect(output).toContain("DATABASE_URL");
  });

  it("returns exit code via inspect --format", () => {
    const state = exitedDocker();
    const { output } = runDocker(state, "docker inspect api --format {{.State.ExitCode}}");
    expect(output).toBe("1");
  });

  it("build adds a new image tag", () => {
    const state = defaultDocker();
    const before = state.images.length;
    const { output, state: next } = runDocker(state, "docker build -t myapp:2.0 .");
    expect(output).toContain("Successfully tagged");
    expect(next.images.length).toBeGreaterThanOrEqual(before);
  });

  it("wrong-port cluster exposes mismatched host port", () => {
    const state = wrongPortDocker();
    const { output } = runDocker(state, "docker ps");
    expect(output).toContain("9090");
  });

  it("docker missions validators match expected commands", () => {
    expect(dockerMissions.length).toBe(6);
    expect(dockerMissions[0]!.validate("docker ps")).toBe(true);
    expect(dockerMissions[0]!.validate("docker ps -a")).toBe(false);
    expect(dockerMissions[4]!.validate("docker ps -a")).toBe(true);
  });
});
