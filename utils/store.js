export class Store {
  constructor() {
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
    for (const key of keys) {
      const stored = localStorage.getItem(`dieta_${key}`);
      if (stored) {
        this.data[key] = JSON.parse(stored);
      } else {
        try {
          const response = await fetch(`./data/${key}.json`);
          const initialData = await response.json();
          this.data[key] = initialData;
          this.save(key);
        } catch (error) {
          console.error(`Error loading initial data for ${key}:`, error);
        }
      }
    }
    // Notify subscribers
    this.notify();
  }

  save(key) {
    localStorage.setItem(`dieta_${key}`, JSON.stringify(this.data[key]));
    this.notify();
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
