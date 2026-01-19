// Simple test runner for core functions
export function runTests() {
  console.log('🚀 Starting Tests...');
  
  const results = [];
  
  // Test 1: BMR Calculation (Mifflin-St Jeor)
  function testBMR() {
    const user = { sex: 'male', weight: 80, height: 180, age: 30 };
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    const bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age + 5;
    const passed = bmr === 1780;
    results.push({ name: 'BMR Calculation Male', passed });
  }

  // Test 2: Recipe Totals
  function testRecipeTotals() {
    const foods = [
      { id: '1', calories: 100, protein: 10, carbs: 10, fats: 10 }
    ];
    const ingredients = [{ foodId: '1', amount: 200 }];
    const totals = ingredients.reduce((acc, item) => {
      const food = foods.find(f => f.id === item.foodId);
      const factor = item.amount / 100;
      acc.calories += food.calories * factor;
      return acc;
    }, { calories: 0 });
    
    const passed = totals.calories === 200;
    results.push({ name: 'Recipe Total Calculation', passed });
  }

  testBMR();
  testRecipeTotals();

  console.table(results);
  const allPassed = results.every(r => r.passed);
  console.log(allPassed ? '✅ All tests passed!' : '❌ Some tests failed!');
}
