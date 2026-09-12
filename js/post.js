document.addEventListener('DOMContentLoaded', () => {
    const postContent = document.querySelector('.post-content');
    if (!postContent) return;

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    // Convert an HTML string into a DocumentFragment using a detached wrapper.
    // The wrapper is never attached to the document, so no live-DOM reparse
    // or listener destruction occurs. Matches the approach used in
    // js/content-engine/templates.js (htmlStringToFragment).
    function htmlStringToFragment(htmlString) {
        const fragment = document.createDocumentFragment();
        if (typeof htmlString !== 'string' || htmlString.trim() === '') {
            return fragment;
        }
        const wrapper = document.createElement('div');
        wrapper.innerHTML = htmlString;
        while (wrapper.firstChild) {
            fragment.appendChild(wrapper.firstChild);
        }
        return fragment;
    }

    function formatDate(isoDate) {
        const parsed = new Date(isoDate);
        if (isNaN(parsed.getTime())) return isoDate || '';
        const day = String(parsed.getDate()).padStart(2, '0');
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const year = String(parsed.getFullYear());
        return day + '.' + month + '.' + year;
    }

    function buildEmptyState(message) {
        if (window.ContentEngineTemplates && typeof window.ContentEngineTemplates.createEmptyState === 'function') {
            return window.ContentEngineTemplates.createEmptyState(message);
        }
        const wrapper = document.createElement('div');
        wrapper.className = 'empty-state';
        const p = document.createElement('p');
        p.className = 'empty-state__message';
        p.textContent = message;
        wrapper.appendChild(p);
        return wrapper;
    }

    function slugify(text) {
        return String(text)
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }

    function calculateReadingTime(body) {
        if (typeof body !== 'string' || body.trim() === '') return 1;
        const words = body.trim().split(/\s+/).length;
        return Math.max(1, Math.ceil(words / 200));
    }

    // ---------------------------------------------------------------------
    // Heading extraction (for TOC)
    // ---------------------------------------------------------------------

    function extractHeadings(body) {
        if (typeof body !== 'string' || body === '') return [];
        const headings = [];
        const lines = body.split(/\r?\n/);
        for (let i = 0; i < lines.length; i += 1) {
            const match = lines[i].match(/^(#{2,3})\s+(.+?)\s*$/);
            if (match) {
                headings.push({
                    level: match[1].length,
                    text: match[2].trim(),
                    id: slugify(match[2].trim())
                });
            }
        }
        return headings;
    }

    // ---------------------------------------------------------------------
    // DOM builders (strict class matching with current post.html CSS)
    // ---------------------------------------------------------------------

    function buildTitle(title) {
        const h1 = document.createElement('h1');
        h1.className = 'post-title';
        h1.textContent = '# ' + (title || '(untitled)');
        return h1;
    }

    function buildMeta(post) {
        const meta = document.createElement('div');
        meta.className = 'post-meta';

        const dateIso = post.metadata && post.metadata.date;
        if (dateIso) {
            const dateItem = document.createElement('div');
            dateItem.className = 'post-meta-item';
            const dateSpan = document.createElement('span');
            dateSpan.textContent = '\uD83D\uDCC5 ' + formatDate(dateIso);
            dateItem.appendChild(dateSpan);
            meta.appendChild(dateItem);
        }

        const minutes = calculateReadingTime(post.body);
        const readItem = document.createElement('div');
        readItem.className = 'post-meta-item';
        const readSpan = document.createElement('span');
        readSpan.textContent = '\u23F1\uFE0F ' + minutes + ' min read';
        readItem.appendChild(readSpan);
        meta.appendChild(readItem);

        return meta;
    }

    function buildTOC(headings) {
        if (!headings || headings.length === 0) return null;

        const container = document.createElement('div');
        container.className = 'toc-container';

        const title = document.createElement('h2');
        title.className = 'toc-title';
        title.textContent = 'Table of Contents';
        container.appendChild(title);

        const list = document.createElement('ul');
        list.className = 'toc-list';

        headings.forEach((heading) => {
            const item = document.createElement('li');
            item.className = 'toc-item';
            if (heading.level === 3) {
                item.style.paddingLeft = '1rem';
            }
            const link = document.createElement('a');
            link.setAttribute('href', '#' + heading.id);
            link.setAttribute('data-toc-target', heading.id);
            link.textContent = heading.text;
            item.appendChild(link);
            list.appendChild(item);
        });

        container.appendChild(list);
        return container;
    }

    function buildBody(renderedHtml) {
        const body = document.createElement('div');
        body.className = 'post-body';
        body.appendChild(htmlStringToFragment(renderedHtml));
        return body;
    }

    function buildNav(prevPost, nextPost) {
        if (!prevPost && !nextPost) return null;

        const nav = document.createElement('nav');
        nav.className = 'post-navigation';

        if (prevPost) {
            const prevLink = document.createElement('a');
            prevLink.href = 'post.html?slug=' + encodeURIComponent(prevPost.slug);
            prevLink.className = 'post-nav-prev';

            const prevLabel = document.createElement('span');
            prevLabel.className = 'post-nav-label';
            prevLabel.textContent = '\u2190 previous';
            prevLink.appendChild(prevLabel);

            const prevTitle = document.createElement('span');
            prevTitle.className = 'post-nav-title';
            prevTitle.textContent = (prevPost.metadata && prevPost.metadata.title) || prevPost.slug;
            prevLink.appendChild(prevTitle);

            nav.appendChild(prevLink);
        } else {
            nav.appendChild(document.createElement('div'));
        }

        if (nextPost) {
            const nextLink = document.createElement('a');
            nextLink.href = 'post.html?slug=' + encodeURIComponent(nextPost.slug);
            nextLink.className = 'post-nav-next';

            const nextLabel = document.createElement('span');
            nextLabel.className = 'post-nav-label';
            nextLabel.textContent = 'next \u2192';
            nextLink.appendChild(nextLabel);

            const nextTitle = document.createElement('span');
            nextTitle.className = 'post-nav-title';
            nextTitle.textContent = (nextPost.metadata && nextPost.metadata.title) || nextPost.slug;
            nextLink.appendChild(nextTitle);

            nav.appendChild(nextLink);
        } else {
            nav.appendChild(document.createElement('div'));
        }

        return nav;
    }

    function buildPostTree(post, renderedHtml, headings, prevPost, nextPost) {
        const fragment = document.createDocumentFragment();
        fragment.appendChild(buildTitle(post.metadata && post.metadata.title));
        fragment.appendChild(buildMeta(post));

        const toc = buildTOC(headings);
        if (toc) fragment.appendChild(toc);

        fragment.appendChild(buildBody(renderedHtml));

        const nav = buildNav(prevPost, nextPost);
        if (nav) fragment.appendChild(nav);

        return fragment;
    }

    // ---------------------------------------------------------------------
    // Orchestration
    // ---------------------------------------------------------------------

    (async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get('slug');

        if (!slug) {
            postContent.replaceChildren(buildEmptyState('No post specified.'));
            return;
        }

        let collection = [];
        try {
            collection = await window.ContentEngineRouter.getSortedCollection('posts', 'desc');
        } catch (error) {
            console.warn('[post] Content engine failed for slug "' + slug + '".', error);
        }

        if (!Array.isArray(collection) || collection.length === 0) {
            postContent.replaceChildren(buildEmptyState('Post not found.'));
            return;
        }

        const currentIndex = collection.findIndex((item) => item && item.slug === slug);
        if (currentIndex === -1) {
            postContent.replaceChildren(buildEmptyState('Post not found.'));
            return;
        }

        const post = collection[currentIndex];
        // Collection is sorted newest -> oldest.
        // Next (newer) is index - 1, Previous (older) is index + 1.
        const nextPost = currentIndex > 0 ? collection[currentIndex - 1] : null;
        const prevPost = currentIndex < collection.length - 1 ? collection[currentIndex + 1] : null;

        let renderedHtml = '';
        try {
            renderedHtml = window.MarkdownRenderer.render(post.body) || '';
        } catch (error) {
            console.warn('[post] MarkdownRenderer failed for slug "' + slug + '".', error);
            renderedHtml = '';
        }

        const headings = extractHeadings(post.body);

        postContent.replaceChildren(buildPostTree(post, renderedHtml, headings, prevPost, nextPost));

        // TOC smooth-scroll. Runs in the capture phase so it beats main.js's
        // document-level page-transition handler, and stopPropagation prevents
        // that handler from running at all -- otherwise it fades the body to
        // opacity: 0 and navigates to the same page + fragment, which leaves
        // the page blank because pageshow never fires on a same-document nav.
        postContent.querySelectorAll('.toc-item a[data-toc-target]').forEach((anchor) => {
            anchor.addEventListener('click', (event) => {
                const targetId = anchor.getAttribute('data-toc-target');
                const target = document.getElementById(targetId);
                if (!target) return;
                event.preventDefault();
                event.stopPropagation();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                history.replaceState(null, '', '#' + targetId);
            }, true);
        });

        const title = post.metadata && post.metadata.title;
        if (title) {
            document.title = title + ' \u2014 kelvin watse';
        }
    })();
});
