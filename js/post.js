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
            // Sort posts chronologically (descending) to match archive order
            const sortedPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
            const currentIndex = sortedPosts.findIndex(p => p.slug === postSlug);

            if (currentIndex === -1) {
                postContent.innerHTML = '<p>Post not found.</p>';
                return;
            }

            const post = sortedPosts[currentIndex];
            document.title = `${post.title} — watse`;

            // Date formatting
            const postDate = new Date(post.date);
            const day = String(postDate.getDate()).padStart(2, '0');
            const month = String(postDate.getMonth() + 1).padStart(2, '0');
            const year = String(postDate.getFullYear());
            const formattedDate = `${day}.${month}.${year}`;

            // Calculate reading time (placeholder calculation or dynamic)
            const readingTime = post.readingTime || `${Math.max(3, Math.min(8, Math.round(post.description.length / 30)))} min read`;
            
            // Get category/tag
            const tag = post.category || 'General';

            // Generate content based on category
            const bodyContent = generateBodyContent(tag, post.title, post.description);

            // Previous/Next articles navigation
            // (Note: in descending array, index + 1 is older/previous, index - 1 is newer/next)
            const prevPost = currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;
            const nextPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;

            let navigationHtml = '';
            if (prevPost || nextPost) {
                navigationHtml = `
                    <nav class="post-navigation">
                        ${prevPost ? `
                            <a href="post.html?slug=${prevPost.slug}" class="post-nav-prev">
                                <span class="post-nav-label">← previous</span>
                                <span class="post-nav-title">${prevPost.title}</span>
                            </a>
                        ` : '<div></div>'}
                        ${nextPost ? `
                            <a href="post.html?slug=${nextPost.slug}" class="post-nav-next">
                                <span class="post-nav-label">next →</span>
                                <span class="post-nav-title">${nextPost.title}</span>
                            </a>
                        ` : '<div></div>'}
                    </nav>
                `;
            }

            postContent.innerHTML = `
                <h1 class="post-title"># ${post.title}</h1>
                
                <div class="post-meta">
                    <div class="post-meta-item">
                        <span>📅 ${formattedDate}</span>
                    </div>
                    <div class="post-meta-item">
                        <span>⏱️ ${readingTime}</span>
                    </div>
                    <div class="post-meta-item">
                        <span class="post-meta-tag">${tag.toLowerCase()}</span>
                    </div>
                </div>

                <div class="toc-container">
                    <h2 class="toc-title">Table of Contents</h2>
                    <ul class="toc-list">
                        <li class="toc-item"><a href="#introduction">1. Introduction</a></li>
                        <li class="toc-item"><a href="#deep-dive">2. Core Concepts & Deep Dive</a></li>
                        <li class="toc-item"><a href="#implementation">3. Technical Implementation</a></li>
                        <li class="toc-item"><a href="#conclusion">4. Summary & Outlook</a></li>
                    </ul>
                </div>

                <div class="post-body">
                    ${bodyContent}
                </div>

                ${navigationHtml}
            `;

            // Apply smooth scroll to TOC links if they target section IDs on the page
            postContent.querySelectorAll('.toc-item a').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href');
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
        })
        .catch(error => {
            console.error('Error fetching post:', error);
            postContent.innerHTML = '<p>Could not load post.</p>';
        });
});

