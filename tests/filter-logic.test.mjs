import assert from "node:assert";
import { describe, it } from "node:test";
import { applyJobFilters, sortJobs } from "../scripts/filter-logic.mjs";

const sampleJobs = [
  { id: 2, title: "Backend Developer", company: "Cloud Delta", type: "Onsite", location: "Mexico", seniority: "Trainee" },
  { id: 10, title: "Frontend Engineer", company: "ScaleUp Corp", type: "Remote", location: "Global", seniority: "Senior" },
  { id: 7, title: "Fullstack Developer", company: "CodeWave", type: "Hybrid", location: "LATAM", seniority: "Semi-Senior" },
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
