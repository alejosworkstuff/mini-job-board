/**
 * Shared shell: main top bar, account menu, Saved jobs modal, theme toggle.
 * Loaded after DOM; works on any page that includes the matching markup and ./data/jobs.json.
 */
(function () {
  const darkModeBtn = document.getElementById("darkModeBtn");
  const userMenuBtn = document.getElementById("userMenuBtn");
  const userMenu = document.getElementById("userMenu");
  const fakeHomeBtn = document.getElementById("fakeHomeBtn");
  const fakeNotifBtn = document.getElementById("fakeNotifBtn");
  const toast = document.getElementById("toast");
  const savedJobsModal = document.getElementById("savedJobsModal");
  const savedJobsList = document.getElementById("savedJobsList");
  const closeSavedJobsModalBtn = document.getElementById("closeSavedJobsModal");

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

  function updateSavedCountShell() {
    const el = document.getElementById("savedCount");
    if (!el) return;
    savedJobsSet = new Set(readStoredSavedJobs());
    el.textContent = `Saved: ${savedJobsSet.size}`;
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
    const jobModal = document.getElementById("jobModal");
    if (!jobModal || jobModal.hidden) {
      document.body.style.overflow = "";
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

  if (darkModeBtn) {
    darkModeBtn.addEventListener("click", () => {
      const isDark = document.body.classList.toggle("dark");
      localStorage.setItem("darkMode", String(isDark));
      darkModeBtn.textContent = isDark ? "Light" : "Dark";
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

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (isUserMenuOpen()) {
      closeUserMenu();
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

  fetch("./data/jobs.json")
    .then((response) => response.json())
    .then((data) => {
      headerJobs = data;
      if (savedJobsModal && !savedJobsModal.hidden) {
        renderSavedJobsList();
      }
    })
    .catch((err) => console.error("Error loading jobs for header:", err));

  const isDarkInit = localStorage.getItem("darkMode") === "true";
  document.body.classList.toggle("dark", isDarkInit);
  if (darkModeBtn) {
    darkModeBtn.textContent = isDarkInit ? "Light" : "Dark";
  }
  savedJobsSet = new Set(readStoredSavedJobs());
  updateSavedCountShell();
})();
