(function () {
  const darkModeBtn = document.getElementById("darkModeBtn");
  const userMenuBtn = document.getElementById("userMenuBtn");
  const userMenu = document.getElementById("userMenu");
  const homeNavBtn = document.getElementById("homeNavBtn");
  const alertsBtn = document.getElementById("alertsBtn");
  const alertsBadge = document.getElementById("alertsBadge");
  const toast = document.getElementById("toast");
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

  if (!userMenuBtn) return;

  let headerJobs = [];
  let savedJobsSet = new Set(readStoredSavedJobs());

  function readStoredSavedJobs() {
    try {
      const saved = JSON.parse(localStorage.getItem("savedJobs") || "[]");
      return Array.isArray(saved) ? saved.filter((id) => Number.isInteger(id)) : [];
    } catch {
      return [];
    }
  }

  function readStoredAppliedJobs() {
    try {
      const applied = JSON.parse(localStorage.getItem("appliedJobs") || "[]");
      return Array.isArray(applied) ? applied.filter((id) => Number.isInteger(id)) : [];
    } catch {
      return [];
    }
  }

  function escapeHtml(text) {
    const s = String(text ?? "");
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
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

  function isHomePage() {
    const path = window.location.pathname.replace(/\\/g, "/");
    return (
      path.endsWith("/") ||
      path.endsWith("/index.html") ||
      /\/mini-job-board\/?$/.test(path)
    );
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

  function updateSavedCountShell() {
    const el = document.getElementById("savedCount");
    if (!el) return;
    savedJobsSet = new Set(readStoredSavedJobs());
    el.textContent = `Saved: ${savedJobsSet.size}`;
  }

  function updateAlertsBadge() {
    if (!alertsBadge) return;
    const count = readStoredAppliedJobs().length;
    alertsBadge.textContent = String(count);
    alertsBadge.hidden = count === 0;
    if (alertsBtn) {
      alertsBtn.setAttribute(
        "aria-label",
        count === 0 ? "Application alerts" : `Application alerts (${count})`
      );
    }
  }

  function toggleSavedJobShell(id) {
    savedJobsSet = new Set(readStoredSavedJobs());
    if (savedJobsSet.has(id)) savedJobsSet.delete(id);
    else savedJobsSet.add(id);
    localStorage.setItem("savedJobs", JSON.stringify([...savedJobsSet]));
    updateSavedCountShell();
    if (typeof window.miniJobBoardOnSavedChanged === "function") {
      window.miniJobBoardOnSavedChanged();
    }
  }

  function anyOverlayOpen() {
    return (
      (savedJobsModal && !savedJobsModal.hidden) ||
      (alertsModal && !alertsModal.hidden) ||
      (settingsModal && !settingsModal.hidden) ||
      (document.getElementById("jobModal") && !document.getElementById("jobModal").hidden)
    );
  }

  function syncBodyScroll() {
    document.body.style.overflow = anyOverlayOpen() ? "hidden" : "";
  }

  function renderSavedJobsList() {
    if (!savedJobsList) return;

    savedJobsSet = new Set(readStoredSavedJobs());
    const ids = [...savedJobsSet];

    if (ids.length === 0) {
      savedJobsList.innerHTML =
        '<p class="saved-jobs-empty">No saved jobs yet. Save roles from the list with the Save button.</p>';
      return;
    }

    if (headerJobs.length === 0) {
      savedJobsList.innerHTML = '<p class="saved-jobs-empty">Loading jobs…</p>';
      return;
    }

    const rows = ids
      .map((id) => {
        const job = headerJobs.find((j) => j.id === id);
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
    const ids = readStoredAppliedJobs();

    if (ids.length === 0) {
      alertsList.innerHTML =
        '<p class="alerts-empty">No applications yet. Apply to a role to see it here.</p>';
      return;
    }

    if (headerJobs.length === 0) {
      alertsList.innerHTML = '<p class="alerts-empty">Loading jobs…</p>';
      return;
    }

    alertsList.innerHTML = ids
      .map((id) => {
        const job = headerJobs.find((j) => j.id === id);
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

  if (clearSavedBtn) {
    clearSavedBtn.addEventListener("click", () => {
      localStorage.setItem("savedJobs", "[]");
      savedJobsSet = new Set();
      updateSavedCountShell();
      if (typeof window.miniJobBoardOnSavedCleared === "function") {
        window.miniJobBoardOnSavedCleared();
      }
      if (savedJobsModal && !savedJobsModal.hidden) renderSavedJobsList();
      showToast("Saved jobs cleared");
    });
  }

  if (clearAppliedBtn) {
    clearAppliedBtn.addEventListener("click", () => {
      localStorage.setItem("appliedJobs", "[]");
      updateAlertsBadge();
      if (typeof window.miniJobBoardOnAppliedCleared === "function") {
        window.miniJobBoardOnAppliedCleared();
      }
      if (alertsModal && !alertsModal.hidden) renderAlertsList();
      showToast("Applications cleared");
    });
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
      if (!isHomePage()) return;
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

  document.addEventListener("click", (event) => {
    if (!isUserMenuOpen()) return;
    const account = event.target.closest(".header-account");
    if (account) return;
    closeUserMenu();
  });

  if (savedJobsList) {
    savedJobsList.addEventListener("click", (event) => {
      const applyBtn = event.target.closest(".saved-job-apply");
      if (applyBtn) {
        event.preventDefault();
        const id = Number(applyBtn.dataset.jobId);
        const job = headerJobs.find((j) => j.id === id);
        if (job) {
          closeSavedJobsModal();
          if (typeof window.miniJobBoardOpenJobModal === "function") {
            window.miniJobBoardOpenJobModal(job);
          }
        }
        return;
      }

      const removeBtn = event.target.closest(".saved-job-remove");
      if (removeBtn) {
        event.preventDefault();
        const id = Number(removeBtn.dataset.jobId);
        toggleSavedJobShell(id);
        renderSavedJobsList();
        showToast("Removed from saved jobs");
        if (typeof window.miniJobBoardAfterRemoveSaved === "function") {
          window.miniJobBoardAfterRemoveSaved(id);
        }
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

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
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
    const jobModal = document.getElementById("jobModal");
    if (jobModal && !jobModal.hidden && typeof window.miniJobBoardCloseJobModal === "function") {
      window.miniJobBoardCloseJobModal();
    }
  });

  window.miniJobBoardRefreshAlertsBadge = updateAlertsBadge;

  fetch("./data/jobs.json")
    .then((response) => response.json())
    .then((data) => {
      headerJobs = data;
      if (savedJobsModal && !savedJobsModal.hidden) {
        renderSavedJobsList();
      }
      if (alertsModal && !alertsModal.hidden) {
        renderAlertsList();
      }
    })
    .catch((err) => console.error("Error loading jobs for header:", err));

  const isDarkInit = localStorage.getItem("darkMode") === "true";
  setTheme(isDarkInit);
  savedJobsSet = new Set(readStoredSavedJobs());
  updateSavedCountShell();
  updateAlertsBadge();
})();
