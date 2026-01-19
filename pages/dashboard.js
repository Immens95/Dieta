import { store } from '../utils/store.js';

export async function DashboardPage() {
  await store.ensureInitialized();
  const container = document.createElement('div');
  container.className = 'space-y-8 animate-fade-in';

  let allUsers = store.getAll('users') || [];
  let selectedUserIds = [allUsers[0]?.id].filter(Boolean); // Start with the first user if available

  function calculateUserStats(user) {
    if (user.manualTargetKcal) {
      return {
        targetKcal: user.manualTargetKcal,
        protein: user.manualProtein,
        carbs: user.manualCarbs,
        fats: user.manualFats
      };
    }

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
    const conditions = (user.healthConditions || []).map(c => c.toLowerCase());
    if (conditions.includes('reflux') || conditions.includes('reflusso')) {
      fatsPct = 0.2; // Lower fats for reflux
      carbsPct = 0.5;
    }
    if (conditions.includes('endometriosis') || conditions.includes('endometriosi') || conditions.includes('artrite')) {
      proteinPct = 0.35; // Higher protein/anti-inflammatory focus
      fatsPct = 0.3;
      carbsPct = 0.35;
    }
    if (conditions.includes('sclerosi multipla')) {
      proteinPct = 0.3;
      fatsPct = 0.4; // Focus on healthy fats (Omega-3)
      carbsPct = 0.3;
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

    const likedFoods = (user.likedFoods || []).map(f => f.toLowerCase());
    const dislikedFoods = (user.dislikedFoods || []).map(f => f.toLowerCase());

    // User preferences (priority)
    likedFoods.forEach(food => recommendations.recommended.push({ name: food, reason: 'Preferito da te' }));
    dislikedFoods.forEach(food => recommendations.avoid.push({ name: food, reason: 'Sconsigliato da te' }));

    foods.forEach(food => {
      let score = 0;
      let reason = [];

      // Intolerances (Hard filters)
      const isIntolerant = user.intolerances?.some(i => {
        const intolerance = i.toLowerCase();
        if ((intolerance === 'lactose' || intolerance === 'lattosio') && !food.tags?.includes('lactose-free')) return true;
        if ((intolerance === 'gluten' || intolerance === 'glutine') && !food.tags?.includes('gluten-free')) return true;
        return false;
      });

      if (isIntolerant) {
        recommendations.avoid.push({ ...food, reason: 'Contiene allergeni' });
        return;
      }

      // Health Conditions
      const conditions = (user.healthConditions || []).map(c => c.toLowerCase());
      const hasReflux = conditions.includes('reflux') || conditions.includes('reflusso');
      const hasIBS = conditions.includes('ibs');
      const hasArtrite = conditions.includes('artrite');
      const hasMS = conditions.includes('sclerosi multipla');

      if (hasReflux) {
        if (food.tags?.includes('acidic')) {
          recommendations.avoid.push({ ...food, reason: 'Acido (Sconsigliato per Reflusso)' });
          return;
        }
        if (food.tags?.includes('low-acid')) score += 2;
      }

      if (hasIBS) {
        if (food.tags?.includes('ibs-friendly')) score += 2;
      }

      if (hasArtrite || hasMS) {
        if (food.tags?.includes('anti-inflammatory')) score += 3;
        if (food.tags?.includes('omega-3')) score += 3;
        if (food.tags?.includes('pro-inflammatory')) {
          recommendations.avoid.push({ ...food, reason: 'Infiammatorio (Sconsigliato)' });
          return;
        }
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
    modal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in';
    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 sm:p-8 animate-scale-in">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-black text-gray-900">Aggiorna Peso</h3>
          <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
            ${user.name.split(' ').map(n => n[0]).join('')}
          </div>
        </div>
        <form id="weight-form" class="space-y-5">
          <div>
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Data Rilevazione</label>
            <input type="date" name="date" value="${new Date().toISOString().split('T')[0]}" required class="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none">
          </div>
          <div>
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Peso (kg)</label>
            <input type="number" step="0.1" name="weight" value="${user.weight}" required class="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none">
          </div>
          <div class="flex gap-3 pt-4">
            <button type="button" id="close-weight-modal" class="flex-1 px-4 py-3 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 rounded-xl transition-all">Annulla</button>
            <button type="submit" class="flex-1 px-4 py-3 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 rounded-xl transition-all shadow-md active:scale-95">Salva</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#close-weight-modal').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
    modal.querySelector('#weight-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const newWeight = Number(formData.get('weight'));
      const date = formData.get('date');
      
      const weightHistory = user.weightHistory || [];
      
      // Update history
      const existingEntry = weightHistory.find(h => h.date === date);
      if (existingEntry) {
        existingEntry.actual = newWeight;
      } else {
        const lastEst = weightHistory.length > 0 ? weightHistory[weightHistory.length-1].estimated : user.weight;
        const dailyLoss = (user.weight - user.targetWeight) / (user.goalWeeks * 7);
        weightHistory.push({
          date: date,
          actual: newWeight,
          estimated: Math.round((lastEst - dailyLoss) * 10) / 10
        });
        // Sort history by date
        weightHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
      }

      const updateData = { 
        weightHistory: weightHistory
      };

      // If updating for today or a newer date, update current weight
      const latestDate = weightHistory[weightHistory.length - 1].date;
      if (date >= latestDate) {
        updateData.weight = newWeight;
      }

      store.update('users', user.id, updateData);

      modal.remove();
      allUsers = store.getAll('users');
      render();
    });
  }

  function showManualTargetModal(user) {
    const stats = calculateUserStats(user);
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in';
    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 sm:p-8 animate-scale-in">
        <h3 class="text-xl font-black text-gray-900 mb-2">Target Manuale</h3>
        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-6">Sovrascrivi i valori calcolati</p>
        <form id="target-form" class="space-y-5">
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Calorie Target (Kcal)</label>
              <input type="number" name="manualTargetKcal" value="${user.manualTargetKcal || stats.targetKcal}" class="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none">
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Proteine (g)</label>
              <input type="number" name="manualProtein" value="${user.manualProtein || stats.protein}" class="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none">
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Carbo (g)</label>
              <input type="number" name="manualCarbs" value="${user.manualCarbs || stats.carbs}" class="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none">
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Grassi (g)</label>
              <input type="number" name="manualFats" value="${user.manualFats || stats.fats}" class="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none">
            </div>
          </div>
          <div class="flex flex-col gap-3 pt-4">
            <button type="submit" class="w-full px-4 py-3 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 rounded-xl transition-all shadow-md active:scale-95">Salva Modifiche</button>
            <div class="flex gap-2">
              <button type="button" id="close-target-modal" class="flex-1 px-4 py-2 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 rounded-lg transition-all">Annulla</button>
              <button type="button" id="reset-targets" class="flex-1 px-4 py-2 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 rounded-lg transition-all">Ripristina</button>
            </div>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#close-target-modal').addEventListener('click', () => modal.remove());
    modal.querySelector('#reset-targets').addEventListener('click', () => {
      store.update('users', user.id, {
        manualTargetKcal: null,
        manualProtein: null,
        manualCarbs: null,
        manualFats: null
      });
      modal.remove();
      allUsers = store.getAll('users');
      render();
    });

    modal.querySelector('#target-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = {
        manualTargetKcal: Number(formData.get('manualTargetKcal')),
        manualProtein: Number(formData.get('manualProtein')),
        manualCarbs: Number(formData.get('manualCarbs')),
        manualFats: Number(formData.get('manualFats'))
      };
      
      store.update('users', user.id, data);
      modal.remove();
      allUsers = store.getAll('users');
      render();
    });
  }

  function render() {
    container.innerHTML = `
      <div id="install-banner" class="hidden bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden animate-bounce-subtle">
        <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="p-3 bg-white/20 rounded-xl backdrop-blur-md">
              <i data-lucide="download-cloud" class="w-8 h-8"></i>
            </div>
            <div>
              <h3 class="text-lg font-bold">Installa DietaPro sul tuo dispositivo</h3>
              <p class="text-sm text-blue-100">Accedi rapidamente e usa l'app anche offline.</p>
            </div>
          </div>
          <button id="dashboard-install-btn" class="w-full md:w-auto px-6 py-3 bg-white text-blue-600 font-bold rounded-xl shadow-md hover:bg-blue-50 transition-all flex items-center justify-center gap-2 active:scale-95">
            <i data-lucide="plus-circle" class="w-5 h-5"></i>
            Installa Ora
          </button>
        </div>
        <!-- Background decoration -->
        <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

          const healthTags = (user.healthConditions || []).map(hc => `<span class="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] rounded uppercase font-bold">${hc}</span>`).join('');
          const intoleranceTags = (user.intolerances || []).map(i => `<span class="px-1.5 py-0.5 bg-yellow-100 text-yellow-600 text-[10px] rounded uppercase font-bold">${i}</span>`).join('');

          return `
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
              <div class="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                <div class="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity user-card-header" data-id="${user.id}">
                  <div class="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                    ${user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 class="font-bold text-gray-900">${user.name}</h3>
                    <div class="flex flex-wrap gap-1 mt-1">
                      ${healthTags}
                      ${intoleranceTags}
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
                <div class="h-48 w-full bg-gray-50 rounded-xl p-4 cursor-pointer weight-chart-container" data-id="${user.id}">
                  <canvas id="chart-${user.id}"></canvas>
                </div>

                <!-- Primary Stats -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div class="p-3 bg-blue-50 rounded-xl text-center cursor-pointer hover:bg-blue-100 transition-colors open-targets" data-id="${user.id}">
                    <p class="text-[10px] text-blue-500 uppercase font-bold mb-1">Target Kcal</p>
                    <p class="text-xl font-black text-blue-700">${user.manualTargetKcal || stats.targetKcal}</p>
                  </div>
                  <div class="p-3 bg-green-50 rounded-xl text-center cursor-pointer hover:bg-green-100 transition-colors open-targets" data-id="${user.id}">
                    <p class="text-[10px] text-green-500 uppercase font-bold mb-1">Proteine</p>
                    <p class="text-xl font-black text-green-700">${user.manualProtein || stats.protein}g</p>
                  </div>
                  <div class="p-3 bg-yellow-50 rounded-xl text-center cursor-pointer hover:bg-yellow-100 transition-colors open-targets" data-id="${user.id}">
                    <p class="text-[10px] text-yellow-500 uppercase font-bold mb-1">Carbo</p>
                    <p class="text-xl font-black text-yellow-700">${user.manualCarbs || stats.carbs}g</p>
                  </div>
                  <div class="p-3 bg-red-50 rounded-xl text-center cursor-pointer hover:bg-red-100 transition-colors open-targets" data-id="${user.id}">
                    <p class="text-[10px] text-red-500 uppercase font-bold mb-1">Grassi</p>
                    <p class="text-xl font-black text-red-700">${user.manualFats || stats.fats}g</p>
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

    // PWA Install Handling
    const banner = container.querySelector('#install-banner');
    const dashboardInstallBtn = container.querySelector('#dashboard-install-btn');
    
    // Check if prompt is already available in window
    if (window.deferredPrompt) {
      banner?.classList.remove('hidden');
    }

    // Listen for the custom event we'll dispatch from app.js
    window.addEventListener('pwa-install-available', () => {
      banner?.classList.remove('hidden');
    });

    dashboardInstallBtn?.addEventListener('click', async () => {
      if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
        const { outcome } = await window.deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          banner?.classList.add('hidden');
          window.deferredPrompt = null;
        }
      }
    });

    // Event Listeners for Dynamic Actions
    container.addEventListener('click', async (e) => {
      const targetBtn = e.target.closest('.open-targets');
      const weightChart = e.target.closest('.weight-chart-container');
      const userHeader = e.target.closest('.user-card-header');
      
      if (targetBtn) {
        const id = targetBtn.getAttribute('data-id');
        const user = allUsers.find(u => u.id === id);
        if (user) showManualTargetModal(user);
      }
      
      if (weightChart) {
        const id = weightChart.getAttribute('data-id');
        const user = allUsers.find(u => u.id === id);
        if (user) showWeightUpdateModal(user);
      }

      if (userHeader) {
        const id = userHeader.getAttribute('data-id');
        const user = allUsers.find(u => u.id === id);
        if (user) {
            const { showUserModal } = await import('./users.js');
            showUserModal(user, () => {
              allUsers = store.getAll('users');
              render();
            });
          }
        }
      });

    if (window.lucide) window.lucide.createIcons();
    if (window.updatePageTitle) window.updatePageTitle();
  }

  render();
  return container;
}
