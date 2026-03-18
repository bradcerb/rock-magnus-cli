import { Command } from "commander";
import { loginCommand } from "./commands/login.js";
import { lsCommand } from "./commands/ls.js";
import { catCommand } from "./commands/cat.js";
import { writeCommand } from "./commands/write.js";
import { buildCommand } from "./commands/build.js";
import { rmCommand } from "./commands/rm.js";
import { mkdirCommand } from "./commands/mkdir.js";
import { touchCommand } from "./commands/touch.js";
import { uploadCommand } from "./commands/upload.js";
import { serversCommand } from "./commands/servers.js";

declare const __VERSION__: string;

const program = new Command();

program
  .name("magnus")
  .description("CLI for interacting with Rock RMS via the Magnus API")
  .version(__VERSION__)
  .option("--verbose", "Show debug output (HTTP requests/responses)");

program.addCommand(loginCommand);
program.addCommand(serversCommand);
program.addCommand(lsCommand);
program.addCommand(catCommand);
program.addCommand(writeCommand);
program.addCommand(buildCommand);
program.addCommand(rmCommand);
program.addCommand(mkdirCommand);
program.addCommand(touchCommand);
program.addCommand(uploadCommand);

program.parseAsync();
