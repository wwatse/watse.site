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

    // ---------------------------------------------------------------------
    // DOM builders (strict class matching with current post.html CSS)
    // ---------------------------------------------------------------------

    function buildTitle(title) {
        const h1 = document.createElement('h1');
        h1.className = 'post-title';
        h1.textContent = '# ' + (title || '(untitled)');
        return h1;
    }

    function buildMeta(dateIso) {
        const meta = document.createElement('div');
        meta.className = 'post-meta';

        if (dateIso) {
            const item = document.createElement('div');
            item.className = 'post-meta-item';
            const span = document.createElement('span');
            span.textContent = '\uD83D\uDCC5 ' + formatDate(dateIso);
            item.appendChild(span);
            meta.appendChild(item);
        }

        return meta;
    }

    function buildBody(renderedHtml) {
        const body = document.createElement('div');
        body.className = 'post-body';
        body.appendChild(htmlStringToFragment(renderedHtml));
        return body;
    }

    function buildPostTree(post, renderedHtml) {
        const fragment = document.createDocumentFragment();
        fragment.appendChild(buildTitle(post.metadata && post.metadata.title));
        fragment.appendChild(buildMeta(post.metadata && post.metadata.date));
        fragment.appendChild(buildBody(renderedHtml));
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

        let post = null;
        try {
            post = await window.ContentEngineRouter.getItemBySlug('posts', slug);
        } catch (error) {
            console.warn('[post] Content engine failed for slug "' + slug + '".', error);
        }

        if (!post) {
            postContent.replaceChildren(buildEmptyState('Post not found.'));
            return;
        }

        let renderedHtml = '';
        try {
            renderedHtml = window.MarkdownRenderer.render(post.body) || '';
        } catch (error) {
            console.warn('[post] MarkdownRenderer failed for slug "' + slug + '".', error);
            renderedHtml = '';
        }

        postContent.replaceChildren(buildPostTree(post, renderedHtml));

        const title = post.metadata && post.metadata.title;
        if (title) {
            document.title = title + ' \u2014 kelvin watse';
        }
    })();
});
