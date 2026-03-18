import { describe, it, expect } from "vitest";
import { normalizeServerUrl } from "./auth.js";

describe("normalizeServerUrl", () => {
  it("adds https:// when no scheme is present", () => {
    expect(normalizeServerUrl("rock.example.com")).toBe("https://rock.example.com");
  });

  it("preserves https://", () => {
    expect(normalizeServerUrl("https://rock.example.com")).toBe("https://rock.example.com");
  });

  it("preserves http://", () => {
    expect(normalizeServerUrl("http://rock.example.com")).toBe("http://rock.example.com");
  });

  it("strips trailing paths", () => {
    expect(normalizeServerUrl("https://rock.example.com/some/path")).toBe("https://rock.example.com");
  });

  it("strips trailing slash", () => {
    expect(normalizeServerUrl("https://rock.example.com/")).toBe("https://rock.example.com");
  });

  it("preserves port numbers", () => {
    expect(normalizeServerUrl("https://rock.example.com:8443")).toBe("https://rock.example.com:8443");
  });

  it("trims whitespace", () => {
    expect(normalizeServerUrl("  rock.example.com  ")).toBe("https://rock.example.com");
  });

  it("handles case-insensitive scheme", () => {
    expect(normalizeServerUrl("HTTPS://rock.example.com")).toBe("https://rock.example.com");
  });
});
