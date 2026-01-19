import { store } from './utils/store.js';
import { runTests } from './utils/tests.js';

// Expose tests to window
window.runTests = runTests;

// Import pages
import { DashboardPage } from './pages/dashboard.js';
import { FoodsPage } from './pages/foods.js';
import { RecipesPage } from './pages/recipes.js';
import { UsersPage } from './pages/users.js';
import { PlansPage } from './pages/plans.js';

const routes = {
  '/': DashboardPage,
  '/foods': FoodsPage,
  '/recipes': RecipesPage,
  '/users': UsersPage,
  '/plans': PlansPage
};

async function handleRoute() {
  const content = document.getElementById('content');
  if (!content) return;

  // Get current hash, default to #/
  let hash = window.location.hash || '#/';
  // Remove #
  let path = hash.slice(1) || '/';
  
  // Normalize path
  if (!path.startsWith('/')) path = '/' + path;

  const pageFunction = routes[path] || routes['/'];
  
  // Show loading
  content.innerHTML = '<div class="flex items-center justify-center h-full"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>';
  
  try {
    const pageContent = await pageFunction();
    content.innerHTML = '';
    content.appendChild(pageContent);
    
    // Update active links in bottom nav
    updateActiveLinks(path);
    // Update title
    updateTitle(path);
  } catch (error) {
    console.error('Routing error:', error);
    content.innerHTML = '<div class="p-4 text-red-500">Errore nel caricamento della pagina.</div>';
  }
}

function updateActiveLinks(currentPath) {
  document.querySelectorAll('nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    
    const linkPath = href.replace('#', '') || '/';
    const isHome = (linkPath === '/' && (currentPath === '/' || currentPath === ''));
    const isMatch = isHome || (linkPath !== '/' && currentPath.startsWith(linkPath));
    
    if (isMatch) {
      link.classList.add('text-blue-600');
      link.classList.remove('text-gray-500');
    } else {
      link.classList.remove('text-blue-600');
      link.classList.add('text-gray-500');
    }
  });
}

function updateTitle(path) {
  const titles = {
    '/': 'Dashboard',
    '/foods': 'Alimenti',
    '/recipes': 'Ricettario',
    '/users': 'Gestione Utenti',
    '/plans': 'Piani Alimentari'
  };
  
  const title = titles[path] || 'DietaPro';
  const titleEl = document.getElementById('page-title');
  if (titleEl) {
    titleEl.textContent = title;
  }
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Global function to update title (called by pages if needed)
window.updatePageTitle = () => {
  let hash = window.location.hash || '#/';
  let path = hash.slice(1) || '/';
  updateTitle(path);
};

document.addEventListener('DOMContentLoaded', () => {
  // Listen for hash changes
  window.addEventListener('hashchange', handleRoute);
  
  // Initial route
  handleRoute();

  // PWA Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js')
        .then(reg => console.log('Service Worker registered'))
        .catch(err => console.log('Service Worker registration failed', err));
    });
  }

  // PWA Install Prompt Handling
  window.deferredPrompt = null;
  const installBtn = document.getElementById('install-btn');

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    window.deferredPrompt = e;
    // Update UI to notify the user they can add to home screen
    if (installBtn) {
      installBtn.classList.remove('hidden');
      installBtn.classList.add('flex');
    }
    // Notify other components
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!window.deferredPrompt) return;
      // Show the prompt
      window.deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await window.deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      // We've used the prompt, and can't use it again, throw it away
      window.deferredPrompt = null;
      // Hide the install button
      installBtn.classList.add('hidden');
      installBtn.classList.remove('flex');
    });
  }

  window.addEventListener('appinstalled', (evt) => {
    console.log('App was installed');
    if (installBtn) {
      installBtn.classList.add('hidden');
      installBtn.classList.remove('flex');
    }
  });
});
