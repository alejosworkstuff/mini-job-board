import { applyJobFilters } from "./scripts/filter-logic.mjs";
import { escapeHtml, normalizeUrlFilter, slugify } from "./scripts/utils.mjs";

// ===== DOM =====
const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const seniorityFilter = document.getElementById("seniorityFilter");
const salaryFilter = document.getElementById("salaryFilter");
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
const userMenuBtn = document.getElementById("userMenuBtn");
const userMenu = document.getElementById("userMenu");
const homeNavBtn = document.getElementById("homeNavBtn");
const alertsBtn = document.getElementById("alertsBtn");
const alertsBadge = document.getElementById("alertsBadge");
const toast = document.getElementById("toast");
const viewGridBtn = document.getElementById("viewGridBtn");
const viewListBtn = document.getElementById("viewListBtn");
const savedCountElement = document.getElementById("savedCount");
const appliedCountElement = document.getElementById("appliedCount");
const jobModal = document.getElementById("jobModal");
const jobModalTitle = document.getElementById("jobModalTitle");
const jobModalCompany = document.getElementById("jobModalCompany");
const jobModalMeta = document.getElementById("jobModalMeta");
const jobModalDescription = document.getElementById("jobModalDescription");
const jobModalDetailsLink = document.getElementById("jobModalDetailsLink");
const closeJobModalBtn = document.getElementById("closeJobModal");
const confirmApplyBtn = document.getElementById("confirmApplyBtn");
const savedJobsModal = document.getElementById("savedJobsModal");
const savedJobsList = document.getElementById("savedJobsList");
const closeSavedJobsModalBtn = document.getElementById("closeSavedJobsModal");
const alertsModal = document.getElementById("alertsModal");
const alertsList = document.getElementById("alertsList");
const closeAlertsModalBtn = document.getElementById("closeAlertsModal");
const settingsModal = document.getElementById("settingsModal");
const closeSettingsModalBtn = document.getElementById("closeSettingsModal");
const settingsThemeBtn = document.getElementById("settingsThemeBtn");
const clearSavedBtn = document.getElementById("clearSavedBtn");
const clearAppliedBtn = document.getElementById("clearAppliedBtn");

// ===== DATA =====
let jobs = [];
let filteredJobs = [];
let currentPage = 1;
let currentView = localStorage.getItem("jobsViewMode") || "grid";
let savedJobs = new Set(readStoredSavedJobs());
let appliedJobs = new Set(readStoredAppliedJobs());
let modalJobId = null;
const PAGE_SIZE = 6;

const VALID_TYPES = new Set(["all", "remote", "hybrid", "onsite"]);
const VALID_SENIORITIES = new Set(["all", "junior", "semi-senior", "senior", "trainee"]);
const VALID_SALARIES = new Set(["all", "under-3k", "3k-5k", "5k-8k", "8k-plus"]);
const VALID_SORTS = new Set(["newest", "company-az", "remote-first"]);

let filterDropdownConfigs = [];

function syncFilterDropdownLabels() {
  filterDropdownConfigs.forEach((cfg) => {
    const opt = cfg.select.options[cfg.select.selectedIndex];
    const labelSpan = cfg.trigger.querySelector(".filter-dropdown-label");
    if (labelSpan && opt) labelSpan.textContent = opt.textContent;
    cfg.list.querySelectorAll(".filter-dropdown-option").forEach((li) => {
      li.setAttribute("aria-selected", li.dataset.value === cfg.select.value ? "true" : "false");
    });
  });
}

function closeFilterDropdown(cfg) {
  cfg.list.classList.remove("is-open");
  cfg.trigger.setAttribute("aria-expanded", "false");
  cfg.list.setAttribute("aria-hidden", "true");
}

function closeAllFilterDropdowns() {
  filterDropdownConfigs.forEach((cfg) => closeFilterDropdown(cfg));
}

function closeAllFilterDropdownsIfOpen() {
  if (!document.querySelector(".filter-dropdown-panel.is-open")) return false;
  closeAllFilterDropdowns();
  return true;
}

function openFilterDropdown(cfg) {
  cfg.list.setAttribute("aria-hidden", "false");
  cfg.trigger.setAttribute("aria-expanded", "true");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      cfg.list.classList.add("is-open");
    });
  });
}

function toggleFilterDropdown(cfg) {
  if (cfg.list.classList.contains("is-open")) {
    closeFilterDropdown(cfg);
  } else {
    closeAllFilterDropdowns();
    openFilterDropdown(cfg);
  }
}

