import { store } from '../utils/store.js';

export async function UsersPage() {
  await store.ensureInitialized();
  const container = document.createElement('div');
  container.className = 'space-y-6';

  let users = store.getAll('users') || [];

  function render() {
    container.innerHTML = `
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 class="text-2xl font-black text-gray-900">Gestione Utenti</h2>
        <button id="add-user-btn" class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest transition-all shadow-md active:scale-95">
          <i data-lucide="user-plus" class="w-5 h-5"></i>
          Aggiungi Utente
        </button>
      </div>

      <!-- Desktop View -->
      <div class="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Utente</th>
              <th class="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ruolo</th>
              <th class="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Dati Fisici</th>
              <th class="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Obiettivo</th>
              <th class="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(user => `
              <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer user-row" data-id="${user.id}">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black">
                      ${user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div class="font-black text-gray-900">${user.name}</div>
                      <div class="text-xs text-gray-500 font-bold">${user.email}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}">
                    ${user.role}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm font-black text-gray-900">${user.weight}kg / ${user.height}cm</div>
                  <div class="text-xs text-gray-500 font-bold">${user.age} anni (${user.sex === 'female' ? 'Donna' : 'Uomo'})</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm font-black text-gray-900">Target: ${user.targetWeight}kg</div>
                  <div class="text-xs text-gray-500 font-bold">${user.goalWeeks} settimane</div>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end gap-2">
                    <button class="p-2 text-gray-400 hover:text-blue-600 edit-user" data-id="${user.id}">
                      <i data-lucide="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button class="p-2 text-gray-400 hover:text-red-600 delete-user" data-id="${user.id}">
                      <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Mobile View -->
      <div class="md:hidden space-y-4">
        ${users.map(user => `
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4 user-row active:scale-[0.98] transition-all" data-id="${user.id}">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg">
                  ${user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div class="font-black text-gray-900">${user.name}</div>
                  <div class="text-xs text-gray-500 font-bold">${user.email}</div>
                </div>
              </div>
              <span class="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${user.role === 'admin' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-gray-50 text-gray-600 border border-gray-100'}">
                ${user.role}
              </span>
            </div>

            <div class="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
              <div class="bg-gray-50/50 p-3 rounded-xl border border-gray-50">
                <div class="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">Dati Fisici</div>
                <div class="text-sm font-black text-gray-900">${user.weight}kg / ${user.height}cm</div>
                <div class="text-[10px] text-gray-500 font-bold">${user.age} anni • ${user.sex === 'female' ? 'Donna' : 'Uomo'}</div>
              </div>
              <div class="bg-blue-50/30 p-3 rounded-xl border border-blue-50">
                <div class="text-[9px] font-black text-blue-400 uppercase tracking-tighter mb-1">Obiettivo</div>
                <div class="text-sm font-black text-blue-700">Target: ${user.targetWeight}kg</div>
                <div class="text-[10px] text-blue-500 font-bold">${user.goalWeeks} settimane</div>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button class="flex items-center gap-2 px-4 py-2 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 rounded-lg transition-all edit-user" data-id="${user.id}">
                <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                Modifica
              </button>
              <button class="flex items-center gap-2 px-4 py-2 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 rounded-lg transition-all delete-user" data-id="${user.id}">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                Elimina
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Event listeners
    const onSave = () => {
      users = store.getAll('users');
      render();
    };

    container.querySelector('#add-user-btn').addEventListener('click', () => showUserModal(null, onSave));
    
    container.addEventListener('click', (e) => {
      const row = e.target.closest('.user-row');
      const deleteBtn = e.target.closest('.delete-user');
      const editBtn = e.target.closest('.edit-user');

      if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
        if (confirm('Eliminare questo utente?')) {
          store.delete('users', id);
          onSave();
        }
        return;
      }

      if (editBtn || row) {
        const id = (editBtn || row).getAttribute('data-id');
        const user = store.getById('users', id);
        showUserModal(user, onSave);
      }
    });

    if (window.lucide) window.lucide.createIcons();
    if (window.updatePageTitle) window.updatePageTitle();
  }

  render();
  return container;
}

export function showUserModal(user = null, onSave = null) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in';
    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar animate-scale-in">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-2xl font-black text-gray-900">${user ? 'Modifica Utente' : 'Aggiungi Utente'}</h3>
          <button id="close-modal-top" class="p-2 hover:bg-gray-100 rounded-xl transition-all">
            <i data-lucide="x" class="w-6 h-6 text-gray-400"></i>
          </button>
        </div>

        <form id="user-form" class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Nome Completo</label>
              <input type="text" name="name" value="${user?.name || ''}" required class="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-4 py-3 text-sm font-bold transition-all outline-none" placeholder="Esempio: Mario Rossi">
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Email</label>
              <input type="email" name="email" value="${user?.email || ''}" required class="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-4 py-3 text-sm font-bold transition-all outline-none" placeholder="mario.rossi@esempio.com">
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Ruolo</label>
              <select name="role" class="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-4 py-3 text-sm font-bold transition-all outline-none appearance-none">
                <option value="user" ${user?.role === 'user' ? 'selected' : ''}>User</option>
                <option value="admin" ${user?.role === 'admin' ? 'selected' : ''}>Admin</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Genere</label>
              <select name="sex" class="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-4 py-3 text-sm font-bold transition-all outline-none appearance-none">
                <option value="male" ${user?.sex === 'male' ? 'selected' : ''}>Uomo</option>
                <option value="female" ${user?.sex === 'female' ? 'selected' : ''}>Donna</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Età</label>
              <input type="number" name="age" value="${user?.age || ''}" required class="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-4 py-3 text-sm font-bold transition-all outline-none">
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Peso (kg)</label>
              <input type="number" name="weight" value="${user?.weight || ''}" required class="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-4 py-3 text-sm font-bold transition-all outline-none">
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Altezza (cm)</label>
              <input type="number" name="height" value="${user?.height || ''}" required class="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-4 py-3 text-sm font-bold transition-all outline-none">
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Peso Target (kg)</label>
              <input type="number" name="targetWeight" value="${user?.targetWeight || ''}" required class="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-4 py-3 text-sm font-bold transition-all outline-none">
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Settimane Obiettivo</label>
              <input type="number" name="goalWeeks" value="${user?.goalWeeks || ''}" required class="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-4 py-3 text-sm font-bold transition-all outline-none">
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Livello Attività</label>
              <select name="activityLevel" class="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-4 py-3 text-sm font-bold transition-all outline-none appearance-none">
                <option value="sedentary" ${user?.activityLevel === 'sedentary' ? 'selected' : ''}>Sedentario</option>
                <option value="light" ${user?.activityLevel === 'light' ? 'selected' : ''}>Leggero</option>
                <option value="medium" ${user?.activityLevel === 'medium' ? 'selected' : ''}>Moderato</option>
                <option value="active" ${user?.activityLevel === 'active' ? 'selected' : ''}>Attivo</option>
              </select>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Patologie</label>
              <input type="text" name="healthConditions" value="${user?.healthConditions?.join(', ') || ''}" placeholder="es: reflusso, artrite (separati da virgola)" class="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-4 py-3 text-sm font-bold transition-all outline-none">
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Intolleranze</label>
              <input type="text" name="intolerances" value="${user?.intolerances?.join(', ') || ''}" placeholder="es: lattosio, glutine (separati da virgola)" class="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-4 py-3 text-sm font-bold transition-all outline-none">
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Sensibilità Organismo</label>
              <select name="sensitivity" class="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-4 py-3 text-sm font-bold transition-all outline-none appearance-none">
                <option value="low" ${user?.sensitivity === 'low' ? 'selected' : ''}>Poco Sensibile</option>
                <option value="medium" ${user?.sensitivity === 'medium' ? 'selected' : ''}>Medio Sensibile</option>
                <option value="high" ${user?.sensitivity === 'high' ? 'selected' : ''}>Molto Sensibile</option>
              </select>
            </div>

            <!-- Preferences Section -->
            <div class="sm:col-span-2 mt-4 pt-6 border-t border-gray-100">
              <h4 class="font-black text-gray-900 text-sm mb-4 flex items-center gap-2 uppercase tracking-widest">
                <i data-lucide="heart" class="w-4 h-4 text-red-500"></i>
                Preferenze Alimentari
              </h4>
              <div class="space-y-4">
                <div>
                  <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Cibi Preferiti</label>
                  <input type="text" name="likedFoods" value="${user?.likedFoods?.join(', ') || ''}" placeholder="es: salmone, avocado, noci" class="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-4 py-3 text-sm font-bold transition-all outline-none">
                </div>
                <div>
                  <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Cibi Sconsigliati</label>
                  <input type="text" name="dislikedFoods" value="${user?.dislikedFoods?.join(', ') || ''}" placeholder="es: peperoni, cipolla, latte" class="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-4 py-3 text-sm font-bold transition-all outline-none">
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100">
            <button type="button" id="close-modal" class="w-full sm:w-auto px-6 py-3 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 rounded-2xl transition-all">Annulla</button>
            <button type="submit" class="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 rounded-2xl transition-all shadow-lg shadow-blue-200 active:scale-95">Salva Utente</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();

    const closeModal = () => {
      modal.classList.add('animate-fade-out');
      modal.querySelector('.animate-scale-in').classList.add('animate-scale-out');
      setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector('#close-modal').addEventListener('click', closeModal);
    modal.querySelector('#close-modal-top').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    modal.querySelector('#user-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());
      
      // Convert numbers
      ['age', 'weight', 'height', 'targetWeight', 'goalWeeks'].forEach(key => {
        data[key] = Number(data[key]);
      });

      // Convert lists
      data.healthConditions = data.healthConditions ? data.healthConditions.split(',').map(s => s.trim().toLowerCase()).filter(s => s) : [];
      data.intolerances = data.intolerances ? data.intolerances.split(',').map(s => s.trim().toLowerCase()).filter(s => s) : [];
      data.likedFoods = data.likedFoods ? data.likedFoods.split(',').map(s => s.trim().toLowerCase()).filter(s => s) : [];
      data.dislikedFoods = data.dislikedFoods ? data.dislikedFoods.split(',').map(s => s.trim().toLowerCase()).filter(s => s) : [];

      if (user) {
        store.update('users', user.id, data);
      } else {
        store.add('users', data);
      }

      modal.remove();
      if (onSave) onSave();
      else window.location.reload(); // Fallback if no specific refresh logic
    });
  }
