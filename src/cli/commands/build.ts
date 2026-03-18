import { Command } from "commander";
import { resolveServer, getClient } from "./shared.js";
import { withErrorHandler } from "./error-handler.js";
import ora from "ora";
import pc from "picocolors";

export const buildCommand = new Command("build")
  .description("Trigger a build action on the server")
  .argument("<build-uri>", "Build URI from the item descriptor")
  .option("-s, --server <url>", "Server URL")
  .addHelpText("after", `
Examples:
  magnus build /api/TriumphTech/Magnus/Build/Themes/MyTheme`)
  .action(withErrorHandler(async (buildUri: string, opts: { server?: string }) => {
    const serverUrl = resolveServer(opts);
    const client = await getClient(serverUrl, opts);

    const spinner = process.stdout.isTTY ? ora("Building...").start() : null;

    const result = await client.build(serverUrl, buildUri);

    if (result.actionSuccessful) {
      spinner?.succeed(pc.green(result.responseMessage || "Build complete."));
      if (!spinner) console.log(pc.green(result.responseMessage || "Build complete."));
    } else {
      spinner?.fail(result.responseMessage || "Build failed.");
      throw new Error(result.responseMessage || "Build failed.");
    }
  }));
