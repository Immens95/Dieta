
import fs from 'fs';
import path from 'path';

const recipesPath = './data/recipes.json';
const foodsPath = './data/foods.json';

const recipes = JSON.parse(fs.readFileSync(recipesPath, 'utf8'));
const foods = JSON.parse(fs.readFileSync(foodsPath, 'utf8'));

const enrichedRecipes = recipes.map(recipe => {
    // Calculate totals
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fats = 0;

    recipe.ingredients.forEach(ing => {
        const food = foods.find(f => f.id === ing.foodId);
        if (food) {
            const factor = ing.amount / 100;
            calories += food.calories * factor;
            protein += food.protein * factor;
            carbs += food.carbs * factor;
            fats += food.fats * factor;
        }
    });

    // Add new fields
    const prepTime = Math.floor(Math.random() * 45) + 15; // 15-60 min
    const difficulties = ['Facile', 'Media', 'Avanzata'];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    
    // Create more detailed instructions
    const steps = [
        `Prepara tutti gli ingredienti: ${recipe.ingredients.map(ing => {
            const food = foods.find(f => f.id === ing.foodId);
            return food ? `${food.name} (${ing.amount}g)` : '';
        }).filter(Boolean).join(', ')}.`,
        `Pulisci e taglia con cura gli alimenti necessari.`,
        `Inizia la cottura a fuoco medio per preservare le proprietà nutritive.`,
        `Unisci gli ingredienti seguendo l'ordine di consistenza.`,
        `Aggiusta di sapore con spezie naturali senza eccedere con il sale.`,
        `Lascia riposare per 2 minuti prima di servire.`
    ];

    // Tips based on tags
    const tips = [];
    if (recipe.tags.includes('gluten-free')) tips.push("Assicurati che tutti gli utensili siano privi di tracce di glutine.");
    if (recipe.tags.includes('lactose-free')) tips.push("Puoi sostituire eventuali grassi con olio extravergine di oliva di alta qualità.");
    if (recipe.tags.includes('low-acid')) tips.push("Evita l'aggiunta di limone o aceto per mantenere il piatto alcalino.");
    tips.push("Per una migliore digestione, mastica lentamente ogni boccone.");
    tips.push("Consuma il piatto appena pronto per godere del massimo apporto vitaminico.");

    return {
        ...recipe,
        prepTime: `${prepTime} min`,
        difficulty,
        steps,
        tips,
        totals: {
            calories: Math.round(calories),
            protein: Math.round(protein),
            carbs: Math.round(carbs),
            fats: Math.round(fats)
        }
    };
});

fs.writeFileSync(recipesPath, JSON.stringify(enrichedRecipes, null, 4));
console.log(`Arricchite ${enrichedRecipes.length} ricette.`);
