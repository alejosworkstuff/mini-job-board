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
const emptyResetBtn = document.getElementById("emptyResetBtn");
const darkModeBtn = document.getElementById("darkModeBtn");
const toast = document.getElementById("toast");
const viewGridBtn = document.getElementById("viewGridBtn");
const viewListBtn = document.getElementById("viewListBtn");
const savedCountElement = document.getElementById("savedCount");

// ===== DATA =====
let jobs = [];
let filteredJobs = [];
let currentPage = 1;
let currentView = localStorage.getItem("jobsViewMode") || "grid";
let savedJobs = new Set(readStoredSavedJobs());
const PAGE_SIZE = 6;

// ===== FETCH =====
fetch("./data/jobs.json")
  .then((response) => response.json())
  .then((data) => {
    jobs = data;
    applyFilters();
  })
  .catch((err) => console.error("Error loading jobs:", err));

// ===== EVENTS =====
searchInput.addEventListener("input", () => {
  toggleClearSearch();
  applyFilters();
});

typeFilter.addEventListener("change", applyFilters);
seniorityFilter.addEventListener("change", applyFilters);
sortBy.addEventListener("change", applyFilters);

if (clearFiltersBtn) {
  clearFiltersBtn.addEventListener("click", resetAllFilters);
}

if (emptyResetBtn) {
  emptyResetBtn.addEventListener("click", resetAllFilters);
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

if (darkModeBtn) {
  darkModeBtn.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem("darkMode", String(isDark));
    darkModeBtn.textContent = isDark ? "Light" : "Dark";
  });
}

if (viewGridBtn && viewListBtn) {
  viewGridBtn.addEventListener("click", () => {
    setViewMode("grid");
  });
  viewListBtn.addEventListener("click", () => {
    setViewMode("list");
  });
}

if (jobsListElement) {
  jobsListElement.addEventListener("click", (event) => {
    const saveButton = event.target.closest(".save-job-btn");
    if (!saveButton) return;

    const id = Number(saveButton.dataset.jobId);
    toggleSavedJob(id);
    renderSaveButton(saveButton, id);
    updateSavedCount();
    showToast(savedJobs.has(id) ? "Saved job to your list" : "Removed from saved jobs");
  });
}

// ===== FILTER LOGIC =====
function applyFilters() {
  const searchText = searchInput.value.toLowerCase().trim();
  const selectedType = typeFilter.value.toLowerCase();
  const selectedSeniority = seniorityFilter.value.toLowerCase();

  currentPage = 1;
  filteredJobs = [...jobs];

  if (selectedType !== "all") {
    filteredJobs = filteredJobs.filter((job) => job.type.toLowerCase() === selectedType);
  }

  if (selectedSeniority !== "all") {
    filteredJobs = filteredJobs.filter((job) => job.seniority.toLowerCase() === selectedSeniority);
  }

  if (searchText !== "") {
    filteredJobs = filteredJobs.filter((job) => {
      return (
        job.title.toLowerCase().includes(searchText) ||
        job.company.toLowerCase().includes(searchText) ||
        (job.location || "").toLowerCase().includes(searchText)
      );
    });
  }

  filteredJobs = sortJobs(filteredJobs, sortBy.value);
  updateResults();
  updateActiveFiltersBadge(searchText);
}

