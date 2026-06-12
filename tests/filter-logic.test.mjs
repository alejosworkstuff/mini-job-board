import assert from "node:assert";
import { describe, it } from "node:test";
import {
  applyJobFilters,
  jobMatchesSalaryBand,
  parseSalaryMonthlyUsd,
  sortJobs,
} from "../scripts/filter-logic.mjs";

const sampleJobs = [
  { id: 2, title: "Backend Developer", company: "Cloud Delta", type: "Onsite", location: "Mexico", seniority: "Trainee", salary: "$1.8k–2.4k USD / month" },
  { id: 10, title: "Frontend Engineer", company: "ScaleUp Corp", type: "Remote", location: "Global", seniority: "Senior", salary: "$6k–9k USD / month" },
  { id: 7, title: "Fullstack Developer", company: "CodeWave", type: "Hybrid", location: "LATAM", seniority: "Semi-Senior", salary: "$4k–6k USD / month" },
];

describe("mini-job-board filter logic", () => {
  it("filters by job type", () => {
    const result = applyJobFilters(sampleJobs, { selectedType: "remote" });
    assert.equal(result.length, 1);
    assert.equal(result[0].company, "ScaleUp Corp");
  });

  it("filters by seniority", () => {
    const result = applyJobFilters(sampleJobs, { selectedSeniority: "trainee" });
    assert.equal(result.length, 1);
    assert.equal(result[0].title, "Backend Developer");
  });

  it("searches title/company/location", () => {
    const result = applyJobFilters(sampleJobs, { searchText: "latam" });
    assert.equal(result.length, 1);
    assert.equal(result[0].company, "CodeWave");
  });

  it("filters by salary band under-3k", () => {
    const result = applyJobFilters(sampleJobs, { selectedSalary: "under-3k" });
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 2);
  });

  it("filters by salary band 5k-8k with overlap", () => {
    const result = applyJobFilters(sampleJobs, { selectedSalary: "5k-8k" });
    assert.equal(result.length, 2);
    assert.deepStrictEqual(
      result.map((j) => j.id).sort((a, b) => a - b),
      [7, 10]
    );
  });

  it("parses monthly USD salaries", () => {
    const parsed = parseSalaryMonthlyUsd("$4k–6k USD / month");
    assert.deepStrictEqual(parsed, { min: 4000, max: 6000 });
  });

  it("parses yearly EUR salaries to monthly USD", () => {
    const parsed = parseSalaryMonthlyUsd("€55k–72k gross / year");
    assert.ok(parsed.min > 4500 && parsed.min < 5200);
    assert.ok(parsed.max > 6000 && parsed.max < 6800);
  });

  it("jobMatchesSalaryBand returns false for unparseable salary", () => {
    assert.equal(jobMatchesSalaryBand({ salary: "Competitive" }, "under-3k"), false);
  });

  it("sorts by newest by default", () => {
    const result = applyJobFilters(sampleJobs);
    assert.deepStrictEqual(
      result.map((j) => j.id),
      [10, 7, 2]
    );
  });

  it("sorts by company A-Z", () => {
    const result = sortJobs(sampleJobs, "company-az");
    assert.deepStrictEqual(
      result.map((j) => j.company),
      ["Cloud Delta", "CodeWave", "ScaleUp Corp"]
    );
  });

  it("prioritizes remote jobs in remote-first mode", () => {
    const result = sortJobs(sampleJobs, "remote-first");
    assert.equal(result[0].type, "Remote");
  });
});
