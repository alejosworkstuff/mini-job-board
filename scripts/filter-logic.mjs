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
    sortMode = "newest",
  } = {}
) {
  const normalizedSearch = searchText.toLowerCase().trim();
  const normalizedType = selectedType.toLowerCase();
  const normalizedSeniority = selectedSeniority.toLowerCase();

  let filtered = [...jobs];

  if (normalizedType !== "all") {
    filtered = filtered.filter((job) => String(job.type || "").toLowerCase() === normalizedType);
  }

  if (normalizedSeniority !== "all") {
    filtered = filtered.filter(
      (job) => String(job.seniority || "").toLowerCase() === normalizedSeniority
    );
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
