document.addEventListener('DOMContentLoaded', () => {
    const updatesSection = document.querySelector('.updates-section');
    if (!updatesSection) return;

    // A2 threshold: engine must supply at least this many items before we
    // prefer it over the legacy JSON. Matches the historical homepage size
    // (1 featured + 4 past updates).
    const REQUIRED_ITEMS = 5;

    function normalizeEngineItem(doc) {
        const meta = (doc && doc.metadata) || {};
        return {
            slug: typeof doc.slug === 'string' ? doc.slug : '',
            title: typeof meta.title === 'string' ? meta.title : '',
            date: typeof meta.date === 'string' ? meta.date : '',
            description: typeof meta.description === 'string' ? meta.description : ''
        };
    }

    function normalizeLegacyItem(post) {
        return {
            slug: typeof post.slug === 'string' ? post.slug : '',
            title: typeof post.title === 'string' ? post.title : '',
            date: typeof post.date === 'string' ? post.date : '',
            description: typeof post.description === 'string' ? post.description : ''
        };
    }

    async function loadEngineItems() {
        if (!window.ContentEngineRouter) return [];
        try {
            const docs = await window.ContentEngineRouter.getLatestItems('posts', REQUIRED_ITEMS);
            if (!Array.isArray(docs)) return [];
            return docs.map(normalizeEngineItem);
        } catch (error) {
            console.warn('[homepage] Content engine failed; falling back to legacy JSON.', error);
            return [];
        }
    }

    async function loadLegacyItems() {
        try {
            const response = await fetch('content/data/posts.json');
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const posts = await response.json();
            if (!Array.isArray(posts)) return [];
            const sorted = posts.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
            return sorted.slice(0, REQUIRED_ITEMS).map(normalizeLegacyItem);
        } catch (error) {
            console.warn('[homepage] Legacy posts.json failed.', error);
            return [];
        }
    }

    function formatDate(isoDate) {
        const parsed = new Date(isoDate);
        if (isNaN(parsed.getTime())) return isoDate || '';
        const day = String(parsed.getDate()).padStart(2, '0');
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const year = String(parsed.getFullYear()).slice(-2);
        return day + '.' + month + '.' + year;
    }

    function buildHeader() {
        const header = document.createElement('div');
        header.className = 'section-header';

        const heading = document.createElement('h2');
        heading.className = 'h24all';
        heading.textContent = 'Updates';
        header.appendChild(heading);

        const viewAll = document.createElement('a');
        viewAll.className = 'view-all';
        viewAll.href = 'writing.html';
        viewAll.textContent = 'View all \u2192';
        header.appendChild(viewAll);

        return header;
    }

    function buildFeatured(item) {
        const link = document.createElement('a');
        link.href = 'post.html?slug=' + encodeURIComponent(item.slug);
        link.className = 'featured-update-link';
        link.id = 'featured-update';

        const wrapper = document.createElement('div');
        wrapper.className = 'featured-update';

        const title = document.createElement('p');
        title.className = 'update-title';
        title.textContent = item.title;
        wrapper.appendChild(title);

        const body = document.createElement('p');
        body.className = 'update-body';
        body.textContent = item.description;
        wrapper.appendChild(body);

        const readMore = document.createElement('p');
        readMore.className = 'update-read-more';
        readMore.textContent = 'Continue reading \u2192';
        wrapper.appendChild(readMore);

        link.appendChild(wrapper);
        return link;
    }

    function buildPastUpdates(items) {
        const container = document.createElement('div');
        container.className = 'past-updates';

        items.forEach((item) => {
            const row = document.createElement('a');
            row.href = 'post.html?slug=' + encodeURIComponent(item.slug);
            row.className = 'update-row';

            const title = document.createElement('p');
            title.className = 'update-row-title';
            title.textContent = item.title;
            row.appendChild(title);

            const date = document.createElement('p');
            date.className = 'update-row-date';
            date.textContent = formatDate(item.date);
            row.appendChild(date);

            container.appendChild(row);
        });

        return container;
    }

    function render(items) {
        const fragment = document.createDocumentFragment();
        fragment.appendChild(buildHeader());

        if (items.length === 0) {
            fragment.appendChild(
                window.ContentEngineTemplates.createEmptyState('No updates yet.')
            );
        } else {
            fragment.appendChild(buildFeatured(items[0]));
            const past = items.slice(1);
            if (past.length > 0) {
                fragment.appendChild(buildPastUpdates(past));
            }
        }

        updatesSection.replaceChildren(fragment);
    }

    (async () => {
        let items = await loadEngineItems();

        // A2 fallback: only use the engine if it can fill a full homepage.
        if (items.length < REQUIRED_ITEMS) {
            const legacy = await loadLegacyItems();
            if (legacy.length > items.length) {
                items = legacy;
            }
        }

        render(items);
    })();
});
