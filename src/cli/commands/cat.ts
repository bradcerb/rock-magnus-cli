import { Command } from "commander";
import { writeFile } from "node:fs/promises";
import { resolveServer, getClient } from "./shared.js";
import { withErrorHandler } from "./error-handler.js";
import pc from "picocolors";

export const catCommand = new Command("cat")
  .description("Read and display a file from the server")
  .argument("<path>", "File path (e.g. /Themes/MyTheme/Layouts/Site.lava)")
  .option("-s, --server <url>", "Server URL")
  .option("-o, --output <file>", "Write to local file instead of stdout")
  .addHelpText("after", `
Examples:
  magnus cat /Themes/MyTheme/Layouts/Site.lava
  magnus cat /Themes/MyTheme/Styles/theme.less -o theme.less`)
  .action(withErrorHandler(async (path: string, opts: { server?: string; output?: string }) => {
    const serverUrl = resolveServer(opts);
    const client = await getClient(serverUrl, opts);

    const content = await client.readFile(serverUrl, path);

    if (opts.output) {
      await writeFile(opts.output, content);
      console.error(pc.green(`Written to ${opts.output}`));
    } else {
      process.stdout.write(content);
    }
  }));
