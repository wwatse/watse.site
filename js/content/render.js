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
                link.href = `writing.html?slug=${post.slug}`;

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
            container.innerHTML = '';
            projects.forEach((project) => {
                const card = (typeof window.createProjectCard === 'function')
                    ? window.createProjectCard(project)
                    : (() => {
                        const cardDiv = document.createElement('div');
                        cardDiv.className = 'project-card';
                        const tagClass = `tag-${(project.tag || '').toLowerCase()}`;
                        const emojiMap = { web: '🌐', experiment: '🧪', tool: '🛠️' };
                        const emoji = emojiMap[(project.tag || '').toLowerCase()] || '💻';
                        cardDiv.innerHTML = `
        <a href="projects.html" class="project-link" style="text-decoration: none; color: inherit; display: flex; flex-direction: column; height: 100%;">
                                <div class="project-thumbnail ${tagClass}">
                                    <span class="project-thumbnail-icon">${emoji}</span>
                                </div>
                                <div class="project-info">
                                    <p class="project-title">${project.title}</p>
                                    <p class="project-description">${project.description}</p>
                                    <span class="project-tag">${project.tag}</span>
                                </div>
                            </a>
                        `;
                        return cardDiv;
                    })();
                container.append(card);
            });
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
