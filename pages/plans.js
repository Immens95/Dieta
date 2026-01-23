
import { store } from '../utils/store.js';
import { showRecipeDetailModal } from './recipes.js';

export async function PlansPage() {
  await store.ensureInitialized();
  const container = document.createElement('div');
  container.className = 'space-y-6 animate-fade-in';

  let plans = store.getAll('plans') || [];
  let users = store.getAll('users') || [];
  let recipes = store.getAll('recipes') || [];
  let foods = store.getAll('foods') || [];
  
  // State
  let selectedUserId = users[0]?.id || null;
  let viewMode = 'week'; // 'day', 'week', 'month'
  let selectedDayIndex = 0; // For 'day' view

  const daysOfWeek = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const meals = ['Colazione', 'Pranzo', 'Cena', 'Spuntini'];
  const mealKeys = ['breakfast', 'lunch', 'dinner', 'snacks'];

  function getSelectedUser() {
    return users.find(u => u.id === selectedUserId) || users[0];
  }

  function getCurrentPlan() {
    const user = getSelectedUser();
    let plan = plans.find(p => p.userId === user?.id);
    if (!plan) {
      plan = { id: Date.now().toString(), userId: user?.id, name: `Piano di ${user?.name}`, days: {} };
      plans.push(plan);
      store.add('plans', plan);
    }
    return plan;
  }

  function calculateUserDailyCals(user) {
    if (!user) return 2000;
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
    
    // Target calories based on goal (consistent with dashboard.js logic if possible)
    const kgToLose = user.weight - user.targetWeight;
    if (Math.abs(kgToLose) > 0.1) {
      const totalDeficitNeeded = kgToLose * 7700;
      const dailyDeficit = totalDeficitNeeded / ((user.goalWeeks || 12) * 7);
      return Math.round(tdee - dailyDeficit);
    }
    
    return Math.round(tdee);
  }

  function getSuitableRecipes(user) {
    const conditions = (user.healthConditions || []).map(c => c.toLowerCase());
    const intolerances = (user.intolerances || []).map(i => i.toLowerCase());

    return recipes.filter(r => {
      // Check intolerances
      if ((intolerances.includes('gluten') || intolerances.includes('glutine')) && !r.tags?.includes('gluten-free')) return false;
      if ((intolerances.includes('lactose') || intolerances.includes('lattosio')) && !r.tags?.includes('lactose-free')) return false;
      
      // Health conditions
      if ((conditions.includes('reflux') || conditions.includes('reflusso')) && !r.tags?.includes('low-acid')) return false;
      if (conditions.includes('ibs') && !r.tags?.includes('low-fodmap') && !r.tags?.includes('gluten-free')) return false;
      
      // New pathologies: focus on anti-inflammatory and omega-3 for arthritis and MS
      if (conditions.includes('artrite') || conditions.includes('sclerosi multipla')) {
        // We don't necessarily filter out recipes, but we could prioritize them.
        // For now, let's just ensure we don't include pro-inflammatory ones if they exist.
        if (r.tags?.includes('pro-inflammatory')) return false;
      }
      
      return true;
    });
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

  function getScaledRecipe(recipe, targetCals) {
    const currentTotals = recipe.totals || calculateTotals(recipe.ingredients);
    if (currentTotals.calories === 0) return recipe;
    
    const scaleFactor = targetCals / currentTotals.calories;
    
    const scaledIngredients = recipe.ingredients.map(ing => ({
      ...ing,
      amount: Math.round(ing.amount * scaleFactor)
    }));
    
    return {
      ...recipe,
      ingredients: scaledIngredients,
      totals: calculateTotals(scaledIngredients)
    };
  }

  function getMealTargetCals(user, mealKey) {
    const dailyTarget = calculateUserDailyCals(user);
    const mealTargets = {
      breakfast: 0.20,
      lunch: 0.35,
      dinner: 0.30,
      snacks: 0.15
    };
    return dailyTarget * (mealTargets[mealKey] || 0.25);
  }

  function render() {
    const user = getSelectedUser();
    const plan = getCurrentPlan();
    const dailyCals = calculateUserDailyCals(user);

    container.innerHTML = `
      <div class="space-y-4">
        <!-- Compact Header -->
        <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-black text-gray-900">Piani Alimentari</h2>
              <p class="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Target: ${dailyCals} kcal/giorno</p>
            </div>
            <div class="flex gap-2">
              <button id="generate-plan-btn" class="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95" title="Genera Piano">
                <i data-lucide="wand-2" class="w-5 h-5"></i>
              </button>
              <button id="export-pdf-btn" class="bg-gray-800 hover:bg-gray-900 text-white p-2.5 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95" title="Esporta PDF">
                <i data-lucide="file-text" class="w-5 h-5"></i>
              </button>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-3">
            <!-- User Selector -->
            <div class="relative flex-1">
              <select id="user-selector" class="w-full pl-9 pr-3 py-2.5 bg-blue-50/50 text-blue-700 text-xs font-black rounded-xl border border-blue-100 focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer">
                ${users.map(u => `<option value="${u.id}" ${u.id === selectedUserId ? 'selected' : ''}>Profilo: ${u.name}</option>`).join('')}
              </select>
              <i data-lucide="user" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 pointer-events-none"></i>
            </div>

            <!-- View Toggles -->
            <div class="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
              <button class="view-toggle flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}" data-view="day">Giorno</button>
              <button class="view-toggle flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}" data-view="week">Settimana</button>
              <button class="view-toggle flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}" data-view="month">Mese</button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4">
          ${viewMode === 'day' ? renderDayView(plan, dailyCals, user) : 
            viewMode === 'week' ? renderWeekView(plan, dailyCals, user) : 
            renderMonthView(plan, dailyCals, user)}
        </div>
      </div>
    `;

    // Event listeners
    container.querySelector('#user-selector').addEventListener('change', (e) => {
      selectedUserId = e.target.value;
      render();
    });

    container.querySelectorAll('.view-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        viewMode = btn.getAttribute('data-view');
        render();
      });
    });

    container.querySelectorAll('.day-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedDayIndex = parseInt(btn.getAttribute('data-idx'));
        render();
      });
    });

    container.querySelectorAll('.add-to-meal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const day = btn.getAttribute('data-day');
        const meal = btn.getAttribute('data-meal');
        showAddRecipeToMealModal(day, meal);
      });
    });

    container.querySelectorAll('.auto-fill-meal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const day = btn.getAttribute('data-day');
        const meal = btn.getAttribute('data-meal');
        autoFillMeal(day, meal);
      });
    });

    container.querySelectorAll('.auto-fill-day').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const day = btn.getAttribute('data-day');
        autoFillDay(day);
      });
    });

    container.querySelectorAll('.recipe-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = item.getAttribute('data-id');
        const mealKey = item.getAttribute('data-meal');
        const recipe = recipes.find(r => r.id === id);
        if (recipe) {
          const targetCals = mealKey ? getMealTargetCals(user, mealKey) : null;
          showRecipeDetailModal(recipe, foods, targetCals);
        }
      });
    });

    container.querySelectorAll('.remove-from-meal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const day = btn.getAttribute('data-day');
        const meal = btn.getAttribute('data-meal');
        const id = btn.getAttribute('data-id');
        
        const idx = plan.days[day][meal].indexOf(id);
        if (idx > -1) {
          plan.days[day][meal].splice(idx, 1);
          store.update('plans', plan.id, plan);
          render();
        }
      });
    });

    container.querySelector('#export-pdf-btn').addEventListener('click', () => exportToPDF());
    container.querySelector('#generate-plan-btn').addEventListener('click', () => generateAutoPlan());

    container.querySelectorAll('.generate-week-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const week = btn.getAttribute('data-week');
        generateAutoPlan(week);
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function renderDayView(plan, dailyCals, user) {
    const dayKey = dayKeys[selectedDayIndex];
    return `
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <!-- Horizontal Day Selector -->
        <div class="bg-gray-50/50 border-b border-gray-100">
          <div class="flex overflow-x-auto scrollbar-hide p-2 gap-1">
            ${daysOfWeek.map((day, idx) => `
              <button class="day-tab shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${selectedDayIndex === idx ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-gray-500 hover:bg-gray-100'}" 
                data-idx="${idx}">
                ${day.substring(0, 3)}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-gray-50 gap-4">
          <div class="flex items-center gap-3">
            <h3 class="text-xl font-black text-gray-900">${daysOfWeek[selectedDayIndex]}</h3>
            <button class="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all auto-fill-day" data-day="${dayKey}">
              <i data-lucide="wand-2" class="w-3.5 h-3.5"></i>
              <span class="hidden sm:inline">Auto-fill Giorno</span>
            </button>
          </div>
          <div class="flex items-center gap-3 bg-blue-50/50 px-4 py-2 rounded-2xl border border-blue-100/50">
            <div class="text-right">
              <div class="text-[8px] font-black text-blue-400 uppercase tracking-tighter">Target Giornaliero</div>
              <div class="text-lg font-black text-blue-700 leading-none">${dailyCals} <span class="text-xs">Kcal</span></div>
            </div>
            <i data-lucide="target" class="w-5 h-5 text-blue-600"></i>
          </div>
        </div>

        <div class="p-4 sm:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          ${mealKeys.map((mealKey, idx) => {
            const mealRecipes = (plan.days[dayKey]?.[mealKey] || []).map(id => recipes.find(r => r.id === id)).filter(Boolean);
            const mealCals = mealRecipes.reduce((sum, r) => {
              const totals = r.totals || calculateTotals(r.ingredients);
              return sum + totals.calories;
            }, 0);
            return `
              <div class="space-y-4 bg-gray-50/30 p-4 rounded-2xl border border-gray-50 transition-all hover:bg-white hover:shadow-md hover:border-gray-100">
                <div class="flex justify-between items-center border-b border-gray-100 pb-2">
                  <h4 class="font-black text-gray-900 text-xs uppercase tracking-widest flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                    ${meals[idx]}
                  </h4>
                  <div class="flex items-center gap-1">
                    <button class="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all auto-fill-meal" data-day="${dayKey}" data-meal="${mealKey}" title="Auto-fill Pasto">
                      <i data-lucide="wand-2" class="w-4 h-4"></i>
                    </button>
                    <button class="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all add-to-meal" data-day="${dayKey}" data-meal="${mealKey}">
                      <i data-lucide="plus-circle" class="w-5 h-5"></i>
                    </button>
                  </div>
                </div>
                <div class="space-y-2">
                  ${mealRecipes.length ? mealRecipes.map(r => {
                    const targetCals = getMealTargetCals(user, mealKey);
                    const scaledR = getScaledRecipe(r, targetCals);
                    const totals = scaledR.totals;
                    return `
                      <div class="group bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-all cursor-pointer recipe-item relative active:scale-95" data-id="${r.id}" data-meal="${mealKey}">
                        <div class="font-black text-sm text-gray-800 pr-6 leading-tight">${r.name}</div>
                        <div class="flex items-center gap-2 mt-2">
                          <span class="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-tighter">${Math.round(totals.calories)} Kcal</span>
                          <span class="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">${r.prepTime || '20 min'}</span>
                        </div>
                        <button class="absolute top-2 right-2 p-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all remove-from-meal" 
                          data-day="${dayKey}" data-meal="${mealKey}" data-id="${r.id}">
                          <i data-lucide="x" class="w-3.5 h-3.5"></i>
                        </button>
                      </div>
                    `;
                  }).join('') : `
                    <div class="text-[10px] text-gray-400 font-bold uppercase tracking-widest py-6 text-center border-2 border-dashed border-gray-100 rounded-xl">
                      Vuoto
                    </div>
                  `}
                </div>
                ${mealRecipes.length ? `
                  <div class="flex justify-between items-center pt-2">
                    <span class="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Totale Pasto</span>
                    <span class="text-[10px] font-black text-gray-900">${Math.round(mealCals)} Kcal</span>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function renderWeekView(plan, dailyCals, user) {
    return `
      <div class="flex overflow-x-auto snap-x snap-mandatory pb-6 gap-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 xl:grid xl:grid-cols-7 xl:overflow-visible">
        ${dayKeys.map((dayKey, dayIdx) => {
          const dayCals = mealKeys.reduce((sum, mk) => {
            const mealRecipes = (plan.days[dayKey]?.[mk] || []).map(id => recipes.find(r => r.id === id)).filter(Boolean);
            return sum + mealRecipes.reduce((s, r) => {
              const totals = r.totals || calculateTotals(r.ingredients);
              return s + totals.calories;
            }, 0);
          }, 0);
          
          return `
            <div class="min-w-[85vw] sm:min-w-[320px] xl:min-w-0 snap-center bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
              <div class="p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                <div class="flex justify-between items-center mb-1">
                  <div class="font-black text-gray-900 text-sm uppercase tracking-wider">${daysOfWeek[dayIdx]}</div>
                  <button class="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all auto-fill-day" data-day="${dayKey}" title="Auto-fill Giorno">
                    <i data-lucide="wand-2" class="w-4 h-4"></i>
                  </button>
                </div>
                <div class="flex items-center justify-between">
                  <div class="text-[10px] font-black uppercase tracking-tighter text-gray-400">Totale Kcal</div>
                  <div class="text-xs font-black ${dayCals > dailyCals ? 'text-red-500' : 'text-green-600'}">${Math.round(dayCals)} / ${dailyCals}</div>
                </div>
              </div>
              <div class="p-4 space-y-6 flex-1">
                ${mealKeys.map((mealKey, idx) => {
                  const mealRecipes = (plan.days[dayKey]?.[mealKey] || []).map(id => recipes.find(r => r.id === id)).filter(Boolean);
                  return `
                    <div class="space-y-3">
                      <div class="flex justify-between items-center px-1">
                        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <span class="w-1.5 h-1.5 rounded-full bg-blue-500/50"></span>
                          ${meals[idx]}
                        </span>
                        <div class="flex items-center gap-1">
                          <button class="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all auto-fill-meal" data-day="${dayKey}" data-meal="${mealKey}" title="Auto-fill Pasto">
                            <i data-lucide="wand-2" class="w-3.5 h-3.5"></i>
                          </button>
                          <button class="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all add-to-meal" data-day="${dayKey}" data-meal="${mealKey}">
                            <i data-lucide="plus-circle" class="w-4 h-4"></i>
                          </button>
                        </div>
                      </div>
                      <div class="space-y-2">
                        ${mealRecipes.length ? mealRecipes.map(r => {
                          const targetCals = getMealTargetCals(user, mealKey);
                          const scaledR = getScaledRecipe(r, targetCals);
                          const totals = scaledR.totals;
                          return `
                            <div class="group p-3 bg-gray-50/50 hover:bg-white hover:shadow-sm border border-transparent hover:border-blue-100 rounded-xl cursor-pointer recipe-item relative transition-all active:scale-[0.98]" data-id="${r.id}" data-meal="${mealKey}">
                              <div class="font-black text-gray-800 text-xs pr-6 leading-tight mb-1">${r.name}</div>
                              <div class="text-[9px] font-bold text-blue-600 uppercase tracking-tighter bg-blue-50/50 px-2 py-0.5 rounded-md inline-block">${Math.round(totals.calories)} Kcal</div>
                              <button class="absolute top-2.5 right-2.5 opacity-100 sm:opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-lg transition-all remove-from-meal" 
                                data-day="${dayKey}" data-meal="${mealKey}" data-id="${r.id}">
                                <i data-lucide="x" class="w-3.5 h-3.5"></i>
                              </button>
                            </div>
                          `;
                        }).join('') : `
                          <div class="text-[9px] text-gray-300 font-black uppercase tracking-widest py-3 text-center border border-dashed border-gray-100 rounded-xl">
                            Vuoto
                          </div>
                        `}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderMonthView(plan, dailyCals, user) {
    return `
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-12 text-center overflow-hidden relative">
        <div class="absolute top-0 right-0 p-8 opacity-5">
          <i data-lucide="calendar" class="w-32 h-32 text-blue-600"></i>
        </div>
        
        <div class="relative z-10">
          <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <i data-lucide="calendar" class="w-8 h-8"></i>
          </div>
          <h3 class="text-2xl font-black text-gray-900 mb-3">Pianificazione Mensile</h3>
          <p class="text-gray-500 max-w-md mx-auto mb-10 text-sm font-medium">Panoramica degli obiettivi nutrizionali per le prossime 4 settimane basata sul tuo profilo.</p>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            ${[1, 2, 3, 4].map(w => `
              <div class="p-6 bg-gray-50/50 border border-gray-100 rounded-2xl hover:border-blue-200 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 transition-all group relative overflow-hidden">
                <div class="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div class="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Settimana ${w}</div>
                <div class="flex items-baseline justify-center gap-1 mb-1">
                  <div class="text-3xl font-black text-gray-900">${Math.round(dailyCals * 7).toLocaleString()}</div>
                  <div class="text-xs font-black text-gray-400">Kcal</div>
                </div>
                <div class="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mb-6">Target Settimanale</div>
                <button class="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm active:scale-95 generate-week-btn" data-week="${w}">
                  Rigenera
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function showAddRecipeToMealModal(day, meal) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in';
    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar animate-scale-in">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-2xl font-black text-gray-900">Aggiungi a ${meals[mealKeys.indexOf(meal)]}</h3>
          <button id="close-modal-top" class="p-2 hover:bg-gray-100 rounded-xl transition-all">
            <i data-lucide="x" class="w-6 h-6 text-gray-400"></i>
          </button>
        </div>
        
        <div class="relative mb-6">
          <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"></i>
          <input type="text" id="recipe-search" placeholder="Cerca ricetta..." class="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none">
        </div>

        <div class="space-y-3" id="modal-recipe-list">
          ${recipes.map(r => {
            const totals = r.totals || calculateTotals(r.ingredients);
            return `
              <button class="w-full text-left p-4 rounded-2xl hover:bg-blue-50 border-2 border-transparent hover:border-blue-100 transition-all flex justify-between items-center group select-recipe active:scale-[0.98]" data-id="${r.id}">
                <div>
                  <div class="font-black text-gray-800 group-hover:text-blue-700 transition-colors">${r.name}</div>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-tighter">${Math.round(totals.calories)} Kcal</span>
                    <span class="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">${r.difficulty || 'Media'}</span>
                  </div>
                </div>
                <div class="w-10 h-10 rounded-xl bg-gray-50 text-gray-300 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                  <i data-lucide="plus-circle" class="w-6 h-6"></i>
                </div>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();

    const closeModal = () => {
      modal.classList.add('animate-fade-out');
      modal.querySelector('.animate-scale-in').classList.add('animate-scale-out');
      setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector('#close-modal-top').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    
    const searchInput = modal.querySelector('#recipe-search');
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const items = modal.querySelectorAll('.select-recipe');
      items.forEach(item => {
        const name = item.querySelector('.font-black').textContent.toLowerCase();
        item.classList.toggle('hidden', !name.includes(term));
      });
    });

    modal.querySelectorAll('.select-recipe').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const plan = getCurrentPlan();
        if (!plan.days[day]) plan.days[day] = {};
        if (!plan.days[day][meal]) plan.days[day][meal] = [];
        plan.days[day][meal].push(id);
        
        store.update('plans', plan.id, plan);
        closeModal();
        render();
      });
    });
  }

  async function exportToPDF() {
    const user = getSelectedUser();
    const plan = getCurrentPlan();
    
    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      document.head.appendChild(script);
      await new Promise(resolve => script.onload = resolve);
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFillColor(249, 250, 251);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setFontSize(24);
    doc.setTextColor(31, 41, 55);
    doc.setFont(undefined, 'bold');
    doc.text(`Piano Alimentare`, 20, 25);
    
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128);
    doc.text(`Utente: ${user.name} | Data: ${new Date().toLocaleDateString('it-IT')}`, 20, 33);
    
    let y = 55;
    
    dayKeys.forEach((dayKey, idx) => {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
      
      doc.setDrawColor(229, 231, 235);
      doc.line(20, y - 5, 190, y - 5);
      
      doc.setFontSize(14);
      doc.setTextColor(37, 99, 235);
      doc.setFont(undefined, 'bold');
      doc.text(daysOfWeek[idx], 20, y);
      y += 10;
      
      mealKeys.forEach((mealKey, mIdx) => {
        const mealRecipes = (plan.days[dayKey]?.[mealKey] || []).map(id => recipes.find(r => r.id === id)).filter(Boolean);
        if (mealRecipes.length) {
          doc.setFontSize(10);
          doc.setTextColor(75, 85, 99);
          doc.setFont(undefined, 'bold');
          doc.text(`${meals[mIdx]}:`, 25, y);
          
          doc.setFont(undefined, 'normal');
          doc.setTextColor(31, 41, 55);
          const recipeNames = mealRecipes.map(r => r.name).join(', ');
          const splitNames = doc.splitTextToSize(recipeNames, 140);
          doc.text(splitNames, 50, y);
          y += (splitNames.length * 5) + 2;
        }
      });
      y += 5;
    });
    
    doc.save(`Piano_Alimentare_${user.name}.pdf`);
  }

  function autoFillMeal(day, meal, silent = false) {
    const user = getSelectedUser();
    const plan = getCurrentPlan();
    const dailyTarget = calculateUserDailyCals(user);
    const suitableRecipes = getSuitableRecipes(user);

    const mealTargets = {
      breakfast: 0.20,
      lunch: 0.35,
      dinner: 0.30,
      snacks: 0.15
    };

    const target = dailyTarget * mealTargets[meal];
    
    // Map meal keys to category names
    const categoryMap = {
      breakfast: 'Colazione',
      lunch: 'Pranzo',
      dinner: 'Cena',
      snacks: 'Merenda'
    };
    const targetCategory = categoryMap[meal];

    let candidates = suitableRecipes.filter(r => {
      // Must match category if categories are defined
      if (r.mealCategories && r.mealCategories.length > 0) {
        if (!r.mealCategories.includes(targetCategory)) return false;
      }
      
      const totals = r.totals || calculateTotals(r.ingredients);
      const cals = totals.calories;
      // Allow recipes within a reasonable calorie range of the target
      return cals >= target * 0.5 && cals <= target * 1.5;
    });

    if (candidates.length === 0) {
      // Fallback to suitable recipes that might not match the category exactly but fit calorie-wise
      candidates = suitableRecipes.filter(r => {
        const totals = r.totals || calculateTotals(r.ingredients);
        const cals = totals.calories;
        return cals >= target * 0.7 && cals <= target * 1.3;
      });
    }

    if (candidates.length === 0) candidates = suitableRecipes;

    // Score candidates and pick best ones
    const scoredCandidates = candidates.map(r => {
      let score = 1; // Base score
      const tags = r.tags || [];
      const conditions = (user.healthConditions || []).map(c => c.toLowerCase());
      
      if (conditions.includes('artrite') || conditions.includes('sclerosi multipla') || conditions.includes('endometriosi')) {
        if (tags.includes('anti-inflammatory')) score += 5;
        if (tags.includes('omega-3')) score += 3;
      }
      
      if (conditions.includes('reflusso') || conditions.includes('reflux')) {
        if (tags.includes('low-acid')) score += 5;
      }

      // Prioritize authentic/new recipes slightly
      if (r.id === '5' || r.id === '6') score += 2;

      return { recipe: r, score: score * Math.random() }; // Add randomness
    }).sort((a, b) => b.score - a.score);

    const picked = scoredCandidates[0].recipe;
    
    if (!plan.days[day]) plan.days[day] = {};
    plan.days[day][meal] = [picked.id];

    store.update('plans', plan.id, plan);
    if (!silent) {
      render();
      showToast(`Pasto generato: ${picked.name}`);
    }
  }

  function autoFillDay(day, silent = false) {
    mealKeys.forEach(meal => autoFillMeal(day, meal, true));
    if (!silent) {
      render();
      showToast(`Giornata generata con successo!`);
    }
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl z-[100] animate-bounce-in flex items-center gap-3 w-[90%] sm:w-auto justify-center';
    toast.innerHTML = `<i data-lucide="check-circle" class="w-5 h-5 text-green-400"></i> <span class="text-sm font-bold">${message}</span>`;
    document.body.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => {
      toast.classList.add('animate-fade-out');
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  }

  function generateAutoPlan(weekNum = null) {
    const user = getSelectedUser();
    const plan = getCurrentPlan();
    
    dayKeys.forEach(dayKey => autoFillDay(dayKey, true));

    store.update('plans', plan.id, plan);
    render();
    
    const msg = weekNum ? `Piano per la settimana ${weekNum} generato!` : `Piano settimanale generato per ${user.name}!`;
    showToast(msg);
  }

  render();
  
  return container;
}
