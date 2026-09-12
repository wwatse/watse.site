document.addEventListener('DOMContentLoaded', () => {
    const postsGrid = document.querySelector('.posts-grid');
    if (!postsGrid) return;

    const Templates = window.ContentEngineTemplates;

    // ---------------------------------------------------------------------
    // Normalization
    // ---------------------------------------------------------------------

    function normalizeEngineItem(doc) {
        const meta = (doc && doc.metadata) || {};
        return {
            slug: typeof doc.slug === 'string' ? doc.slug : '',
            title: typeof meta.title === 'string' ? meta.title : '',
            date: typeof meta.date === 'string' ? meta.date : ''
        };
    }

    function normalizeLegacyItem(post) {
        return {
            slug: typeof post.slug === 'string' ? post.slug : '',
            title: typeof post.title === 'string' ? post.title : '',
            date: typeof post.date === 'string' ? post.date : ''
        };
    }

    // ---------------------------------------------------------------------
    // Loaders (A2 parallel-fetch fallback)
    // ---------------------------------------------------------------------

    async function loadEngineItems() {
        if (!window.ContentEngineRouter) return [];
        try {
            const docs = await window.ContentEngineRouter.getSortedCollection('posts', 'desc');
            if (!Array.isArray(docs)) return [];
            return docs.map(normalizeEngineItem);
        } catch (error) {
            console.warn('[writing] Content engine failed; legacy JSON will be used.', error);
            return [];
        }
    }

    async function loadLegacyItems() {
        try {
            const response = await fetch('content/data/posts.json');
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const posts = await response.json();
            if (!Array.isArray(posts)) return [];
            return posts.map(normalizeLegacyItem);
        } catch (error) {
            console.warn('[writing] Legacy posts.json failed.', error);
            return [];
        }
    }

    // ---------------------------------------------------------------------
    // Sorting & grouping
    // ---------------------------------------------------------------------

    function sortDescByDate(items) {
        return items.slice().sort((a, b) => {
            const aT = a.date ? new Date(a.date).getTime() : 0;
            const bT = b.date ? new Date(b.date).getTime() : 0;
            return bT - aT;
        });
    }

    function groupByYear(items) {
        const groups = new Map();
        items.forEach((item) => {
            const parsed = new Date(item.date);
            const year = isNaN(parsed.getTime()) ? 'unknown' : String(parsed.getFullYear());
            if (!groups.has(year)) groups.set(year, []);
            groups.get(year).push(item);
        });
        const years = Array.from(groups.keys()).sort((a, b) => {
            if (a === 'unknown') return 1;
            if (b === 'unknown') return -1;
            return Number(b) - Number(a);
        });
        return years.map((year) => ({ year: year, posts: groups.get(year) }));
    }

    // ---------------------------------------------------------------------
    // Year scaffolding (the controller's job; template only makes rows)
    // ---------------------------------------------------------------------

    function buildYearHeading(year, isFirst) {
        const heading = document.createElement('h2');
        heading.className = 'h24all';
        heading.style.marginTop = isFirst ? '0' : '2.5rem';
        heading.style.marginBottom = '0.8rem';
        heading.textContent = year;
        return heading;
    }

    function buildYearContainer() {
        const container = document.createElement('div');
        container.className = 'year-posts-container';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.marginBottom = '1.5rem';
        return container;
    }

    function buildArchive(items) {
        const fragment = document.createDocumentFragment();
        const grouped = groupByYear(items);

        grouped.forEach((group, index) => {
            fragment.appendChild(buildYearHeading(group.year, index === 0));

            const container = buildYearContainer();
            group.posts.forEach((item) => {
                // Template-aligned: rows come from ContentEngineTemplates.
                if (Templates && typeof Templates.createPostItem === 'function') {
                    container.appendChild(Templates.createPostItem(item));
                }
            });
            fragment.appendChild(container);
        });

        return fragment;
    }

    function applyFadeIn(root) {
        const targets = root.querySelectorAll('.h24all, .post-link-archive');
        targets.forEach((el, idx) => {
            el.style.animation = 'fadeIn 0.3s ease-out ' + (idx * 0.03) + 's forwards';
            el.style.opacity = '0';
        });
    }

    // ---------------------------------------------------------------------
    // Orchestration
    // ---------------------------------------------------------------------

    (async () => {
        const results = await Promise.all([loadEngineItems(), loadLegacyItems()]);
        const engineItems = results[0];
        const legacyItems = results[1];
        const chosen = engineItems.length >= legacyItems.length ? engineItems : legacyItems;

        if (chosen.length === 0) {
            const empty = (Templates && typeof Templates.createEmptyState === 'function')
                ? Templates.createEmptyState('No articles published yet.')
                : (() => {
                    const w = document.createElement('div');
                    w.className = 'empty-state';
                    const p = document.createElement('p');
                    p.className = 'empty-state__message';
                    p.textContent = 'No articles published yet.';
                    w.appendChild(p);
                    return w;
                })();
            postsGrid.replaceChildren(empty);
            return;
        }

        const sorted = sortDescByDate(chosen);
        postsGrid.replaceChildren(buildArchive(sorted));
        applyFadeIn(postsGrid);
    })();
});
