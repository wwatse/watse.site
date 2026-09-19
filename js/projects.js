/**
 * Projects grid controller.
 *
 * Data sources (A2 pattern):
 *   1. Content engine via ContentEngineRouter.getSortedCollection("projects", "desc")
 *   2. Legacy flat file content/data/projects.json
 *
 * Whichever yields more items wins, so the grid does not shrink during
 * migration. Once the engine holds at least as many items as the legacy
 * file, the legacy fetch self-retires with no code change.
 *
 * All DOM is built with createElement/appendChild/replaceChildren.
 * No innerHTML is used anywhere in this file.
 */
(function () {
    'use strict';

    var EMOJI_MAP = { web: '\uD83C\uDF10', experiment: '\uD83E\uDDEA', tool: '\uD83D\uDEE0\uFE0F' };
    var DEFAULT_EMOJI = '\uD83D\uDCBB';
    var DEFAULT_TAG = 'tool';
    var DEFAULT_TITLE = 'Untitled Project';

    // -------------------------------------------------------------------------
    // Normalization
    // -------------------------------------------------------------------------

    function normalizeEngineItem(doc) {
        var meta = (doc && doc.metadata) || {};
        var tag = typeof meta.tag === 'string' && meta.tag ? meta.tag : DEFAULT_TAG;
        return {
            slug: typeof doc.slug === 'string' ? doc.slug : '',
            title: typeof meta.title === 'string' && meta.title ? meta.title : DEFAULT_TITLE,
            description: typeof meta.description === 'string' ? meta.description : '',
            tag: tag,
            featured: meta.featured === 'true' || meta.featured === true,
            isLatest: doc.slug === 'project-one',
            url: typeof meta.url === 'string' ? meta.url : ''
        };
    }

    function normalizeLegacyItem(project) {
        var tag = typeof project.tag === 'string' && project.tag ? project.tag : DEFAULT_TAG;
        return {
            slug: typeof project.slug === 'string' ? project.slug : '',
            title: typeof project.title === 'string' && project.title ? project.title : DEFAULT_TITLE,
            description: typeof project.description === 'string' ? project.description : '',
            tag: tag,
            featured: project.featured === true || project.featured === 'true',
            isLatest: project.id === 1 || project.id === 'latest-project' || project.slug === 'project-one',
            url: typeof project.url === 'string' ? project.url : ''
        };
    }

    // -------------------------------------------------------------------------
    // Loading
    // -------------------------------------------------------------------------

    async function loadEngineItems() {
        if (!window.ContentEngineRouter) return [];
        try {
            var docs = await window.ContentEngineRouter.getSortedCollection('projects', 'desc');
            if (!Array.isArray(docs)) return [];
            return docs.map(normalizeEngineItem);
        } catch (error) {
            console.warn('[projects] Content engine failed; legacy JSON will be used.', error);
            return [];
        }
    }

    async function loadLegacyItems() {
        try {
            var response = await fetch('/content/data/projects.json');
            if (!response.ok) throw new Error('HTTP ' + response.status);
            var projects = await response.json();
            if (!Array.isArray(projects)) return [];
            return projects.map(normalizeLegacyItem);
        } catch (error) {
            console.warn('[projects] Legacy projects.json failed.', error);
            return [];
        }
    }

    // -------------------------------------------------------------------------
    // Card builder (matches existing .project-card markup exactly)
    // -------------------------------------------------------------------------

    function createProjectCard(project) {
        var tag = (project && project.tag ? project.tag : DEFAULT_TAG).toLowerCase();
        var emoji = EMOJI_MAP[tag] || DEFAULT_EMOJI;

        // The card itself is the anchor so the entire tile is clickable.
        // The previous structure used an inner <a class="project-link">, but
        // CSS applies display: contents to it on the projects page, which
        // strips the anchor's box and interactive behavior in some browsers.
        var card = document.createElement('a');
        card.className = 'project-card';
        card.href = project && project.url ? project.url : '/projects';
        card.style.textDecoration = 'none';
        card.style.color = 'inherit';
        if (project && project.isLatest) {
            card.id = 'latest-project';
        }

        var thumbnail = document.createElement('div');
        thumbnail.className = 'project-thumbnail tag-' + tag;
        var icon = document.createElement('span');
        icon.className = 'project-thumbnail-icon';
        icon.textContent = emoji;
        thumbnail.appendChild(icon);
        card.appendChild(thumbnail);

        var info = document.createElement('div');
        info.className = 'project-info';

        var title = document.createElement('p');
        title.className = 'project-title';
        title.textContent = project && project.title ? project.title : DEFAULT_TITLE;
        info.appendChild(title);

        var description = document.createElement('p');
        description.className = 'project-description';
        description.textContent = project && project.description ? project.description : '';
        info.appendChild(description);

        var tagEl = document.createElement('span');
        tagEl.className = 'project-tag';
        tagEl.textContent = project && project.tag ? project.tag : DEFAULT_TAG;
        info.appendChild(tagEl);

        card.appendChild(info);

        return card;
    }

    // Preserve the historical export for any dynamic caller that still uses it.
    if (typeof window !== 'undefined') {
        window.createProjectCard = createProjectCard;
    }

    // -------------------------------------------------------------------------
    // Empty state (uses engine template when available)
    // -------------------------------------------------------------------------

    function buildEmptyState(message) {
        if (window.ContentEngineTemplates && typeof window.ContentEngineTemplates.createEmptyState === 'function') {
            return window.ContentEngineTemplates.createEmptyState(message);
        }
        var wrapper = document.createElement('div');
        wrapper.className = 'empty-state';
        var p = document.createElement('p');
        p.className = 'empty-state__message';
        p.textContent = message;
        wrapper.appendChild(p);
        return wrapper;
    }

    // -------------------------------------------------------------------------
    // Controller
    // -------------------------------------------------------------------------

    document.addEventListener('DOMContentLoaded', async function () {
        var projectsGrid = document.querySelector('.projects-grid');
        if (!projectsGrid) return;

        var showAll = projectsGrid.hasAttribute('data-all-projects');
        var isHomepageFeatured = projectsGrid.classList.contains('projects-grid--featured');

        var engineItems = [];
        var legacyItems = [];
        try {
            var results = await Promise.all([loadEngineItems(), loadLegacyItems()]);
            engineItems = results[0];
            legacyItems = results[1];
        } catch (error) {
            console.warn('[projects] Unexpected load failure.', error);
        }

        var chosen = engineItems.length >= legacyItems.length ? engineItems : legacyItems;
        var displayItems = showAll ? chosen : chosen.filter(function (p) { return p.featured; });

        if (isHomepageFeatured) {
            displayItems = displayItems.slice(0, 3);
        }

        if (displayItems.length === 0) {
            projectsGrid.replaceChildren(buildEmptyState('No projects to display.'));
            return;
        }

        var fragment = document.createDocumentFragment();
        displayItems.forEach(function (project) {
            fragment.appendChild(createProjectCard(project));
        });
        projectsGrid.replaceChildren(fragment);
    });
})();