// ===== RENDER =====
function renderJobs(list) {
  jobsListElement.innerHTML = "";

  list.forEach((job, index) => {
    const jobCard = document.createElement("article");
    jobCard.className = "job";
    jobCard.tabIndex = 0;
    jobCard.style.animationDelay = `${index * 45}ms`;

    const badgeClass = slugify(job.seniority);
    const chips = [
      job.type ? `<span class="chip">${job.type}</span>` : "",
      job.location ? `<span class="chip">${job.location}</span>` : "",
      job.salary ? `<span class="chip">${job.salary}</span>` : ""
    ].join("");

    const isSaved = savedJobs.has(job.id);
    const saveLabel = isSaved ? "Saved" : "Save";
    const saveStateClass = isSaved ? "is-saved" : "";
    const savePressed = isSaved ? "true" : "false";

    jobCard.innerHTML = `
      <div class="job-top">
        <p class="job-time">Posted recently</p>
        <button
          class="save-job-btn ${saveStateClass}"
          type="button"
          data-job-id="${job.id}"
          aria-label="${isSaved ? "Unsave job" : "Save job"}"
          aria-pressed="${savePressed}"
        >
          ${saveLabel}
        </button>
      </div>
      <div class="job-header">
        <h3 class="job-title">${job.title}</h3>
        <span class="badge ${badgeClass}">${job.seniority}</span>
      </div>
      <p class="job-company">${job.company}</p>
      <div class="job-meta">${chips}</div>
      <div class="job-actions">
        <button type="button" class="apply-btn">Apply now</button>
        <button type="button" class="ghost-btn">Details</button>
      </div>
    `;

    jobsListElement.appendChild(jobCard);
  });
}

function updateResults() {
  const total = filteredJobs.length;
  const visible = filteredJobs.slice(0, currentPage * PAGE_SIZE);

  renderJobs(visible);
  updateResultsCount(total, visible.length);
  updateSavedCount();

  emptyState.hidden = total !== 0;

  if (loadMoreBtn) {
    loadMoreBtn.hidden = visible.length >= total || total === 0;
  }
}

function updateResultsCount(total, visible) {
  if (!resultsCount) return;
  const label = total === 1 ? "job" : "jobs";
  const details = total > visible ? `${visible}/${total}` : `${total}`;
  resultsCount.textContent = `${details} ${label} shown`;
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

function updateSavedCount() {
  if (!savedCountElement) return;
  const count = savedJobs.size;
  savedCountElement.textContent = `Saved: ${count}`;
}

function setViewMode(mode) {
  currentView = mode;
  const isGrid = mode === "grid";
  jobsListElement.classList.toggle("jobs-grid", isGrid);
  jobsListElement.classList.toggle("jobs-list-view", !isGrid);
  viewGridBtn.classList.toggle("is-active", isGrid);
  viewListBtn.classList.toggle("is-active", !isGrid);
  viewGridBtn.setAttribute("aria-pressed", String(isGrid));
  viewListBtn.setAttribute("aria-pressed", String(!isGrid));
  localStorage.setItem("jobsViewMode", mode);
}

function toggleSavedJob(id) {
  if (savedJobs.has(id)) {
    savedJobs.delete(id);
  } else {
    savedJobs.add(id);
  }
  localStorage.setItem("savedJobs", JSON.stringify([...savedJobs]));
}

function renderSaveButton(button, id) {
  const isSaved = savedJobs.has(id);
  button.classList.toggle("is-saved", isSaved);
  button.setAttribute("aria-pressed", String(isSaved));
  button.setAttribute("aria-label", isSaved ? "Unsave job" : "Save job");
  button.textContent = isSaved ? "Saved" : "Save";
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timerId);
  showToast.timerId = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1700);
}

showToast.timerId = 0;

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

function readStoredSavedJobs() {
  try {
    const saved = JSON.parse(localStorage.getItem("savedJobs") || "[]");
    return Array.isArray(saved) ? saved.filter((id) => Number.isInteger(id)) : [];
  } catch (error) {
    console.warn("Could not parse saved jobs from localStorage.", error);
    return [];
  }
}

function resetAllFilters() {
  searchInput.value = "";
  typeFilter.value = "all";
  seniorityFilter.value = "all";
  sortBy.value = "newest";
  toggleClearSearch();
  applyFilters();
}

function slugify(value = "") {
  return value.toLowerCase().trim().replace(/\s+/g, "-");
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  const isDark = localStorage.getItem("darkMode") === "true";
  document.body.classList.toggle("dark", isDark);
  if (darkModeBtn) {
    darkModeBtn.textContent = isDark ? "Light" : "Dark";
  }
  setViewMode(currentView);
  toggleClearSearch();
  updateSavedCount();
});
