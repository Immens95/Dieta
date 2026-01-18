import React, { createContext, useContext, useState, useEffect } from 'react';
import initialFoods from '../data/foods.json';
import initialRecipes from '../data/recipes.json';
import initialUsers from '../data/users.json';
import initialPlans from '../data/plans.json';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [foods, setFoods] = useState(() => {
    const saved = localStorage.getItem('foods');
    return saved ? JSON.parse(saved) : initialFoods;
  });

  const [recipes, setRecipes] = useState(() => {
    const saved = localStorage.getItem('recipes');
    return saved ? JSON.parse(saved) : initialRecipes;
  });

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [plans, setPlans] = useState(() => {
    const saved = localStorage.getItem('plans');
    return saved ? JSON.parse(saved) : initialPlans;
  });

  const [currentUser, setCurrentUser] = useState(users[0] || null);

  useEffect(() => {
    localStorage.setItem('foods', JSON.stringify(foods));
  }, [foods]);

  useEffect(() => {
    localStorage.setItem('recipes', JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('plans', JSON.stringify(plans));
  }, [plans]);

  // CRUD Helpers
  const addFood = (food) => setFoods([...foods, { ...food, id: Date.now().toString() }]);
  const updateFood = (id, updatedFood) => setFoods(foods.map(f => f.id === id ? { ...f, ...updatedFood } : f));
  const deleteFood = (id) => setFoods(foods.filter(f => f.id !== id));

  const addRecipe = (recipe) => setRecipes([...recipes, { ...recipe, id: Date.now().toString() }]);
  const updateRecipe = (id, updatedRecipe) => setRecipes(recipes.map(r => r.id === id ? { ...r, ...updatedRecipe } : r));
  const deleteRecipe = (id) => setRecipes(recipes.filter(r => r.id !== id));

  const addUser = (user) => setUsers([...users, { ...user, id: Date.now().toString() }]);
  const updateUser = (id, updatedUser) => setUsers(users.map(u => u.id === id ? { ...u, ...updatedUser } : u));
  const deleteUser = (id) => setUsers(users.filter(u => u.id !== id));

  const addPlan = (plan) => setPlans([...plans, { ...plan, id: Date.now().toString() }]);
  const updatePlan = (id, updatedPlan) => setPlans(plans.map(p => p.id === id ? { ...p, ...updatedPlan } : p));
  const deletePlan = (id) => setPlans(plans.filter(p => p.id !== id));

  const calculateRecipeNutrition = (recipe) => {
    let totals = { calories: 0, protein: 0, fat: 0, carbs: 0 };
    recipe.ingredients.forEach(ing => {
      const food = foods.find(f => f.id === ing.foodId);
      if (food) {
        const factor = ing.amount / 100;
        totals.calories += food.calories * factor;
        totals.protein += food.protein * factor;
        totals.fat += food.fat * factor;
        totals.carbs += food.carbs * factor;
      }
    });
    return totals;
  };

  const calculateUserStats = (user) => {
    if (!user || !user.weight || !user.height || !user.age) return null;

    // 1. BMR (Mifflin-St Jeor)
    let bmr = 0;
    if (user.gender === 'male') {
      bmr = (10 * user.weight) + (6.25 * user.height) - (5 * user.age) + 5;
    } else {
      bmr = (10 * user.weight) + (6.25 * user.height) - (5 * user.age) - 161;
    }

    // 2. Maintenance Calories
    const activityCoefficients = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    const maintenance = bmr * (activityCoefficients[user.activityLevel] || 1.2);

    // 3. Target Calories (Weight Loss)
    let target = maintenance;
    let deficit = 0;
    if (user.weight > user.targetWeight && user.weeksToGoal > 0) {
      deficit = ((user.weight - user.targetWeight) * 7700) / (user.weeksToGoal * 7);
      target = maintenance - deficit;
    }

    return {
      bmr: Math.round(bmr),
      maintenance: Math.round(maintenance),
      target: Math.round(target),
      deficit: Math.round(deficit)
    };
  };

  return (
    <DataContext.Provider value={{
      foods, addFood, updateFood, deleteFood,
      recipes, addRecipe, updateRecipe, deleteRecipe,
      users, addUser, updateUser, deleteUser,
      plans, addPlan, updatePlan, deletePlan,
      currentUser, setCurrentUser,
      calculateRecipeNutrition,
      calculateUserStats
    }}>
      {children}
    </DataContext.Provider>
  );
};
