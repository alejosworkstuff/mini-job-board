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
const userMenuBtn = document.getElementById("userMenuBtn");
const userMenu = document.getElementById("userMenu");
const fakeHomeBtn = document.getElementById("fakeHomeBtn");
const fakeNotifBtn = document.getElementById("fakeNotifBtn");
const toast = document.getElementById("toast");
const viewGridBtn = document.getElementById("viewGridBtn");
const viewListBtn = document.getElementById("viewListBtn");
const savedCountElement = document.getElementById("savedCount");
const jobModal = document.getElementById("jobModal");
const jobModalTitle = document.getElementById("jobModalTitle");
const jobModalCompany = document.getElementById("jobModalCompany");
const jobModalMeta = document.getElementById("jobModalMeta");
const jobModalDescription = document.getElementById("jobModalDescription");
const jobModalDetailsLink = document.getElementById("jobModalDetailsLink");
const closeJobModalBtn = document.getElementById("closeJobModal");
const savedJobsModal = document.getElementById("savedJobsModal");
const savedJobsList = document.getElementById("savedJobsList");
const closeSavedJobsModalBtn = document.getElementById("closeSavedJobsModal");

// ===== DATA =====
let jobs = [];
let filteredJobs = [];
let currentPage = 1;
let currentView = localStorage.getItem("jobsViewMode") || "grid";
let savedJobs = new Set(readStoredSavedJobs());
const PAGE_SIZE = 6;

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
fetch("./data/jobs.json")
  .then((response) => response.json())
  .then((data) => {
    jobs = data;
    applyFilters();
    if (savedJobsModal && !savedJobsModal.hidden) {
      renderSavedJobsList();
    }
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

if (userMenuBtn && userMenu) {
  userMenuBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleUserMenu();
  });

  userMenu.querySelectorAll(".user-menu-item").forEach((item) => {
    item.addEventListener("click", () => {
      const action = item.dataset.action;
      if (action === "saved-jobs") {
        closeUserMenu();
        openSavedJobsModal();
        return;
      }
      const labels = {
        profile: "View Profile (demo)",
        settings: "Settings (demo)",
        signout: "Sign out (demo)"
      };
      showToast(labels[action] || "Done");
      closeUserMenu();
    });
  });
}

if (fakeHomeBtn) {
  fakeHomeBtn.addEventListener("click", () => {
    showToast("Home (demo)");
  });
}

if (fakeNotifBtn) {
  fakeNotifBtn.addEventListener("click", () => {
    showToast("Notifications (demo)");
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
        <button type="button" class="apply-btn" data-job-id="${job.id}">Apply now</button>
        <button type="button" class="ghost-btn" data-job-id="${job.id}">Details</button>
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
  if (filterDropdownConfigs.length) syncFilterDropdownLabels();
  applyFilters();
}

function slugify(value = "") {
  return value.toLowerCase().trim().replace(/\s+/g, "-");
}

function escapeHtml(text) {
  const s = String(text ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function openSavedJobsModal() {
  if (!savedJobsModal) return;
  renderSavedJobsList();
  savedJobsModal.hidden = false;
  document.body.style.overflow = "hidden";
  if (closeSavedJobsModalBtn) closeSavedJobsModalBtn.focus();
}

function closeSavedJobsModal() {
  if (!savedJobsModal) return;
  savedJobsModal.hidden = true;
  if (!jobModal || jobModal.hidden) {
    document.body.style.overflow = "";
  }
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

function openJobModal(job) {
  if (!jobModal || !jobModalTitle) return;

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

  jobModal.hidden = false;
  document.body.style.overflow = "hidden";
  if (closeJobModalBtn) closeJobModalBtn.focus();
}

function closeJobModal() {
  if (!jobModal) return;
  jobModal.hidden = true;
  if (!savedJobsModal || savedJobsModal.hidden) {
    document.body.style.overflow = "";
  }
}

if (jobModal) {
  jobModal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-modal]")) closeJobModal();
  });
}

if (closeJobModalBtn) {
  closeJobModalBtn.addEventListener("click", closeJobModal);
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (closeAllFilterDropdownsIfOpen()) return;
  if (isUserMenuOpen()) {
    closeUserMenu();
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
  document.body.classList.toggle("dark", isDark);
  if (darkModeBtn) {
    darkModeBtn.textContent = isDark ? "Light" : "Dark";
  }
  setViewMode(currentView);
  toggleClearSearch();
  updateSavedCount();
  initFilterDropdowns();
  syncFilterDropdownLabels();
});
