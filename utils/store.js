export class Store {
  constructor() {
    this.initialized = false;
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
      const foodsStored = localStorage.getItem('dieta_foods');
      const recipesStored = localStorage.getItem('dieta_recipes');
      
      let shouldClear = false;

      if (foodsStored) {
        const parsedFoods = JSON.parse(foodsStored);
        if (!Array.isArray(parsedFoods) || parsedFoods.length < 1000) {
          shouldClear = true;
        }
      }

      if (recipesStored) {
        const parsedRecipes = JSON.parse(recipesStored);
        if (!Array.isArray(parsedRecipes) || parsedRecipes.length < 500 || !parsedRecipes[0].prepTime || !parsedRecipes[0].mealCategories) {
          shouldClear = true;
        }
      }

      if (shouldClear) {
        console.warn('Migration: Clearing old data to load 1000 foods and 500 recipes');
        localStorage.removeItem('dieta_foods');
        localStorage.removeItem('dieta_recipes');
        localStorage.removeItem('dieta_plans');
      }
    } catch (e) {
      console.error('Error during migration check:', e);
      localStorage.clear(); // Nuclear option if JSON is malformed
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
    
    // Also save to server if running on htdocs/XAMPP
    try {
      await fetch('./save.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: `${key}.json`,
          content: this.data[key]
        })
      });
    } catch (e) {
      console.warn('Could not save to server, only local storage updated');
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
