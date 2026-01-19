import { store } from '../utils/store.js';
import { recipeImages, getUnsplashUrl, searchUnsplashImages } from '../utils/imageGallery.js';

export async function RecipesPage() {
  await store.ensureInitialized();
  const container = document.createElement('div');
  container.className = 'space-y-6';

  let recipes = store.getAll('recipes') || [];
  let foods = store.getAll('foods') || [];
  let users = store.getAll('users') || [];
  let searchTerm = '';
  let selectedUserId = '';
  let selectedMeal = '';
  let sortBy = 'name'; // 'name', 'time', 'difficulty', 'kcal'
  let sortOrder = 'asc'; // 'asc', 'desc'

  function calculateUserDailyCals(user) {
    if (!user) return 2000;
    if (user.manualTargetKcal) return user.manualTargetKcal;

    // Mifflin-St Jeor Equation
    let bmr = (10 * user.weight) + (6.25 * user.height) - (5 * user.age);
    bmr = user.sex === 'male' ? bmr + 5 : bmr - 161;
    
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      medium: 1.55,
      active: 1.725
    };
    
    let tdee = bmr * (activityMultipliers[user.activityLevel] || 1.2);
    
    const kgToLose = user.weight - user.targetWeight;
    if (Math.abs(kgToLose) > 0.1) {
      const totalDeficitNeeded = kgToLose * 7700;
      const dailyDeficit = totalDeficitNeeded / ((user.goalWeeks || 12) * 7);
      return Math.round(tdee - dailyDeficit);
    }
    
    return Math.round(tdee);
  }

  function getMealTargetCals(user, meal) {
    if (!user) return null;
    const dailyTarget = calculateUserDailyCals(user);
    const mealTargets = {
      'Colazione': 0.20,
      'Pranzo': 0.35,
      'Cena': 0.30,
      'Merenda': 0.15
    };
    return dailyTarget * (mealTargets[meal] || 0.25);
  }

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
    const selectedUser = users.find(u => u.id === selectedUserId);
    const mealTargetCals = (selectedUser && selectedMeal) ? getMealTargetCals(selectedUser, selectedMeal) : null;

    let filteredRecipes = recipes.filter(recipe => {
      // Search filter
      const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.instructions.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (recipe.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchesSearch) return false;

      // Meal filter
      if (selectedMeal && !(recipe.mealCategories || []).includes(selectedMeal)) return false;

      // User health/intolerance filter
      if (selectedUser) {
        const intolerances = (selectedUser.intolerances || []).map(i => i.toLowerCase());
        const conditions = (selectedUser.healthConditions || []).map(c => c.toLowerCase());

        if ((intolerances.includes('gluten') || intolerances.includes('glutine')) && !recipe.tags?.includes('gluten-free')) return false;
        if ((intolerances.includes('lactose') || intolerances.includes('lattosio')) && !recipe.tags?.includes('lactose-free')) return false;
        if ((conditions.includes('reflux') || conditions.includes('reflusso')) && !recipe.tags?.includes('low-acid')) return false;
      }

      return true;
    });

    // Sorting
    filteredRecipes.sort((a, b) => {
      let valA, valB;
      
      switch (sortBy) {
        case 'time':
          valA = parseInt(a.prepTime) || 0;
          valB = parseInt(b.prepTime) || 0;
          break;
        case 'difficulty':
          const diffMap = { 'Facile': 1, 'Media': 2, 'Difficile': 3 };
          valA = diffMap[a.difficulty] || 2;
          valB = diffMap[b.difficulty] || 2;
          break;
        case 'kcal':
          const totalsA = a.totals || calculateTotals(a.ingredients);
          const totalsB = b.totals || calculateTotals(b.ingredients);
          valA = totalsA.calories;
          valB = totalsB.calories;
          break;
        default:
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div class="flex flex-col md:flex-row items-start md:items-center gap-4 w-full xl:w-auto">
            <h2 class="text-2xl font-bold text-gray-800 shrink-0">Ricettario</h2>
            
            <div class="flex flex-wrap items-center gap-3 w-full">
              <!-- Context Selector -->
              <div class="flex items-center gap-2 bg-blue-50/50 p-1.5 rounded-lg border border-blue-100">
                <i data-lucide="user" class="w-4 h-4 text-blue-600 ml-1"></i>
                <select id="user-context" class="bg-transparent text-sm font-bold text-blue-700 border-none focus:ring-0 cursor-pointer py-1">
                  <option value="">Nessun Utente</option>
                  ${users.map(u => `<option value="${u.id}" ${u.id === selectedUserId ? 'selected' : ''}>${u.name}</option>`).join('')}
                </select>
                <div class="w-px h-4 bg-blue-200 mx-1"></div>
                <i data-lucide="clock" class="w-4 h-4 text-blue-600"></i>
                <select id="meal-context" class="bg-transparent text-sm font-bold text-blue-700 border-none focus:ring-0 cursor-pointer py-1">
                  <option value="">Qualsiasi Pasto</option>
                  ${['Colazione', 'Pranzo', 'Cena', 'Merenda'].map(m => `<option value="${m}" ${m === selectedMeal ? 'selected' : ''}>${m}</option>`).join('')}
                </select>
              </div>

              <!-- Sorting -->
              <div class="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                <i data-lucide="filter" class="w-4 h-4 text-gray-500 ml-1"></i>
                <select id="sort-by" class="bg-transparent text-sm font-medium text-gray-700 border-none focus:ring-0 cursor-pointer py-1">
                  <option value="name" ${sortBy === 'name' ? 'selected' : ''}>Nome</option>
                  <option value="time" ${sortBy === 'time' ? 'selected' : ''}>Tempo</option>
                  <option value="difficulty" ${sortBy === 'difficulty' ? 'selected' : ''}>Difficoltà</option>
                  <option value="kcal" ${sortBy === 'kcal' ? 'selected' : ''}>Kcal</option>
                </select>
                <button id="toggle-sort-order" class="p-1 hover:bg-gray-200 rounded text-gray-500">
                  <i data-lucide="${sortOrder === 'asc' ? 'arrow-up-narrow-wide' : 'arrow-down-wide-narrow'}" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          </div>
          
          <div class="flex gap-3 w-full xl:w-auto">
            <div class="relative flex-1 md:w-64">
              <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"></i>
              <input type="text" id="recipe-search-input" placeholder="Cerca ricette..." 
                value="${searchTerm}"
                class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
            </div>
            
            <button id="add-recipe-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all shrink-0 shadow-sm shadow-blue-100">
              <i data-lucide="plus" class="w-4 h-4"></i>
              Nuova
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="recipe-list">
          ${filteredRecipes.length > 0 ? filteredRecipes.map(recipe => {
            const baseTotals = recipe.totals || calculateTotals(recipe.ingredients);
            let displayTotals = baseTotals;
            let isAdapted = false;

            if (mealTargetCals && baseTotals.calories > 0) {
              const scaleFactor = mealTargetCals / baseTotals.calories;
              displayTotals = {
                calories: baseTotals.calories * scaleFactor,
                protein: baseTotals.protein * scaleFactor,
                carbs: baseTotals.carbs * scaleFactor,
                fats: baseTotals.fats * scaleFactor
              };
              isAdapted = true;
            }

            return `
              <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 group recipe-card" data-id="${recipe.id}">
                <div class="h-52 bg-gray-200 relative overflow-hidden">
                  <img src="${recipe.image || 'https://via.placeholder.com/400x300'}" 
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                  <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div class="absolute top-3 left-3 flex gap-1.5">
                    <span class="px-2 py-1 bg-white/95 backdrop-blur shadow-sm rounded-lg text-[10px] font-extrabold text-blue-600 uppercase tracking-tighter">${recipe.difficulty || 'Media'}</span>
                    <span class="px-2 py-1 bg-white/95 backdrop-blur shadow-sm rounded-lg text-[10px] font-extrabold text-gray-600 uppercase tracking-tighter">${recipe.prepTime || '30 min'}</span>
                    ${isAdapted ? `<span class="px-2 py-1 bg-green-600 shadow-sm rounded-lg text-[10px] font-extrabold text-white uppercase tracking-tighter">Adattata</span>` : ''}
                  </div>

                  <div class="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-[-10px] group-hover:translate-y-0 transition-all duration-300">
                    <button class="p-2.5 bg-white rounded-xl text-gray-600 hover:text-blue-600 hover:shadow-lg edit-recipe transition-all" data-id="${recipe.id}" onclick="event.stopPropagation()">
                      <i data-lucide="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button class="p-2.5 bg-white rounded-xl text-gray-600 hover:text-red-600 hover:shadow-lg delete-recipe transition-all" data-id="${recipe.id}" onclick="event.stopPropagation()">
                      <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>

                <div class="p-5 flex-1 flex flex-col">
                  <div class="mb-3">
                    <div class="flex flex-wrap gap-1 mb-2">
                      ${(recipe.mealCategories || []).map(cat => `
                        <span class="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-bold uppercase border border-blue-100">${cat}</span>
                      `).join('')}
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">${recipe.name}</h3>
                  </div>

                  <div class="grid grid-cols-4 gap-2 mb-5">
                    <div class="text-center p-2 bg-blue-50/50 rounded-xl border border-blue-100/50">
                      <div class="text-[9px] text-blue-400 uppercase font-black mb-0.5">Kcal</div>
                      <div class="text-sm font-black text-blue-700">${Math.round(displayTotals.calories)}</div>
                    </div>
                    <div class="text-center p-2 bg-green-50/50 rounded-xl border border-green-100/50">
                      <div class="text-[9px] text-green-400 uppercase font-black mb-0.5">Pro</div>
                      <div class="text-sm font-black text-green-700">${Math.round(displayTotals.protein)}g</div>
                    </div>
                    <div class="text-center p-2 bg-yellow-50/50 rounded-xl border border-yellow-100/50">
                      <div class="text-[9px] text-yellow-400 uppercase font-black mb-0.5">Carb</div>
                      <div class="text-sm font-black text-yellow-700">${Math.round(displayTotals.carbs)}g</div>
                    </div>
                    <div class="text-center p-2 bg-red-50/50 rounded-xl border border-red-100/50">
                      <div class="text-[9px] text-red-400 uppercase font-black mb-0.5">Fat</div>
                      <div class="text-sm font-black text-red-700">${Math.round(displayTotals.fats)}g</div>
                    </div>
                  </div>

                  <div class="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div class="flex flex-wrap gap-1">
                      ${(recipe.tags || []).slice(0, 2).map(tag => `
                        <span class="text-[10px] font-bold text-gray-400 uppercase">#${tag}</span>
                      `).join('')}
                    </div>
                    <div class="text-blue-600 font-bold text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Dettagli <i data-lucide="chevron-right" class="w-3 h-3"></i>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('') : `
            <div class="col-span-full py-20 text-center">
              <div class="bg-gray-50 rounded-3xl p-12 max-w-md mx-auto border border-dashed border-gray-200">
                <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i data-lucide="search-x" class="w-10 h-10 text-gray-300"></i>
                </div>
                <h4 class="text-lg font-bold text-gray-800 mb-2">Nessuna ricetta trovata</h4>
                <p class="text-gray-500 text-sm mb-6">Prova a cambiare i filtri o i criteri di ricerca</p>
                <button id="clear-all-filters" class="bg-white border border-gray-200 text-gray-700 px-6 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
                  Resetta tutto
                </button>
              </div>
            </div>
          `}
        </div>
      </div>
    `;

    // Event listeners
    const searchInput = container.querySelector('#recipe-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value;
        render();
        const newInput = container.querySelector('#recipe-search-input');
        newInput.focus();
        newInput.setSelectionRange(searchTerm.length, searchTerm.length);
      });
    }

    container.querySelector('#user-context')?.addEventListener('change', (e) => {
      selectedUserId = e.target.value;
      render();
    });

    container.querySelector('#meal-context')?.addEventListener('change', (e) => {
      selectedMeal = e.target.value;
      render();
    });

    container.querySelector('#sort-by')?.addEventListener('change', (e) => {
      sortBy = e.target.value;
      render();
    });

    container.querySelector('#toggle-sort-order')?.addEventListener('click', () => {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      render();
    });

    container.querySelector('#clear-all-filters')?.addEventListener('click', () => {
      searchTerm = '';
      selectedUserId = '';
      selectedMeal = '';
      render();
    });

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
        
        const selectedUser = users.find(u => u.id === selectedUserId);
        const mealTargetCals = (selectedUser && selectedMeal) ? getMealTargetCals(selectedUser, selectedMeal) : null;
        
        showRecipeDetailModal(recipe, foods, mealTargetCals);
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
    let gallerySearchTerm = '';

    function renderModalContent() {
      const filteredGallery = recipeImages.filter(img => 
        img.name.toLowerCase().includes(gallerySearchTerm.toLowerCase())
      );

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
                  <label class="block text-sm font-medium text-gray-700 mb-2">Categorie Pasto</label>
                  <div class="grid grid-cols-2 gap-2">
                    ${['Colazione', 'Pranzo', 'Cena', 'Merenda'].map(cat => `
                      <label class="flex items-center gap-2 p-2 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" name="mealCategories" value="${cat}" 
                          ${(recipe?.mealCategories || []).includes(cat) ? 'checked' : ''}
                          class="rounded text-blue-600 focus:ring-blue-500">
                        <span class="text-sm text-gray-700">${cat}</span>
                      </label>
                    `).join('')}
                  </div>
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
                  <div class="flex justify-between items-center">
                    <label class="block text-sm font-medium text-gray-700">Galleria Ricette</label>
                    <div class="relative">
                      <i data-lucide="search" class="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400"></i>
                      <input type="text" id="gallery-search" placeholder="Cerca immagini..." 
                        value="${gallerySearchTerm}"
                        class="pl-7 pr-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-500">
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-2 overflow-y-auto max-h-[160px] border border-gray-100 p-2 rounded-lg">
                    ${filteredGallery.length > 0 ? filteredGallery.map(img => `
                      <img src="${img.url}" alt="${img.name}" 
                        class="w-full h-20 object-cover rounded-md cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all image-option ${selectedImageUrl === img.url ? 'ring-2 ring-blue-600' : ''}" 
                        data-url="${img.url}">
                    `).join('') : '<p class="col-span-2 text-center text-xs text-gray-400 py-4">Nessuna immagine locale trovata</p>'}
                    <div class="col-span-2 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 text-center">
                      <p class="text-[10px] text-gray-500 mb-2">Puoi anche cercare immagini gratuite su Unsplash:</p>
                      <a href="${getUnsplashUrl('cibo sano')}" target="_blank" id="unsplash-link"
                         class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-[10px] font-bold rounded-md hover:bg-gray-50 transition-colors shadow-sm">
                        <i data-lucide="external-link" class="w-3 h-3"></i>
                        Vai su Unsplash
                      </a>
                    </div>
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
      const gallerySearch = modal.querySelector('#gallery-search');

      function attachImageOptionListeners() {
        modal.querySelectorAll('.image-option').forEach(img => {
          img.addEventListener('click', () => {
            modal.querySelectorAll('.image-option').forEach(i => i.classList.remove('ring-2', 'ring-blue-600'));
            img.classList.add('ring-2', 'ring-blue-600');
            selectedImageUrl = img.getAttribute('data-url');
            urlInput.value = selectedImageUrl;
            previewImg.src = selectedImageUrl;
          });
        });
      }

      attachImageOptionListeners();

      gallerySearch.addEventListener('input', async (e) => {
        gallerySearchTerm = e.target.value;
        const filtered = recipeImages.filter(img => 
          img.name.toLowerCase().includes(gallerySearchTerm.toLowerCase())
        );
        const galleryContainer = modal.querySelector('.grid.grid-cols-2.gap-2.overflow-y-auto');
        
        let html = filtered.length > 0 ? filtered.map(img => `
          <img src="${img.url}" alt="${img.name}" 
            class="w-full h-20 object-cover rounded-md cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all image-option ${selectedImageUrl === img.url ? 'ring-2 ring-blue-600' : ''}" 
            data-url="${img.url}">
        `).join('') : '<p class="col-span-2 text-center text-xs text-gray-400 py-4">Nessuna immagine locale trovata</p>';

        if (gallerySearchTerm.length > 2) {
          const unsplashResults = await searchUnsplashImages(gallerySearchTerm);
          
          if (unsplashResults.length > 0) {
            html += `
              <div class="col-span-2 mt-2 pt-2 border-t border-gray-100">
                <p class="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Risultati da Unsplash</p>
                <div class="grid grid-cols-2 gap-2">
                  ${unsplashResults.map(img => `
                    <div class="relative group">
                      <img src="${img.thumb}" alt="${img.name}" 
                        class="w-full h-20 object-cover rounded-md cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all image-option ${selectedImageUrl === img.url ? 'ring-2 ring-blue-600' : ''}" 
                        data-url="${img.url}">
                      <div class="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-b-md truncate">
                        ${img.author}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          } else {
            html += `
              <div class="col-span-2 mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100 text-center">
                <p class="text-[10px] text-blue-600 mb-2">Cerchi altro? Trova immagini gratuite su Unsplash:</p>
                <a href="${getUnsplashUrl(gallerySearchTerm)}" target="_blank" 
                   class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-md hover:bg-blue-700 transition-colors">
                  <i data-lucide="external-link" class="w-3 h-3"></i>
                  Cerca "${gallerySearchTerm}" su Unsplash (Esterno)
                </a>
              </div>
            `;
          }
        }
        
        galleryContainer.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();
        attachImageOptionListeners();
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
        const mealCategories = formData.getAll('mealCategories');
        const data = {
          name: formData.get('name'),
          instructions: formData.get('instructions'),
          ingredients: currentIngredients,
          image: selectedImageUrl,
          mealCategories: mealCategories,
          totals: calculateTotals(currentIngredients)
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
      const totalsContainer = modal.querySelector('#recipe-totals');
      if (totalsContainer) {
        totalsContainer.innerHTML = `
          <div class="text-center"><div class="text-lg font-bold">${Math.round(totals.calories)}</div><div class="text-[10px] text-gray-500">Kcal</div></div>
          <div class="text-center"><div class="text-lg font-bold">${Math.round(totals.protein)}g</div><div class="text-[10px] text-gray-500">Pro</div></div>
          <div class="text-center"><div class="text-lg font-bold">${Math.round(totals.carbs)}g</div><div class="text-[10px] text-gray-500">Carb</div></div>
          <div class="text-center"><div class="text-lg font-bold">${Math.round(totals.fats)}g</div><div class="text-[10px] text-gray-500">Fat</div></div>
        `;
      }
    }

    renderModalContent();
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  render();
  return container;
}

export function showRecipeDetailModal(recipe, foods, targetCals = null) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm';
  
  // Totals calculation helper
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

  let displayIngredients = [...recipe.ingredients];
  let totals = recipe.totals || calculateTotalsLocal(recipe.ingredients);

  if (targetCals && totals.calories > 0) {
    const scaleFactor = targetCals / totals.calories;
    displayIngredients = recipe.ingredients.map(ing => ({
      ...ing,
      amount: Math.round(ing.amount * scaleFactor)
    }));
    totals = calculateTotalsLocal(displayIngredients);
  }

  modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        <div class="flex-1 overflow-y-auto scrollbar-hide">
          <div class="relative h-64 md:h-80 shrink-0">
            <img src="${recipe.image || 'https://via.placeholder.com/800x600'}" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <button id="close-detail" class="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors z-10">
              <i data-lucide="x" class="w-6 h-6"></i>
            </button>
            <div class="absolute bottom-6 left-6 right-6">
              <div class="flex gap-2 mb-2">
                <span class="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold uppercase tracking-wider">${recipe.difficulty || 'Media'}</span>
                <span class="px-2 py-1 bg-white/20 text-white rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">${recipe.prepTime || '30 min'}</span>
                ${targetCals ? '<span class="px-2 py-1 bg-green-600 text-white rounded text-[10px] font-bold uppercase tracking-wider">Adattata</span>' : ''}
              </div>
              <h2 class="text-3xl font-bold text-white mb-2">${recipe.name}</h2>
              <div class="flex gap-4 text-white/90 text-sm">
                <div class="flex items-center gap-1"><i data-lucide="flame" class="w-4 h-4 text-orange-400"></i> ${Math.round(totals.calories)} Kcal</div>
                <div class="flex items-center gap-1"><i data-lucide="leaf" class="w-4 h-4 text-green-400"></i> ${recipe.tags?.join(', ') || 'Naturale'}</div>
              </div>
            </div>
          </div>

          <div class="p-8">
            ${targetCals ? `
              <div class="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-4 animate-fade-in">
                <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                  <i data-lucide="info" class="w-5 h-5 text-white"></i>
                </div>
                <p class="text-sm text-blue-800">
                  Questa ricetta è stata <strong>adattata automaticamente</strong> alle tue esigenze caloriche. Le dosi degli ingredienti sono state ricalcolate per un pasto da circa <strong>${Math.round(targetCals)} Kcal</strong>.
                </p>
              </div>
            ` : ''}

            <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div class="md:col-span-1 space-y-8">
                <div>
                  <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Ingredienti</h3>
                  <ul class="space-y-3">
                    ${displayIngredients.map(ing => {
                      const food = foods.find(f => f.id === ing.foodId);
                      return `
                        <li class="flex justify-between items-center text-gray-700 pb-2 border-b border-gray-50">
                          <span class="font-medium">${food?.name || 'Ingrediente'}</span>
                          <span class="text-gray-400 text-sm font-bold">${ing.amount}g</span>
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
                      <span class="font-bold text-green-600">${Math.round(totals.protein)}g</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-gray-600">Carboidrati</span>
                      <span class="font-bold text-yellow-600">${Math.round(totals.carbs)}g</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-gray-600">Grassi</span>
                      <span class="font-bold text-red-600">${Math.round(totals.fats)}g</span>
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
