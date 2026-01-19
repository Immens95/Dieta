import { store } from '../utils/store.js';

export async function PlansPage() {
  const container = document.createElement('div');
  container.className = 'space-y-6';

  let plans = store.getAll('plans');
  let users = store.getAll('users');
  let recipes = store.getAll('recipes');
  let currentPlan = plans[0] || { days: {} };
  let selectedUser = users.find(u => u.id === currentPlan.userId) || users[0];

  const daysOfWeek = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const meals = ['Colazione', 'Pranzo', 'Cena', 'Spuntini'];
  const mealKeys = ['breakfast', 'lunch', 'dinner', 'snacks'];

  function render() {
    container.innerHTML = `
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Piani Alimentari</h2>
          <p class="text-sm text-gray-500">Gestisci i piani settimanali per ${selectedUser.name}</p>
        </div>
        <div class="flex gap-2">
          <button id="export-pdf-btn" class="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
            <i data-lucide="file-text" class="w-4 h-4"></i>
            Esporta PDF
          </button>
          <button id="generate-plan-btn" class="bg-secondary hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
            <i data-lucide="wand-2" class="w-4 h-4"></i>
            Genera Automatico
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-7 gap-4 overflow-x-auto pb-4">
        ${dayKeys.map((dayKey, dayIdx) => `
          <div class="min-w-[200px] bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <div class="p-3 border-b border-gray-100 bg-gray-50 rounded-t-xl text-center font-bold text-gray-700">
              ${daysOfWeek[dayIdx]}
            </div>
            <div class="p-2 space-y-4 flex-1">
              ${mealKeys.map(mealKey => {
                const mealRecipes = (currentPlan.days[dayKey]?.[mealKey] || []).map(id => recipes.find(r => r.id === id)).filter(Boolean);
                return `
                  <div class="space-y-2">
                    <div class="flex justify-between items-center px-1">
                      <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">${meals[mealKeys.indexOf(mealKey)]}</span>
                      <button class="text-blue-500 hover:text-blue-700 add-to-meal" data-day="${dayKey}" data-meal="${mealKey}">
                        <i data-lucide="plus-circle" class="w-3 h-3"></i>
                      </button>
                    </div>
                    <div class="space-y-1">
                      ${mealRecipes.length ? mealRecipes.map(r => `
                        <div class="p-2 bg-blue-50 rounded-lg text-xs group relative">
                          <div class="font-medium text-blue-900 pr-4">${r.name}</div>
                          <button class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 remove-from-meal" 
                            data-day="${dayKey}" data-meal="${mealKey}" data-id="${r.id}">
                            <i data-lucide="x" class="w-3 h-3"></i>
                          </button>
                        </div>
                      `).join('') : '<div class="text-[10px] text-gray-300 italic px-1">Nessun pasto</div>'}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Event listeners
    container.querySelectorAll('.add-to-meal').forEach(btn => {
      btn.addEventListener('click', () => {
        const day = btn.getAttribute('data-day');
        const meal = btn.getAttribute('data-meal');
        showAddRecipeToMealModal(day, meal);
      });
    });

    container.querySelectorAll('.remove-from-meal').forEach(btn => {
      btn.addEventListener('click', () => {
        const day = btn.getAttribute('data-day');
        const meal = btn.getAttribute('data-meal');
        const id = btn.getAttribute('data-id');
        
        const idx = currentPlan.days[day][meal].indexOf(id);
        if (idx > -1) {
          currentPlan.days[day][meal].splice(idx, 1);
          store.update('plans', currentPlan.id, currentPlan);
          render();
        }
      });
    });

    container.querySelector('#export-pdf-btn').addEventListener('click', () => exportToPDF());
    container.querySelector('#generate-plan-btn').addEventListener('click', () => generateAutoPlan());

    if (window.lucide) window.lucide.createIcons();
    if (window.updatePageTitle) window.updatePageTitle();
  }

  function showAddRecipeToMealModal(day, meal) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 class="text-xl font-bold mb-4">Aggiungi a ${meals[mealKeys.indexOf(meal)]} (${daysOfWeek[dayKeys.indexOf(day)]})</h3>
        <div class="space-y-2 max-h-96 overflow-y-auto pr-2">
          ${recipes.map(r => `
            <button class="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors flex justify-between items-center select-recipe" data-id="${r.id}">
              <span class="font-medium">${r.name}</span>
              <i data-lucide="chevron-right" class="w-4 h-4 text-gray-400"></i>
            </button>
          `).join('')}
        </div>
        <div class="mt-6 flex justify-end">
          <button id="close-modal" class="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Chiudi</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();

    modal.querySelector('#close-modal').addEventListener('click', () => modal.remove());
    modal.querySelectorAll('.select-recipe').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (!currentPlan.days[day]) currentPlan.days[day] = {};
        if (!currentPlan.days[day][meal]) currentPlan.days[day][meal] = [];
        currentPlan.days[day][meal].push(id);
        
        if (currentPlan.id) {
          store.update('plans', currentPlan.id, currentPlan);
        } else {
          currentPlan.userId = selectedUser.id;
          currentPlan.name = "Nuovo Piano";
          const newPlan = store.add('plans', currentPlan);
          currentPlan = newPlan;
        }
        
        modal.remove();
        render();
      });
    });
  }

  async function exportToPDF() {
    // Import jsPDF from CDN dynamically if not available
    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      document.head.appendChild(script);
      await new Promise(resolve => script.onload = resolve);
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text(`Piano Alimentare: ${selectedUser.name}`, 20, 20);
    
    doc.setFontSize(12);
    let y = 40;
    
    dayKeys.forEach((dayKey, idx) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFont(undefined, 'bold');
      doc.text(daysOfWeek[idx], 20, y);
      y += 10;
      doc.setFont(undefined, 'normal');
      
      mealKeys.forEach((mealKey, mIdx) => {
        const mealRecipes = (currentPlan.days[dayKey]?.[mealKey] || []).map(id => recipes.find(r => r.id === id)).filter(Boolean);
        if (mealRecipes.length) {
          doc.text(`  ${meals[mIdx]}: ${mealRecipes.map(r => r.name).join(', ')}`, 20, y);
          y += 7;
        }
      });
      y += 5;
    });
    
    doc.save(`Piano_Alimentare_${selectedUser.name}.pdf`);
  }

  function generateAutoPlan() {
    alert("Funzionalità in fase di sviluppo: Generazione basata sugli obiettivi di " + selectedUser.name);
    // Logic to pick recipes based on calories and macros
  }

  render();
  return container;
}
