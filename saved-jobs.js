const savedJobsListElement = document.getElementById("saved-jobs-list");
const savedEmptyElement = document.getElementById("saved-empty");


function getSavedJobsIds() {
    try {
        const saved = JSON.parse(localStorage.getItem("savedJobs") || "[]");
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
console.error("Could not read saved jobs:", error);
return [];
    }
}


async function loadSavedJobs () {
    const saveIds = getSavedJobsIds();

    if(getSavedJobsIds.length === 0) {
    showEmpty();
    return[];
    }

    try {
        const response = await fetch ("../data/jobs.json");
        const jobs = await response.json();

        const savedJobs = jobs.filter((job) => saveIds.includes(job.id));

        if(savedJobs.length === 0) {
            showEmpty();
            return[];
    }

savedJobsListElement.innerHTML = savedJobs
.map(
    (job) => `
    <article class="job">
    <h2><${job.title}/h2>
    <p>${job.company}</p>
    <p>${job.location}</p>
    <p>${job.seniority}</p>
    <a href="job-details.html?id=${job.id}" class="ghost-btn">Details</a>
    </article>
    `
).join("");
   } catch (error) {
    console.error("Could not load saved jobs:", error);
    showEmpty();
   }
}

function showEmpty() {
    if (savedJobsListElement) savedJobsListElement.innerHTML = "";
    if (savedEmptyElement) savedEmptyElement.hidden = false;
}

loadSavedJobs();
