// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

const childProcess = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const process = require("process");

const VERSION = "1.32.2";

function chooseBinarySuffix() {
  const platform = os.platform();
  const arch = os.arch();

  if (platform === "linux" && arch === "x64") {
    return `linux-amd64-${VERSION}`;
  }
  if (platform === "linux" && arch === "arm64") {
    return `linux-arm64-${VERSION}`;
  }

  console.error(
    `Unsupported platform (${platform}) and architecture (${arch})`
  );
  process.exit(1);
}

function chooseBinaries() {
  const suffix = chooseBinarySuffix();
  return {
    tailscale: `${__dirname}/tailscale-${suffix}`,
    tailscaled: `${__dirname}/tailscaled-${suffix}`,
  };
}

function tailscaledBackground(tailscaledBinary) {
  // TODO: Track the PID in the filesystem and stop the process via a
  //       `runs.post` script.
  const stderrLog = path.join(os.homedir(), "tailscaled.log");
  const stderrLogFD = fs.openSync(stderrLog, "w");

  const spawnReturns = childProcess.spawn(tailscaledBinary, {
    detached: true,
    stdio: ["ignore", "inherit", stderrLogFD],
  });
  spawnReturns.unref();
}

function resolveAuthKey() {
  const authKey = process.env.INPUT_AUTHKEY || "";
  if (!!authKey) {
    return authKey;
  }

  console.error(
    "::error title=\u26d4 error hint::Auth key empty, Maybe you need to " +
      "populate it in the Secrets for your workflow, see more in " +
      "https://docs.github.com/en/actions/security-guides/encrypted-secrets"
  );
  process.exit(1);
}

function resolveHostname() {
  const inputHostname = process.env.INPUT_HOSTNAME || "";
  if (!!inputHostname) {
    return inputHostname;
  }

  const osHostname = os.hostname();
  return `github-${osHostname}`;
}

function resolveAdditionalArgs() {
  const argsJSON = process.env["INPUT_ARGS-JSON"] || "";
  if (!argsJSON) {
    return [];
  }

  const additionalArgs = JSON.parse(argsJSON);
  // TODO: Actually validate that this is a string array; this JavaScript
  //       code should be moved to a bespoke Go binary so it becomes easy to
  //       do.
  return additionalArgs;
}

function tailscaleUp(tailscaleBinary) {
  const authKey = resolveAuthKey();
  const hostname = resolveHostname();
  const additionalArgs = resolveAdditionalArgs();

  const args = [
    "up",
    "--authkey",
    authKey,
    "--hostname",
    hostname,
    "--accept-routes",
    ...additionalArgs,
  ];
  const spawnSyncReturns = childProcess.spawnSync(tailscaleBinary, args, {
    stdio: "inherit",
  });
  const status = spawnSyncReturns.status;
  return status;
}

function main() {
  const binaries = chooseBinaries();

  tailscaledBackground(binaries.tailscaled);
  const status = tailscaleUp(binaries.tailscale);

  if (typeof status === "number") {
    process.exit(status);
  }
  process.exit(1);
}

if (require.main === module) {
  main();
}
