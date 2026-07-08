/**
 * Loads and renders blog posts on writing.html.
 */
(function () {
    'use strict';

    async function initPostsPage() {
        const grid = document.querySelector('.posts-grid[data-posts]');
        if (!grid) return;

        try {
            const posts = await ContentLoader.loadPosts();
            ContentRender.renderPostList(posts, grid);

            grid.querySelectorAll('.post-row').forEach((row, index) => {
                row.style.animation = `fadeIn 0.3s ease-out ${index * 0.05}s forwards`;
                row.style.opacity = '0';
            });
        } catch (error) {
            console.error('Failed to load posts:', error);
        }
    }

    document.addEventListener('DOMContentLoaded', initPostsPage);
})();
