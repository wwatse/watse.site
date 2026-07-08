/**
 * Content loader — fetches JSON from /content/ at runtime.
 *
 * Not wired into pages yet. HTML remains the source of truth until
 * render functions are implemented and called from main.js.
 */
(function () {
    'use strict';

    const CONTENT_BASE = '/content';

    async function loadJSON(relativePath) {
        const response = await fetch(`${CONTENT_BASE}/${relativePath}`);

        if (!response.ok) {
            throw new Error(`Failed to load content/${relativePath}: ${response.status}`);
        }

        return response.json();
    }

    window.ContentLoader = {
        paths: {
            site: 'data/site.json',
            updates: 'data/updates.json',
            posts: 'data/posts.json',
            projects: 'projects/projects.json'
        },

        loadSite: () => loadJSON('data/site.json'),
        loadUpdates: () => loadJSON('data/updates.json'),
        loadPosts: () => loadJSON('data/posts.json'),
        loadProjects: () => loadJSON('projects/projects.json'),

        loadJSON
    };
})();
