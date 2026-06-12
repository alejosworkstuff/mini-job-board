const STORAGE_KEY = "savedJobs";
const APPLIED_STORAGE_KEY = "appliedJobs";

const detailLoading = document.getElementById("detailLoading");
const detailNotFound = document.getElementById("detailNotFound");
const detailArticle = document.getElementById("detailArticle");
const detailHero = document.getElementById("detailHero");
const detailTitle = document.getElementById("detailTitle");
const detailCompany = document.getElementById("detailCompany");
const detailChips = document.getElementById("detailChips");
const detailAboutInner = document.getElementById("detailAboutInner");
const detailApplyBtn = document.getElementById("detailApplyBtn");
const detailSaveBtn = document.getElementById("detailSaveBtn");
const shareJobBtn = document.getElementById("shareJobBtn");
const toast = document.getElementById("toast");
const relatedSection = document.getElementById("relatedSection");
const relatedList = document.getElementById("relatedList");

const jobModal = document.getElementById("jobModal");
const jobModalTitle = document.getElementById("jobModalTitle");
const jobModalCompany = document.getElementById("jobModalCompany");
const jobModalMeta = document.getElementById("jobModalMeta");
const jobModalDescription = document.getElementById("jobModalDescription");
const closeJobModalBtn = document.getElementById("closeJobModal");
const confirmApplyBtn = document.getElementById("confirmApplyBtn");

let currentJob = null;

function escapeHtml(text) {
  const s = String(text ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readSavedIds() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((id) => Number.isInteger(id)) : [];
  } catch {
    return [];
  }
}

function isSaved(id) {
  return readSavedIds().includes(id);
}

