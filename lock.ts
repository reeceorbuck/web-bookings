import { dirname, fromFileUrl, join } from "jsr:@std/path@^1.1.6";

// remote is a member of the tinyTools workspace, so running deno here writes a
// workspace-shaped lockfile. The image is built from this repo alone and expects
// a flat one, so the lockfile is generated from a copy outside the workspace.
// The age policy can only be configured outside a workspace too, and our own
// package is exempt from it so that a new release can be deployed straight away.

const remoteDir = dirname(fromFileUrl(import.meta.url));

async function run(command: string, args: string[], cwd: string) {
  const { success, code, stdout } = await new Deno.Command(command, {
    args,
    cwd,
    stdout: "piped",
    stderr: "inherit",
  }).output();
  if (!success) throw new Error(`${command} exited with code ${code}.`);
  return new TextDecoder().decode(stdout);
}

const files = (await run("git", [
  "ls-files",
  "--cached",
  "--others",
  "--exclude-standard",
], remoteDir)).split("\n").filter(Boolean);

const tempDir = await Deno.makeTempDir({ prefix: "remote-lock-" });
try {
  for (const file of files.filter((file) => file !== "deno.lock")) {
    await Deno.mkdir(dirname(join(tempDir, file)), { recursive: true });
    await Deno.copyFile(join(remoteDir, file), join(tempDir, file));
  }
  const configPath = join(tempDir, "deno.json");
  await Deno.writeTextFile(
    configPath,
    JSON.stringify({
      ...JSON.parse(await Deno.readTextFile(configPath)),
      minimumDependencyAge: {
        age: "P1D",
        exclude: ["jsr:@tinytools/hono-tools"],
      },
    }),
  );
  await run(Deno.execPath(), ["cache", "build.ts", "serve.ts"], tempDir);
  await Deno.copyFile(join(tempDir, "deno.lock"), join(remoteDir, "deno.lock"));
} finally {
  await Deno.remove(tempDir, { recursive: true });
}
