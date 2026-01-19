export class Router {
  constructor(routes, rootElementId) {
    this.routes = routes;
    this.rootElement = document.getElementById(rootElementId);
    this.currentPath = null;
    
    // Determine base path (e.g., "/Dieta" if hosted at localhost/Dieta/)
    this.basePath = window.location.pathname.replace(/\/$/, '') || '';
    // If the path ends with a known route, strip it to get the actual base
    const knownRoutes = Object.keys(routes).filter(r => r !== '/');
    for (const route of knownRoutes) {
      if (this.basePath.endsWith(route)) {
        this.basePath = this.basePath.slice(0, -route.length);
        break;
      }
    }

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
    const fullPath = this.basePath + (path === '/' ? '' : path);
    window.history.pushState({}, '', fullPath || '/');
    this.handleRoute();
  }

  async handleRoute() {
    let path = window.location.pathname;
    
    // Remove base path from current pathname to get the route
    if (this.basePath && path.startsWith(this.basePath)) {
      path = path.slice(this.basePath.length);
    }
    
    // Normalize path
    path = path.replace(/\/$/, '') || '/';
    
    const route = this.routes[path] || this.routes['/404'] || this.routes['/'];
    
    this.currentPath = path;
    
    if (this.rootElement) {
      // Clear current content
      this.rootElement.innerHTML = '<div class="flex items-center justify-center h-full"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>';
      
      try {
        const content = await route();
        this.rootElement.innerHTML = '';
        this.rootElement.appendChild(content);
        
        // Update page title globally
        if (window.updatePageTitle) {
          window.updatePageTitle(path);
        }
      } catch (error) {
        console.error('Routing error:', error);
        this.rootElement.innerHTML = '<div class="p-4 text-red-500">Errore nel caricamento della pagina.</div>';
      }
    }
    
    // Update active links
    this.updateActiveLinks();
  }

  updateActiveLinks() {
    document.querySelectorAll('a[data-link]').forEach(link => {
      const href = link.getAttribute('href');
      const isHome = href === '/' && (this.currentPath === '/' || this.currentPath === '');
      const isOther = href !== '/' && this.currentPath.startsWith(href);
      
      if (isHome || isOther) {
        link.classList.add('text-blue-600');
        link.classList.remove('text-gray-500');
      } else {
        link.classList.remove('text-blue-600');
        link.classList.add('text-gray-500');
      }
    });
  }
}
