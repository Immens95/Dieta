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
  const router = new Router(routes, 'content');
  
  // Initial route
  router.handleRoute();

  // Listen for title changes
  window.addEventListener('popstate', () => {
    updateTitle();
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
  
  const path = normalizedPath || window.location.pathname.replace(/\/$/, '') || '/';
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
