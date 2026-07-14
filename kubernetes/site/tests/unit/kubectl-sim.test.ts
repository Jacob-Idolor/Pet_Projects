import { describe, it, expect } from "vitest";
import {
  defaultCluster,
  lab02Cluster,
  brokenEndpointsCluster,
  crashLoopCluster,
  runKubectl,
  missions,
} from "../../src/lib/kubectl-sim";

describe("kubectl-sim", () => {
  it("lists pods in default cluster", () => {
    const { output } = runKubectl(defaultCluster(), "kubectl get pods");
    expect(output).toContain("nginx");
    expect(output).toContain("Running");
  });

  it("describes a pod with events", () => {
    const { output } = runKubectl(defaultCluster(), "kubectl describe pod nginx");
    expect(output).toContain("Name:         nginx");
    expect(output).toContain("Events:");
  });

  it("returns pod logs", () => {
    const { output } = runKubectl(defaultCluster(), "kubectl logs nginx");
    expect(output).toContain("nginx");
  });

  it("lists deployments and services in lab02", () => {
    const state = lab02Cluster();
    const dep = runKubectl(state, "kubectl get deploy");
    expect(dep.output).toContain("web");
    const svc = runKubectl(state, "kubectl get svc");
    expect(svc.output).toContain("ClusterIP");
  });

  it("shows empty endpoints when selector mismatches", () => {
    const { output } = runKubectl(brokenEndpointsCluster(), "kubectl get endpoints");
    expect(output).toContain("<none>");
  });

  it("reports CrashLoopBackOff status", () => {
    const { output } = runKubectl(crashLoopCluster(), "kubectl get pods");
    expect(output).toContain("CrashLoopBackOff");
  });

  it("kubectl missions validators work", () => {
    expect(missions.length).toBe(4);
    expect(missions[0]!.validate("kubectl get pods")).toBe(true);
    expect(missions[1]!.validate("kubectl describe pod nginx")).toBe(true);
    expect(missions[3]!.validate("kubectl get endpoints")).toBe(true);
  });
});
