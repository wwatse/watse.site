document.addEventListener('DOMContentLoaded', () => {
    const postsGrid = document.querySelector('.posts-grid');
    if (!postsGrid) return;

    fetch('content/data/posts.json')
        .then(response => response.json())
        .then(posts => {
            const sortedPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));

            postsGrid.innerHTML = '';

            sortedPosts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'post-item';

                const postDate = new Date(post.date);
                const day = String(postDate.getDate()).padStart(2, '0');
                const month = String(postDate.getMonth() + 1).padStart(2, '0');
                const year = String(postDate.getFullYear()).slice(-2);
                const formattedDate = `${day}.${month}.${year}`;

                postElement.innerHTML = `
                    <a href="post.html?slug=${post.slug}" class="post-link">
                        <h2 class="post-title">${post.title}</h2>
                        <p class="post-description">${post.description}</p>
                        <p class="post-date">${formattedDate}</p>
                    </a>
                `;
                postsGrid.appendChild(postElement);
            });
        })
        .catch(error => {
            console.error('Error fetching posts:', error);
            postsGrid.innerHTML = '<p>Could not load posts.</p>';
        });
});