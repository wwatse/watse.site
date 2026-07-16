document.addEventListener('DOMContentLoaded', () => {
    const updatesSection = document.querySelector('.updates-section');
    if (!updatesSection) return;

    fetch('content/data/posts.json')
        .then(response => response.json())
        .then(posts => {
            const sortedPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Show latest 5 posts on homepage updates
            const latestPosts = sortedPosts.slice(0, 5);
            const featuredPost = latestPosts.shift(); 

            updatesSection.innerHTML = `
                <div class="section-header">
                    <h2 class="h24all">Updates</h2>
                    <a href="/updates" class="view-all">View all →</a>
                </div>
            `;

            if (featuredPost) {
                const featuredUpdate = document.createElement('a');
                featuredUpdate.href = `post.html?slug=${featuredPost.slug}`;
                featuredUpdate.className = 'featured-update-link';
                featuredUpdate.id = 'featured-update';
                featuredUpdate.innerHTML = `
                    <div class="featured-update">
                        <p class="update-title">${featuredPost.title}</p>
                        <p class="update-body">${featuredPost.description}</p>
                        <p class="update-read-more">Continue reading →</p>
                    </div>
                `;
                updatesSection.appendChild(featuredUpdate);
            }

            if (latestPosts.length > 0) {
                const pastUpdates = document.createElement('div');
                pastUpdates.className = 'past-updates';

                latestPosts.forEach(post => {
                    const updateRow = document.createElement('a');
                    updateRow.href = `post.html?slug=${post.slug}`;
                    updateRow.className = 'update-row';
                    
                    const postDate = new Date(post.date);
                    const day = String(postDate.getDate()).padStart(2, '0');
                    const month = String(postDate.getMonth() + 1).padStart(2, '0');
                    const year = String(postDate.getFullYear()).slice(-2);
                    const formattedDate = `${day}.${month}.${year}`;

                    updateRow.innerHTML = `
                        <p class="update-row-title">${post.title}</p>
                        <p class="update-row-date">${formattedDate}</p>
                    `;
                    pastUpdates.appendChild(updateRow);
                });

                updatesSection.appendChild(pastUpdates);
            }
        })
        .catch(error => {
            console.error('Error fetching posts:', error);
            updatesSection.innerHTML += '<p>Could not load updates.</p>';
        });
});