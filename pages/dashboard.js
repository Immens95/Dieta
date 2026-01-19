import { store } from '../utils/store.js';

export async function DashboardPage() {
  const container = document.createElement('div');
  container.className = 'space-y-8 animate-fade-in';

  let allUsers = store.getAll('users');
  let selectedUserIds = [allUsers[0]?.id].filter(Boolean); // Start with the first user if available

  function calculateUserStats(user) {
    // Basic BMR calculation (Mifflin-St Jeor)
    const bmr = user.sex === 'male'
      ? 10 * user.weight + 6.25 * user.height - 5 * user.age + 5
      : 10 * user.weight + 6.25 * user.height - 5 * user.age - 161;
    
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      medium: 1.55,
      active: 1.725
    };
    
    const tdee = Math.round(bmr * (multipliers[user.activityLevel] || 1.2));
    
    // Target calories based on goal
    const kgToLose = user.weight - user.targetWeight;
    const totalDeficitNeeded = kgToLose * 7700;
    const dailyDeficit = totalDeficitNeeded / (user.goalWeeks * 7);
    const targetKcal = Math.round(tdee - dailyDeficit);

    // Default macro distribution (40% Carbs, 30% Protein, 30% Fats)
    let proteinPct = 0.3;
    let carbsPct = 0.4;
    let fatsPct = 0.3;

    // Adjust macros based on health conditions
    if (user.healthConditions?.includes('reflux')) {
      fatsPct = 0.2; // Lower fats for reflux
      carbsPct = 0.5;
    }
    if (user.healthConditions?.includes('endometriosis')) {
      proteinPct = 0.35; // Higher protein/anti-inflammatory focus
      fatsPct = 0.3;
      carbsPct = 0.35;
    }
    if (user.sensitivity === 'high') {
      // More balanced for high sensitivity
      proteinPct = 0.3;
      carbsPct = 0.4;
      fatsPct = 0.3;
    }

    return {
      tdee,
      targetKcal,
      protein: Math.round((targetKcal * proteinPct) / 4),
      carbs: Math.round((targetKcal * carbsPct) / 4),
      fats: Math.round((targetKcal * fatsPct) / 9)
    };
  }

  function getDietaryRecommendations(user) {
    const foods = store.getAll('foods');
    let recommendations = {
      recommended: [],
      avoid: []
    };

    foods.forEach(food => {
      let score = 0;
      let reason = [];

      // Intolerances (Hard filters)
      const isIntolerant = user.intolerances?.some(i => {
        if (i === 'lactose' && !food.tags?.includes('lactose-free')) return true;
        if (i === 'gluten' && !food.tags?.includes('gluten-free')) return true;
        return false;
      });

      if (isIntolerant) {
        recommendations.avoid.push({ ...food, reason: 'Contiene allergeni' });
        return;
      }

      // Health Conditions
      if (user.healthConditions?.includes('reflux')) {
        if (food.tags?.includes('acidic')) {
          recommendations.avoid.push({ ...food, reason: 'Acido (Sconsigliato per Reflusso)' });
          return;
        }
        if (food.tags?.includes('low-acid')) score += 2;
      }

      if (user.healthConditions?.includes('ibs')) {
        if (food.tags?.includes('ibs-friendly')) score += 2;
      }

      if (score >= 2) {
        recommendations.recommended.push(food);
      }
    });

    return recommendations;
  }

  let timeframe = 'daily';

  function initChart(canvasId, user, timeframe) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    let history = [...(user.weightHistory || [])];
    if (history.length === 0) {
      history = [{ date: new Date().toISOString().split('T')[0], actual: user.weight, estimated: user.weight }];
    }

    // Sort by date
    history.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Filter based on timeframe
    const now = new Date();
    if (timeframe === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      history = history.filter(h => new Date(h.date) >= weekAgo);
    } else if (timeframe === 'monthly') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      history = history.filter(h => new Date(h.date) >= monthAgo);
    } else if (timeframe === 'bimonthly') {
      const bimonthlyAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
      history = history.filter(h => new Date(h.date) >= bimonthlyAgo);
    } else if (timeframe === 'quarterly') {
      const quarterlyAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      history = history.filter(h => new Date(h.date) >= quarterlyAgo);
    } else if (timeframe === 'semiannual') {
      const semiannualAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      history = history.filter(h => new Date(h.date) >= semiannualAgo);
    } else if (timeframe === 'annual') {
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      history = history.filter(h => new Date(h.date) >= yearAgo);
    }
    // (Other timeframes can be added similarly)

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: history.map(h => h.date),
        datasets: [
          {
            label: 'Peso Reale',
            data: history.map(h => h.actual),
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          },
          {
            label: 'Peso Stimato',
            data: history.map(h => h.estimated),
            borderColor: '#94a3b8',
            borderDash: [5, 5],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { grid: { display: false } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  function showWeightUpdateModal(user) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h3 class="text-xl font-bold mb-4">Aggiorna Peso per ${user.name}</h3>
        <form id="weight-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Peso Odierno (kg)</label>
            <input type="number" step="0.1" name="weight" value="${user.weight}" required class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
          </div>
          <div class="flex justify-end gap-3 pt-4">
            <button type="button" id="close-weight-modal" class="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Annulla</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium">Salva</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#close-weight-modal').addEventListener('click', () => modal.remove());
    modal.querySelector('#weight-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const newWeight = Number(new FormData(e.target).get('weight'));
      const today = new Date().toISOString().split('T')[0];
      
      const weightHistory = user.weightHistory || [];
      const stats = calculateUserStats(user);
      
      // Update history
      const existingEntry = weightHistory.find(h => h.date === today);
      if (existingEntry) {
        existingEntry.actual = newWeight;
      } else {
        const lastEst = weightHistory.length > 0 ? weightHistory[weightHistory.length-1].estimated : user.weight;
        const dailyLoss = (user.weight - user.targetWeight) / (user.goalWeeks * 7);
        weightHistory.push({
          date: today,
          actual: newWeight,
          estimated: Math.round((lastEst - dailyLoss) * 10) / 10
        });
      }

      store.update('users', user.id, { 
        weight: newWeight,
        weightHistory: weightHistory
      });

      modal.remove();
      allUsers = store.getAll('users');
      render();
    });
  }

  function render() {
    container.innerHTML = `
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Panoramica Nutrizionale</h2>
          <p class="text-sm text-gray-500">Monitora gli obiettivi e le statistiche degli utenti selezionati</p>
        </div>
        
        <div class="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <select id="timeframe-selector" class="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium">
            <option value="daily" ${timeframe === 'daily' ? 'selected' : ''}>Giornaliero</option>
            <option value="weekly" ${timeframe === 'weekly' ? 'selected' : ''}>Settimanale</option>
            <option value="monthly" ${timeframe === 'monthly' ? 'selected' : ''}>Mensile</option>
            <option value="bimonthly" ${timeframe === 'bimonthly' ? 'selected' : ''}>Bimestrale</option>
            <option value="quarterly" ${timeframe === 'quarterly' ? 'selected' : ''}>Trimestrale</option>
            <option value="semiannual" ${timeframe === 'semiannual' ? 'selected' : ''}>Semestrale</option>
            <option value="annual" ${timeframe === 'annual' ? 'selected' : ''}>Annuale</option>
          </select>

          <div class="relative inline-block text-left w-full md:w-auto">
            <button id="user-selector-btn" class="w-full md:w-64 bg-white border border-gray-300 rounded-lg px-4 py-2 flex justify-between items-center text-sm font-medium hover:bg-gray-50 transition-colors">
              <span>Seleziona Utenti (${selectedUserIds.length})</span>
              <i data-lucide="chevron-down" class="w-4 h-4"></i>
            </button>
            <div id="user-dropdown" class="hidden absolute right-0 mt-2 w-full md:w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden">
              <div class="p-2 space-y-1">
                ${allUsers.map(user => `
                  <label class="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
                    <input type="checkbox" value="${user.id}" ${selectedUserIds.includes(user.id) ? 'checked' : ''} class="user-checkbox w-4 h-4 text-blue-600 rounded">
                    <span class="text-sm text-gray-700">${user.name}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-8" id="user-stats-grid">
        ${selectedUserIds.map(id => {
          const user = allUsers.find(u => u.id === id);
          if (!user) return '';
          const stats = calculateUserStats(user);
          const recommendations = getDietaryRecommendations(user);
          const progress = Math.min(100, Math.max(0, ((user.weight - user.targetWeight) / (user.weight - user.targetWeight + 5)) * 100));

          return `
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
              <div class="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                    ${user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 class="font-bold text-gray-900">${user.name}</h3>
                    <div class="flex flex-wrap gap-1 mt-1">
                      ${user.healthConditions?.map(hc => `<span class="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] rounded uppercase font-bold">${hc}</span>`).join('')}
                      ${user.intolerances?.map(i => `<span class="px-1.5 py-0.5 bg-yellow-100 text-yellow-600 text-[10px] rounded uppercase font-bold">${i}</span>`).join('')}
                      <span class="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded uppercase font-bold">Sensibilità: ${user.sensitivity || 'media'}</span>
                    </div>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button class="p-2 text-gray-400 hover:text-blue-600 update-weight-btn" data-id="${user.id}">
                    <i data-lucide="scale" class="w-5 h-5"></i>
                  </button>
                  <button class="text-gray-400 hover:text-red-500 transition-colors remove-user-view" data-id="${user.id}">
                    <i data-lucide="x" class="w-5 h-5"></i>
                  </button>
                </div>
              </div>

              <div class="p-6 space-y-6">
                <!-- Chart -->
                <div class="h-48 w-full bg-gray-50 rounded-xl p-4">
                  <canvas id="chart-${user.id}"></canvas>
                </div>

                <!-- Primary Stats -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div class="p-3 bg-blue-50 rounded-xl text-center">
                    <p class="text-[10px] text-blue-500 uppercase font-bold mb-1">Target Kcal</p>
                    <p class="text-xl font-black text-blue-700">${stats.targetKcal}</p>
                  </div>
                  <div class="p-3 bg-green-50 rounded-xl text-center">
                    <p class="text-[10px] text-green-500 uppercase font-bold mb-1">Proteine</p>
                    <p class="text-xl font-black text-green-700">${stats.protein}g</p>
                  </div>
                  <div class="p-3 bg-yellow-50 rounded-xl text-center">
                    <p class="text-[10px] text-yellow-500 uppercase font-bold mb-1">Carboidrati</p>
                    <p class="text-xl font-black text-yellow-700">${stats.carbs}g</p>
                  </div>
                  <div class="p-3 bg-red-50 rounded-xl text-center">
                    <p class="text-[10px] text-red-500 uppercase font-bold mb-1">Grassi</p>
                    <p class="text-xl font-black text-red-700">${stats.fats}g</p>
                  </div>
                </div>

                <!-- Dietary Tips -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="p-4 bg-green-50/50 rounded-xl border border-green-100">
                    <h4 class="text-[10px] font-bold text-green-700 uppercase mb-2">Alimenti Consigliati</h4>
                    <div class="space-y-1">
                      ${recommendations.recommended.slice(0, 3).map(f => `<p class="text-xs text-green-800">• ${f.name}</p>`).join('') || '<p class="text-xs text-gray-400">Nessun consiglio</p>'}
                    </div>
                  </div>
                  <div class="p-4 bg-red-50/50 rounded-xl border border-red-100">
                    <h4 class="text-[10px] font-bold text-red-700 uppercase mb-2">Da Evitare</h4>
                    <div class="space-y-1">
                      ${recommendations.avoid.slice(0, 3).map(f => `<p class="text-xs text-red-800">• ${f.name}</p>`).join('') || '<p class="text-xs text-gray-400">Nessun divieto</p>'}
                    </div>
                  </div>
                </div>

                <!-- Progress Bar -->
                <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div class="flex justify-between items-end mb-4">
                    <div>
                      <p class="text-xs text-gray-400 font-bold uppercase mb-1">Peso Attuale</p>
                      <p class="text-2xl font-black text-gray-800">${user.weight} <span class="text-sm font-normal text-gray-400">kg</span></p>
                    </div>
                    <div class="text-right">
                      <p class="text-xs text-gray-400 font-bold uppercase mb-1">Obiettivo</p>
                      <p class="text-2xl font-black text-blue-600">${user.targetWeight} <span class="text-sm font-normal text-gray-400">kg</span></p>
                    </div>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div class="bg-blue-600 h-3 rounded-full transition-all duration-1000" style="width: ${progress}%"></div>
                  </div>
                  <p class="text-[10px] text-gray-500 italic text-center">Raggiunto il ${Math.round(progress)}% dell'obiettivo</p>
                </div>
              </div>
            </div>
          `;
        }).join('')}

        ${selectedUserIds.length === 0 ? `
          <div class="col-span-full py-20 text-center">
            <div class="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <i data-lucide="users" class="w-8 h-8 text-gray-400"></i>
            </div>
            <h3 class="text-lg font-bold text-gray-900">Nessun utente selezionato</h3>
            <p class="text-gray-500">Usa il selettore in alto per mostrare le statistiche</p>
          </div>
        ` : ''}
      </div>
    `;

    // Wait for DOM
    setTimeout(() => {
      selectedUserIds.forEach(id => {
        const user = allUsers.find(u => u.id === id);
        if (user) initChart(`chart-${id}`, user, timeframe);
      });
    }, 0);

    // Event Listeners
    const timeframeSelector = container.querySelector('#timeframe-selector');
    timeframeSelector?.addEventListener('change', (e) => {
      timeframe = e.target.value;
      render();
    });

    const selectorBtn = container.querySelector('#user-selector-btn');
    const dropdown = container.querySelector('#user-dropdown');
    
    selectorBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown?.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (dropdown && !dropdown.contains(e.target) && e.target !== selectorBtn) {
        dropdown.classList.add('hidden');
      }
    });

    container.querySelectorAll('.user-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = e.target.value;
        if (e.target.checked) {
          if (!selectedUserIds.includes(id)) selectedUserIds.push(id);
        } else {
          selectedUserIds = selectedUserIds.filter(uid => uid !== id);
        }
        render();
      });
    });

    container.querySelectorAll('.remove-user-view').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        selectedUserIds = selectedUserIds.filter(uid => uid !== id);
        render();
      });
    });

    container.querySelectorAll('.update-weight-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const user = allUsers.find(u => u.id === id);
        if (user) showWeightUpdateModal(user);
      });
    });

    if (window.lucide) window.lucide.createIcons();
    if (window.updatePageTitle) window.updatePageTitle();
  }

  render();
  return container;
}
