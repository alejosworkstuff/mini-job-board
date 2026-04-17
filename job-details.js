const jobDetailsElement = document.getElementById("job-details");
const jobNotFoundElement = document.getElementById("job-not-found");

async function loadJobDetails() {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("id");

    if (!Number.isInteger(Number(jobId))) {
        showNotFound(); 
        return;
    }


    try {
        const response = await fetch(`../data/jobs.json`);
        const jobs = await response.json();

        const job = jobs.find((item) => item.id === jobId);

        if (!job) {
            showNotFound();
            return;
        }

jobDetailsElement.innerHTML = `
<h1>${job.title}</h1>
<p><strong>Company:</strong> ${job.company}</p>
<p><strong>Type:</strong> ${job.type}</p>
<p><strong>Location:</strong> ${job.location}</p>
<p><strong>Seniority:</strong> ${job.seniority}</p>
`;
    } catch (error) {
        console.error("Error loading job details:", error);
        showNotFound();
}
    }

    function showNotFound() {
        if (jobDetailsElement) jobDetailsElement.innerHTML = "";
        if (jobNotFoundElement) jobNotFoundElement.hidden = false;
    }


    loadJobDetails();
