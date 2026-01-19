import { store } from '../utils/store.js';
import { recipeImages } from '../utils/imageGallery.js';

export async function RecipesPage() {
  await store.ensureInitialized();
  const container = document.createElement('div');
  container.className = 'space-y-6';

  let recipes = store.getAll('recipes') || [];
  let foods = store.getAll('foods') || [];

  function calculateTotals(recipeIngredients) {
    return recipeIngredients.reduce((acc, item) => {
      const food = foods.find(f => f.id === item.foodId);
      if (food) {
        const factor = item.amount / 100;
        acc.calories += food.calories * factor;
        acc.protein += food.protein * factor;
        acc.carbs += food.carbs * factor;
        acc.fats += food.fats * factor;
      }
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
  }

  function render() {
    container.innerHTML = `
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-800">Ricettario</h2>
        <button id="add-recipe-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
          <i data-lucide="plus" class="w-4 h-4"></i>
          Aggiungi Ricetta
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="recipe-list">
        ${recipes.map(recipe => {
          const totals = calculateTotals(recipe.ingredients);
          return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div class="h-48 bg-gray-200 relative">
                <img src="${recipe.image || 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(recipe.name)}" 
                  onerror="this.onerror=null; this.src='https://via.placeholder.com/400x300?text=${encodeURIComponent(recipe.name)}';" 
                  class="w-full h-full object-cover">
                <div class="absolute top-2 right-2 flex gap-2">
                  <button class="p-2 bg-white/90 rounded-full text-gray-600 hover:text-blue-600 edit-recipe" data-id="${recipe.id}">
                    <i data-lucide="edit-2" class="w-4 h-4"></i>
                  </button>
                  <button class="p-2 bg-white/90 rounded-full text-gray-600 hover:text-red-600 delete-recipe" data-id="${recipe.id}">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>
              <div class="p-5 flex-1 flex flex-col">
                <h3 class="text-lg font-bold text-gray-900 mb-2">${recipe.name}</h3>
                <div class="grid grid-cols-4 gap-2 mb-4">
                  <div class="text-center p-2 bg-blue-50 rounded-lg">
                    <div class="text-[10px] text-blue-500 uppercase font-bold">Kcal</div>
                    <div class="text-sm font-bold text-blue-700">${Math.round(totals.calories)}</div>
                  </div>
                  <div class="text-center p-2 bg-green-50 rounded-lg">
                    <div class="text-[10px] text-green-500 uppercase font-bold">Pro</div>
                    <div class="text-sm font-bold text-green-700">${Math.round(totals.protein)}g</div>
                  </div>
                  <div class="text-center p-2 bg-yellow-50 rounded-lg">
                    <div class="text-[10px] text-yellow-500 uppercase font-bold">Carb</div>
                    <div class="text-sm font-bold text-yellow-700">${Math.round(totals.carbs)}g</div>
                  </div>
                  <div class="text-center p-2 bg-red-50 rounded-lg">
                    <div class="text-[10px] text-red-500 uppercase font-bold">Fat</div>
                    <div class="text-sm font-bold text-red-700">${Math.round(totals.fats)}g</div>
                  </div>
                </div>
                <div class="text-sm text-gray-600 line-clamp-3 mb-4">
                  ${recipe.instructions}
                </div>
                <div class="mt-auto pt-4 border-t border-gray-50">
                  <div class="text-xs font-semibold text-gray-400 uppercase mb-2">Ingredienti</div>
                  <div class="flex flex-wrap gap-2">
                    ${recipe.ingredients.map(ing => {
                      const food = foods.find(f => f.id === ing.foodId);
                      return `<span class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">${food?.name} (${ing.amount}g)</span>`;
                    }).join('')}
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Event listeners
    container.querySelector('#add-recipe-btn').addEventListener('click', () => showRecipeModal());
    
    container.querySelectorAll('.delete-recipe').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Eliminare questa ricetta?')) {
          store.delete('recipes', id);
          recipes = store.getAll('recipes');
          render();
        }
      });
    });

    container.querySelectorAll('.edit-recipe').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const recipe = store.getById('recipes', id);
        showRecipeModal(recipe);
      });
    });

    if (window.lucide) window.lucide.createIcons();
    if (window.updatePageTitle) window.updatePageTitle();
  }

  function showRecipeModal(recipe = null) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
    
    let currentIngredients = recipe ? [...recipe.ingredients] : [];
    let selectedImageUrl = recipe?.image || '';

    function renderModalContent() {
      modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
          <h3 class="text-xl font-bold mb-4">${recipe ? 'Modifica Ricetta' : 'Aggiungi Ricetta'}</h3>
          <form id="recipe-form" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Nome Ricetta</label>
                  <input type="text" name="name" value="${recipe?.name || ''}" required class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
                </div>

                <div>
                  <div class="flex justify-between items-center mb-2">
                    <label class="block text-sm font-medium text-gray-700">Ingredienti</label>
                    <button type="button" id="add-ing-row" class="text-blue-600 text-xs font-bold hover:underline">+ Aggiungi</button>
                  </div>
                  <div id="ingredients-list" class="space-y-2 max-h-[200px] overflow-y-auto p-1">
                    ${currentIngredients.map((ing, idx) => `
                      <div class="flex gap-2 items-center">
                        <select class="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm ing-food" data-idx="${idx}">
                          ${foods.map(f => `<option value="${f.id}" ${f.id === ing.foodId ? 'selected' : ''}>${f.name}</option>`).join('')}
                        </select>
                        <input type="number" value="${ing.amount}" class="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm ing-amount" data-idx="${idx}" placeholder="g">
                        <button type="button" class="text-red-500 remove-ing" data-idx="${idx}"><i data-lucide="x" class="w-4 h-4"></i></button>
                      </div>
                    `).join('')}
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700">Istruzioni</label>
                  <textarea name="instructions" rows="4" required class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">${recipe?.instructions || ''}</textarea>
                </div>
              </div>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Immagine (URL o scegli sotto)</label>
                  <input type="text" id="image-url-input" name="image" value="${selectedImageUrl}" class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
                </div>
                
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-gray-700">Galleria Ricette</label>
                  <div class="grid grid-cols-2 gap-2 overflow-y-auto max-h-[200px] border border-gray-100 p-2 rounded-lg">
                    ${recipeImages.map(img => `
                      <img src="${img.url}" alt="${img.name}" 
                        class="w-full h-20 object-cover rounded-md cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all image-option ${selectedImageUrl === img.url ? 'ring-2 ring-blue-600' : ''}" 
                        data-url="${img.url}">
                    `).join('')}
                  </div>
                </div>

                <div class="p-2 border border-blue-100 bg-blue-50 rounded-lg text-center">
                  <p class="text-xs text-blue-600 font-medium mb-1">Anteprima Ricetta</p>
                  <img id="modal-image-preview" src="${selectedImageUrl || 'https://via.placeholder.com/150'}" class="h-40 w-full object-cover rounded-lg mx-auto border border-white shadow-sm">
                </div>

                <div class="bg-gray-50 p-4 rounded-lg">
                  <div class="text-xs font-bold text-gray-400 uppercase mb-2">Totali Nutrizionali (Stimati)</div>
                  <div id="recipe-totals" class="grid grid-cols-4 gap-4">
                    <!-- Calculated dynamically -->
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" id="close-modal" class="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">Annulla</button>
              <button type="submit" class="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors shadow-sm">Salva Ricetta</button>
            </div>
          </form>
        </div>
      `;

      updateTotals();

      const previewImg = modal.querySelector('#modal-image-preview');
      const urlInput = modal.querySelector('#image-url-input');

      modal.querySelectorAll('.image-option').forEach(img => {
        img.addEventListener('click', () => {
          modal.querySelectorAll('.image-option').forEach(i => i.classList.remove('ring-2', 'ring-blue-600'));
          img.classList.add('ring-2', 'ring-blue-600');
          selectedImageUrl = img.getAttribute('data-url');
          urlInput.value = selectedImageUrl;
          previewImg.src = selectedImageUrl;
        });
      });

      urlInput.addEventListener('input', (e) => {
        selectedImageUrl = e.target.value;
        previewImg.src = selectedImageUrl || 'https://via.placeholder.com/150';
      });

      modal.querySelector('#close-modal').addEventListener('click', () => modal.remove());
      
      modal.querySelector('#add-ing-row').addEventListener('click', () => {
        currentIngredients.push({ foodId: foods[0].id, amount: 100 });
        renderModalContent();
      });

      modal.querySelectorAll('.remove-ing').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-idx'));
          currentIngredients.splice(idx, 1);
          renderModalContent();
        });
      });

      modal.querySelectorAll('.ing-food').forEach(sel => {
        sel.addEventListener('change', (e) => {
          const idx = parseInt(sel.getAttribute('data-idx'));
          currentIngredients[idx].foodId = e.target.value;
          updateTotals();
        });
      });

      modal.querySelectorAll('.ing-amount').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const idx = parseInt(inp.getAttribute('data-idx'));
          currentIngredients[idx].amount = Number(e.target.value);
          updateTotals();
        });
      });

      modal.querySelector('#recipe-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
          name: formData.get('name'),
          instructions: formData.get('instructions'),
          ingredients: currentIngredients,
          image: selectedImageUrl
        };

        if (recipe) {
          await store.update('recipes', recipe.id, data);
        } else {
          await store.add('recipes', data);
        }

        modal.remove();
        recipes = store.getAll('recipes');
        render();
      });

      if (window.lucide) window.lucide.createIcons();
    }

    function updateTotals() {
      const totals = calculateTotals(currentIngredients);
      const container = modal.querySelector('#recipe-totals');
      if (container) {
        container.innerHTML = `
          <div class="text-center"><div class="text-lg font-bold">${Math.round(totals.calories)}</div><div class="text-[10px] text-gray-500">Kcal</div></div>
          <div class="text-center"><div class="text-lg font-bold">${Math.round(totals.protein)}g</div><div class="text-[10px] text-gray-500">Pro</div></div>
          <div class="text-center"><div class="text-lg font-bold">${Math.round(totals.carbs)}g</div><div class="text-[10px] text-gray-500">Carb</div></div>
          <div class="text-center"><div class="text-lg font-bold">${Math.round(totals.fats)}g</div><div class="text-[10px] text-gray-500">Fat</div></div>
        `;
      }
    }

    renderModalContent();
    document.body.appendChild(modal);
  }

  render();
  return container;
}
