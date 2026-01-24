import { store } from '../utils/store.js';
import { recipeImages, getUnsplashUrl, searchUnsplashImages } from '../utils/imageGallery.js';
import { showFoodDetailModal } from './foods.js';

function getOriginFlag(origin) {
  const flags = {
    'Italia': '🇮🇹',
    'Francia': '🇫🇷',
    'Grecia': '🇬🇷',
    'Spagna': '🇪🇸',
    'Messico': '🇲🇽',
    'Giappone': '🇯🇵',
    'India': '🇮🇳',
    'USA': '🇺🇸',
    'Mediterranea': '🥗',
    'Internazionale': '🌍'
  };
  return flags[origin] || '🍽️';
}

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
  let selectedOrigin = '';
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
    const origins = [...new Set(recipes.map(r => r.origin).filter(Boolean))].sort();

    let filteredRecipes = recipes.filter(recipe => {
      // Search filter
      const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.instructions.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (recipe.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchesSearch) return false;

      // Meal filter
      if (selectedMeal && !(recipe.mealCategories || []).includes(selectedMeal)) return false;

      // Origin filter
      if (selectedOrigin && recipe.origin !== selectedOrigin) return false;

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
      <div class="space-y-4">
        <!-- Header Section -->
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-black text-gray-900">Ricettario</h2>
              <p class="text-[10px] text-gray-500 uppercase font-bold tracking-widest">${filteredRecipes.length} ricette trovate</p>
            </div>
            <button id="add-recipe-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-black transition-all shadow-md active:scale-95">
              <i data-lucide="plus" class="w-5 h-5"></i>
              <span class="hidden sm:inline">Nuova Ricetta</span>
            </button>
          </div>

          <!-- Filters Row -->
          <div class="flex flex-col gap-3">
            <!-- Search -->
            <div class="relative w-full">
              <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"></i>
              <input type="text" id="recipe-search-input" placeholder="Cerca ricette o ingredienti..." 
                value="${searchTerm}"
                class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm transition-all">
            </div>

            <!-- Selectors and Sort -->
            <div class="flex flex-wrap items-center gap-2">
              <!-- User Context -->
              <div class="flex-1 min-w-[140px] relative">
                <select id="user-context" class="w-full pl-9 pr-3 py-2 bg-blue-50/50 text-blue-700 text-xs font-black rounded-xl border border-blue-100 focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer">
                  <option value="">Profilo: Default</option>
                  ${users.map(u => `<option value="${u.id}" ${u.id === selectedUserId ? 'selected' : ''}>Profilo: ${u.name}</option>`).join('')}
                </select>
                <i data-lucide="user" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 pointer-events-none"></i>
              </div>

              <!-- Meal Context -->
              <div class="flex-1 min-w-[140px] relative">
                <select id="meal-context" class="w-full pl-9 pr-3 py-2 bg-orange-50/50 text-orange-700 text-xs font-black rounded-xl border border-orange-100 focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer">
                  <option value="">Tutti i Pasti</option>
                  ${['Colazione', 'Pranzo', 'Cena', 'Merenda'].map(m => `<option value="${m}" ${m === selectedMeal ? 'selected' : ''}>${m}</option>`).join('')}
                </select>
                <i data-lucide="clock" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-600 pointer-events-none"></i>
              </div>

              <!-- Country Filter -->
              <div class="flex-1 min-w-[140px] relative">
                <select id="origin-filter" class="w-full pl-9 pr-3 py-2 bg-green-50/50 text-green-700 text-xs font-black rounded-xl border border-green-100 focus:ring-2 focus:ring-green-500 appearance-none cursor-pointer">
                  <option value="">Tutti i Paesi</option>
                  ${origins.map(o => `<option value="${o}" ${o === selectedOrigin ? 'selected' : ''}>${o}</option>`).join('')}
                </select>
                <i data-lucide="globe" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600 pointer-events-none"></i>
              </div>

              <!-- Sorting -->
              <div class="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
                <select id="sort-by" class="bg-transparent text-[10px] font-black text-gray-600 border-none focus:ring-0 cursor-pointer py-1 pl-2 pr-6 appearance-none">
                  <option value="name" ${sortBy === 'name' ? 'selected' : ''}>ORDINA: NOME</option>
                  <option value="time" ${sortBy === 'time' ? 'selected' : ''}>ORDINA: TEMPO</option>
                  <option value="difficulty" ${sortBy === 'difficulty' ? 'selected' : ''}>ORDINA: DIFF.</option>
                  <option value="kcal" ${sortBy === 'kcal' ? 'selected' : ''}>ORDINA: KCAL</option>
                </select>
                <button id="toggle-sort-order" class="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors">
                  <i data-lucide="${sortOrder === 'asc' ? 'arrow-up-narrow-wide' : 'arrow-down-wide-narrow'}" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6" id="recipe-list">
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
                <div class="h-44 sm:h-52 bg-gray-200 relative overflow-hidden">
                  <img src="${recipe.image || 'https://placehold.co/400x300'}" 
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                  <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div class="absolute top-3 left-3 flex gap-1.5">
                    <span class="px-2 py-1 bg-white/95 backdrop-blur shadow-sm rounded-lg text-[10px] font-extrabold flex items-center gap-1">
                      <span>${getOriginFlag(recipe.origin)}</span>
                    </span>
                    <span class="px-2 py-1 bg-white/95 backdrop-blur shadow-sm rounded-lg text-[10px] font-extrabold text-blue-600 uppercase tracking-tighter">${recipe.difficulty || 'Media'}</span>
                    <span class="px-2 py-1 bg-white/95 backdrop-blur shadow-sm rounded-lg text-[10px] font-extrabold text-gray-600 uppercase tracking-tighter">${recipe.prepTime || '30 min'}</span>
                    ${isAdapted ? `<span class="px-2 py-1 bg-green-600 shadow-sm rounded-lg text-[10px] font-extrabold text-white uppercase tracking-tighter">Adattata</span>` : ''}
                  </div>

                  <div class="absolute top-3 right-3 flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 translate-y-0 sm:translate-y-[-10px] group-hover:translate-y-0 transition-all duration-300">
                    <button class="p-2.5 bg-white/95 backdrop-blur rounded-xl text-gray-600 hover:text-blue-600 hover:shadow-lg edit-recipe transition-all" data-id="${recipe.id}" onclick="event.stopPropagation()">
                      <i data-lucide="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button class="p-2.5 bg-white/95 backdrop-blur rounded-xl text-gray-600 hover:text-red-600 hover:shadow-lg delete-recipe transition-all" data-id="${recipe.id}" onclick="event.stopPropagation()">
                      <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>

                <div class="p-4 sm:p-5 flex-1 flex flex-col">
                  <div class="mb-3">
                    <div class="flex flex-wrap gap-1 mb-2">
                      ${(recipe.mealCategories || []).map(cat => `
                        <span class="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-bold uppercase border border-blue-100">${cat}</span>
                      `).join('')}
                    </div>
                    <h3 class="text-lg sm:text-xl font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">${recipe.name}</h3>
                  </div>

                  <div class="grid grid-cols-4 gap-1.5 sm:gap-2 mb-4 sm:mb-5">
                    <div class="text-center p-1.5 sm:p-2 bg-blue-50/50 rounded-xl border border-blue-100/50">
                      <div class="text-[8px] sm:text-[9px] text-blue-400 uppercase font-black mb-0.5">Kcal</div>
                      <div class="text-xs sm:text-sm font-black text-blue-700">${Math.round(displayTotals.calories)}</div>
                    </div>
                    <div class="text-center p-1.5 sm:p-2 bg-green-50/50 rounded-xl border border-green-100/50">
                      <div class="text-[8px] sm:text-[9px] text-green-400 uppercase font-black mb-0.5">Pro</div>
                      <div class="text-xs sm:text-sm font-black text-green-700">${Math.round(displayTotals.protein)}g</div>
                    </div>
                    <div class="text-center p-1.5 sm:p-2 bg-yellow-50/50 rounded-xl border border-yellow-100/50">
                      <div class="text-[8px] sm:text-[9px] text-yellow-400 uppercase font-black mb-0.5">Carb</div>
                      <div class="text-xs sm:text-sm font-black text-yellow-700">${Math.round(displayTotals.carbs)}g</div>
                    </div>
                    <div class="text-center p-1.5 sm:p-2 bg-red-50/50 rounded-xl border border-red-100/50">
                      <div class="text-[8px] sm:text-[9px] text-red-400 uppercase font-black mb-0.5">Fat</div>
                      <div class="text-xs sm:text-sm font-black text-red-700">${Math.round(displayTotals.fats)}g</div>
                    </div>
                  </div>

                  <div class="mt-auto pt-3 sm:pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div class="flex flex-wrap gap-1">
                      ${(recipe.tags || []).slice(0, 2).map(tag => `
                        <span class="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase">#${tag}</span>
                      `).join('')}
                    </div>
                    <div class="text-blue-600 font-bold text-[10px] sm:text-xs flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
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

    container.querySelector('#origin-filter')?.addEventListener('change', (e) => {
      selectedOrigin = e.target.value;
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
        <div class="bg-white rounded-none sm:rounded-xl shadow-xl w-full max-w-4xl p-4 sm:p-6 h-full sm:h-auto max-h-screen sm:max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-6 sm:mb-4">
            <h3 class="text-xl font-black text-gray-900">${recipe ? 'Modifica Ricetta' : 'Aggiungi Ricetta'}</h3>
            <button type="button" id="close-modal-top" class="sm:hidden p-2 text-gray-400 hover:text-gray-600">
              <i data-lucide="x" class="w-6 h-6"></i>
            </button>
          </div>
          
          <form id="recipe-form" class="space-y-6 pb-20 sm:pb-0">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <div class="space-y-5">
                <div>
                  <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Nome Ricetta</label>
                  <input type="text" name="name" value="${recipe?.name || ''}" required 
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Esempio: Pasta al Pomodoro">
                </div>

                <div>
                  <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Paese d'Origine</label>
                  <input type="text" name="origin" value="${recipe?.origin || ''}" 
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Esempio: Italia, Francia, Messico...">
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Tempo Prep.</label>
                    <input type="text" name="prepTime" value="${recipe?.prepTime || ''}" 
                      class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Esempio: 20 min">
                  </div>
                  <div>
                    <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Porzioni</label>
                    <input type="number" name="servings" value="${recipe?.servings || 1}" 
                      class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="4">
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Difficoltà</label>
                  <select name="difficulty" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all">
                    <option value="Facile" ${recipe?.difficulty === 'Facile' ? 'selected' : ''}>Facile</option>
                    <option value="Media" ${recipe?.difficulty === 'Media' ? 'selected' : ''}>Media</option>
                    <option value="Difficile" ${recipe?.difficulty === 'Difficile' ? 'selected' : ''}>Difficile</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Tag (separati da virgola)</label>
                  <input type="text" name="tags" value="${(recipe?.tags || []).join(', ')}" 
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Esempio: gluten-free, lactose-free, vegan">
                </div>

                <div>
                  <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Categorie Pasto</label>
                  <div class="grid grid-cols-2 gap-2">
                    ${['Colazione', 'Pranzo', 'Cena', 'Merenda'].map(cat => `
                      <label class="flex items-center gap-2 p-3 bg-gray-50 border border-gray-100 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-100 transition-all">
                        <input type="checkbox" name="mealCategories" value="${cat}" 
                          ${(recipe?.mealCategories || []).includes(cat) ? 'checked' : ''}
                          class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300">
                        <span class="text-sm font-bold text-gray-700">${cat}</span>
                      </label>
                    `).join('')}
                  </div>
                </div>

                <div>
                  <div class="flex justify-between items-center mb-2">
                    <label class="block text-xs font-black text-gray-500 uppercase tracking-widest">Ingredienti</label>
                    <button type="button" id="add-ing-row" class="bg-blue-50 text-blue-600 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-all">+ Aggiungi</button>
                  </div>
                  <div id="ingredients-list" class="space-y-2 max-h-[250px] overflow-y-auto p-1 scrollbar-hide">
                    ${currentIngredients.map((ing, idx) => `
                      <div class="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2">
                        <div class="flex gap-2 items-center">
                          <select class="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 ing-food" data-idx="${idx}">
                            ${foods.map(f => `<option value="${f.id}" ${f.id === ing.foodId ? 'selected' : ''}>${f.name}</option>`).join('')}
                          </select>
                          <div class="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-gray-200">
                            <input type="number" value="${ing.amount}" 
                              class="w-14 bg-transparent border-none focus:ring-0 text-sm font-black text-right ing-amount" 
                              data-idx="${idx}" placeholder="0">
                            <span class="text-[10px] font-black text-gray-400">G</span>
                          </div>
                          <button type="button" class="p-2 text-red-400 hover:text-red-600 remove-ing" data-idx="${idx}">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                          </button>
                        </div>
                        <input type="text" value="${ing.note || ''}" 
                          class="w-full bg-white/50 border border-gray-200 rounded-lg px-3 py-1.5 text-[10px] focus:ring-1 focus:ring-blue-500 transition-all ing-note" 
                          data-idx="${idx}" placeholder="Nota ingrediente (es. 'a temperatura ambiente')">
                      </div>
                    `).join('')}
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Procedimento (un passaggio per riga)</label>
                  <textarea name="steps" rows="6" required 
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Descrivi i passaggi, uno per riga...">${(recipe?.steps || [recipe?.instructions || '']).join('\n')}</textarea>
                </div>

                <div>
                  <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Consigli dello Chef (uno per riga)</label>
                  <textarea name="tips" rows="2" 
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Esempio: Usa ingredienti a temperatura ambiente">${(recipe?.tips || []).join('\n')}</textarea>
                </div>

                <div>
                  <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Varianti (una per riga)</label>
                  <textarea name="variants" rows="2" 
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Esempio: Versione vegetariana con tofu">${(recipe?.variants || []).join('\n')}</textarea>
                </div>

                <div>
                  <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Fonti (una per riga)</label>
                  <textarea name="sources" rows="2" 
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Esempio: Accademia Italiana della Cucina">${(recipe?.sources || []).join('\n')}</textarea>
                </div>

                <div>
                  <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Attrezzatura (separata da virgola)</label>
                  <input type="text" name="equipment" value="${(recipe?.equipment || []).join(', ')}" 
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Esempio: Padella, Sbattitore elettrico">
                </div>

                <div>
                  <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Dettagli di Servizio</label>
                  <textarea name="servingSuggestions" rows="2" 
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Come presentare il piatto...">${recipe?.servingSuggestions || ''}</textarea>
                </div>

                <div>
                  <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Note e Varianti</label>
                  <textarea name="notes" rows="2" 
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Consigli extra o varianti...">${recipe?.notes || ''}</textarea>
                </div>
              </div>

              <div class="space-y-5">
                <div>
                  <label class="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Immagine (URL o scegli sotto)</label>
                  <input type="text" id="image-url-input" name="image" value="${selectedImageUrl}" 
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="https://esempio.it/immagine.jpg">
                </div>
                
                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <label class="block text-xs font-black text-gray-500 uppercase tracking-widest">Galleria Ricette</label>
                    <div class="relative">
                      <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"></i>
                      <input type="text" id="gallery-search" placeholder="Cerca..." 
                        value="${gallerySearchTerm}"
                        class="pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 w-32 sm:w-48 transition-all">
                    </div>
                  </div>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto max-h-[200px] border border-gray-100 p-2 rounded-xl scrollbar-hide">
                    ${filteredGallery.length > 0 ? filteredGallery.map(img => `
                      <div class="relative group">
                        <img src="${img.url}" alt="${img.name}" 
                          class="w-full h-24 object-cover rounded-lg cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all image-option ${selectedImageUrl === img.url ? 'ring-4 ring-blue-600' : ''}" 
                          data-url="${img.url}">
                        ${selectedImageUrl === img.url ? '<div class="absolute top-1 right-1 bg-blue-600 text-white p-1 rounded-full shadow-lg"><i data-lucide="check" class="w-3 h-3"></i></div>' : ''}
                      </div>
                    `).join('') : '<p class="col-span-full text-center text-xs text-gray-400 py-8">Nessuna immagine trovata</p>'}
                  </div>
                </div>

                <div class="p-3 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
                  <div class="w-20 h-20 bg-white rounded-xl overflow-hidden border border-blue-200 shrink-0">
                    <img id="modal-image-preview" src="${selectedImageUrl || 'https://placehold.co/150'}" class="w-full h-full object-cover">
                  </div>
                  <div class="flex-1">
                    <p class="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Anteprima</p>
                    <p class="text-xs text-blue-800 font-bold leading-tight">L'immagine apparirà così nel ricettario</p>
                  </div>
                </div>

                <div class="bg-gray-900 p-5 rounded-2xl shadow-lg">
                  <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Totali Nutrizionali Stimati</div>
                  <div id="recipe-totals" class="grid grid-cols-4 gap-2">
                    <!-- Calculated dynamically -->
                  </div>
                </div>
              </div>
            </div>

            <div class="fixed sm:static bottom-0 left-0 right-0 p-4 sm:p-0 bg-white sm:bg-transparent border-t sm:border-t-0 border-gray-100 flex gap-3 sm:pt-6 sm:justify-end z-10">
              <button type="button" id="close-modal" class="flex-1 sm:flex-none px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-all">Annulla</button>
              <button type="submit" class="flex-1 sm:flex-none px-8 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95">Salva Ricetta</button>
            </div>
          </form>
        </div>
      `;

      updateTotals();

      const previewImg = modal.querySelector('#modal-image-preview');
      const urlInput = modal.querySelector('#image-url-input');
      const gallerySearch = modal.querySelector('#gallery-search');

      modal.querySelector('#close-modal-top')?.addEventListener('click', () => modal.remove());

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
              <div class="col-span-2 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 text-center">
                <p class="text-[10px] text-gray-400">Nessun risultato aggiuntivo trovato su Unsplash.</p>
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
        previewImg.src = selectedImageUrl || 'https://placehold.co/150';
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

      modal.querySelectorAll('.ing-note').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const idx = parseInt(inp.getAttribute('data-idx'));
          currentIngredients[idx].note = e.target.value;
        });
      });

      modal.querySelector('#recipe-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const mealCategories = formData.getAll('mealCategories');
        const data = {
          name: formData.get('name'),
          steps: formData.get('steps').split('\n').map(s => s.trim()).filter(Boolean),
          instructions: formData.get('steps'), // Keep for compatibility
          origin: formData.get('origin'),
          prepTime: formData.get('prepTime'),
          servings: Number(formData.get('servings')),
          difficulty: formData.get('difficulty'),
          tags: formData.get('tags').split(',').map(t => t.trim()).filter(Boolean),
          ingredients: currentIngredients,
          image: selectedImageUrl,
          mealCategories: mealCategories,
          sources: formData.get('sources').split('\n').map(s => s.trim()).filter(Boolean),
          equipment: formData.get('equipment').split(',').map(e => e.trim()).filter(Boolean),
          tips: formData.get('tips').split('\n').map(s => s.trim()).filter(Boolean),
          variants: formData.get('variants').split('\n').map(s => s.trim()).filter(Boolean),
          servingSuggestions: formData.get('servingSuggestions'),
          notes: formData.get('notes'),
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
          <div class="text-center p-2 bg-white/5 rounded-xl border border-white/5">
            <div class="text-sm font-black text-white">${Math.round(totals.calories)}</div>
            <div class="text-[8px] text-gray-500 uppercase font-black">Kcal</div>
          </div>
          <div class="text-center p-2 bg-white/5 rounded-xl border border-white/5">
            <div class="text-sm font-black text-green-400">${Math.round(totals.protein)}g</div>
            <div class="text-[8px] text-gray-500 uppercase font-black">Pro</div>
          </div>
          <div class="text-center p-2 bg-white/5 rounded-xl border border-white/5">
            <div class="text-sm font-black text-yellow-400">${Math.round(totals.carbs)}g</div>
            <div class="text-[8px] text-gray-500 uppercase font-black">Carb</div>
          </div>
          <div class="text-center p-2 bg-white/5 rounded-xl border border-white/5">
            <div class="text-sm font-black text-red-400">${Math.round(totals.fats)}g</div>
            <div class="text-[8px] text-gray-500 uppercase font-black">Fat</div>
          </div>
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
      <div class="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full max-w-4xl h-full sm:h-auto max-h-screen sm:max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        <div class="flex-1 overflow-y-auto scrollbar-hide pb-20 sm:pb-0">
          <div class="relative h-56 sm:h-80 shrink-0">
            <img src="${recipe.image || 'https://placehold.co/800x600'}" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
            <button id="close-detail" class="absolute top-4 right-4 p-2.5 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all z-10 active:scale-90">
              <i data-lucide="x" class="w-5 h-5 sm:w-6 sm:h-6"></i>
            </button>
            <div class="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
              <div class="flex flex-wrap gap-1.5 mb-2">
                <span class="px-2 py-0.5 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider">${recipe.difficulty || 'Media'}</span>
                <span class="px-2 py-0.5 bg-white/20 text-white rounded-lg text-[9px] font-black uppercase tracking-wider backdrop-blur-md border border-white/10">${recipe.prepTime || '30 min'}</span>
                ${targetCals ? '<span class="px-2 py-0.5 bg-green-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider shadow-lg">Adattata</span>' : ''}
              </div>
              <h2 class="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">${recipe.name}</h2>
              <div class="flex flex-wrap gap-3 text-white/90 text-xs font-bold uppercase tracking-wider">
                <div class="flex items-center gap-1.5"><i data-lucide="flame" class="w-4 h-4 text-orange-400"></i> ${Math.round(totals.calories)} Kcal</div>
                <div class="flex items-center gap-1.5">
                  <span>${getOriginFlag(recipe.origin)}</span>
                  <span>${recipe.origin || 'Internazionale'}</span>
                </div>
                <div class="flex items-center gap-1.5"><i data-lucide="tag" class="w-4 h-4 text-blue-400"></i> ${recipe.tags?.slice(0, 2).join(', ') || 'Naturale'}</div>
              </div>
            </div>
          </div>

          <div class="p-5 sm:p-8">
            ${targetCals ? `
              <div class="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4 animate-fade-in">
                <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
                  <i data-lucide="info" class="w-5 h-5 text-white"></i>
                </div>
                <p class="text-xs sm:text-sm text-blue-900 font-medium leading-relaxed">
                  Questa ricetta è stata <strong>adattata</strong> alle tue esigenze caloriche. Le dosi sono state ricalcolate per un pasto da <strong>${Math.round(targetCals)} Kcal</strong>.
                </p>
              </div>
            ` : ''}

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
              <div class="md:col-span-1 space-y-6 sm:space-y-8">
                <div>
                  <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i data-lucide="shopping-basket" class="w-4 h-4"></i> Ingredienti
                  </h3>
                <ul class="space-y-2">
                  ${displayIngredients.map(ing => {
                    const food = foods.find(f => f.id === ing.foodId);
                    return `
                      <li class="flex justify-between items-center bg-gray-50/50 p-3 rounded-xl border border-gray-100 transition-colors hover:bg-blue-50 cursor-pointer ingredient-item" data-food-id="${ing.foodId}">
                        <div class="flex flex-col">
                          <span class="text-sm font-bold text-gray-700">${food?.name || 'Ingrediente'}</span>
                          ${ing.note ? `<span class="text-[10px] text-gray-400 italic">${ing.note}</span>` : ''}
                        </div>
                        <span class="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">${ing.amount}g</span>
                      </li>
                    `;
                  }).join('')}
                </ul>
                </div>

                ${recipe.servings ? `
                  <div class="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                    <h3 class="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <i data-lucide="users" class="w-3 h-3"></i> Porzioni
                    </h3>
                    <p class="text-sm font-bold text-blue-900">${recipe.servings} persone</p>
                  </div>
                ` : ''}

                ${recipe.sources ? `
                  <div class="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <i data-lucide="link" class="w-3 h-3"></i> Fonti
                    </h3>
                    <ul class="space-y-1">
                      ${recipe.sources.map(src => `<li class="text-[11px] text-gray-600 font-medium">• ${src}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}

                <div class="bg-gray-900 p-6 rounded-2xl shadow-xl space-y-5">
                  <h3 class="text-[10px] font-black text-gray-500 uppercase tracking-widest">Macro-nutrienti</h3>
                  <div class="space-y-4">
                    <div class="flex justify-between items-center">
                      <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full bg-green-500"></div>
                        <span class="text-xs font-bold text-gray-400">Proteine</span>
                      </div>
                      <span class="text-sm font-black text-green-400">${Math.round(totals.protein)}g</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span class="text-xs font-bold text-gray-400">Carboidrati</span>
                      </div>
                      <span class="text-sm font-black text-yellow-400">${Math.round(totals.carbs)}g</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full bg-red-500"></div>
                        <span class="text-xs font-bold text-gray-400">Grassi</span>
                      </div>
                      <span class="text-sm font-black text-red-400">${Math.round(totals.fats)}g</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="md:col-span-2 space-y-6 sm:space-y-8">
                <div>
                  <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i data-lucide="chef-hat" class="w-4 h-4"></i> Preparazione
                  </h3>
                  <div class="space-y-4">
                    ${(recipe.steps || [recipe.instructions]).map((step, idx) => {
                      const stepText = typeof step === 'object' 
                        ? `<strong class="block text-gray-900 mb-1">${step.title}</strong>${step.description}`
                        : step;
                      return `
                        <div class="flex gap-4 p-4 bg-gray-50/30 rounded-2xl border border-gray-100/50">
                          <div class="shrink-0 w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-blue-100">${idx + 1}</div>
                          <p class="text-gray-700 text-sm leading-relaxed pt-1 font-medium">${stepText}</p>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>

                ${recipe.tips && recipe.tips.length > 0 ? `
                  <div class="bg-orange-50/50 border border-orange-100 p-6 rounded-2xl">
                    <h3 class="flex items-center gap-2 text-[10px] font-black text-orange-700 uppercase tracking-widest mb-4">
                      <i data-lucide="lightbulb" class="w-4 h-4"></i> Consigli dello Chef
                    </h3>
                    <ul class="space-y-3">
                      ${recipe.tips.map(tip => `
                        <li class="flex gap-3 text-orange-900 text-sm font-medium">
                          <span class="text-orange-400 font-black">•</span>
                          <span>${tip}</span>
                        </li>
                      `).join('')}
                    </ul>
                  </div>
                ` : ''}

                ${recipe.servingSuggestions ? `
                  <div class="bg-green-50/50 border border-green-100 p-6 rounded-2xl">
                    <h3 class="flex items-center gap-2 text-[10px] font-black text-green-700 uppercase tracking-widest mb-4">
                      <i data-lucide="utensils" class="w-4 h-4"></i> Dettagli di Servizio
                    </h3>
                    <p class="text-green-900 text-sm font-medium leading-relaxed">${recipe.servingSuggestions}</p>
                  </div>
                ` : ''}

                ${recipe.notes || (recipe.variants && recipe.variants.length > 0) ? `
                  <div class="bg-blue-50/50 border border-blue-100 p-6 rounded-2xl">
                    <h3 class="flex items-center gap-2 text-[10px] font-black text-blue-700 uppercase tracking-widest mb-4">
                      <i data-lucide="info" class="w-4 h-4"></i> Note e Varianti
                    </h3>
                    <div class="space-y-4">
                      ${recipe.notes ? `
                        <div>
                          <p class="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Note</p>
                          <p class="text-blue-900 text-sm font-medium leading-relaxed">${recipe.notes}</p>
                        </div>
                      ` : ''}
                      ${recipe.variants && recipe.variants.length > 0 ? `
                        <div>
                          <p class="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Varianti</p>
                          <ul class="space-y-1">
                            ${recipe.variants.map(v => `<li class="text-blue-900 text-sm font-medium">• ${v}</li>`).join('')}
                          </ul>
                        </div>
                      ` : ''}
                    </div>
                  </div>
                ` : ''}

                ${recipe.equipment && recipe.equipment.length > 0 ? `
                  <div class="bg-gray-50/50 border border-gray-100 p-6 rounded-2xl">
                    <h3 class="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                      <i data-lucide="tool" class="w-4 h-4"></i> Attrezzatura Necessaria
                    </h3>
                    <ul class="flex flex-wrap gap-2">
                      ${recipe.equipment.map(item => `
                        <li class="bg-white border border-gray-100 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 shadow-sm">${item}</li>
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

    modal.querySelectorAll('.ingredient-item').forEach(item => {
      item.addEventListener('click', () => {
        const foodId = item.getAttribute('data-food-id');
        const food = foods.find(f => f.id === foodId);
        if (food) {
          showFoodDetailModal(food);
        }
      });
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('animate-scale-out');
        setTimeout(() => modal.remove(), 200);
      }
    });
  }
