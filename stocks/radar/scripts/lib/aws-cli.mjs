/**
 * Thin AWS CLI wrapper shared by digest + signal-alerts.
 * Same behavior as the previous inline helpers (execFileSync + optional profile/region).
 */

import { execFileSync } from "node:child_process";

/**
 * @param {string[]} args aws subcommand args (without leading "aws")
 * @param {{ region?: string, profile?: string, json?: boolean }} [opts]
 */
export function awsCli(args, opts = {}) {
  const region = opts.region || process.env.AWS_REGION || "us-west-2";
  const profile = opts.profile ?? process.env.AWS_PROFILE ?? "";
  const json = opts.json !== false;
  const cmd = ["aws", ...args, "--region", region];
  if (json) cmd.push("--output", "json");
  if (profile) cmd.push("--profile", profile);
  const out = execFileSync(cmd[0], cmd.slice(1), { encoding: "utf8" });
  if (!json) return out;
  return out ? JSON.parse(out) : null;
}

/**
 * @param {string} topicArn
 * @param {string} subject
 * @param {string} message
 * @param {{ region?: string, profile?: string, dryRun?: boolean }} [opts]
 */
export function publishSns(topicArn, subject, message, opts = {}) {
  if (!topicArn) {
    console.log(`(no topic for subject: ${subject})`);
    return false;
  }
  if (opts.dryRun) {
    console.log(`(dry run — would publish to ${topicArn})`);
    console.log(`  subject: ${subject}`);
    return true;
  }
  awsCli(
    [
      "sns",
      "publish",
      "--topic-arn",
      topicArn,
      "--subject",
      subject.slice(0, 100),
      "--message",
      message,
    ],
    { region: opts.region, profile: opts.profile, json: true }
  );
  return true;
}
