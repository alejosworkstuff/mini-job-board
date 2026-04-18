const savedJobsListElement = document.getElementById("saved-jobs-list");
const savedEmptyElement = document.getElementById("saved-empty");

const jobModal = document.getElementById("jobModal");
const jobModalTitle = document.getElementById("jobModalTitle");
const jobModalCompany = document.getElementById("jobModalCompany");
const jobModalMeta = document.getElementById("jobModalMeta");
const jobModalDescription = document.getElementById("jobModalDescription");
const jobModalDetailsLink = document.getElementById("jobModalDetailsLink");
const closeJobModalBtn = document.getElementById("closeJobModal");

function getSavedJobsIds() {
  try {
    const saved = JSON.parse(localStorage.getItem("savedJobs") || "[]");
    return Array.isArray(saved) ? saved.filter((id) => Number.isInteger(id)) : [];
  } catch (error) {
    console.error("Could not read saved jobs:", error);
    return [];
  }
}

function showEmpty() {
  if (savedJobsListElement) savedJobsListElement.innerHTML = "";
  if (savedEmptyElement) savedEmptyElement.hidden = false;
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
      job.description || "Open the full details page for more information about this role.";
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
  const savedM = document.getElementById("savedJobsModal");
  if (!savedM || savedM.hidden) {
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

window.miniJobBoardOpenJobModal = function (job) {
  openJobModal(job);
};

window.miniJobBoardCloseJobModal = function () {
  closeJobModal();
};

let savedJobsPageJobs = [];

async function loadSavedJobs() {
  const saveIds = getSavedJobsIds();

  if (saveIds.length === 0) {
    showEmpty();
    return;
  }

  try {
    const response = await fetch("./data/jobs.json");
    if (!response.ok) throw new Error(String(response.status));
    const jobs = await response.json();

    const savedJobs = jobs.filter((job) => saveIds.includes(job.id));

    if (savedJobs.length === 0) {
      showEmpty();
      return;
    }

    savedJobsPageJobs = savedJobs;

    if (savedEmptyElement) savedEmptyElement.hidden = true;

    savedJobsListElement.innerHTML = savedJobs
      .map(
        (job) => `
    <article class="job saved-jobs-card">
      <div class="job-header">
        <h2 class="job-title">${escapeHtml(job.title)}</h2>
        <span class="badge ${slugify(job.seniority || "")}">${escapeHtml(job.seniority || "")}</span>
      </div>
      <p class="job-company">${escapeHtml(job.company)}</p>
      <div class="job-meta">
        ${job.type ? `<span class="chip">${escapeHtml(job.type)}</span>` : ""}
        ${job.location ? `<span class="chip">${escapeHtml(job.location)}</span>` : ""}
      </div>
      <div class="job-actions">
        <a href="job-details.html?id=${job.id}" class="ghost-btn">Details</a>
        <button type="button" class="apply-btn saved-page-apply" data-job-id="${job.id}">Apply</button>
      </div>
    </article>
    `
      )
      .join("");
  } catch (error) {
    console.error("Could not load saved jobs:", error);
    showEmpty();
  }
}

if (savedJobsListElement) {
  savedJobsListElement.addEventListener("click", (event) => {
    const btn = event.target.closest(".saved-page-apply");
    if (!btn) return;
    event.preventDefault();
    const id = Number(btn.dataset.jobId);
    const job = savedJobsPageJobs.find((j) => j.id === id);
    if (job) openJobModal(job);
  });
}

function escapeHtml(text) {
  const s = String(text ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugify(value = "") {
  return value.toLowerCase().trim().replace(/\s+/g, "-");
}

document.addEventListener("DOMContentLoaded", loadSavedJobs);
