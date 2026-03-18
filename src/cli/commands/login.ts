import { Command } from "commander";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { saveServer, saveCredentials, setDefaultServer, normalizeServerUrl } from "../../core/auth.js";
import { MagnusClient } from "../../core/api.js";
import { withErrorHandler } from "./error-handler.js";
import pc from "picocolors";

export const loginCommand = new Command("login")
  .description("Authenticate with a Rock RMS server")
  .argument("<server-url>", "Server URL (e.g. https://rock.example.com)")
  .option("-u, --username <user>", "Username")
  .option("--default", "Set as the default server")
  .addHelpText("after", `
Examples:
  magnus login https://rock.example.com
  magnus login rock.example.com -u admin --default`)
  .action(withErrorHandler(async (serverUrl: string, opts: { username?: string; default?: boolean }) => {
    const rl = createInterface({ input: stdin, output: stdout });

    try {
      const username = opts.username ?? await rl.question("Username: ");

      // Use hidden input for password
      process.stdout.write("Password: ");
      const password = await new Promise<string>((resolve) => {
        let buf = "";
        const wasRaw = stdin.isRaw;
        if (stdin.isTTY) stdin.setRawMode(true);
        const onData = (data: Buffer) => {
          const ch = data.toString();
          if (ch === "\n" || ch === "\r") {
            stdin.removeListener("data", onData);
            if (stdin.isTTY) stdin.setRawMode(wasRaw ?? false);
            process.stdout.write("\n");
            resolve(buf);
          } else if (ch === "\u0003") {
            // Ctrl+C
            stdin.removeListener("data", onData);
            if (stdin.isTTY) stdin.setRawMode(wasRaw ?? false);
            process.stdout.write("\n");
            process.exit(130);
          } else if (ch === "\u007F" || ch === "\b") {
            buf = buf.slice(0, -1);
          } else {
            buf += ch;
          }
        };
        stdin.on("data", onData);
      });

      const client = new MagnusClient();
      const ok = await client.login(serverUrl, username, password);

      if (!ok) {
        throw new Error("Login failed. Check your URL and credentials.");
      }

      saveServer(serverUrl, username);
      saveCredentials(serverUrl, username, password);

      if (opts.default) {
        setDefaultServer(serverUrl);
      }

      const base = normalizeServerUrl(serverUrl);
      console.log(pc.green(`Logged in to ${base}`));
    } finally {
      rl.close();
    }
  }));
