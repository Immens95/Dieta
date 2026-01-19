import { store } from '../utils/store.js';

export async function DashboardPage() {
  const container = document.createElement('div');
  container.className = 'space-y-6';

  const users = store.getAll('users');
  const user = users[0]; // Default to first user for demo

  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <i data-lucide="activity" class="w-6 h-6"></i>
          </div>
          <div>
            <p class="text-sm text-gray-500">Kcal Giornaliere</p>
            <p class="text-2xl font-bold">2,450</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-green-100 text-green-600 rounded-lg">
            <i data-lucide="beef" class="w-6 h-6"></i>
          </div>
          <div>
            <p class="text-sm text-gray-500">Proteine</p>
            <p class="text-2xl font-bold">160g</p>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
            <i data-lucide="wheat" class="w-6 h-6"></i>
          </div>
          <div>
            <p class="text-sm text-gray-500">Carboidrati</p>
            <p class="text-2xl font-bold">250g</p>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-red-100 text-red-600 rounded-lg">
            <i data-lucide="droplet" class="w-6 h-6"></i>
          </div>
          <div>
            <p class="text-sm text-gray-500">Grassi</p>
            <p class="text-2xl font-bold">70g</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 class="text-lg font-semibold mb-4">Andamento Peso</h3>
        <div class="h-64 flex items-end gap-2 px-2">
          ${[65, 70, 68, 72, 75, 73, 70].map(h => `
            <div class="flex-1 bg-blue-500 rounded-t" style="height: ${h}%"></div>
          `).join('')}
        </div>
        <div class="flex justify-between mt-2 text-xs text-gray-400">
          <span>Lun</span><span>Mar</span><span>Mer</span><span>Gio</span><span>Ven</span><span>Sab</span><span>Dom</span>
        </div>
      </div>

      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 class="text-lg font-semibold mb-4">Obiettivo Corrente</h3>
        <div class="space-y-4">
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span>Perdita Peso</span>
              <span class="font-medium">65%</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-2">
              <div class="bg-blue-600 h-2 rounded-full" style="width: 65%"></div>
            </div>
          </div>
          <p class="text-sm text-gray-600 mt-4">
            Stai andando bene! Hai perso 3.2kg nelle ultime 4 settimane. Mantieni questo ritmo per raggiungere il tuo obiettivo in 8 settimane.
          </p>
        </div>
      </div>
    </div>
  `;

  // Re-initialize icons
  setTimeout(() => {
    if (window.lucide) window.lucide.createIcons();
    if (window.updatePageTitle) window.updatePageTitle();
  }, 0);

  return container;
}
