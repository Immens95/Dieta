import { store } from '../utils/store.js';
import { foodImages, getUnsplashUrl, searchUnsplashImages } from '../utils/imageGallery.js';

export async function FoodsPage() {
  await store.ensureInitialized();
  const container = document.createElement('div');
  container.className = 'space-y-6';

  let foods = store.getAll('foods') || [];
  let currentSearch = '';
  let currentCategory = 'all';
  let currentSort = 'name';
  let currentSortDir = 'asc';

  function renderTableRows(items) {
    return items.map(food => `
      <tr class="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer food-row" data-id="${food.id}">
        <td class="px-6 py-4">
          <div class="flex items-center gap-4">
            <img src="${food.image || 'https://via.placeholder.com/40'}" 
              onerror="this.onerror=null; this.src='https://via.placeholder.com/40?text=${encodeURIComponent(food.name.replace(/'/g, ''))}';" 
              class="w-12 h-12 rounded-xl object-cover shadow-sm">
            <div>
              <div class="font-bold text-gray-900">${food.name}</div>
              <div class="text-[10px] text-gray-500 font-medium uppercase tracking-tighter">Porzione: ${food.unit}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 text-center">
          <span class="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-sm font-black">${food.calories}</span>
        </td>
        <td class="px-6 py-4">
          <div class="flex items-center justify-center gap-3">
            <div class="text-center">
              <div class="text-xs font-black text-blue-600">${food.protein}g</div>
              <div class="text-[8px] text-gray-400 uppercase font-bold">Pro</div>
            </div>
            <div class="text-center">
              <div class="text-xs font-black text-green-600">${food.carbs}g</div>
              <div class="text-[8px] text-gray-400 uppercase font-bold">Carb</div>
            </div>
            <div class="text-center">
              <div class="text-xs font-black text-red-600">${food.fats}g</div>
              <div class="text-[8px] text-gray-400 uppercase font-bold">Fat</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 text-right">
          <div class="flex justify-end gap-1">
            <button class="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all edit-food" data-id="${food.id}">
              <i data-lucide="edit-2" class="w-4 h-4"></i>
            </button>
            <button class="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all delete-food" data-id="${food.id}">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function renderMobileCards(items) {
    return items.map(food => `
      <div class="p-4 flex items-center gap-4 active:bg-gray-50 transition-colors food-row" data-id="${food.id}">
        <img src="${food.image || 'https://via.placeholder.com/40'}" 
          onerror="this.onerror=null; this.src='https://via.placeholder.com/40?text=${encodeURIComponent(food.name.replace(/'/g, ''))}';" 
          class="w-16 h-16 rounded-2xl object-cover shadow-sm shrink-0">
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-start mb-1">
            <h3 class="font-black text-gray-900 truncate pr-2">${food.name}</h3>
            <span class="text-xs font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">${food.calories} kcal</span>
          </div>
          <div class="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            <span class="text-blue-600">P: ${food.protein}g</span>
            <span class="text-green-600">C: ${food.carbs}g</span>
            <span class="text-red-600">F: ${food.fats}g</span>
          </div>
          <div class="mt-2 flex justify-between items-center">
            <span class="text-[10px] text-gray-400 font-medium">Portione: ${food.unit}</span>
            <div class="flex gap-1">
              <button class="p-2 text-gray-400 hover:text-blue-600 edit-food" data-id="${food.id}">
                <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
              </button>
              <button class="p-2 text-gray-400 hover:text-red-600 delete-food" data-id="${food.id}">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  function updateTable(filteredFoods) {
    const tbody = container.querySelector('#food-table-body');
    const cardsContainer = container.querySelector('#food-cards-container');
    const countEl = container.querySelector('#food-count');
    
    if (tbody) tbody.innerHTML = renderTableRows(filteredFoods);
    if (cardsContainer) cardsContainer.innerHTML = renderMobileCards(filteredFoods);
    if (countEl) countEl.textContent = `${filteredFoods.length} alimenti trovati`;
    
    if (window.lucide) window.lucide.createIcons();
  }

  function render() {
    const categories = ['all', ...new Set(store.getAll('foods').map(f => f.category).filter(Boolean))];
    container.innerHTML = `
      <div class="flex flex-col gap-4">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 class="text-xl font-black text-gray-900">Database Alimenti</h2>
            <p class="text-xs text-gray-500 uppercase font-bold tracking-wider" id="food-count">${foods.length} alimenti trovati</p>
          </div>
          <div class="flex gap-2 w-full sm:w-auto">
            <button id="clear-cache-btn" class="flex-1 sm:flex-none bg-amber-100 hover:bg-amber-200 text-amber-700 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all border border-amber-200 active:scale-95">
              <i data-lucide="refresh-cw" class="w-5 h-5"></i>
              <span>Svuota Cache</span>
            </button>
            <button id="add-food-btn" class="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-md active:scale-95">
              <i data-lucide="plus" class="w-5 h-5"></i>
              <span>Aggiungi</span>
            </button>
          </div>
        </div>

        <!-- Filters and Sorting -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <i data-lucide="search" class="w-4 h-4"></i>
            </span>
            <input type="text" id="food-search" placeholder="Cerca..." 
              class="block w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all">
          </div>

          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <i data-lucide="tag" class="w-4 h-4"></i>
            </span>
            <select id="food-category" class="block w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all appearance-none">
              ${categories.map(cat => `<option value="${cat}">${cat === 'all' ? 'Tutte le categorie' : cat}</option>`).join('')}
            </select>
          </div>

          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <i data-lucide="arrow-up-down" class="w-4 h-4"></i>
            </span>
            <select id="food-sort" class="block w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all appearance-none">
              <option value="name">Ordina per Nome</option>
              <option value="calories">Ordina per Calorie</option>
              <option value="protein">Ordina per Proteine</option>
              <option value="carbs">Ordina per Carboidrati</option>
              <option value="fats">Ordina per Grassi</option>
            </select>
          </div>

          <div class="flex bg-gray-50 rounded-xl border border-gray-200 p-1">
            <button id="sort-asc" class="flex-1 py-1 rounded-lg text-xs font-bold transition-all ${currentSortDir === 'asc' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}">ASC</button>
            <button id="sort-desc" class="flex-1 py-1 rounded-lg text-xs font-bold transition-all ${currentSortDir === 'desc' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}">DESC</button>
          </div>
        </div>
      </div>

      <div class="bg-white sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden -mx-4 sm:mx-0">
        <!-- Desktop Table View -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/50 border-b border-gray-100">
                <th class="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Alimento</th>
                <th class="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Calorie</th>
                <th class="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Macros (P/C/F)</th>
                <th class="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Azioni</th>
              </tr>
            </thead>
            <tbody id="food-table-body">
              ${renderTableRows(foods)}
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View -->
        <div class="md:hidden divide-y divide-gray-100" id="food-cards-container">
          ${renderMobileCards(foods)}
        </div>
      </div>
    `;

    // Add event listeners
    const clearCacheBtn = container.querySelector('#clear-cache-btn');
    if (clearCacheBtn) {
      clearCacheBtn.addEventListener('click', () => {
        if (confirm('Sei sicuro di voler svuotare la cache? L\'app verrà ricaricata con i dati puliti dal server.')) {
          localStorage.clear();
          location.reload();
        }
      });
    }

    const searchInput = container.querySelector('#food-search');
    const categorySelect = container.querySelector('#food-category');
    const sortSelect = container.querySelector('#food-sort');
    const sortAscBtn = container.querySelector('#sort-asc');
    const sortDescBtn = container.querySelector('#sort-desc');

    const handleFilterChange = () => {
      currentSearch = searchInput.value.toLowerCase();
      currentCategory = categorySelect.value;
      
      let filtered = store.getAll('foods').filter(f => {
        const matchesSearch = f.name.toLowerCase().includes(currentSearch);
        const matchesCategory = currentCategory === 'all' || f.category === currentCategory;
        return matchesSearch && matchesCategory;
      });

      // Sort
      filtered.sort((a, b) => {
        let valA = a[currentSort];
        let valB = b[currentSort];

        if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (valA < valB) return currentSortDir === 'asc' ? -1 : 1;
        if (valA > valB) return currentSortDir === 'asc' ? 1 : -1;
        return 0;
      });

      updateTable(filtered);
    };

    searchInput.addEventListener('input', handleFilterChange);
    categorySelect.addEventListener('change', handleFilterChange);
    
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      handleFilterChange();
    });

    sortAscBtn.addEventListener('click', () => {
      currentSortDir = 'asc';
      sortAscBtn.classList.add('bg-white', 'shadow-sm', 'text-blue-600');
      sortAscBtn.classList.remove('text-gray-500');
      sortDescBtn.classList.remove('bg-white', 'shadow-sm', 'text-blue-600');
      sortDescBtn.classList.add('text-gray-500');
      handleFilterChange();
    });

    sortDescBtn.addEventListener('click', () => {
      currentSortDir = 'desc';
      sortDescBtn.classList.add('bg-white', 'shadow-sm', 'text-blue-600');
      sortDescBtn.classList.remove('text-gray-500');
      sortAscBtn.classList.remove('bg-white', 'shadow-sm', 'text-blue-600');
      sortAscBtn.classList.add('text-gray-500');
      handleFilterChange();
    });

    container.querySelector('#add-food-btn').addEventListener('click', () => {
      showFoodModal();
    });

    container.addEventListener('click', (e) => {
      const row = e.target.closest('.food-row');
      const deleteBtn = e.target.closest('.delete-food');
      const editBtn = e.target.closest('.edit-food');

      if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
        if (confirm('Sei sicuro di voler eliminare questo alimento?')) {
          store.delete('foods', id);
          foods = store.getAll('foods');
          render();
        }
        return;
      }

      if (editBtn) {
        const id = editBtn.getAttribute('data-id');
        const food = store.getById('foods', id);
        showFoodModal(food);
        return;
      }

      if (row) {
        const id = row.getAttribute('data-id');
        const food = store.getById('foods', id);
        showFoodDetailModal(food);
      }
    });

    if (window.lucide) window.lucide.createIcons();
    if (window.updatePageTitle) window.updatePageTitle();
    
    // Apply initial filters/sort
    handleFilterChange();
  }

  function showFoodModal(food = null) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
    let selectedImageUrl = food?.image || '';
    let gallerySearchTerm = '';

    function renderModalContent() {
      const filteredGallery = foodImages.filter(img => 
        img.name.toLowerCase().includes(gallerySearchTerm.toLowerCase())
      );

      modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto pb-24 sm:pb-6">
          <h3 class="text-xl font-bold">${food ? 'Modifica Alimento' : 'Aggiungi Alimento'}</h3>
          <form id="food-form" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Nome</label>
                  <input type="text" name="name" value="${food?.name || ''}" required class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Categoria</label>
                  <input type="text" name="category" value="${food?.category || ''}" placeholder="es: Carne, Frutta, Pasta..." class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Calorie</label>
                    <input type="number" name="calories" value="${food?.calories || ''}" required class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Proteine</label>
                    <input type="number" step="0.1" name="protein" value="${food?.protein || ''}" required class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Carboidrati</label>
                    <input type="number" step="0.1" name="carbs" value="${food?.carbs || ''}" required class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Grassi</label>
                    <input type="number" step="0.1" name="fats" value="${food?.fats || ''}" required class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Unità</label>
                  <select name="unit" class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="100g" ${food?.unit === '100g' ? 'selected' : ''}>100g</option>
                    <option value="100ml" ${food?.unit === '100ml' ? 'selected' : ''}>100ml</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Immagine (URL o scegli a destra)</label>
                  <input type="text" id="image-url-input" name="image" value="${selectedImageUrl}" class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                </div>
              </div>
              
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <label class="block text-sm font-medium text-gray-700">Galleria Immagini</label>
                  <div class="relative">
                    <i data-lucide="search" class="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400"></i>
                    <input type="text" id="gallery-search" placeholder="Cerca..." 
                      value="${gallerySearchTerm}"
                      class="pl-7 pr-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-500 w-32">
                  </div>
                </div>
                
                <div class="grid grid-cols-3 gap-2 overflow-y-auto max-h-[200px] border border-gray-100 p-2 rounded-lg" id="gallery-container">
                  ${filteredGallery.length > 0 ? filteredGallery.map(img => `
                    <img src="${img.url}" alt="${img.name}" title="${img.name}"
                      class="w-full h-16 object-cover rounded-md cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all image-option ${selectedImageUrl === img.url ? 'ring-2 ring-blue-600' : ''}" 
                      data-url="${img.url}">
                  `).join('') : '<p class="col-span-3 text-center text-[10px] text-gray-400 py-4">Nessuna immagine locale</p>'}
                </div>
                
                <div class="p-2 border border-blue-100 bg-blue-50 rounded-lg text-center">
                  <p class="text-[10px] text-blue-600 font-bold mb-1 uppercase tracking-tighter">Anteprima</p>
                  <img id="modal-image-preview" src="${selectedImageUrl || 'https://via.placeholder.com/150'}" class="h-28 w-full object-cover rounded-lg mx-auto border border-white shadow-sm">
                </div>
              </div>
            </div>

            <div class="fixed sm:static bottom-0 left-0 right-0 p-4 sm:p-0 bg-white sm:bg-transparent border-t sm:border-t-0 border-gray-100 flex gap-3 sm:pt-6 sm:justify-end z-10">
              <button type="button" id="close-modal" class="flex-1 sm:flex-none px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-all">Annulla</button>
              <button type="submit" class="flex-1 sm:flex-none px-8 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95">Salva Alimento</button>
            </div>
          </form>
        </div>
      `;

      const previewImg = modal.querySelector('#modal-image-preview');
      const urlInput = modal.querySelector('#image-url-input');
      const gallerySearch = modal.querySelector('#gallery-search');
      const galleryContainer = modal.querySelector('#gallery-container');

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
        const filtered = foodImages.filter(img => 
          img.name.toLowerCase().includes(gallerySearchTerm.toLowerCase())
        );
        
        let html = filtered.length > 0 ? filtered.map(img => `
          <img src="${img.url}" alt="${img.name}" title="${img.name}"
            class="w-full h-16 object-cover rounded-md cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all image-option ${selectedImageUrl === img.url ? 'ring-2 ring-blue-600' : ''}" 
            data-url="${img.url}">
        `).join('') : '<p class="col-span-3 text-center text-[10px] text-gray-400 py-4">Nessuna immagine locale</p>';

        if (gallerySearchTerm.length > 2) {
          const unsplashResults = await searchUnsplashImages(gallerySearchTerm);
          if (unsplashResults.length > 0) {
            html += `
              <div class="col-span-3 mt-1 pt-1 border-t border-gray-100">
                <p class="text-[8px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Risultati da Unsplash</p>
                <div class="grid grid-cols-3 gap-1">
                  ${unsplashResults.map(img => `
                    <div class="relative group">
                      <img src="${img.thumb}" alt="${img.name}" title="${img.name} by ${img.author}"
                        class="w-full h-12 object-cover rounded-md cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all image-option ${selectedImageUrl === img.url ? 'ring-2 ring-blue-600' : ''}" 
                        data-url="${img.url}">
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          } else {
            html += `
              <div class="col-span-3 mt-1 p-2 bg-gray-50 rounded-lg border border-gray-100 text-center">
                <p class="text-[8px] text-gray-400">Nessun risultato aggiuntivo.</p>
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
      
      modal.querySelector('#food-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        data.calories = Number(data.calories);
        data.protein = Number(data.protein);
        data.carbs = Number(data.carbs);
        data.fats = Number(data.fats);
        data.image = selectedImageUrl;

        if (food) {
          await store.update('foods', food.id, data);
        } else {
          await store.add('foods', data);
        }

        modal.remove();
        foods = store.getAll('foods');
        render();
      });

      if (window.lucide) window.lucide.createIcons();
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

export function showFoodDetailModal(food) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm';

  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-scale-in">
      <div class="relative h-64 shrink-0">
        <img src="${food.image || 'https://via.placeholder.com/400x300'}" 
          onerror="this.onerror=null; this.src='https://via.placeholder.com/400x300?text=${encodeURIComponent(food.name.replace(/'/g, ''))}';" 
          class="w-full h-full object-cover">
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <button id="close-detail" class="absolute top-4 right-4 p-2.5 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all z-10 active:scale-90">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
        <div class="absolute bottom-4 left-6 right-6">
          <span class="px-2 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider mb-2 inline-block">${food.category || 'Alimento'}</span>
          <h2 class="text-2xl font-black text-white leading-tight">${food.name}</h2>
          <p class="text-white/80 text-xs font-bold uppercase tracking-widest mt-1">Porzione: ${food.unit}</p>
        </div>
      </div>

      <div class="p-6 space-y-6">
        <div class="grid grid-cols-4 gap-3">
          <div class="text-center p-3 bg-orange-50 rounded-2xl border border-orange-100">
            <div class="text-[9px] text-orange-400 uppercase font-black mb-1">Kcal</div>
            <div class="text-lg font-black text-orange-700">${food.calories}</div>
          </div>
          <div class="text-center p-3 bg-blue-50 rounded-2xl border border-blue-100">
            <div class="text-[9px] text-blue-400 uppercase font-black mb-1">Pro</div>
            <div class="text-lg font-black text-blue-700">${food.protein}g</div>
          </div>
          <div class="text-center p-3 bg-green-50 rounded-2xl border border-green-100">
            <div class="text-[9px] text-green-400 uppercase font-black mb-1">Carb</div>
            <div class="text-lg font-black text-green-700">${food.carbs}g</div>
          </div>
          <div class="text-center p-3 bg-red-50 rounded-2xl border border-red-100">
            <div class="text-[9px] text-red-400 uppercase font-black mb-1">Fat</div>
            <div class="text-lg font-black text-red-700">${food.fats}g</div>
          </div>
        </div>

        ${food.tags && food.tags.length > 0 ? `
          <div>
            <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Caratteristiche</h3>
            <div class="flex flex-wrap gap-2">
              ${food.tags.map(tag => `
                <span class="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase border border-gray-200">${tag}</span>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="pt-4 border-t border-gray-100">
          <div class="flex items-center gap-3 text-gray-500">
            <i data-lucide="info" class="w-5 h-5 text-blue-500"></i>
            <p class="text-xs font-medium leading-relaxed">
              I valori nutrizionali sono riferiti a <strong>${food.unit}</strong> di prodotto ed espressi in grammi per i macro-nutrienti.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  if (window.lucide) window.lucide.createIcons();

  const closeModal = () => {
    modal.classList.add('animate-scale-out');
    setTimeout(() => modal.remove(), 200);
  };

  modal.querySelector('#close-detail').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}