function setSaved(id, saved) {
  const ids = new Set(readSavedIds());
  if (saved) ids.add(id);
  else ids.delete(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
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

function updateApplyButton() {
  if (!detailApplyBtn || !currentJob) return;
  const applied = isApplied(currentJob.id);
  detailApplyBtn.textContent = applied ? "Applied" : "Apply now";
  detailApplyBtn.disabled = applied;
  detailApplyBtn.classList.toggle("is-applied", applied);
  detailApplyBtn.setAttribute("aria-label", applied ? "Already applied" : "Apply now");
}

function updateModalApplyButton() {
  if (!confirmApplyBtn || !currentJob) return;
  const applied = isApplied(currentJob.id);
  confirmApplyBtn.textContent = applied ? "Already applied" : "Confirm application";
  confirmApplyBtn.disabled = applied;
  confirmApplyBtn.classList.toggle("is-applied", applied);
}

function updateSaveButton() {
  if (!detailSaveBtn || !currentJob) return;
  const saved = isSaved(currentJob.id);
  detailSaveBtn.classList.toggle("is-saved", saved);
  detailSaveBtn.setAttribute("aria-pressed", String(saved));
  detailSaveBtn.setAttribute("aria-label", saved ? "Unsave job" : "Save job");
  detailSaveBtn.textContent = saved ? "Saved" : "Save";
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

function slugify(value = "") {
  return value.toLowerCase().trim().replace(/\s+/g, "-");
}

function setMetaAndTitle(job) {
  document.title = `${job.title} · ${job.company} · Mini Job Board`;
  const summary =
    job.description && job.description.length > 160
      ? `${job.description.slice(0, 157)}…`
      : job.description || `${job.title} at ${job.company} — ${job.type}, ${job.location}.`;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", summary);
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute("content", `${job.title} · ${job.company}`);
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute("content", summary.slice(0, 200));
}

function getRelated(job, allJobs) {
  const typeNorm = job.type ? job.type.toLowerCase() : "";
  const related = allJobs.filter((j) => {
    if (j.id === job.id) return false;
    if (j.company === job.company) return true;
    if (typeNorm && j.type && j.type.toLowerCase() === typeNorm) return true;
    return false;
  });
  return related.slice(0, 3);
}

function renderRelated(job, related) {
  if (!relatedList || !relatedSection) return;
  if (!related.length) {
    relatedSection.hidden = true;
    relatedList.innerHTML = "";
    return;
  }
  relatedSection.hidden = false;
  relatedList.innerHTML = related
    .map(
      (j) => `
    <li>
      <a class="job-details-related-card" href="job-details.html?id=${j.id}">
        <span class="job-details-related-title">${escapeHtml(j.title)}</span>
        <span class="job-details-related-co">${escapeHtml(j.company)}</span>
        <span class="job-details-related-meta">${escapeHtml([j.type, j.location].filter(Boolean).join(" • "))}</span>
      </a>
    </li>`
    )
    .join("");
}

function formatLedeHtml(text) {
  const raw = String(text || "").trim();
  if (!raw) {
    return "<p>No extended description yet. Ask the hiring team for a full brief.</p>";
  }
  const parts = raw.split(/\n\n+/).filter((s) => s.trim());
  if (!parts.length) return "<p></p>";
  return parts
    .map((p) => `<p class="job-details-lede-p">${escapeHtml(p.trim()).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function bulletSection(headingId, heading, items) {
  if (!Array.isArray(items) || !items.length) return "";
  const list = items.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
  return `
    <section class="job-details-subsection" aria-labelledby="${headingId}">
      <h3 class="job-details-subheading" id="${headingId}">${escapeHtml(heading)}</h3>
      <ul class="job-details-bullets">${list}</ul>
    </section>`;
}

function renderAboutRole(job) {
  if (!detailAboutInner) return;

  const employment = job.employment || "Full-time";
  const workplace = job.type || "—";
  const location = job.location || "—";
  const seniority = job.seniority || "—";

  const salaryBlock = job.salary
    ? `<div class="job-details-compensation">
        <div class="job-details-compensation-card">
          <span class="job-details-comp-label">Salary range</span>
          <span class="job-details-comp-amount">${escapeHtml(job.salary)}</span>
        </div>
      </div>`
    : "";

  const glance = `
    <dl class="job-details-glance">
      <div class="job-details-glance-row"><dt>Employment type</dt><dd>${escapeHtml(employment)}</dd></div>
      <div class="job-details-glance-row"><dt>Workplace</dt><dd>${escapeHtml(workplace)}</dd></div>
      <div class="job-details-glance-row"><dt>Location</dt><dd>${escapeHtml(location)}</dd></div>
      <div class="job-details-glance-row"><dt>Seniority</dt><dd>${escapeHtml(seniority)}</dd></div>
    </dl>`;

  let html = salaryBlock + glance;
  html += `<div class="job-details-lede">${formatLedeHtml(job.description)}</div>`;
  html += bulletSection("job-heading-do", "What you'll do", job.responsibilities);
  html += bulletSection("job-heading-req", "Requirements", job.requirements);
  html += bulletSection("job-heading-benefits", "Benefits", job.benefits);

  detailAboutInner.innerHTML = html;
}

function showState(state) {
  if (detailLoading) detailLoading.hidden = state !== "loading";
  if (detailNotFound) detailNotFound.hidden = state !== "notfound";
  if (detailArticle) detailArticle.hidden = state !== "content";
  if (detailHero) detailHero.hidden = state !== "content";
}

function renderJob(job, allJobs) {
  currentJob = job;
  setMetaAndTitle(job);

  if (detailTitle) detailTitle.textContent = job.title;
  if (detailCompany) detailCompany.textContent = job.company;

  if (detailChips) {
    const seniorClass = slugify(job.seniority || "");
    detailChips.innerHTML = [
      job.type ? `<span class="chip">${escapeHtml(job.type)}</span>` : "",
      job.location ? `<span class="chip">${escapeHtml(job.location)}</span>` : "",
      job.seniority ? `<span class="badge ${seniorClass}">${escapeHtml(job.seniority)}</span>` : ""
    ].join("");
  }

  renderAboutRole(job);

  updateSaveButton();
  updateApplyButton();
  renderRelated(job, getRelated(job, allJobs));
  showState("content");
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
      'No long description yet. Add a "description" field in data/jobs.json.';
  }
  updateModalApplyButton();
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

async function init() {
  const params = new URLSearchParams(window.location.search);
  const rawId = params.get("id");
  const jobId = rawId !== null ? Number.parseInt(rawId, 10) : NaN;

  if (!Number.isInteger(jobId) || jobId < 0) {
    showState("notfound");
    document.title = "Job not found · Mini Job Board";
    return;
  }

  showState("loading");

  let allJobs = [];
  try {
    const res = await fetch("./data/jobs.json");
    if (!res.ok) throw new Error(String(res.status));
    allJobs = await res.json();
  } catch (e) {
    console.error(e);
    showState("notfound");
    document.title = "Job not found · Mini Job Board";
    return;
  }

  const job = allJobs.find((j) => j.id === jobId);
  if (!job) {
    showState("notfound");
    document.title = "Job not found · Mini Job Board";
    return;
  }

  renderJob(job, allJobs);
}

if (shareJobBtn) {
  shareJobBtn.addEventListener("click", async () => {
    const url = window.location.href;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        showToast("Link copied to clipboard");
      } else {
        showToast(url);
      }
    } catch {
      showToast("Could not copy link");
    }
  });
}

if (detailApplyBtn) {
  detailApplyBtn.addEventListener("click", () => {
    if (currentJob && !isApplied(currentJob.id)) openJobModal(currentJob);
  });
}

if (confirmApplyBtn) {
  confirmApplyBtn.addEventListener("click", () => {
    if (!currentJob || isApplied(currentJob.id)) return;
    setApplied(currentJob.id, true);
    updateApplyButton();
    updateModalApplyButton();
    showToast("Application recorded — good luck!");
  });
}

if (detailSaveBtn) {
  detailSaveBtn.addEventListener("click", () => {
    if (!currentJob) return;
    const next = !isSaved(currentJob.id);
    setSaved(currentJob.id, next);
    updateSaveButton();
    showToast(next ? "Saved job to your list" : "Removed from saved jobs");
  });
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

window.miniJobBoardOnSavedChanged = function () {
  updateSaveButton();
};

window.miniJobBoardAfterRemoveSaved = function () {
  updateSaveButton();
};

document.addEventListener("DOMContentLoaded", init);
