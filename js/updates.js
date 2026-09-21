document.addEventListener('DOMContentLoaded', () => {
    const updatesSection = document.querySelector('.updates-section');
    if (!updatesSection) return;

    const REQUIRED_ITEMS = 5;

    function normalizeEngineItem(doc) {
        const meta = (doc && doc.metadata) || {};
        return {
            slug: typeof doc.slug === 'string' ? doc.slug : '',
            title: typeof meta.title === 'string' ? meta.title : '',
            date: typeof meta.date === 'string' ? meta.date : ''
        };
    }

    async function loadEngineItems() {
        if (!window.ContentEngineRouter) return [];
        try {
            const docs = await window.ContentEngineRouter.getLatestItems('posts', REQUIRED_ITEMS);
            if (!Array.isArray(docs)) return [];
            return docs.map(normalizeEngineItem);
        } catch (error) {
            console.warn('[homepage] Content engine failed.', error);
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
        heading.textContent = 'thoughts';
        header.appendChild(heading);

        return header;
    }

    function buildRows(items) {
        const container = document.createElement('div');
        container.className = 'past-updates';

        items.forEach((item) => {
            const row = document.createElement('a');
            row.href = '/post?slug=' + encodeURIComponent(item.slug);
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
                window.ContentEngineTemplates.createEmptyState('No thoughts yet.')
            );
        } else {
            fragment.appendChild(buildRows(items));
        }

        updatesSection.replaceChildren(fragment);
    }

    (async () => {
        render(await loadEngineItems());
    })();
});
