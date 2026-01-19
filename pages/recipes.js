import { store } from '../utils/store.js';
import { recipeImages } from '../utils/imageGallery.js';

export async function RecipesPage() {
  await store.ensureInitialized();
  const container = document.createElement('div');
  container.className = 'space-y-6';

  let recipes = store.getAll('recipes') || [];
  let foods = store.getAll('foods') || [];
  let searchTerm = '';

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
    const filteredRecipes = recipes.filter(recipe => 
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.instructions.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (recipe.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    container.innerHTML = `
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 class="text-2xl font-bold text-gray-800">Ricettario</h2>
        
        <div class="flex gap-3">
          <div class="relative flex-1 max-w-md">
            <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"></i>
            <input type="text" id="recipe-search-input" placeholder="Cerca ricette, ingredienti o tag..." 
              value="${searchTerm}"
              class="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
          </div>
          
          <button id="add-recipe-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shrink-0">
            <i data-lucide="plus" class="w-4 h-4"></i>
            Aggiungi Ricetta
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="recipe-list">
        ${filteredRecipes.length > 0 ? filteredRecipes.map(recipe => {
          const totals = recipe.totals || calculateTotals(recipe.ingredients);
          return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow cursor-pointer recipe-card" data-id="${recipe.id}">
              <div class="h-48 bg-gray-200 relative">
                <img src="${recipe.image || 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(recipe.name.replace(/'/g, ''))}" 
                  onerror="this.onerror=null; this.src='https://via.placeholder.com/400x300?text=${encodeURIComponent(recipe.name.replace(/'/g, ''))}';" 
                  class="w-full h-full object-cover">
                <div class="absolute top-2 left-2 flex gap-1">
                  <span class="px-2 py-1 bg-white/90 rounded text-[10px] font-bold text-blue-600 uppercase shadow-sm">${recipe.difficulty || 'Media'}</span>
                  <span class="px-2 py-1 bg-white/90 rounded text-[10px] font-bold text-gray-600 uppercase shadow-sm">${recipe.prepTime || '30 min'}</span>
                </div>
                <div class="absolute top-2 right-2 flex gap-2">
                  <button class="p-2 bg-white/90 rounded-full text-gray-600 hover:text-blue-600 edit-recipe" data-id="${recipe.id}" onclick="event.stopPropagation()">
                    <i data-lucide="edit-2" class="w-4 h-4"></i>
                  </button>
                  <button class="p-2 bg-white/90 rounded-full text-gray-600 hover:text-red-600 delete-recipe" data-id="${recipe.id}" onclick="event.stopPropagation()">
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
                <div class="text-sm text-gray-600 line-clamp-2 mb-4">
                  ${recipe.instructions}
                </div>
                <div class="mt-auto flex flex-wrap gap-1">
                  ${(recipe.tags || []).slice(0, 3).map(tag => `
                    <span class="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold uppercase">${tag}</span>
                  `).join('')}
                </div>
              </div>
            </div>
          `;
        }).join('') : `
          <div class="col-span-full py-12 text-center">
            <div class="bg-gray-50 rounded-2xl p-8 max-w-sm mx-auto border border-dashed border-gray-200">
              <i data-lucide="search-x" class="w-12 h-12 text-gray-300 mx-auto mb-4"></i>
              <p class="text-gray-500 font-medium">Nessuna ricetta trovata per "${searchTerm}"</p>
              <button id="clear-search" class="mt-4 text-blue-600 text-sm font-bold hover:underline">Mostra tutte le ricette</button>
            </div>
          </div>
        `}
      </div>
    `;

    // Event listeners
    const searchInput = container.querySelector('#recipe-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value;
        render();
        // Maintain focus and cursor position after re-render
        const newInput = container.querySelector('#recipe-search-input');
        newInput.focus();
        newInput.setSelectionRange(searchTerm.length, searchTerm.length);
      });
    }

    const clearSearchBtn = container.querySelector('#clear-search');
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchTerm = '';
        render();
      });
    }

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

    container.querySelectorAll('.recipe-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        const recipe = store.getById('recipes', id);
        showRecipeDetailModal(recipe, foods);
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

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

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

export function showRecipeDetailModal(recipe, foods) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm';
  
  // Totals calculation helper (since we're outside the component scope)
  function calculateTotalsLocal(recipeIngredients) {
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

  const totals = recipe.totals || calculateTotalsLocal(recipe.ingredients);

    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        <div class="relative h-64 md:h-80 shrink-0">
          <img src="${recipe.image || 'https://via.placeholder.com/800x600'}" class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <button id="close-detail" class="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
          <div class="absolute bottom-6 left-6 right-6">
            <div class="flex gap-2 mb-2">
              <span class="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold uppercase tracking-wider">${recipe.difficulty || 'Media'}</span>
              <span class="px-2 py-1 bg-white/20 text-white rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">${recipe.prepTime || '30 min'}</span>
            </div>
            <h2 class="text-3xl font-bold text-white mb-2">${recipe.name}</h2>
            <div class="flex gap-4 text-white/90 text-sm">
              <div class="flex items-center gap-1"><i data-lucide="flame" class="w-4 h-4 text-orange-400"></i> ${totals.calories} Kcal</div>
              <div class="flex items-center gap-1"><i data-lucide="leaf" class="w-4 h-4 text-green-400"></i> ${recipe.tags?.join(', ') || 'Naturale'}</div>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div class="md:col-span-1 space-y-8">
              <div>
                <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Ingredienti</h3>
                <ul class="space-y-3">
                  ${recipe.ingredients.map(ing => {
                    const food = foods.find(f => f.id === ing.foodId);
                    return `
                      <li class="flex justify-between items-center text-gray-700 pb-2 border-b border-gray-50">
                        <span class="font-medium">${food?.name || 'Ingrediente'}</span>
                        <span class="text-gray-400 text-sm">${ing.amount}g</span>
                      </li>
                    `;
                  }).join('')}
                </ul>
              </div>

              <div class="bg-gray-50 p-6 rounded-xl space-y-4">
                <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest">Macro-nutrienti</h3>
                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Proteine</span>
                    <span class="font-bold text-green-600">${totals.protein}g</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Carboidrati</span>
                    <span class="font-bold text-yellow-600">${totals.carbs}g</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Grassi</span>
                    <span class="font-bold text-red-600">${totals.fats}g</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="md:col-span-2 space-y-8">
              <div>
                <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Preparazione</h3>
                <div class="space-y-6">
                  ${(recipe.steps || [recipe.instructions]).map((step, idx) => `
                    <div class="flex gap-4">
                      <div class="shrink-0 w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100">${idx + 1}</div>
                      <p class="text-gray-700 leading-relaxed pt-1">${step}</p>
                    </div>
                  `).join('')}
                </div>
              </div>

              ${recipe.tips && recipe.tips.length > 0 ? `
                <div class="bg-amber-50 border border-amber-100 p-6 rounded-xl">
                  <h3 class="flex items-center gap-2 text-sm font-bold text-amber-700 uppercase tracking-widest mb-4">
                    <i data-lucide="lightbulb" class="w-4 h-4"></i> I Consigli dello Chef
                  </h3>
                  <ul class="space-y-3">
                    ${recipe.tips.map(tip => `
                      <li class="flex gap-3 text-amber-800 text-sm">
                        <span class="text-amber-400">•</span>
                        <span>${tip}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();

    modal.querySelector('#close-detail').addEventListener('click', () => {
      modal.classList.add('animate-scale-out');
      setTimeout(() => modal.remove(), 200);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('animate-scale-out');
        setTimeout(() => modal.remove(), 200);
      }
    });
  }
