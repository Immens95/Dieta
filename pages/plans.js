
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
    
    // Adjustment for goal
    if (user.weight > user.targetWeight) tdee -= 500; // Deficit
    else if (user.weight < user.targetWeight) tdee += 300; // Surplus
    
    return Math.round(tdee);
  }

  function getSuitableRecipes(user) {
    return recipes.filter(r => {
      // Check intolerances (match data values: lactose, gluten)
      if (user.intolerances?.includes('gluten') && !r.tags?.includes('gluten-free')) return false;
      if (user.intolerances?.includes('lactose') && !r.tags?.includes('lactose-free')) return false;
      
      // Health conditions (match data values: reflux, ibs)
      if (user.healthConditions?.includes('reflux') && !r.tags?.includes('low-acid')) return false;
      if (user.healthConditions?.includes('ibs') && !r.tags?.includes('low-fodmap') && !r.tags?.includes('gluten-free')) return false;
      
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

  function render() {
    const user = getSelectedUser();
    const plan = getCurrentPlan();
    const dailyCals = calculateUserDailyCals(user);

    container.innerHTML = `
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div class="space-y-1">
          <h2 class="text-2xl font-bold text-gray-800 tracking-tight">Piani Alimentari</h2>
          <div class="flex items-center gap-3">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-wider">Gestione per:</label>
            <select id="user-selector" class="bg-blue-50 text-blue-700 text-sm font-bold py-1 px-3 rounded-full border-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
              ${users.map(u => `<option value="${u.id}" ${u.id === selectedUserId ? 'selected' : ''}>${u.name}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="flex flex-wrap gap-3">
          <div class="flex bg-gray-100 p-1 rounded-xl">
            <button class="view-toggle px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}" data-view="day">Giorno</button>
            <button class="view-toggle px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}" data-view="week">Settimana</button>
            <button class="view-toggle px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}" data-view="month">Mese</button>
          </div>
          
          <button id="generate-plan-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-sm shadow-blue-200">
            <i data-lucide="wand-2" class="w-4 h-4"></i>
            Genera Piano
          </button>
          
          <button id="export-pdf-btn" class="bg-gray-800 hover:bg-gray-900 text-white px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-sm">
            <i data-lucide="file-text" class="w-4 h-4"></i>
            Esporta
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6">
        ${viewMode === 'day' ? renderDayView(plan, dailyCals) : 
          viewMode === 'week' ? renderWeekView(plan, dailyCals) : 
          renderMonthView(plan, dailyCals)}
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
        const recipe = recipes.find(r => r.id === id);
        if (recipe) showRecipeDetailModal(recipe, foods);
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

  function renderDayView(plan, dailyCals) {
    const dayKey = dayKeys[selectedDayIndex];
    return `
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between p-6 border-b border-gray-50 bg-gray-50/30">
          <div class="flex items-center gap-4">
            <button id="prev-day" class="p-2 hover:bg-gray-100 rounded-full transition-colors"><i data-lucide="chevron-left" class="w-5 h-5"></i></button>
            <h3 class="text-xl font-bold text-gray-800">${daysOfWeek[selectedDayIndex]}</h3>
            <button id="next-day" class="p-2 hover:bg-gray-100 rounded-full transition-colors"><i data-lucide="chevron-right" class="w-5 h-5"></i></button>
            <button class="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors auto-fill-day" data-day="${dayKey}">
              <i data-lucide="wand-2" class="w-3.5 h-3.5"></i>
              Auto-fill Giorno
            </button>
          </div>
          <div class="text-right">
            <div class="text-[10px] font-bold text-gray-400 uppercase">Target Giornaliero</div>
            <div class="text-lg font-black text-blue-600">${dailyCals} Kcal</div>
          </div>
        </div>
        <div class="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          ${mealKeys.map((mealKey, idx) => {
            const mealRecipes = (plan.days[dayKey]?.[mealKey] || []).map(id => recipes.find(r => r.id === id)).filter(Boolean);
            const mealCals = mealRecipes.reduce((sum, r) => {
              const totals = r.totals || calculateTotals(r.ingredients);
              return sum + totals.calories;
            }, 0);
            return `
              <div class="space-y-4">
                <div class="flex justify-between items-center border-b border-gray-100 pb-2">
                  <h4 class="font-bold text-gray-900 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                    ${meals[idx]}
                  </h4>
                  <div class="flex items-center gap-2">
                    <button class="text-blue-500 hover:text-blue-700 auto-fill-meal" data-day="${dayKey}" data-meal="${mealKey}" title="Auto-fill Pasto">
                      <i data-lucide="wand-2" class="w-4 h-4"></i>
                    </button>
                    <button class="text-blue-600 hover:text-blue-800 add-to-meal" data-day="${dayKey}" data-meal="${mealKey}">
                      <i data-lucide="plus-circle" class="w-5 h-5"></i>
                    </button>
                  </div>
                </div>
                <div class="space-y-3">
                  ${mealRecipes.length ? mealRecipes.map(r => {
                    const totals = r.totals || calculateTotals(r.ingredients);
                    return `
                      <div class="group bg-gray-50 hover:bg-blue-50 p-3 rounded-xl transition-all cursor-pointer recipe-item relative border border-transparent hover:border-blue-100" data-id="${r.id}">
                        <div class="font-bold text-sm text-gray-800 pr-6">${r.name}</div>
                        <div class="text-[10px] font-medium text-gray-500 mt-1">${Math.round(totals.calories)} Kcal • ${r.prepTime || '20 min'}</div>
                        <button class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 remove-from-meal transition-opacity" 
                          data-day="${dayKey}" data-meal="${mealKey}" data-id="${r.id}">
                          <i data-lucide="x" class="w-4 h-4"></i>
                        </button>
                      </div>
                    `;
                  }).join('') : '<div class="text-xs text-gray-400 italic py-4 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">Nessun pasto pianificato</div>'}
                </div>
                ${mealRecipes.length ? `<div class="text-right text-[10px] font-bold text-gray-400 uppercase">Totale: ${Math.round(mealCals)} Kcal</div>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function renderWeekView(plan, dailyCals) {
    return `
      <div class="grid grid-cols-1 xl:grid-cols-7 gap-4 overflow-x-auto pb-4">
        ${dayKeys.map((dayKey, dayIdx) => {
          const dayCals = mealKeys.reduce((sum, mk) => {
            const mealRecipes = (plan.days[dayKey]?.[mk] || []).map(id => recipes.find(r => r.id === id)).filter(Boolean);
            return sum + mealRecipes.reduce((s, r) => {
              const totals = r.totals || calculateTotals(r.ingredients);
              return s + totals.calories;
            }, 0);
          }, 0);
          
          return `
            <div class="min-w-[220px] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
              <div class="p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                <div class="flex justify-between items-center mb-1">
                  <div class="font-bold text-gray-800 text-sm">${daysOfWeek[dayIdx]}</div>
                  <button class="text-blue-500 hover:text-blue-700 auto-fill-day" data-day="${dayKey}" title="Auto-fill Giorno">
                    <i data-lucide="wand-2" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
                <div class="text-center text-[10px] font-bold ${dayCals > dailyCals ? 'text-red-500' : 'text-green-500'}">${Math.round(dayCals)} / ${dailyCals} Kcal</div>
              </div>
              <div class="p-3 space-y-5 flex-1">
                ${mealKeys.map((mealKey, idx) => {
                  const mealRecipes = (plan.days[dayKey]?.[mealKey] || []).map(id => recipes.find(r => r.id === id)).filter(Boolean);
                  return `
                    <div class="space-y-2">
                      <div class="flex justify-between items-center px-1">
                        <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">${meals[idx]}</span>
                        <div class="flex items-center gap-1">
                          <button class="text-blue-400 hover:text-blue-600 auto-fill-meal" data-day="${dayKey}" data-meal="${mealKey}" title="Auto-fill Pasto">
                            <i data-lucide="wand-2" class="w-3 h-3"></i>
                          </button>
                          <button class="text-blue-500 hover:text-blue-700 add-to-meal" data-day="${dayKey}" data-meal="${mealKey}">
                            <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                          </button>
                        </div>
                      </div>
                      <div class="space-y-1.5">
                        ${mealRecipes.length ? mealRecipes.map(r => {
                          const totals = r.totals || calculateTotals(r.ingredients);
                          return `
                            <div class="group p-2 bg-blue-50/50 hover:bg-blue-100/50 rounded-lg text-[11px] cursor-pointer recipe-item relative transition-colors" data-id="${r.id}">
                              <div class="font-bold text-blue-900 pr-4 leading-tight">${r.name}</div>
                              <div class="text-[9px] text-blue-600 mt-0.5">${Math.round(totals.calories)} Kcal</div>
                              <button class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 remove-from-meal transition-opacity" 
                                data-day="${dayKey}" data-meal="${mealKey}" data-id="${r.id}">
                                <i data-lucide="x" class="w-3 h-3"></i>
                              </button>
                            </div>
                          `;
                        }).join('') : '<div class="text-[9px] text-gray-300 italic px-1">Vuoto</div>'}
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

  function renderMonthView(plan, dailyCals) {
    return `
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <i data-lucide="calendar" class="w-8 h-8"></i>
        </div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">Vista Mensile</h3>
        <p class="text-gray-500 max-w-md mx-auto mb-6">La vista mensile ti permette di avere una panoramica delle calorie e degli obiettivi nutrizionali per le prossime 4 settimane.</p>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          ${[1,2,3,4].map(w => `
            <div class="p-6 border border-gray-100 rounded-2xl hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
              <div class="text-xs font-bold text-gray-400 uppercase mb-2">Settimana ${w}</div>
              <div class="text-2xl font-black text-gray-800 mb-1">${Math.round(dailyCals * 7)}</div>
              <div class="text-[10px] font-bold text-gray-400 uppercase mb-4">Kcal Totali</div>
              <button class="w-full py-2 bg-white border border-blue-100 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm generate-week-btn" data-week="${w}">
                Rigenera
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function showAddRecipeToMealModal(day, meal) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-scale-in">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-2xl font-bold text-gray-800">Aggiungi a ${meals[mealKeys.indexOf(meal)]}</h3>
          <button id="close-modal" class="text-gray-400 hover:text-gray-600"><i data-lucide="x" class="w-6 h-6"></i></button>
        </div>
        
        <div class="relative mb-6">
          <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"></i>
          <input type="text" id="recipe-search" placeholder="Cerca ricetta..." class="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500">
        </div>

        <div class="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar" id="modal-recipe-list">
          ${recipes.map(r => {
            const totals = r.totals || calculateTotals(r.ingredients);
            return `
              <button class="w-full text-left p-4 rounded-xl hover:bg-blue-50 border border-gray-100 transition-all flex justify-between items-center group select-recipe" data-id="${r.id}">
                <div>
                  <div class="font-bold text-gray-800 group-hover:text-blue-700 transition-colors">${r.name}</div>
                  <div class="text-xs text-gray-500">${Math.round(totals.calories)} Kcal • ${r.difficulty || 'Media'}</div>
                </div>
                <i data-lucide="plus-circle" class="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-all"></i>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();

    modal.querySelector('#close-modal').addEventListener('click', () => modal.remove());
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
    
    const searchInput = modal.querySelector('#recipe-search');
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const items = modal.querySelectorAll('.select-recipe');
      items.forEach(item => {
        const name = item.querySelector('.font-bold').textContent.toLowerCase();
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
        modal.remove();
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
    let candidates = suitableRecipes.filter(r => {
      const totals = r.totals || calculateTotals(r.ingredients);
      const cals = totals.calories;
      return cals >= target * 0.7 && cals <= target * 1.3;
    });

    if (candidates.length === 0) candidates = suitableRecipes;
    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    
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
    toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl z-[100] animate-bounce-in flex items-center gap-3';
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
  
  // Add day navigation listeners
  container.addEventListener('click', (e) => {
    if (e.target.closest('#prev-day')) {
      selectedDayIndex = (selectedDayIndex - 1 + 7) % 7;
      render();
    }
    if (e.target.closest('#next-day')) {
      selectedDayIndex = (selectedDayIndex + 1) % 7;
      render();
    }
  });

  return container;
}
