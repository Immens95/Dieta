export class Router {
  constructor(routes, rootElementId) {
    this.routes = routes;
    this.rootElement = document.getElementById(rootElementId);
    this.currentPath = null;

    window.addEventListener('popstate', () => this.handleRoute());
    
    // Intercept link clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[data-link]');
      if (link) {
        e.preventDefault();
        this.navigate(link.getAttribute('href'));
      }
    });
  }

  navigate(path) {
    window.history.pushState({}, '', path);
    this.handleRoute();
  }

  async handleRoute() {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    const route = this.routes[path] || this.routes['/404'] || this.routes['/'];
    
    this.currentPath = path;
    
    if (this.rootElement) {
      // Clear current content
      this.rootElement.innerHTML = '<div class="flex items-center justify-center h-full"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>';
      
      try {
        const content = await route();
        this.rootElement.innerHTML = '';
        this.rootElement.appendChild(content);
      } catch (error) {
        console.error('Routing error:', error);
        this.rootElement.innerHTML = '<div class="p-4 text-red-500">Errore nel caricamento della pagina.</div>';
      }
    }
    
    // Update active links in sidebar
    this.updateActiveLinks();
  }

  updateActiveLinks() {
    document.querySelectorAll('a[data-link]').forEach(link => {
      if (link.getAttribute('href') === this.currentPath) {
        link.classList.add('bg-blue-600', 'text-white');
        link.classList.remove('text-gray-300', 'hover:bg-gray-700');
      } else {
        link.classList.remove('bg-blue-600', 'text-white');
        link.classList.add('text-gray-300', 'hover:bg-gray-700');
      }
    });
  }
}
