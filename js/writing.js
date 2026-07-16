document.addEventListener('DOMContentLoaded', () => {
    const postsGrid = document.querySelector('.posts-grid');
    if (!postsGrid) return;

    fetch('content/data/posts.json')
        .then(response => response.json())
        .then(posts => {
            // Sort all posts by date descending
            const sortedPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Group posts by year
            const postsByYear = {};
            sortedPosts.forEach(post => {
                const year = new Date(post.date).getFullYear();
                if (!postsByYear[year]) {
                    postsByYear[year] = [];
                }
                postsByYear[year].push(post);
            });

            // Get sorted list of years descending
            const years = Object.keys(postsByYear).sort((a, b) => b - a);

            postsGrid.innerHTML = '';

            years.forEach((year, index) => {
                // Create year heading
                const yearHeading = document.createElement('h2');
                yearHeading.className = 'h24all';
                yearHeading.style.marginTop = index === 0 ? '0' : '2.5rem';
                yearHeading.style.marginBottom = '0.8rem';
                yearHeading.textContent = year;
                postsGrid.appendChild(yearHeading);

                // Create container for this year's posts
                const yearGrid = document.createElement('div');
                yearGrid.className = 'year-posts-container';
                yearGrid.style.display = 'flex';
                yearGrid.style.flexDirection = 'column';
                yearGrid.style.marginBottom = '1.5rem';

                postsByYear[year].forEach(post => {
                    const postDate = new Date(post.date);
                    const day = String(postDate.getDate()).padStart(2, '0');
                    const month = String(postDate.getMonth() + 1).padStart(2, '0');
                    const fullYear = String(postDate.getFullYear());
                    const formattedDate = `${day}.${month}.${fullYear}`;

                    const postLink = document.createElement('a');
                    postLink.href = `post.html?slug=${post.slug}`;
                    postLink.className = 'post-link-archive';
                    postLink.innerHTML = `
                        <span class="post-title-archive"># ${post.title}</span>
                        <span class="post-date-archive">${formattedDate}</span>
                    `;
                    yearGrid.appendChild(postLink);
                });

                postsGrid.appendChild(yearGrid);
            });

            // Apply fade-in animation to headings and archive rows
            const elementsToAnimate = postsGrid.querySelectorAll('.h24all, .post-link-archive');
            elementsToAnimate.forEach((el, idx) => {
                el.style.animation = `fadeIn 0.3s ease-out ${idx * 0.03}s forwards`;
                el.style.opacity = '0';
            });
        })
        .catch(error => {
            console.error('Error fetching posts:', error);
            postsGrid.innerHTML = '<p>Could not load writing archive.</p>';
        });
});