// Helper to generate dynamic realistic content based on category
function generateBodyContent(category, title, description) {
    const defaultIntro = `<p id="introduction">This article explores the details surrounding <strong>${title}</strong>. ${description}</p>`;

    if (category.toLowerCase() === 'web') {
        return `
            ${defaultIntro}
            <p>Building for the modern web is often a balancing act between developer experience and user-facing performance. As frameworks become heavier, the case for returning to simple, native web APIs becomes stronger. By utilizing the platform itself, we can build robust, highly optimized interfaces with zero compile-time dependencies.</p>
            
            <h2 id="deep-dive">1. Leveraging the Platform</h2>
            <p>Every kilobyte of JavaScript we ship to our users must be parsed and executed, which often constitutes the main bottleneck on low-end mobile devices. When we build websites using vanilla HTML5 semantics, we respect both the client hardware and browser layout engines.</p>
            <blockquote>
                <p>"The Web is already accessible, fast, and secure by default. It is our tooling and code choices that break it."</p>
            </blockquote>
            
            <h3 id="implementation">2. Lightweight Intersection Observer</h3>
            <p>Instead of importing a heavy external library to manage lazy-loading assets or trigger scroll animations, we can write a concise, highly efficient script using standard browser features:</p>
            
            <pre><code>// Lazy load images with a simple Intersection Observer
const observer = new IntersectionObserver((entries, self) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy-loading');
            self.unobserve(img);
        }
    });
}, { rootMargin: '0px 0px 200px 0px' });</code></pre>

            <p>This implementation ensures images are loaded just before they enter the user's viewport, saving bandwidth and improving initial rendering times. You can read more about it on the <a href="https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API" target="_blank">MDN Documentation page</a>.</p>

            <h2 id="conclusion">3. Summary</h2>
            <p>By opting for native primitives, we eliminate security supply chain risks and ensure our websites remain fast and readable for years to come. Sometimes, building a quiet web means writing less code.</p>
        `;
    }

    if (category.toLowerCase() === 'design') {
        return `
            ${defaultIntro}
            <p>Design engineering is about bridging the gap between layout ideas and technical implementation. When code and design exist in harmony, the resulting interfaces feel seamless, intuitive, and satisfying to interact with.</p>
            
            <h2 id="deep-dive">1. The Philosophy of Whitespace</h2>
            <p>Whitespace is not empty space; it is an active design element. It directs the user's attention, separates conceptual groups, and gives elements room to breathe. Without proper whitespace, even the most beautiful typography becomes illegible.</p>
            
            <blockquote>
                <p>"Whitespace is like silence in music. It is not the absence of sound; it is the frame that gives the notes meaning."</p>
            </blockquote>

            <h3 id="implementation">2. Golden Ratios and Type Scales</h3>
            <p>Consistency in layout is achieved through strict scale rules. Setting your padding, margins, and line-heights to multiples of a base unit (like 4px or 8px) creates a visual rhythm that users feel, even if they can't explicitly point it out.</p>

            <ul>
                <li><strong>Base unit:</strong> 8px grid for layout rhythm.</li>
                <li><strong>Line height:</strong> 1.5 to 1.7 for body text readability.</li>
                <li><strong>Contrast:</strong> Adhering to WCAG AA standards (minimum 4.5:1 ratio).</li>
            </ul>

            <h2 id="conclusion">3. Bridging Design and Code</h2>
            <p>Creating tools that export direct CSS code from canvas models (like Figma) saves hours of manual translation. It allows designers to experiment with animations in real-time, knowing the final code will match their frames exactly.</p>
        `;
    }

    if (category.toLowerCase() === 'games') {
        return `
            ${defaultIntro}
            <p>Developing games independently requires managing a complex state loop, collision math, and asset structures. Keeping the code clean and isolated is critical to finishing a playable build.</p>
            
            <h2 id="deep-dive">1. The Standard Game Loop</h2>
            <p>At the center of every game is the loop. It processes user input, updates entity states, handles collision resolutions, and renders the scene. If any of these steps block, the frame rate drops, creating a laggy experience.</p>
            
            <blockquote>
                <p>"A game loop is a continuous cycle of updates. The challenge is decoupling the physics ticks from the refresh rate of the monitor."</p>
            </blockquote>

            <h3 id="implementation">2. Decoupled Frame Rate Loop</h3>
            <p>To prevent physics entities from moving faster or slower on different monitors (e.g. 60Hz vs 144Hz), we must multiply movement offsets by the time elapsed between frames (delta time):</p>

            <pre><code>let lastTime = 0;

function gameLoop(timestamp) {
    const deltaTime = (timestamp - lastTime) / 1000; // in seconds
    lastTime = timestamp;

    updatePhysics(deltaTime);
    renderScene();

    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);</code></pre>

            <p>This implementation ensures consistent physics simulations regardless of target computer rendering speeds.</p>

            <h2 id="conclusion">3. Next Steps</h2>
            <p>Our next milestone is implementing simple A* pathfinding on a grid, followed by sound design trigger queues. Keeping things low-resolution and pixel-perfect helps us focus on game mechanics rather than graphics rendering complexity.</p>
        `;
    }

    // Default template for personal or culture categories
    return `
        ${defaultIntro}
        <p>Exploring complex topics with curiosity is what keeps programming and writing interesting. When we document our thoughts, we organize our understanding and make our internal models clear.</p>
        
        <h2 id="deep-dive">1. The Importance of Documenting</h2>
        <p>Writing is thinking. By writing essays, tutorials, or reviews, we discover gaps in our knowledge. It forces us to synthesize disparate ideas into a coherent narrative that can be explained to others.</p>
        
        <blockquote>
            <p>"If you can't explain it simply, you don't understand it well enough." — Albert Einstein</p>
        </blockquote>

        <h3 id="implementation">2. Key Lessons Learned</h3>
        <p>Through various iterations of writing, building, and coding, several principles stand out:</p>
        
        <ol>
            <li><strong>Start simple:</strong> Over-engineering is the enemy of completion.</li>
            <li><strong>Optimize later:</strong> Clean, readable code is always better than premature optimization.</li>
            <li><strong>Embrace constraints:</strong> Constraints build focus and creativity.</li>
        </ol>

        <h2 id="conclusion">3. Conclusion</h2>
        <p>Whether you're developing an indie game, organizing a design system, or writing a personal blog, the goal is consistent, quiet progress. Keep building and sharing.</p>
    `;
}