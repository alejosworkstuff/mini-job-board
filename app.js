// ===== DOM =====
const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const seniorityFilter = document.getElementById("seniorityFilter");
const sortBy = document.getElementById("sortBy");
const clearFiltersBtn = document.getElementById("clearFilters");
const jobsListElement = document.getElementById("jobs-list");
const emptyState = document.getElementById("empty-state");
const filtersPanel = document.getElementById("filtersPanel");
const toggleFiltersBtn = document.getElementById("toggleFilters");
const filtersWrapper = document.querySelector(".filters");
const resultsCount = document.getElementById("resultsCount");
const clearSearchBtn = document.getElementById("clearSearch");
const activeFiltersBadge = document.getElementById("activeFiltersBadge");
const loadMoreBtn = document.getElementById("loadMore");

// ===== DATA =====
let jobs = [];
let filteredJobs = [];
let currentPage = 1;
const PAGE_SIZE = 6;

// ===== FETCH =====
fetch("./data/jobs.json")
  .then(response => response.json())
  .then(data => {
    jobs = data;
    applyFilters();
  })
  .catch(err => console.error("Error loading jobs:", err));

// ===== EVENTS =====
searchInput.addEventListener("input", () => {
  toggleClearSearch();
  applyFilters();
});
typeFilter.addEventListener("change", applyFilters);
seniorityFilter.addEventListener("change", applyFilters);
sortBy.addEventListener("change", applyFilters);

if (clearFiltersBtn) {
  clearFiltersBtn.addEventListener("click", () => {
    searchInput.value = "";
    typeFilter.value = "all";
    seniorityFilter.value = "all";
    sortBy.value = "newest";
    toggleClearSearch();
    applyFilters();
  });
}

if (clearSearchBtn) {
  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    toggleClearSearch();
    applyFilters();
    searchInput.focus();
  });
}

if (loadMoreBtn) {
  loadMoreBtn.addEventListener("click", () => {
    currentPage += 1;
    updateResults();
  });
}

if (toggleFiltersBtn && filtersPanel && filtersWrapper) {
  const setCollapsed = (collapsed) => {
    filtersPanel.classList.toggle("is-collapsed", collapsed);
    filtersWrapper.classList.toggle("is-collapsed", collapsed);
    toggleFiltersBtn.setAttribute("aria-expanded", String(!collapsed));
  };

  toggleFiltersBtn.addEventListener("click", () => {
    const isCollapsed = filtersPanel.classList.toggle("is-collapsed");
    filtersWrapper.classList.toggle("is-collapsed", isCollapsed);
    toggleFiltersBtn.setAttribute("aria-expanded", String(!isCollapsed));
    localStorage.setItem("filtersCollapsed", String(isCollapsed));
  });

  const stored = localStorage.getItem("filtersCollapsed") === "true";
  setCollapsed(stored);
}

// ===== FILTER LOGIC =====
function applyFilters() {
  const searchText = searchInput.value.toLowerCase().trim();
  const selectedType = typeFilter.value.toLowerCase();
  const selectedSeniority = seniorityFilter.value.toLowerCase();

  currentPage = 1;
  filteredJobs = [...jobs];

  if (selectedType !== "all") {
    filteredJobs = filteredJobs.filter(
      job => job.type.toLowerCase() === selectedType
    );
  }

  if (selectedSeniority !== "all") {
    filteredJobs = filteredJobs.filter(
      job => job.seniority.toLowerCase() === selectedSeniority
    );
  }

  if (searchText !== "") {
    filteredJobs = filteredJobs.filter(
      job =>
        job.title.toLowerCase().includes(searchText) ||
        job.company.toLowerCase().includes(searchText)
    );
  }

  filteredJobs = sortJobs(filteredJobs, sortBy.value);
  updateResults();
  updateActiveFiltersBadge(searchText);
}

// ===== RENDER =====
function renderJobs(list) {
  jobsListElement.innerHTML = "";

  list.forEach(job => {
    const jobDiv = document.createElement("div");
    jobDiv.className = "job";
    jobDiv.tabIndex = 0;

    const badgeClass = job.seniority
      .toLowerCase()
      .replace(" ", "-");

    const chips = [
      job.type ? `<span class="chip">${job.type}</span>` : "",
      job.location ? `<span class="chip">${job.location}</span>` : "",
      job.salary ? `<span class="chip">${job.salary}</span>` : ""
    ].join("");

    jobDiv.innerHTML = `
      <div class="job-header">
        <h3 class="job-title">${job.title}</h3>
        <span class="badge ${badgeClass}">
          ${job.seniority}
        </span>
      </div>
      <p class="job-company">${job.company}</p>
      <div class="job-meta">${chips}</div>
    `;

    jobsListElement.appendChild(jobDiv);
  });
}

function updateResults() {
  const total = filteredJobs.length;
  const visible = filteredJobs.slice(0, currentPage * PAGE_SIZE);

  renderJobs(visible);
  updateResultsCount(total);

  if (total === 0) {
    emptyState.style.display = "block";
  } else {
    emptyState.style.display = "none";
  }

  if (loadMoreBtn) {
    loadMoreBtn.hidden = visible.length >= total || total === 0;
  }
}

function updateResultsCount(total) {
  if (!resultsCount) return;
  const label = total === 1 ? "job" : "jobs";
  resultsCount.textContent = `${total} ${label} found`;
}

function toggleClearSearch() {
  if (!clearSearchBtn) return;
  clearSearchBtn.hidden = searchInput.value.trim() === "";
}

function updateActiveFiltersBadge(searchText) {
  if (!activeFiltersBadge) return;
  let count = 0;
  if (searchText) count += 1;
  if (typeFilter.value !== "all") count += 1;
  if (seniorityFilter.value !== "all") count += 1;

  if (count === 0) {
    activeFiltersBadge.hidden = true;
    activeFiltersBadge.textContent = "0";
    return;
  }

  activeFiltersBadge.hidden = false;
  activeFiltersBadge.textContent = String(count);
}

function sortJobs(list, mode) {
  const sorted = [...list];

  if (mode === "company-az") {
    sorted.sort((a, b) => a.company.localeCompare(b.company));
    return sorted;
  }

  if (mode === "remote-first") {
    const rank = (job) => {
      const type = job.type.toLowerCase();
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

// ===== DARK MODE =====

document.addEventListener("DOMContentLoaded", () => {
  const isDark = localStorage.getItem("darkMode") === "true";
  document.body.classList.toggle("dark", isDark);
});

document.addEventListener("click", (e) => {
  const darkModeBtn = e.target.closest("#darkModeBtn");
  if (!darkModeBtn) return;

  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", isDark);
});
