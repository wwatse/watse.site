document.addEventListener('DOMContentLoaded', () => {
    const projectsGrid = document.querySelector('.projects-grid');
    if (!projectsGrid) return;

    fetch('content/data/projects.json')
        .then(response => response.json())
        .then(projects => {
            const featuredProjects = projects.filter(project => project.featured);
            
            projectsGrid.innerHTML = '';

            featuredProjects.forEach(project => {
                const projectCard = document.createElement('div');
                projectCard.className = 'project-card';
                if (project.id === 'latest-project') {
                    projectCard.id = 'latest-project';
                }

                projectCard.innerHTML = `
                    <a href="/project?slug=${project.slug}" class="project-link">
                        <div class="project-thumbnail"></div>
                        <div class="project-info">
                            <p class="project-title">${project.title}</p>
                            <p class="project-description">${project.description}</p>
                            <span class="project-tag">${project.tag}</span>
                        </div>
                    </a>
                `;
                projectsGrid.appendChild(projectCard);
            });
        })
        .catch(error => {
            console.error('Error fetching projects:', error);
            projectsGrid.innerHTML = '<p>Could not load projects.</p>';
        });
});