/**
 * Reusable project card component and rendering logic.
 */

// Helper to create a single project card node
function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    if (project.id === 1 || project.id === 'latest-project' || project.slug === 'project-one') {
        card.id = 'latest-project';
    }

    const tagClass = `tag-${(project.tag || '').toLowerCase()}`;
    const emojiMap = {
        web: '🌐',
        experiment: '🧪',
        tool: '🛠️'
    };
    const emoji = emojiMap[(project.tag || '').toLowerCase()] || '💻';

    card.innerHTML = `
        <a href="/project?slug=${project.slug}" class="project-link" style="text-decoration: none; color: inherit; display: flex; flex-direction: column; height: 100%;">
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
    return card;
}

document.addEventListener('DOMContentLoaded', () => {
    const projectsGrid = document.querySelector('.projects-grid');
    if (!projectsGrid) return;

    // Check if container requests all projects
    const showAll = projectsGrid.hasAttribute('data-all-projects');

    fetch('content/data/projects.json')
        .then(response => response.json())
        .then(projects => {
            const displayProjects = showAll ? projects : projects.filter(project => project.featured);
            
            projectsGrid.innerHTML = '';

            displayProjects.forEach(project => {
                const card = createProjectCard(project);
                projectsGrid.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Error fetching projects:', error);
            projectsGrid.innerHTML = '<p>Could not load projects.</p>';
        });
});

// Also export helper for use in dynamic loaders if needed
if (typeof window !== 'undefined') {
    window.createProjectCard = createProjectCard;
}