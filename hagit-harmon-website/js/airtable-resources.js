// Airtable Resources Integration
// API key is securely stored in Netlify environment variables

// Fetch resources from Airtable via Netlify Function
async function fetchAirtableResources() {
    try {
        const response = await fetch('/.netlify/functions/get-resources');

        if (!response.ok) {
            throw new Error(`Function error: ${response.status} ${response.statusText}`);
        }

        const resources = await response.json();
        return resources;
    } catch (error) {
        console.error('Error fetching resources:', error);
        return [];
    }
}

// Load resources for English page (resources.html)
async function loadResourcesEnglish() {
    const resources = await fetchAirtableResources();
    const container = document.getElementById('airtable-resources');

    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    if (resources.length === 0) {
        return;
    }

    // Render each resource
    resources.forEach(resource => {
        const resourceItem = document.createElement('div');
        resourceItem.className = 'resource-item';

        resourceItem.innerHTML = `
            <h3>${resource.en.title}</h3>
            <p>${resource.en.description}</p>
            <a href="${resource.link}" target="_blank" rel="noopener noreferrer">visit website →</a>
        `;

        container.appendChild(resourceItem);
    });
}

// Load resources for Hebrew page (resources-he.html)
async function loadResourcesHebrew() {
    const resources = await fetchAirtableResources();
    const container = document.getElementById('airtable-resources');

    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    if (resources.length === 0) {
        return;
    }

    // Render each resource
    resources.forEach(resource => {
        const resourceItem = document.createElement('div');
        resourceItem.className = 'resource-item';

        resourceItem.innerHTML = `
            <h3>${resource.he.title}</h3>
            <p>${resource.he.description}</p>
            <a href="${resource.link}" target="_blank" rel="noopener noreferrer">בקרו באתר ←</a>
        `;

        container.appendChild(resourceItem);
    });
}
