import { Router } from './utils/router.js';
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
  '/plans': PlansPage,
  '/404': () => {
    const el = document.createElement('div');
    el.innerHTML = '<h1 class="text-2xl font-bold">404 - Pagina non trovata</h1>';
    return el;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.router = new Router(routes, 'content');
  
  // Initial route
  window.router.handleRoute();

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

function updateTitle(normalizedPath) {
  const titles = {
    '/': 'Dashboard',
    '/foods': 'Alimenti',
    '/recipes': 'Ricettario',
    '/users': 'Gestione Utenti',
    '/plans': 'Piani Alimentari'
  };
  
  let path = normalizedPath;
  if (!path) {
    path = window.location.pathname;
    if (window.router && window.router.basePath && path.startsWith(window.router.basePath)) {
      path = path.slice(window.router.basePath.length);
    }
    path = path.replace(/\/$/, '') || '/';
  }
  
  const title = titles[path] || 'DietaPro';
  
  const titleEl = document.getElementById('page-title');
  if (titleEl) {
    titleEl.textContent = title;
  }
  
  // Re-initialize icons after route change
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Global function to update title (called by router too)
window.updatePageTitle = updateTitle;
