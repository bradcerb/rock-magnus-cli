import { Command } from "commander";
import { resolveServer, getClient } from "./shared.js";
import { withErrorHandler } from "./error-handler.js";
import ora from "ora";
import pc from "picocolors";

export const uploadCommand = new Command("upload")
  .description("Upload files or a directory to the server")
  .argument("<upload-uri>", "Upload URI from the item descriptor")
  .argument("<paths...>", "Local files or directory to upload")
  .option("-s, --server <url>", "Server URL")
  .option("--dir", "Upload a directory instead of individual files")
  .addHelpText("after", `
Examples:
  magnus upload /api/TriumphTech/Magnus/Upload/Themes/MyTheme style.css script.js
  magnus upload /api/TriumphTech/Magnus/Upload/Themes ./my-theme --dir`)
  .action(withErrorHandler(async (uploadUri: string, paths: string[], opts: { server?: string; dir?: boolean }) => {
    const serverUrl = resolveServer(opts);
    const client = await getClient(serverUrl, opts);

    const spinner = process.stdout.isTTY ? ora("Uploading...").start() : null;

    if (opts.dir) {
      if (paths.length !== 1) {
        spinner?.stop();
        throw new Error("When using --dir, provide exactly one directory path.");
      }
      const result = await client.uploadDirectory(serverUrl, uploadUri, paths[0]);
      if (result.actionSuccessful) {
        spinner?.succeed(pc.green(result.responseMessage || "Directory uploaded."));
        if (!spinner) console.log(pc.green(result.responseMessage || "Directory uploaded."));
      } else {
        spinner?.fail(result.responseMessage || "Upload failed.");
        throw new Error(result.responseMessage || "Upload failed.");
      }
    } else {
      const result = await client.uploadFiles(serverUrl, uploadUri, paths);
      if (result.actionSuccessful) {
        spinner?.succeed(pc.green(result.responseMessage || `Uploaded ${paths.length} file(s).`));
        if (!spinner) console.log(pc.green(result.responseMessage || `Uploaded ${paths.length} file(s).`));
      } else {
        spinner?.fail(result.responseMessage || "Upload failed.");
        throw new Error(result.responseMessage || "Upload failed.");
      }
    }
  }));
