import { store } from '../utils/store.js';

export async function FoodsPage() {
  const container = document.createElement('div');
  container.className = 'space-y-6';

  let foods = store.getAll('foods');

  function render() {
    container.innerHTML = `
      <div class="flex justify-between items-center">
        <div class="relative w-64">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <i data-lucide="search" class="w-4 h-4"></i>
          </span>
          <input type="text" id="food-search" placeholder="Cerca alimento..." 
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm">
        </div>
        <button id="add-food-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
          <i data-lucide="plus" class="w-4 h-4"></i>
          Aggiungi Alimento
        </button>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Alimento</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Calorie</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Proteine</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Carboidrati</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Grassi</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Azioni</th>
            </tr>
          </thead>
          <tbody id="food-table-body">
            ${foods.map(food => `
              <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer food-row" data-id="${food.id}">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <img src="${food.image || 'https://via.placeholder.com/40'}" class="w-10 h-10 rounded-lg object-cover">
                    <div>
                      <div class="font-medium text-gray-900">${food.name}</div>
                      <div class="text-xs text-gray-500">Unità: ${food.unit}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-center font-medium">${food.calories}</td>
                <td class="px-6 py-4 text-center text-blue-600 font-medium">${food.protein}g</td>
                <td class="px-6 py-4 text-center text-green-600 font-medium">${food.carbs}g</td>
                <td class="px-6 py-4 text-center text-red-600 font-medium">${food.fats}g</td>
                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end gap-2">
                    <button class="p-2 text-gray-400 hover:text-blue-600 transition-colors edit-food" data-id="${food.id}">
                      <i data-lucide="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button class="p-2 text-gray-400 hover:text-red-600 transition-colors delete-food" data-id="${food.id}">
                      <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Add event listeners
    container.querySelector('#food-search').addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = store.getAll('foods').filter(f => f.name.toLowerCase().includes(query));
      updateTable(filtered);
    });

    container.querySelector('#add-food-btn').addEventListener('click', () => {
      showFoodModal();
    });

    container.addEventListener('click', (e) => {
      const row = e.target.closest('.food-row');
      const deleteBtn = e.target.closest('.delete-food');
      const editBtn = e.target.closest('.edit-food');

      if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
        if (confirm('Sei sicuro di voler eliminare questo alimento?')) {
          store.delete('foods', id);
          foods = store.getAll('foods');
          render();
        }
        return;
      }

      if (editBtn || row) {
        const id = (editBtn || row).getAttribute('data-id');
        const food = store.getById('foods', id);
        showFoodModal(food);
      }
    });

    if (window.lucide) window.lucide.createIcons();
    if (window.updatePageTitle) window.updatePageTitle();
  }

  function updateTable(filteredFoods) {
    const tbody = container.querySelector('#food-table-body');
    tbody.innerHTML = filteredFoods.map(food => `
      <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer food-row" data-id="${food.id}">
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <img src="${food.image || 'https://via.placeholder.com/40'}" class="w-10 h-10 rounded-lg object-cover">
            <div>
              <div class="font-medium text-gray-900">${food.name}</div>
              <div class="text-xs text-gray-500">Unità: ${food.unit}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 text-center font-medium">${food.calories}</td>
        <td class="px-6 py-4 text-center text-blue-600 font-medium">${food.protein}g</td>
        <td class="px-6 py-4 text-center text-green-600 font-medium">${food.carbs}g</td>
        <td class="px-6 py-4 text-center text-red-600 font-medium">${food.fats}g</td>
        <td class="px-6 py-4 text-right">
          <div class="flex justify-end gap-2">
            <button class="p-2 text-gray-400 hover:text-blue-600 transition-colors edit-food" data-id="${food.id}">
              <i data-lucide="edit-2" class="w-4 h-4"></i>
            </button>
            <button class="p-2 text-gray-400 hover:text-red-600 transition-colors delete-food" data-id="${food.id}">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    if (window.lucide) window.lucide.createIcons();
  }

  function showFoodModal(food = null) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 class="text-xl font-bold">${food ? 'Modifica Alimento' : 'Aggiungi Alimento'}</h3>
        <form id="food-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Nome</label>
            <input type="text" name="name" value="${food?.name || ''}" required class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Calorie (per 100g/ml)</label>
              <input type="number" name="calories" value="${food?.calories || ''}" required class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Proteine (g)</label>
              <input type="number" step="0.1" name="protein" value="${food?.protein || ''}" required class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Carboidrati (g)</label>
              <input type="number" step="0.1" name="carbs" value="${food?.carbs || ''}" required class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Grassi (g)</label>
              <input type="number" step="0.1" name="fats" value="${food?.fats || ''}" required class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Unità</label>
            <select name="unit" class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="100g" ${food?.unit === '100g' ? 'selected' : ''}>100g</option>
              <option value="100ml" ${food?.unit === '100ml' ? 'selected' : ''}>100ml</option>
            </select>
          </div>
          <div class="flex justify-end gap-3 pt-4">
            <button type="button" id="close-modal" class="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">Annulla</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors">Salva</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#close-modal').addEventListener('click', () => modal.remove());
    modal.querySelector('#food-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());
      
      // Convert numbers
      data.calories = Number(data.calories);
      data.protein = Number(data.protein);
      data.carbs = Number(data.carbs);
      data.fats = Number(data.fats);

      // Auto-fetch image if name changed or new
      if (!food || food.name !== data.name) {
        data.image = `https://loremflickr.com/300/300/food,${encodeURIComponent(data.name)}`;
      } else {
        data.image = food.image;
      }

      if (food) {
        store.update('foods', food.id, data);
      } else {
        store.add('foods', data);
      }

      modal.remove();
      foods = store.getAll('foods');
      render();
    });
  }

  render();
  return container;
}
