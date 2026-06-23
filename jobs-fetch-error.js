(function () {
  const banner = document.getElementById("jobs-fetch-error");
  const retryBtn = document.getElementById("jobs-fetch-retry");

  function showJobsFetchError() {
    if (!banner) return;
    banner.hidden = false;
  }

  function hideJobsFetchError() {
    if (!banner) return;
    banner.hidden = true;
  }

  if (retryBtn) {
    retryBtn.addEventListener("click", () => {
      window.location.reload();
    });
  }

  window.miniJobBoardJobsFetchError = { show: showJobsFetchError, hide: hideJobsFetchError };
})();