function initFilterDropdowns() {
  filterDropdownConfigs = [];
  const specs = [
    { select: typeFilter, triggerId: "typeFilterBtn", listId: "typeFilterList" },
    { select: seniorityFilter, triggerId: "seniorityFilterBtn", listId: "seniorityFilterList" },
    { select: salaryFilter, triggerId: "salaryFilterBtn", listId: "salaryFilterList" },
    { select: sortBy, triggerId: "sortByBtn", listId: "sortByList" }
  ];

  specs.forEach((spec) => {
    const trigger = document.getElementById(spec.triggerId);
    const list = document.getElementById(spec.listId);
    if (!spec.select || !trigger || !list) return;
    const cfg = { ...spec, trigger, list };
    filterDropdownConfigs.push(cfg);

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFilterDropdown(cfg);
    });

    list.querySelectorAll(".filter-dropdown-option").forEach((opt) => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        const val = opt.dataset.value;
        if (spec.select.value !== val) {
          spec.select.value = val;
          spec.select.dispatchEvent(new Event("change", { bubbles: true }));
        }
        closeFilterDropdown(cfg);
        syncFilterDropdownLabels();
      });
    });
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest(".filter-dropdown")) return;
    closeAllFilterDropdowns();
  });
}

// ===== FETCH =====
let jobsLoaded = false;
let jobsLoadFailed = false;
let domReady = false;

function showJobsLoadError() {
  jobsLoadFailed = true;
  window.miniJobBoardJobsFetchError?.show();
  if (resultsCount) resultsCount.textContent = "Jobs unavailable";
  if (emptyState) emptyState.hidden = true;
  if (jobsListElement) jobsListElement.innerHTML = "";
  if (loadMoreBtn) loadMoreBtn.hidden = true;
}

function tryInitialRender() {
  if (!jobsLoaded || !domReady) return;
  if (jobsLoadFailed) {
    showJobsLoadError();
    return;
  }
  syncFilterDropdownLabels();
  applyFilters();
}

readFiltersFromUrl();

fetch("./data/jobs.json")
  .then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then((data) => {
    window.miniJobBoardJobsFetchError?.hide();
    jobs = data;
    jobsLoaded = true;
    jobsLoadFailed = false;
    tryInitialRender();
    if (savedJobsModal && !savedJobsModal.hidden) {
      renderSavedJobsList();
    }
  })
  .catch((err) => {
    console.error("Error loading jobs:", err);
    jobsLoaded = true;
    jobsLoadFailed = true;
    tryInitialRender();
  });

// ===== EVENTS =====
searchInput.addEventListener("input", () => {
  toggleClearSearch();
  applyFilters();
});

typeFilter.addEventListener("change", applyFilters);
seniorityFilter.addEventListener("change", applyFilters);
if (salaryFilter) salaryFilter.addEventListener("change", applyFilters);
sortBy.addEventListener("change", applyFilters);

window.addEventListener("popstate", () => {
  readFiltersFromUrl();
  toggleClearSearch();
  if (filterDropdownConfigs.length) syncFilterDropdownLabels();
  if (jobs.length) applyFilters();
});

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
    toggleTheme();
  });
}

if (settingsThemeBtn) {
  settingsThemeBtn.addEventListener("click", () => {
    toggleTheme();
  });
}

function syncThemeButtons() {
  const isDark = document.body.classList.contains("dark");
  const label = isDark ? "Light" : "Dark";
  if (darkModeBtn) darkModeBtn.textContent = label;
  if (settingsThemeBtn) settingsThemeBtn.textContent = label;
}

function setTheme(isDark) {
  document.body.classList.toggle("dark", isDark);
  localStorage.setItem("darkMode", String(isDark));
  syncThemeButtons();
}

function toggleTheme() {
  setTheme(!document.body.classList.contains("dark"));
}

function updateAlertsBadge() {
  if (!alertsBadge) return;
  const count = appliedJobs.size;
  alertsBadge.textContent = String(count);
  alertsBadge.hidden = count === 0;
  if (alertsBtn) {
    alertsBtn.setAttribute(
      "aria-label",
      count === 0 ? "Application alerts" : `Application alerts (${count})`
    );
  }
}

function isUserMenuOpen() {
  return Boolean(userMenu && userMenu.classList.contains("is-open"));
}

