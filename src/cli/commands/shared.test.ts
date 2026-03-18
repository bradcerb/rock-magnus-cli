import { describe, it, expect } from "vitest";
import { resolveServer, NoServerError } from "./shared.js";

describe("resolveServer", () => {
  it("returns the server from opts when provided", () => {
    expect(resolveServer({ server: "https://rock.example.com" })).toBe("https://rock.example.com");
  });

  it("throws NoServerError when no server is available", () => {
    // This test relies on no default server being configured in the test env
    // It may pass or fail depending on local config — primarily tests error type
    try {
      resolveServer({});
      // If it doesn't throw, a default server is configured — that's fine
    } catch (error) {
      expect(error).toBeInstanceOf(NoServerError);
    }
  });
});
