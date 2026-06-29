import { escapeHtml, slugify } from "./scripts/utils.mjs";

const APPLIED_STORAGE_KEY = "appliedJobs";

const savedJobsListElement = document.getElementById("saved-jobs-list");
const savedEmptyElement = document.getElementById("saved-empty");
const toast = document.getElementById("toast");

const jobModal = document.getElementById("jobModal");
const jobModalTitle = document.getElementById("jobModalTitle");
const jobModalCompany = document.getElementById("jobModalCompany");
const jobModalMeta = document.getElementById("jobModalMeta");
const jobModalDescription = document.getElementById("jobModalDescription");
const jobModalDetailsLink = document.getElementById("jobModalDetailsLink");
const closeJobModalBtn = document.getElementById("closeJobModal");
const confirmApplyBtn = document.getElementById("confirmApplyBtn");

let savedJobsPageJobs = [];
let modalJobId = null;

function getSavedJobsIds() {
  try {
    const saved = JSON.parse(localStorage.getItem("savedJobs") || "[]");
    return Array.isArray(saved) ? saved.filter((id) => Number.isInteger(id)) : [];
  } catch (error) {
    console.error("Could not read saved jobs:", error);
    return [];
  }
}

function readAppliedIds() {
  try {
    const applied = JSON.parse(localStorage.getItem(APPLIED_STORAGE_KEY) || "[]");
    return Array.isArray(applied) ? applied.filter((id) => Number.isInteger(id)) : [];
  } catch {
    return [];
  }
}

function isApplied(id) {
  return readAppliedIds().includes(id);
}

function setApplied(id, applied) {
  const ids = new Set(readAppliedIds());
  if (applied) ids.add(id);
  else ids.delete(id);
  localStorage.setItem(APPLIED_STORAGE_KEY, JSON.stringify([...ids]));
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

function showEmpty() {
  if (savedJobsListElement) savedJobsListElement.innerHTML = "";
  if (savedEmptyElement) savedEmptyElement.hidden = false;
}

function updateModalApplyButton() {
  if (!confirmApplyBtn || modalJobId === null) return;
  const applied = isApplied(modalJobId);
  confirmApplyBtn.textContent = applied ? "Already applied" : "Confirm application";
  confirmApplyBtn.disabled = applied;
  confirmApplyBtn.classList.toggle("is-applied", applied);
}

function renderSavedJobsCards(jobs) {
  if (!savedJobsListElement) return;

  savedJobsListElement.innerHTML = jobs
    .map((job) => {
      const applied = isApplied(job.id);
      const applyLabel = applied ? "Applied" : "Apply now";
      const applyStateClass = applied ? "is-applied" : "";
      const applyDisabled = applied ? "disabled" : "";
      const applyAria = applied ? "Already applied" : "Apply now";

      return `
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
        <button type="button" class="apply-btn saved-page-apply ${applyStateClass}" data-job-id="${job.id}" ${applyDisabled} aria-label="${applyAria}">${applyLabel}</button>
      </div>
    </article>
    `;
    })
    .join("");
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
      job.description || "Open the full details page for more information about this role.";
  }
  if (jobModalDetailsLink) {
    jobModalDetailsLink.href = `job-details.html?id=${job.id}`;
  }
  updateModalApplyButton();

  jobModal.hidden = false;
  document.body.style.overflow = "hidden";
  if (closeJobModalBtn) closeJobModalBtn.focus();
}

function closeJobModal() {
  if (!jobModal) return;
  jobModal.hidden = true;
  modalJobId = null;
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

if (confirmApplyBtn) {
  confirmApplyBtn.addEventListener("click", () => {
    if (modalJobId === null || isApplied(modalJobId)) return;
    setApplied(modalJobId, true);
    updateModalApplyButton();
    renderSavedJobsCards(savedJobsPageJobs);
    showToast("Application recorded — good luck!");
  });
}

window.miniJobBoardOpenJobModal = function (job) {
  openJobModal(job);
};

window.miniJobBoardCloseJobModal = function () {
  closeJobModal();
};

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

    window.miniJobBoardJobsFetchError?.hide();

    const savedJobs = jobs.filter((job) => saveIds.includes(job.id));

    if (savedJobs.length === 0) {
      showEmpty();
      return;
    }

    savedJobsPageJobs = savedJobs;

    if (savedEmptyElement) savedEmptyElement.hidden = true;
    renderSavedJobsCards(savedJobs);
  } catch (error) {
    console.error("Could not load saved jobs:", error);
    if (savedJobsListElement) savedJobsListElement.innerHTML = "";
    if (savedEmptyElement) savedEmptyElement.hidden = true;
    window.miniJobBoardJobsFetchError?.show();
  }
}

if (savedJobsListElement) {
  savedJobsListElement.addEventListener("click", (event) => {
    const btn = event.target.closest(".saved-page-apply");
    if (!btn || btn.disabled) return;
    event.preventDefault();
    const id = Number(btn.dataset.jobId);
    if (isApplied(id)) return;
    const job = savedJobsPageJobs.find((j) => j.id === id);
    if (job) openJobModal(job);
  });
}

document.addEventListener("DOMContentLoaded", loadSavedJobs);