function openUserMenu() {
  if (!userMenu || !userMenuBtn) return;
  userMenu.setAttribute("aria-hidden", "false");
  userMenuBtn.setAttribute("aria-expanded", "true");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      userMenu.classList.add("is-open");
    });
  });
  const firstItem = userMenu.querySelector('[role="menuitem"]');
  if (firstItem) window.setTimeout(() => firstItem.focus(), 0);
}

function closeUserMenu() {
  if (!userMenu || !userMenuBtn) return;
  userMenu.classList.remove("is-open");
  userMenuBtn.setAttribute("aria-expanded", "false");
  userMenu.setAttribute("aria-hidden", "true");
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    userMenuBtn.focus();
  };
  userMenu.addEventListener(
    "transitionend",
    (e) => {
      if (e.target === userMenu && (e.propertyName === "opacity" || e.propertyName === "transform")) {
        finish();
      }
    },
    { once: true }
  );
  window.setTimeout(finish, 320);
}

function toggleUserMenu() {
  if (isUserMenuOpen()) closeUserMenu();
  else openUserMenu();
}

function anyOverlayOpen() {
  return (
    (savedJobsModal && !savedJobsModal.hidden) ||
    (alertsModal && !alertsModal.hidden) ||
    (settingsModal && !settingsModal.hidden) ||
    (jobModal && !jobModal.hidden)
  );
}

function syncBodyScroll() {
  document.body.style.overflow = anyOverlayOpen() ? "hidden" : "";
}

if (userMenuBtn && userMenu) {
  userMenuBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleUserMenu();
  });

  userMenu.querySelectorAll(".user-menu-item").forEach((item) => {
    item.addEventListener("click", () => {
      const action = item.dataset.action;
      closeUserMenu();
      if (action === "saved-jobs") {
        openSavedJobsModal();
        return;
      }
      if (action === "settings") {
        openSettingsModal();
      }
    });
  });
}

