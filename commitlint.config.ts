import type { UserConfig } from "@commitlint/types";

const config: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Enforce exact types from plan-projectMoonlight.prompt.md
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "docs", // Documentation only
        "style", // Formatting, no logic change
        "refactor", // Code restructure, no feature/fix
        "perf", // Performance improvement
        "test", // Adding or fixing tests
        "chore", // Build process or auxiliary tools
        "ci", // CI/CD changes
        "revert", // Revert a previous commit
      ],
    ],
    // type must be lowercase
    "type-case": [2, "always", "lower-case"],
    // subject must not end with a period
    "subject-full-stop": [2, "never", "."],
    // subject must not be empty
    "subject-empty": [2, "never"],
    // subject must be sentence-case or lower-case (flexible for devs)
    "subject-case": [0],
    // Max header length: 100 chars (GitHub truncates at 72, but 100 is practical)
    "header-max-length": [2, "always", 100],
    // Body lines max 100 chars
    "body-max-line-length": [2, "always", 100],
  },
};

export default config;
