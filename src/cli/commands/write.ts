import { Command } from "commander";
import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { resolveServer, getClient } from "./shared.js";
import { withErrorHandler } from "./error-handler.js";
import pc from "picocolors";

export const writeCommand = new Command("write")
  .description("Write content to a file on the server")
  .argument("<path>", "Remote file path")
  .option("-s, --server <url>", "Server URL")
  .option("-f, --file <local-path>", "Read content from a local file")
  .option("-d, --data <text>", "Content string to write")
  .option("--force", "Skip overwrite confirmation")
  .addHelpText("after", `
Examples:
  magnus write /Themes/MyTheme/Styles/theme.less -f theme.less
  magnus write /Themes/MyTheme/test.txt -d "hello world"
  echo "content" | magnus write /Themes/MyTheme/test.txt`)
  .action(withErrorHandler(async (path: string, opts: { server?: string; file?: string; data?: string; force?: boolean }) => {
    const serverUrl = resolveServer(opts);
    const client = await getClient(serverUrl, opts);

    // Check if file exists and confirm overwrite (unless --force)
    if (!opts.force && process.stdout.isTTY) {
      try {
        await client.readFile(serverUrl, path);
        // File exists — ask for confirmation
        const rl = createInterface({ input: process.stdin, output: process.stdout });
        const answer = await rl.question(`File ${path} already exists. Overwrite? [y/N] `);
        rl.close();
        if (answer.toLowerCase() !== "y") {
          console.log("Cancelled.");
          return;
        }
      } catch {
        // File doesn't exist or can't be read — proceed
      }
    }

    let content: Buffer;

    if (opts.file) {
      content = await readFile(opts.file);
    } else if (opts.data) {
      content = Buffer.from(opts.data);
    } else {
      // Read from stdin
      const chunks: Buffer[] = [];
      for await (const chunk of process.stdin) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
      content = Buffer.concat(chunks);
    }

    await client.writeFile(serverUrl, path, content);
    console.log(pc.green(`Written ${content.length} bytes to ${path}`));
  }));