if (homeNavBtn) {
  homeNavBtn.addEventListener("click", (event) => {
    const path = window.location.pathname.replace(/\\/g, "/");
    const onHome =
      path.endsWith("/") || path.endsWith("/index.html") || /\/mini-job-board\/?$/.test(path);
    if (!onHome) return;
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

if (alertsBtn) {
  alertsBtn.addEventListener("click", () => {
    if (alertsModal && !alertsModal.hidden) closeAlertsModal();
    else openAlertsModal();
  });
}

if (clearSavedBtn) {
  clearSavedBtn.addEventListener("click", () => {
    savedJobs = new Set();
    localStorage.setItem("savedJobs", "[]");
    updateSavedCount();
    updateResults();
    if (savedJobsModal && !savedJobsModal.hidden) renderSavedJobsList();
    showToast("Saved jobs cleared");
  });
}

if (clearAppliedBtn) {
  clearAppliedBtn.addEventListener("click", () => {
    appliedJobs = new Set();
    localStorage.setItem("appliedJobs", "[]");
    updateAppliedCount();
    updateAlertsBadge();
    updateResults();
    updateApplyButtonState();
    if (alertsModal && !alertsModal.hidden) renderAlertsList();
    showToast("Applications cleared");
  });
}

document.addEventListener("click", (event) => {
  if (!isUserMenuOpen()) return;
  const account = event.target.closest(".header-account");
  if (account) return;
  closeUserMenu();
});

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
    const applyButton = event.target.closest(".apply-btn");
    if (applyButton) {
      const id = Number(applyButton.dataset.jobId);
      const job = jobs.find((j) => j.id === id);
      if (job) openJobModal(job);
      return;
    }

    const detailsButton = event.target.closest(".ghost-btn");
    if (detailsButton) {
      const id = detailsButton.dataset.jobId;
      window.location.href = `job-details.html?id=${id}`;
      return;
    }

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
function readFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q") || params.get("search") || "";
  const type = normalizeUrlFilter(params.get("type"), VALID_TYPES);
  const seniority = normalizeUrlFilter(params.get("seniority"), VALID_SENIORITIES);
  const salary = normalizeUrlFilter(params.get("salary"), VALID_SALARIES);
  const sort = normalizeUrlFilter(params.get("sort"), VALID_SORTS);

  searchInput.value = q;
  if (type) typeFilter.value = type;
  if (seniority) seniorityFilter.value = seniority;
  if (salary && salaryFilter) salaryFilter.value = salary;
  if (sort) sortBy.value = sort;
}

function syncUrlToFilters() {
  const params = new URLSearchParams();
  const q = searchInput.value.trim();
  if (q) params.set("q", q);
  if (typeFilter.value !== "all") params.set("type", typeFilter.value);
  if (seniorityFilter.value !== "all") params.set("seniority", seniorityFilter.value);
  if (salaryFilter && salaryFilter.value !== "all") params.set("salary", salaryFilter.value);
  if (sortBy.value !== "newest") params.set("sort", sortBy.value);

  const query = params.toString();
  const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
    history.replaceState(null, "", nextUrl);
  }
}

function applyFilters() {
  const searchText = searchInput.value.trim();
  const selectedType = typeFilter.value;
  const selectedSeniority = seniorityFilter.value;
  const selectedSalary = salaryFilter ? salaryFilter.value : "all";

  currentPage = 1;
  filteredJobs = applyJobFilters(jobs, {
    searchText,
    selectedType,
    selectedSeniority,
    selectedSalary,
    sortMode: sortBy.value
  });
  syncUrlToFilters();
  updateResults();
  updateActiveFiltersBadge(searchText.toLowerCase());
}

// ===== RENDER =====
function renderJobs(list) {
  jobsListElement.innerHTML = "";

  list.forEach((job, index) => {
    const jobCard = document.createElement("article");
    jobCard.className = "job";
    jobCard.tabIndex = 0;
    jobCard.style.animationDelay = `${index * 55}ms`;

    const badgeClass = slugify(job.seniority);
    const chips = [
      job.type ? `<span class="chip">${escapeHtml(job.type)}</span>` : "",
      job.location ? `<span class="chip">${escapeHtml(job.location)}</span>` : "",
      job.salary ? `<span class="chip">${escapeHtml(job.salary)}</span>` : ""
    ].join("");

    const isSaved = savedJobs.has(job.id);
    const isApplied = appliedJobs.has(job.id);
    const saveLabel = isSaved ? "Saved" : "Save";
    const saveStateClass = isSaved ? "is-saved" : "";
    const savePressed = isSaved ? "true" : "false";
    const applyLabel = isApplied ? "Applied" : "Apply now";
    const applyStateClass = isApplied ? "is-applied" : "";
    const applyDisabled = isApplied ? "disabled" : "";

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
        <h3 class="job-title">${escapeHtml(job.title)}</h3>
        <span class="badge ${badgeClass}">${escapeHtml(job.seniority)}</span>
      </div>
      <p class="job-company">${escapeHtml(job.company)}</p>
      <div class="job-meta">${chips}</div>
      <div class="job-actions">
        <button type="button" class="apply-btn ${applyStateClass}" data-job-id="${job.id}" ${applyDisabled} aria-label="${isApplied ? "Already applied" : "Apply now"}">${applyLabel}</button>
        <button type="button" class="ghost-btn" data-job-id="${job.id}">Details</button>
      </div>
    `;

    jobsListElement.appendChild(jobCard);
  });
}

function updateResults() {
  if (jobsLoadFailed) {
    showJobsLoadError();
    return;
  }

  const total = filteredJobs.length;
  const visible = filteredJobs.slice(0, currentPage * PAGE_SIZE);

  renderJobs(visible);
  updateResultsCount(total, visible.length);
  updateSavedCount();
  updateAppliedCount();

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
  if (salaryFilter && salaryFilter.value !== "all") count += 1;

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

function readStoredSavedJobs() {
  try {
    const saved = JSON.parse(localStorage.getItem("savedJobs") || "[]");
    return Array.isArray(saved) ? saved.filter((id) => Number.isInteger(id)) : [];
  } catch (error) {
    console.warn("Could not parse saved jobs from localStorage.", error);
    return [];
  }
}

function updateAppliedCount() {
  if (!appliedCountElement) return;
  appliedCountElement.textContent = `Applied: ${appliedJobs.size}`;
}

function markJobApplied(id) {
  appliedJobs.add(id);
  localStorage.setItem("appliedJobs", JSON.stringify([...appliedJobs]));
  updateAppliedCount();
  updateAlertsBadge();
}

function readStoredAppliedJobs() {
  try {
    const applied = JSON.parse(localStorage.getItem("appliedJobs") || "[]");
    return Array.isArray(applied) ? applied.filter((id) => Number.isInteger(id)) : [];
  } catch (error) {
    console.warn("Could not parse applied jobs from localStorage.", error);
    return [];
  }
}

function updateApplyButtonState() {
  if (!confirmApplyBtn || modalJobId === null) return;
  const isApplied = appliedJobs.has(modalJobId);
  confirmApplyBtn.textContent = isApplied ? "Already applied" : "Confirm application";
  confirmApplyBtn.disabled = isApplied;
  confirmApplyBtn.classList.toggle("is-applied", isApplied);
}

function resetAllFilters() {
  searchInput.value = "";
  typeFilter.value = "all";
  seniorityFilter.value = "all";
  if (salaryFilter) salaryFilter.value = "all";
  sortBy.value = "newest";
  toggleClearSearch();
  if (filterDropdownConfigs.length) syncFilterDropdownLabels();
  applyFilters();
}

function renderSavedJobsList() {
  if (!savedJobsList) return;

  const ids = [...savedJobs];

  if (ids.length === 0) {
    savedJobsList.innerHTML =
      '<p class="saved-jobs-empty">No saved jobs yet. Save roles from the list with the Save button.</p>';
    return;
  }

  if (jobs.length === 0) {
    savedJobsList.innerHTML = '<p class="saved-jobs-empty">Loading jobs…</p>';
    return;
  }

  const rows = ids
    .map((id) => {
      const job = jobs.find((j) => j.id === id);
      if (!job) {
        return `
          <div class="saved-job-row saved-job-row--missing" data-job-id="${id}">
            <p class="saved-job-missing-text">This listing (ID ${id}) is no longer available.</p>
            <button type="button" class="ghost-btn saved-job-remove" data-job-id="${id}">Remove</button>
          </div>`;
      }
      const meta = [job.type, job.location].filter(Boolean).join(" • ");
      return `
        <article class="saved-job-row" data-job-id="${job.id}">
          <div class="saved-job-main">
            <h3 class="saved-job-title">${escapeHtml(job.title)}</h3>
            <p class="saved-job-company">${escapeHtml(job.company)}</p>
            <p class="saved-job-meta">${escapeHtml(meta)}</p>
          </div>
          <div class="saved-job-actions">
            <a href="job-details.html?id=${job.id}" class="ghost-btn">Details</a>
            <button type="button" class="apply-btn saved-job-apply" data-job-id="${job.id}">Apply</button>
            <button type="button" class="ghost-btn saved-job-remove" data-job-id="${job.id}">Remove</button>
          </div>
        </article>`;
    })
    .join("");

  savedJobsList.innerHTML = rows;
}

function renderAlertsList() {
  if (!alertsList) return;
  const ids = [...appliedJobs];

  if (ids.length === 0) {
    alertsList.innerHTML =
      '<p class="alerts-empty">No applications yet. Apply to a role to see it here.</p>';
    return;
  }

  if (jobs.length === 0) {
    alertsList.innerHTML = '<p class="alerts-empty">Loading jobs…</p>';
    return;
  }

  alertsList.innerHTML = ids
    .map((id) => {
      const job = jobs.find((j) => j.id === id);
      if (!job) {
        return `
          <div class="alert-row">
            <div class="alert-row-main">
              <p class="alert-row-title">Listing #${id}</p>
              <p class="alert-row-company">No longer available</p>
            </div>
          </div>`;
      }
      return `
        <article class="alert-row">
          <div class="alert-row-main">
            <h3 class="alert-row-title">${escapeHtml(job.title)}</h3>
            <p class="alert-row-company">${escapeHtml(job.company)}</p>
          </div>
          <a href="job-details.html?id=${job.id}" class="ghost-btn">Details</a>
        </article>`;
    })
    .join("");
}

function openSavedJobsModal() {
  if (!savedJobsModal) return;
  closeAlertsModal();
  closeSettingsModal();
  renderSavedJobsList();
  savedJobsModal.hidden = false;
  syncBodyScroll();
  if (closeSavedJobsModalBtn) closeSavedJobsModalBtn.focus();
}

function closeSavedJobsModal() {
  if (!savedJobsModal) return;
  savedJobsModal.hidden = true;
  syncBodyScroll();
}

function openAlertsModal() {
  if (!alertsModal) return;
  closeSavedJobsModal();
  closeSettingsModal();
  closeUserMenu();
  renderAlertsList();
  alertsModal.hidden = false;
  if (alertsBtn) alertsBtn.setAttribute("aria-expanded", "true");
  syncBodyScroll();
  if (closeAlertsModalBtn) closeAlertsModalBtn.focus();
}

function closeAlertsModal() {
  if (!alertsModal) return;
  alertsModal.hidden = true;
  if (alertsBtn) alertsBtn.setAttribute("aria-expanded", "false");
  syncBodyScroll();
}

function openSettingsModal() {
  if (!settingsModal) return;
  closeSavedJobsModal();
  closeAlertsModal();
  syncThemeButtons();
  settingsModal.hidden = false;
  syncBodyScroll();
  if (closeSettingsModalBtn) closeSettingsModalBtn.focus();
}

function closeSettingsModal() {
  if (!settingsModal) return;
  settingsModal.hidden = true;
  syncBodyScroll();
}

if (savedJobsList) {
  savedJobsList.addEventListener("click", (event) => {
    const applyBtn = event.target.closest(".saved-job-apply");
    if (applyBtn) {
      event.preventDefault();
      const id = Number(applyBtn.dataset.jobId);
      const job = jobs.find((j) => j.id === id);
      if (job) {
        closeSavedJobsModal();
        openJobModal(job);
      }
      return;
    }

    const removeBtn = event.target.closest(".saved-job-remove");
    if (removeBtn) {
      event.preventDefault();
      const id = Number(removeBtn.dataset.jobId);
      toggleSavedJob(id);
      updateSavedCount();
      renderSavedJobsList();
      updateResults();
      showToast("Removed from saved jobs");
    }
  });
}

if (savedJobsModal) {
  savedJobsModal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-saved-modal]")) closeSavedJobsModal();
  });
}

if (closeSavedJobsModalBtn) {
  closeSavedJobsModalBtn.addEventListener("click", closeSavedJobsModal);
}

if (alertsModal) {
  alertsModal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-alerts-modal]")) closeAlertsModal();
  });
}

if (closeAlertsModalBtn) {
  closeAlertsModalBtn.addEventListener("click", closeAlertsModal);
}

if (settingsModal) {
  settingsModal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-settings-modal]")) closeSettingsModal();
  });
}

if (closeSettingsModalBtn) {
  closeSettingsModalBtn.addEventListener("click", closeSettingsModal);
}

function openJobModal(job) {
  if (!jobModal || !jobModalTitle) return;

  modalJobId = job.id;
  jobModalTitle.textContent = job.title;
  if (jobModalCompany) jobModalCompany.textContent = job.company;
  if (jobModalMeta) {
    jobModalMeta.textContent = [job.type, job.location, job.seniority].filter(Boolean).join(" • ");
  }
  if (jobModalDescription) {
    jobModalDescription.textContent =
      job.description ||
      'No long description yet. Add a "description" field in data/jobs.json, or use the full details page.';
  }
  if (jobModalDetailsLink) {
    jobModalDetailsLink.href = `job-details.html?id=${job.id}`;
  }
  updateApplyButtonState();

  jobModal.hidden = false;
  syncBodyScroll();
  if (closeJobModalBtn) closeJobModalBtn.focus();
}

function closeJobModal() {
  if (!jobModal) return;
  jobModal.hidden = true;
  modalJobId = null;
  syncBodyScroll();
}

if (jobModal) {
  jobModal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-modal]")) closeJobModal();
  });
}

if (closeJobModalBtn) {
  closeJobModalBtn.addEventListener("click", closeJobModal);
}

if (confirmApplyBtn) {
  confirmApplyBtn.addEventListener("click", () => {
    if (modalJobId === null || appliedJobs.has(modalJobId)) return;
    markJobApplied(modalJobId);
    updateApplyButtonState();
    updateResults();
    showToast("Application recorded — good luck!");
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (closeAllFilterDropdownsIfOpen()) return;
  if (isUserMenuOpen()) {
    closeUserMenu();
    return;
  }
  if (settingsModal && !settingsModal.hidden) {
    closeSettingsModal();
    return;
  }
  if (alertsModal && !alertsModal.hidden) {
    closeAlertsModal();
    return;
  }
  if (savedJobsModal && !savedJobsModal.hidden) {
    closeSavedJobsModal();
    return;
  }
  if (jobModal && !jobModal.hidden) closeJobModal();
});

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  const isDark = localStorage.getItem("darkMode") === "true";
  setTheme(isDark);
  setViewMode(currentView);
  toggleClearSearch();
  updateSavedCount();
  updateAppliedCount();
  updateAlertsBadge();
  initFilterDropdowns();
  domReady = true;
  tryInitialRender();
});
