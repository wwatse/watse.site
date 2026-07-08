/**
 * Content render helpers — populate DOM from loaded JSON.
 */
(function () {
    'use strict';

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatPostDate(isoDate) {
        const [year, month, day] = isoDate.split('-');
        return `${day}.${month}.${year}`;
    }

    window.ContentRender = {
        /**
         * @param {object} site - Parsed site.json
         * @param {HTMLElement} root
         */
        renderSiteInfo(site, root) {
            // TODO: bio, status list, contact, footer
        },

        /**
         * @param {object[]} posts - Array from content/data/posts.json
         * @param {HTMLElement} container - e.g. .posts-grid
         */
        renderPostList(posts, container) {
            const sorted = [...posts].sort(
                (a, b) => new Date(b.date) - new Date(a.date)
            );

            container.innerHTML = '';

            sorted.forEach((post) => {
                const article = document.createElement('article');
                article.className = 'post-row';

                const link = document.createElement('a');
                link.className = 'post-link';
                link.href = `/writing/${post.slug}`;

                const title = document.createElement('span');
                title.className = 'post-row-title';
                title.textContent = post.title;

                const date = document.createElement('span');
                date.className = 'post-row-date';
                date.textContent = formatPostDate(post.date);

                link.append(title, date);
                article.append(link);
                container.append(article);
            });
        },

        /**
         * @param {object[]} projects - projects array from projects.json
         * @param {HTMLElement} container - e.g. .projects-grid
         */
        renderProjectGrid(projects, container) {
            // TODO: .project-card entries
        },

        /**
         * @param {object} updates - Parsed updates.json
         * @param {HTMLElement} section - .updates-section
         */
        renderUpdates(updates, section) {
            // TODO: featured update + .past-updates rows
        }
    };
})();
