import { describe, it, expect } from "vitest";
import { MagnusClient } from "./api.js";

describe("MagnusClient", () => {
  it("can be instantiated", () => {
    const client = new MagnusClient();
    expect(client).toBeInstanceOf(MagnusClient);
  });

  it("accepts verbose option", () => {
    const client = new MagnusClient({ verbose: true });
    expect(client).toBeInstanceOf(MagnusClient);
  });
});
