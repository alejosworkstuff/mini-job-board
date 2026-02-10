// ===== DOM =====
const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const seniorityFilter = document.getElementById("seniorityFilter");
const clearFiltersBtn = document.getElementById("clearFilters");
const jobsListElement = document.getElementById("jobs-list");
const emptyState = document.getElementById("empty-state");

// ===== DATA =====
let jobs = [];

// ===== FETCH =====
fetch("./data/jobs.json")
  .then(response => response.json())
  .then(data => {
    jobs = data;
    applyFilters(); // initial render
  })
  .catch(err => console.error("Error loading jobs:", err));

// ===== EVENTS =====
searchInput.addEventListener("input", applyFilters);
typeFilter.addEventListener("change", applyFilters);
seniorityFilter.addEventListener("change", applyFilters);

if (clearFiltersBtn) {
  clearFiltersBtn.addEventListener("click", () => {
    searchInput.value = "";
    typeFilter.value = "all";
    seniorityFilter.value = "all";
    applyFilters();
  });
}

// ===== FILTER LOGIC =====
function applyFilters() {
  const searchText = searchInput.value.toLowerCase().trim();
  const selectedType = typeFilter.value.toLowerCase();
  const selectedSeniority = seniorityFilter.value.toLowerCase();

  let filteredJobs = [...jobs];

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

  renderJobs(filteredJobs);
}

// ===== RENDER =====
function renderJobs(list) {
  jobsListElement.innerHTML = "";

  if (list.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  list.forEach(job => {
    const jobDiv = document.createElement("div");
    jobDiv.className = "job";

    const badgeClass = job.seniority
      .toLowerCase()
      .replace(" ", "-");

    jobDiv.innerHTML = `
      <div class="job-header">
        <h3 class="job-title">${job.title}</h3>
        <span class="badge ${badgeClass}">
          ${job.seniority}
        </span>
      </div>
      <p class="job-company">${job.company}</p>
      <p class="job-meta">${job.type} · ${job.location}</p>
    `;

    jobsListElement.appendChild(jobDiv);
  });
}

// ===== DARK MODE =====

// Apply saved mode on load
document.addEventListener("DOMContentLoaded", () => {
  const isDark = localStorage.getItem("darkMode") === "true";
  document.body.classList.toggle("dark", isDark);
});

// Event delegation (survives re-renders)
document.addEventListener("click", (e) => {
  const darkModeBtn = e.target.closest("#darkModeBtn");
  if (!darkModeBtn) return;

  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", isDark);
});
