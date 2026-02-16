// Airtable Events Integration
// Replace these with your actual Airtable credentials
const AIRTABLE_CONFIG = {
    baseId: 'apptjSc9CHXlZKntH',
    tableName: 'Events',
    apiKey: 'patgMZR8hTr6EoOr0.5c90d477c43327c823764db5926b2dfa15ba66d3ffaa803b120c3e0c5f5c63d0',
    view: ''               // Empty = use default view (all records)
};

// Fetch events from Airtable
async function fetchAirtableEvents() {
    try {
        console.log('📅 Fetching events from Airtable...');

        // Build the API URL
        const url = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${encodeURIComponent(AIRTABLE_CONFIG.tableName)}`;

        const params = new URLSearchParams();
        if (AIRTABLE_CONFIG.view) {
            params.append('view', AIRTABLE_CONFIG.view);
        }

        // Fetch from Airtable API
        const response = await fetch(`${url}?${params}`, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Fetched ${data.records.length} records from Airtable`);

        // Transform Airtable records to our format
        const events = data.records
            .filter(record => record.fields.Published) // Only published events
            .map(record => ({
                id: record.id,
                isRecurring: record.fields['Is Recurring'] || false,
                eventDate: record.fields['date'] || null,
                en: {
                    title: record.fields['Title (eng)'] || '',
                    date: record.fields['Date display (eng)'] || '',
                    location: record.fields['Location (eng)'] || '',
                    language: record.fields['Language (eng)'] || '',
                    description: record.fields[' Description (eng)'] || ''
                },
                he: {
                    title: record.fields['Title (heb)'] || '',
                    date: record.fields['Date display (heb)'] || '',
                    location: record.fields['Location (heb)'] || '',
                    language: record.fields['Language (heb)'] || '',
                    description: record.fields[' Description (heb)'] || ''
                },
                registerLink: record.fields['Registration Link'] || '',
                image: record.fields.Image && record.fields.Image.length > 0
                    ? record.fields.Image[0].url
                    : '/images/event.png' // fallback image
            }));

        console.log('📋 Events before sorting:', events.map(e => `${e.en.title}: ${e.eventDate}`));

        const sortedEvents = events.sort((a, b) => {
                // Events without dates go last
                if (!a.eventDate && !b.eventDate) return 0;
                if (!a.eventDate) return 1;
                if (!b.eventDate) return -1;

                // Sort by date ascending (soonest first = earliest date first)
                const dateA = new Date(a.eventDate);
                const dateB = new Date(b.eventDate);

                // Debug logging
                console.log(`Comparing: ${a.en.title} (${a.eventDate} = ${dateA.getTime()}) vs ${b.en.title} (${b.eventDate} = ${dateB.getTime()})`);
                console.log(`Result: ${dateA - dateB}`);

                return dateA - dateB;
            });

        console.log('✅ Events after sorting:', sortedEvents.map(e => `${e.en.title}: ${e.eventDate}`));

        return sortedEvents;
    } catch (error) {
        console.error('Error fetching events from Airtable:', error);
        return [];
    }
}

// Load events for English events page (events.html)
async function loadEventsEnglish() {
    const events = await fetchAirtableEvents();
    const upcomingGrid = document.getElementById('upcoming-events');

    if (!upcomingGrid) return;

    // Clear existing content
    upcomingGrid.innerHTML = '';

    if (events.length === 0) {
        upcomingGrid.innerHTML = '<p class="body-text" style="text-align: left; color: #380001; line-height: 1.6;">There are no upcoming events right now. Scroll down to stay in touch through email or whatsapp.</p>';
        return;
    }

    // Render each event
    events.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';

        eventCard.innerHTML = `
            <h2 class="event-title">${event.en.title}</h2>
            <div class="event-image">
                <img src="${event.image}" alt="${event.en.title}">
            </div>
            <div class="event-content">
                <div class="event-meta">
                    <span>Date: ${event.en.date}</span>
                    <span>Location: ${event.en.location}</span>
                    ${event.en.language ? `<span>Language: ${event.en.language}</span>` : ''}
                </div>
                <p class="event-description">${event.en.description}</p>
                ${event.registerLink ? `<a href="${event.registerLink}" target="_blank" rel="noopener noreferrer" class="event-link">Register</a>` : ''}
            </div>
        `;

        upcomingGrid.appendChild(eventCard);
    });

    // Re-initialize read more functionality if it exists
    if (typeof initReadMore === 'function') {
        initReadMore();
    }
}

