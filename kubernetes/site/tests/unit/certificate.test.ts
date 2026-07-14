import { describe, it, expect } from "vitest";
import { CORE_LAB_IDS, getCertificateStatus } from "../../src/lib/certificate";
import { emptyProgress, setComplete } from "../../src/lib/progress-store";
import { allTrackables } from "../../src/data/trackables";

describe("certificate", () => {
  it("core program requires 31 labs", () => {
    expect(CORE_LAB_IDS).toHaveLength(31);
  });

  it("is not eligible until all core labs complete", () => {
    const status = getCertificateStatus(emptyProgress(), allTrackables);
    expect(status.eligible).toBe(false);
    expect(status.coreComplete).toBe(false);
    expect(status.coreTotal).toBe(31);
  });

  it("unlocks when all core labs marked complete", () => {
    let data = emptyProgress();
    for (const id of CORE_LAB_IDS) {
      data = setComplete(data, id, true);
    }
    const status = getCertificateStatus(data, allTrackables);
    expect(status.eligible).toBe(true);
    expect(status.coreComplete).toBe(true);
    expect(status.credentialId).toMatch(/^K8SLAB-/);
  });
});
