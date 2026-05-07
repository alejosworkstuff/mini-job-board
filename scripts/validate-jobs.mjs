import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const jobsPath = resolve(process.cwd(), "data/jobs.json");
const requiredFields = [
  "id",
  "title",
  "company",
  "type",
  "location",
  "seniority",
  "employment",
  "salary",
  "description",
  "responsibilities",
  "requirements",
  "benefits"
];

function fail(message) {
  console.error(`Data validation failed: ${message}`);
  process.exit(1);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonEmptyStringArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

async function main() {
  const source = await readFile(jobsPath, "utf8");
  let jobs;

  try {
    jobs = JSON.parse(source);
  } catch (error) {
    fail(`data/jobs.json is not valid JSON (${error.message})`);
  }

  if (!Array.isArray(jobs) || jobs.length === 0) {
    fail("jobs.json must contain a non-empty array.");
  }

  const ids = new Set();

  for (let i = 0; i < jobs.length; i += 1) {
    const job = jobs[i];
    const indexLabel = `job at index ${i}`;

    if (typeof job !== "object" || job === null || Array.isArray(job)) {
      fail(`${indexLabel} must be an object.`);
    }

    for (const field of requiredFields) {
      if (!(field in job)) {
        fail(`${indexLabel} is missing required field "${field}".`);
      }
    }

    if (!Number.isInteger(job.id) || job.id <= 0) {
      fail(`${indexLabel} has an invalid "id". Expected a positive integer.`);
    }

    if (ids.has(job.id)) {
      fail(`${indexLabel} uses duplicate id "${job.id}".`);
    }
    ids.add(job.id);

    if (!isNonEmptyString(job.title) || !isNonEmptyString(job.company)) {
      fail(`${indexLabel} has an empty "title" or "company".`);
    }

    if (!isNonEmptyStringArray(job.responsibilities)) {
      fail(`${indexLabel} needs a non-empty "responsibilities" string array.`);
    }

    if (!isNonEmptyStringArray(job.requirements)) {
      fail(`${indexLabel} needs a non-empty "requirements" string array.`);
    }

    if (!isNonEmptyStringArray(job.benefits)) {
      fail(`${indexLabel} needs a non-empty "benefits" string array.`);
    }
  }

  console.log(`Data validation passed for ${jobs.length} jobs.`);
}

main().catch((error) => fail(error.message));
