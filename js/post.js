document.addEventListener('DOMContentLoaded', () => {
    const postContent = document.querySelector('.post-content');
    if (!postContent) return;

    const urlParams = new URLSearchParams(window.location.search);
    const postSlug = urlParams.get('slug');

    if (!postSlug) {
        postContent.innerHTML = '<p>Post not found.</p>';
        return;
    }

    fetch('content/data/posts.json')
        .then(response => response.json())
        .then(posts => {
            const post = posts.find(p => p.slug === postSlug);

            if (post) {
                document.title = post.title;
                
                const postDate = new Date(post.date);
                const day = String(postDate.getDate()).padStart(2, '0');
                const month = String(postDate.getMonth() + 1).padStart(2, '0');
                const year = String(postDate.getFullYear()).slice(-2);
                const formattedDate = `${day}.${month}.${year}`;

                postContent.innerHTML = `
                    <h1 class="post-title">${post.title}</h1>
                    <p class="post-meta">Published on ${formattedDate}</p>
                    <div class="post-body">
                        <p>${post.description}</p>
                        <!-- Full post content will be loaded here in the future -->
                    </div>
                `;
            } else {
                postContent.innerHTML = '<p>Post not found.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching post:', error);
            postContent.innerHTML = '<p>Could not load post.</p>';
        });
});