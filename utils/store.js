export class Store {
  constructor() {
    this.initialized = false;
    this.version = '1.8.0'; // Increment this to force migration
    this.forceReset = true; // Temporary flag to ensure cleanup
    console.log("Store version:", this.version);
    this.data = {
      users: [],
      foods: [],
      recipes: [],
      plans: []
    };
    this.init();
  }

  async init() {
    const keys = ['users', 'foods', 'recipes', 'plans'];
    
    // Clear old data if it's the old version or corrupted
    try {
      const storedVersion = localStorage.getItem('dieta_version');
      const foodsStored = localStorage.getItem('dieta_foods');
      const recipesStored = localStorage.getItem('dieta_recipes');
      
      let shouldClear = this.forceReset;

      if (storedVersion !== this.version) {
        shouldClear = true;
      }

      // Add a special check for the food count duplication issue
      if (foodsStored && !shouldClear) {
        const parsedFoods = JSON.parse(foodsStored);
        if (Array.isArray(parsedFoods) && parsedFoods.length > 500) {
          console.warn("Detected old food database (998 items), forcing cleanup...");
          shouldClear = true;
        }
      }

      if (shouldClear) {
        console.warn(`Migration: Clearing old data (v${storedVersion || '0'}) to load new data (v${this.version})`);
        // Targeted clear to avoid clearing non-dieta keys if any
        keys.forEach(k => localStorage.removeItem(`dieta_${k}`));
        localStorage.removeItem('dieta_version');
        
        localStorage.setItem('dieta_version', this.version);
        // Force clearing in-memory data as well
        this.data.foods = [];
        this.data.recipes = [];
        this.data.plans = [];
        this.data.users = [];
        
        console.log("LocalStorage cleared for Dieta keys.");
      }
    } catch (e) {
      console.error('Error during migration check:', e);
      localStorage.clear();
      localStorage.setItem('dieta_version', this.version);
    }

    const loadPromises = keys.map(async (key) => {
      const stored = localStorage.getItem(`dieta_${key}`);
      
      if (stored) {
        try {
          this.data[key] = JSON.parse(stored);
        } catch (e) {
          console.error(`Error parsing stored ${key}:`, e);
          localStorage.removeItem(`dieta_${key}`);
        }
      }
      
      // If not loaded from storage (or storage was cleared), fetch from JSON
      if (!this.data[key] || this.data[key].length === 0) {
        try {
          const response = await fetch(`./data/${key}.json?v=${Date.now()}`);
          if (response.ok) {
            const initialData = await response.json();
            this.data[key] = initialData;
            this.save(key);
            console.log(`Loaded ${key} from JSON:`, initialData.length, 'items');
          }
        } catch (error) {
          console.error(`Error loading initial data for ${key}:`, error);
        }
      }
    });
    
    await Promise.all(loadPromises);
    this.initialized = true;
    this.notify();
  }

  async ensureInitialized() {
    if (this.initialized) return;
    return new Promise(resolve => {
      const unsubscribe = this.subscribe(() => {
        if (this.initialized) {
          unsubscribe();
          resolve();
        }
      });
    });
  }

  async save(key) {
    localStorage.setItem(`dieta_${key}`, JSON.stringify(this.data[key]));
    this.notify();
    
    // Check if we are on a static host (like GitHub Pages)
    const isStaticHost = window.location.hostname.includes('github.io') || 
                        window.location.protocol === 'file:';

    if (isStaticHost) {
      return; // Skip server save on static environments
    }

    // Also save to server if running on a PHP-enabled environment (htdocs/XAMPP)
    try {
      const response = await fetch('./save.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: `${key}.json`,
          content: this.data[key]
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
    } catch (e) {
      // Silently fail for server saves to avoid console noise on unsupported environments
      // but keep local storage working
    }
  }

  getAll(key) {
    return this.data[key];
  }

  getById(key, id) {
    return this.data[key].find(item => item.id === id);
  }

  add(key, item) {
    const newItem = { ...item, id: Date.now().toString() };
    this.data[key].push(newItem);
    this.save(key);
    return newItem;
  }

  update(key, id, updates) {
    const index = this.data[key].findIndex(item => item.id === id);
    if (index !== -1) {
      this.data[key][index] = { ...this.data[key][index], ...updates };
      this.save(key);
      return this.data[key][index];
    }
    return null;
  }

  delete(key, id) {
    this.data[key] = this.data[key].filter(item => item.id !== id);
    this.save(key);
  }

  // Simple subscription pattern
  subscribers = [];
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(callback => callback(this.data));
  }
}

export const store = new Store();
