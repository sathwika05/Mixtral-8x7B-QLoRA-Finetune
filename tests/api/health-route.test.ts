import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/inference/client", () => ({
  probeEndpoint: vi.fn(),
}));

import { probeEndpoint } from "@/lib/inference/client";
import { GET, POST } from "@/app/api/health/route";

const mockProbe = vi.mocked(probeEndpoint);

beforeEach(() => {
  delete process.env.MIXTRAL_API_URL;
  delete process.env.MIXTRAL_API_KEY;
  delete process.env.MIXTRAL_SUPPORTS_PARAMETERS;
  delete process.env.MIXTRAL_TIMEOUT_MS;
  mockProbe.mockReset();
});

describe("GET /api/health", () => {
  it("reports not_configured when the url is absent", async () => {
    const json = await (await GET()).json();
    expect(json.state).toBe("not_configured");
    expect(json.timeoutMs).toBeNull();
  });

  it("reports configured and never contacts the endpoint", async () => {
    process.env.MIXTRAL_API_URL = "https://api.example.com/prod/invoke";
    process.env.MIXTRAL_TIMEOUT_MS = "30000";
    const json = await (await GET()).json();
    expect(json.state).toBe("configured");
    expect(json.supportsParameters).toBe(false);
    expect(json.timeoutMs).toBe(30000);
    expect(mockProbe).not.toHaveBeenCalled();
  });

  it("never returns reachable, and never returns the url or key", async () => {
    process.env.MIXTRAL_API_URL = "https://api.example.com/prod/invoke";
    process.env.MIXTRAL_API_KEY = "super-secret-key";
    const raw = await (await GET()).text();
    expect(raw).not.toContain("reachable");
    expect(raw).not.toContain("api.example.com");
    expect(raw).not.toContain("super-secret-key");
  });
});

describe("POST /api/health", () => {
  it("returns reachable only when the probe actually succeeds", async () => {
    process.env.MIXTRAL_API_URL = "https://api.example.com/prod/invoke";
    mockProbe.mockResolvedValue(true);
    const json = await (await POST()).json();
    expect(json.state).toBe("reachable");
    expect(mockProbe).toHaveBeenCalledTimes(1);
  });

  it("returns unavailable when the probe fails", async () => {
    process.env.MIXTRAL_API_URL = "https://api.example.com/prod/invoke";
    mockProbe.mockResolvedValue(false);
    expect((await (await POST()).json()).state).toBe("unavailable");
  });

  it("does not probe at all when configuration is missing", async () => {
    const json = await (await POST()).json();
    expect(json.state).toBe("not_configured");
    expect(mockProbe).not.toHaveBeenCalled();
  });
});
