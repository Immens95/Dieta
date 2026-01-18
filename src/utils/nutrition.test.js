import { describe, it, expect } from 'vitest';

const calculateNutrition = (ingredients, foods) => {
  let totals = { calories: 0, protein: 0, fat: 0, carbs: 0 };
  ingredients.forEach(ing => {
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

describe('Nutritional Calculations', () => {
  const mockFoods = [
    { id: '1', name: 'Food A', calories: 100, protein: 10, fat: 5, carbs: 2 },
    { id: '2', name: 'Food B', calories: 200, protein: 20, fat: 10, carbs: 4 }
  ];

  it('calculates totals correctly for a single ingredient', () => {
    const ingredients = [{ foodId: '1', amount: 200 }];
    const result = calculateNutrition(ingredients, mockFoods);
    expect(result.calories).toBe(200);
    expect(result.protein).toBe(20);
    expect(result.fat).toBe(10);
    expect(result.carbs).toBe(4);
  });

  it('calculates totals correctly for multiple ingredients', () => {
    const ingredients = [
      { foodId: '1', amount: 100 },
      { foodId: '2', amount: 50 }
    ];
    const result = calculateNutrition(ingredients, mockFoods);
    expect(result.calories).toBe(200); // 100 + (200 * 0.5)
    expect(result.protein).toBe(20);   // 10 + (20 * 0.5)
    expect(result.fat).toBe(10);      // 5 + (10 * 0.5)
    expect(result.carbs).toBe(4);     // 2 + (4 * 0.5)
  });
});
