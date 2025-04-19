import './styles/main.css';
import { renderNavbar } from './components/Navbar.js';
import { renderHome } from './components/Home.js';
import { renderDetection } from './components/Detection.js';
import { renderHistory } from './components/History.js';
import { renderAbout } from './components/About.js';
import { renderContact } from './components/Contact.js';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');

    // Render navbar
    const navbar = renderNavbar();
    app.appendChild(navbar);

    // Create container for pages
    const container = document.createElement('div');
    container.className = 'container';
    app.appendChild(container);

    // Initialize pages
    const pages = {
        home: renderHome(),
        detection: renderDetection(),
        history: renderHistory(),
        about: renderAbout(),
        contact: renderContact()
    };

    // Add all pages to the container
    Object.entries(pages).forEach(([id, page]) => {
        page.id = id;
        page.className = `page ${id === 'home' ? 'active' : ''}`;
        container.appendChild(page);
    });

    // Create footer
    const footer = document.createElement('footer');
    footer.className = 'footer mt-5';
    footer.innerHTML = `
    <div class="container text-center">
      <p class="mb-0">&copy; 2024 Skin Cancer Detection. All rights reserved.</p>
    </div>
  `;
    app.appendChild(footer);

    // Handle navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);

            // Update active page
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            document.getElementById(targetId).classList.add('active');

            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(navLink => {
                navLink.classList.remove('active');
            });
            link.classList.add('active');

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}); 