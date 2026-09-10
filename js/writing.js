document.addEventListener('DOMContentLoaded', () => {
    const postsGrid = document.querySelector('.posts-grid');
    if (!postsGrid) return;

    // ---------------------------------------------------------------------
    // Normalization
    //
    // Engine items arrive as { slug, metadata: { title, date, ... }, body }.
    // Legacy items arrive as { slug, title, date, ... }.
    // Both normalize to { slug, title, date } so the renderer below is
    // agnostic to source.
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
    // Loaders
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
            const aTime = a.date ? new Date(a.date).getTime() : 0;
            const bTime = b.date ? new Date(b.date).getTime() : 0;
            return bTime - aTime;
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
        // Sort year keys descending; "unknown" sinks to the bottom.
        const years = Array.from(groups.keys()).sort((a, b) => {
            if (a === 'unknown') return 1;
            if (b === 'unknown') return -1;
            return Number(b) - Number(a);
        });
        return years.map((year) => ({ year, posts: groups.get(year) }));
    }

    // ---------------------------------------------------------------------
    // Formatting
    // ---------------------------------------------------------------------

    function formatDate(isoDate) {
        const parsed = new Date(isoDate);
        if (isNaN(parsed.getTime())) return isoDate || '';
        const day = String(parsed.getDate()).padStart(2, '0');
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const year = String(parsed.getFullYear());
        return day + '.' + month + '.' + year;
    }

    // ---------------------------------------------------------------------
    // DOM builders
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

    function buildPostLink(item) {
        const link = document.createElement('a');
        link.href = 'post.html?slug=' + encodeURIComponent(item.slug);
        link.className = 'post-link-archive';

        const title = document.createElement('span');
        title.className = 'post-title-archive';
        title.textContent = '# ' + item.title;
        link.appendChild(title);

        const date = document.createElement('span');
        date.className = 'post-date-archive';
        date.textContent = formatDate(item.date);
        link.appendChild(date);

        return link;
    }

    function buildArchive(items) {
        const fragment = document.createDocumentFragment();
        const grouped = groupByYear(items);

        grouped.forEach((group, index) => {
            fragment.appendChild(buildYearHeading(group.year, index === 0));

            const container = buildYearContainer();
            group.posts.forEach((item) => {
                container.appendChild(buildPostLink(item));
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
        // Parallel fetch: engine + legacy. Pick whichever yields more items.
        // This keeps all 30 legacy articles visible while content migration
        // is still in progress, and self-retires once the engine catches up.
        const [engineItems, legacyItems] = await Promise.all([
            loadEngineItems(),
            loadLegacyItems()
        ]);

        const chosen = engineItems.length >= legacyItems.length ? engineItems : legacyItems;

        if (chosen.length === 0) {
            const empty = window.ContentEngineTemplates
                ? window.ContentEngineTemplates.createEmptyState('No articles published yet.')
                : (() => {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'empty-state';
                    const msg = document.createElement('p');
                    msg.className = 'empty-state__message';
                    msg.textContent = 'No articles published yet.';
                    wrapper.appendChild(msg);
                    return wrapper;
                })();
            postsGrid.replaceChildren(empty);
            return;
        }

        const sorted = sortDescByDate(chosen);
        const tree = buildArchive(sorted);
        postsGrid.replaceChildren(tree);
        applyFadeIn(postsGrid);
    })();
});
