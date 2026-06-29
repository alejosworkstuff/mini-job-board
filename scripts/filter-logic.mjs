import { slugify } from "./utils.mjs";

const EUR_TO_USD = 1.08;

const SALARY_BANDS = {
  "under-3k": { min: 0, max: 3000 },
  "3k-5k": { min: 3000, max: 5000 },
  "5k-8k": { min: 5000, max: 8000 },
  "8k-plus": { min: 8000, max: Infinity },
};

export function parseSalaryMonthlyUsd(salary) {
  if (!salary || typeof salary !== "string") return null;
  const s = salary.toLowerCase();
  const kMatches = [...s.matchAll(/([\d.]+)\s*k/gi)];
  if (kMatches.length < 2) return null;

  let min = parseFloat(kMatches[0][1]) * 1000;
  let max = parseFloat(kMatches[1][1]) * 1000;

  const isYearly = /\/\s*year|per\s+year|yearly|gross\s*\/\s*year/.test(s);
  const isEur = /€|eur/.test(s);

  if (isYearly) {
    min /= 12;
    max /= 12;
  }
  if (isEur) {
    min *= EUR_TO_USD;
    max *= EUR_TO_USD;
  }

  return { min, max };
}

function rangesOverlap(a, b) {
  return a.min < b.max && a.max > b.min;
}

export function jobMatchesSalaryBand(job, band) {
  if (!band || band === "all") return true;
  const filterRange = SALARY_BANDS[band];
  if (!filterRange) return true;
  const parsed = parseSalaryMonthlyUsd(job.salary);
  if (!parsed) return false;
  return rangesOverlap(parsed, filterRange);
}

export function sortJobs(list, mode = "newest") {
  const sorted = [...list];

  if (mode === "company-az") {
    sorted.sort((a, b) => a.company.localeCompare(b.company));
    return sorted;
  }

  if (mode === "remote-first") {
    const rank = (job) => {
      const type = String(job.type || "").toLowerCase();
      if (type === "remote") return 0;
      if (type === "hybrid") return 1;
      return 2;
    };

    sorted.sort((a, b) => rank(a) - rank(b) || a.company.localeCompare(b.company));
    return sorted;
  }

  sorted.sort((a, b) => (b.id || 0) - (a.id || 0));
  return sorted;
}

export function applyJobFilters(
  jobs,
  {
    searchText = "",
    selectedType = "all",
    selectedSeniority = "all",
    selectedSalary = "all",
    sortMode = "newest",
  } = {}
) {
  const normalizedSearch = searchText.toLowerCase().trim();
  const normalizedType = slugify(selectedType);
  const normalizedSeniority = slugify(selectedSeniority);

  let filtered = [...jobs];

  if (normalizedType !== "all") {
    filtered = filtered.filter((job) => slugify(job.type || "") === normalizedType);
  }

  if (normalizedSeniority !== "all") {
    filtered = filtered.filter((job) => slugify(job.seniority || "") === normalizedSeniority);
  }

  if (selectedSalary !== "all") {
    filtered = filtered.filter((job) => jobMatchesSalaryBand(job, selectedSalary));
  }

  if (normalizedSearch) {
    filtered = filtered.filter((job) => {
      return (
        String(job.title || "").toLowerCase().includes(normalizedSearch) ||
        String(job.company || "").toLowerCase().includes(normalizedSearch) ||
        String(job.location || "").toLowerCase().includes(normalizedSearch)
      );
    });
  }

  return sortJobs(filtered, sortMode);
}