// Load events for Hebrew events page (events-he.html)
async function loadEventsHebrew() {
    const events = await fetchAirtableEvents();
    const upcomingGrid = document.getElementById('upcoming-events');

    if (!upcomingGrid) return;

    // Clear existing content
    upcomingGrid.innerHTML = '';

    if (events.length === 0) {
        upcomingGrid.innerHTML = '<p class="body-text" style="text-align: right; color: #380001; line-height: 1.6;">אין כרגע אירועים, תשמרו על קשר למטה דרך מייל או וואטסאפ</p>';
        return;
    }

    // Render each event
    events.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';

        eventCard.innerHTML = `
            <h2 class="event-title">${event.he.title}</h2>
            <div class="event-image">
                <img src="${event.image}" alt="${event.he.title}">
            </div>
            <div class="event-content">
                <div class="event-meta">
                    <span>תאריך: ${event.he.date}</span>
                    <span>מיקום: ${event.he.location}</span>
                    ${event.he.language ? `<span>שפה: ${event.he.language}</span>` : ''}
                </div>
                <p class="event-description">${event.he.description}</p>
                ${event.registerLink ? `<a href="${event.registerLink}" target="_blank" rel="noopener noreferrer" class="event-link">הרשמה</a>` : ''}
            </div>
        `;

        upcomingGrid.appendChild(eventCard);
    });

    // Re-initialize read more functionality if it exists
    if (typeof initReadMore === 'function') {
        initReadMore();
    }
}

// Load upcoming events for English meditation page (zen-meditation.html)
async function loadUpcomingEventsEnglish() {
    const events = await fetchAirtableEvents();
    const grid = document.getElementById('meditation-events-grid');

    if (!grid) return;

    // Clear existing content
    grid.innerHTML = '';

    // Filter for upcoming events
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingEvents = events.filter(event => {
        if (event.isRecurring) return true;
        if (!event.eventDate) return true;

        const eventDate = new Date(event.eventDate);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
    });

    if (upcomingEvents.length === 0) {
        grid.innerHTML = '<p class="body-text" style="text-align: left; color: #380001; line-height: 1.6; grid-column: 1 / -1;">There are no upcoming events right now. Scroll down to stay in touch through email or whatsapp.</p>';
        return;
    }

    // Render each event
    upcomingEvents.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';

        eventCard.innerHTML = `
            <h2 class="event-title">${event.en.title}</h2>
            <div class="event-image">
                <img src="${event.image}" alt="${event.en.title}">
            </div>
            <div class="event-content">
                <div class="event-meta">
                    <span>Date: ${event.en.date}</span>
                    <span>Location: ${event.en.location}</span>
                    ${event.en.language ? `<span>Language: ${event.en.language}</span>` : ''}
                </div>
                <p class="event-description">${event.en.description}</p>
                ${event.registerLink ? `<a href="${event.registerLink}" target="_blank" rel="noopener noreferrer" class="event-link">Register</a>` : ''}
            </div>
        `;

        grid.appendChild(eventCard);
    });

    // Re-initialize read more functionality if it exists
    if (typeof initReadMore === 'function') {
        initReadMore();
    }
}

// Load upcoming events for Hebrew meditation page (zen-meditation-he.html)
async function loadUpcomingEventsHebrew() {
    const events = await fetchAirtableEvents();
    const grid = document.getElementById('meditation-events-grid');

    if (!grid) return;

    // Clear existing content
    grid.innerHTML = '';

    // Filter for upcoming events
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingEvents = events.filter(event => {
        if (event.isRecurring) return true;
        if (!event.eventDate) return true;

        const eventDate = new Date(event.eventDate);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
    });

    if (upcomingEvents.length === 0) {
        grid.innerHTML = '<p class="body-text" style="text-align: right; color: #380001; line-height: 1.6; grid-column: 1 / -1;">אין כרגע אירועים, תשמרו על קשר למטה דרך מייל או וואטסאפ</p>';
        return;
    }

    // Render each event
    upcomingEvents.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';

        eventCard.innerHTML = `
            <h2 class="event-title">${event.he.title}</h2>
            <div class="event-image">
                <img src="${event.image}" alt="${event.he.title}">
            </div>
            <div class="event-content">
                <div class="event-meta">
                    <span>תאריך: ${event.he.date}</span>
                    <span>מיקום: ${event.he.location}</span>
                    ${event.he.language ? `<span>שפה: ${event.he.language}</span>` : ''}
                </div>
                <p class="event-description">${event.he.description}</p>
                ${event.registerLink ? `<a href="${event.registerLink}" target="_blank" rel="noopener noreferrer" class="event-link">הרשמה</a>` : ''}
            </div>
        `;

        grid.appendChild(eventCard);
    });

    // Re-initialize read more functionality if it exists
    if (typeof initReadMore === 'function') {
        initReadMore();
    }
}
