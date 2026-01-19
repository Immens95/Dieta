import { store } from '../utils/store.js';

export async function UsersPage() {
  await store.ensureInitialized();
  const container = document.createElement('div');
  container.className = 'space-y-6';

  let users = store.getAll('users') || [];

  function render() {
    container.innerHTML = `
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-800">Gestione Utenti</h2>
        <button id="add-user-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
          <i data-lucide="user-plus" class="w-4 h-4"></i>
          Aggiungi Utente
        </button>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Utente</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Ruolo</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Dati Fisici</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Obiettivo</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(user => `
              <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer user-row" data-id="${user.id}">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      ${user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div class="font-medium text-gray-900">${user.name}</div>
                      <div class="text-xs text-gray-500">${user.email}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}">
                    ${user.role}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900">${user.weight}kg / ${user.height}cm</div>
                  <div class="text-xs text-gray-500">${user.age} anni (${user.sex === 'female' ? 'Donna' : 'Uomo'})</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900">Target: ${user.targetWeight}kg</div>
                  <div class="text-xs text-gray-500">${user.goalWeeks} settimane</div>
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
    `;

    // Event listeners
    container.querySelector('#add-user-btn').addEventListener('click', () => showUserModal());
    
    container.addEventListener('click', (e) => {
      const row = e.target.closest('.user-row');
      const deleteBtn = e.target.closest('.delete-user');
      const editBtn = e.target.closest('.edit-user');

      if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
        if (confirm('Eliminare questo utente?')) {
          store.delete('users', id);
          users = store.getAll('users');
          render();
        }
        return;
      }

      if (editBtn || row) {
        const id = (editBtn || row).getAttribute('data-id');
        const user = store.getById('users', id);
        showUserModal(user);
      }
    });

    if (window.lucide) window.lucide.createIcons();
    if (window.updatePageTitle) window.updatePageTitle();
  }

  function showUserModal(user = null) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold mb-4">${user ? 'Modifica Utente' : 'Aggiungi Utente'}</h3>
        <form id="user-form" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700">Nome Completo</label>
              <input type="text" name="name" value="${user?.name || ''}" required class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" name="email" value="${user?.email || ''}" required class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Ruolo</label>
              <select name="role" class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="user" ${user?.role === 'user' ? 'selected' : ''}>User</option>
                <option value="admin" ${user?.role === 'admin' ? 'selected' : ''}>Admin</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Genere</label>
              <select name="sex" class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="male" ${user?.sex === 'male' ? 'selected' : ''}>Uomo</option>
                <option value="female" ${user?.sex === 'female' ? 'selected' : ''}>Donna</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Età</label>
              <input type="number" name="age" value="${user?.age || ''}" required class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Peso (kg)</label>
              <input type="number" name="weight" value="${user?.weight || ''}" required class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Altezza (cm)</label>
              <input type="number" name="height" value="${user?.height || ''}" required class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Peso Target (kg)</label>
              <input type="number" name="targetWeight" value="${user?.targetWeight || ''}" required class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Settimane Obiettivo</label>
              <input type="number" name="goalWeeks" value="${user?.goalWeeks || ''}" required class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700">Livello Attività</label>
              <select name="activityLevel" class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="sedentary" ${user?.activityLevel === 'sedentary' ? 'selected' : ''}>Sedentario</option>
                <option value="light" ${user?.activityLevel === 'light' ? 'selected' : ''}>Leggero</option>
                <option value="medium" ${user?.activityLevel === 'medium' ? 'selected' : ''}>Moderato</option>
                <option value="active" ${user?.activityLevel === 'active' ? 'selected' : ''}>Attivo</option>
              </select>
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700">Patologie (es: reflusso, ibs, endometriosi)</label>
              <input type="text" name="healthConditions" value="${user?.healthConditions?.join(', ') || ''}" placeholder="Separati da virgola" class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700">Intolleranze (es: lattosio, glutine)</label>
              <input type="text" name="intolerances" value="${user?.intolerances?.join(', ') || ''}" placeholder="Separati da virgola" class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700">Sensibilità Organismo</label>
              <select name="sensitivity" class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="low" ${user?.sensitivity === 'low' ? 'selected' : ''}>Poco Sensibile</option>
                <option value="medium" ${user?.sensitivity === 'medium' ? 'selected' : ''}>Medio Sensibile</option>
                <option value="high" ${user?.sensitivity === 'high' ? 'selected' : ''}>Molto Sensibile</option>
              </select>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" id="close-modal" class="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">Annulla</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors">Salva Utente</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#close-modal').addEventListener('click', () => modal.remove());
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

      if (user) {
        store.update('users', user.id, data);
      } else {
        store.add('users', data);
      }

      modal.remove();
      users = store.getAll('users');
      render();
    });
  }

  render();
  return container;
}
