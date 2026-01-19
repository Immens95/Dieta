
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

    // Meal categories based on common associations
    const mealCategories = [];
    const recipeName = recipe.name.toLowerCase();
    
    if (recipeName.includes('colazione') || recipeName.includes('yogurt') || recipeName.includes('frutta') || recipeName.includes('uova') || recipeName.includes('muesli')) {
        mealCategories.push('Colazione');
    }
    if (recipeName.includes('pasta') || recipeName.includes('riso') || recipeName.includes('risotto') || recipeName.includes('carne') || recipeName.includes('pollo') || recipeName.includes('pesce') || recipeName.includes('insalata') || recipeName.includes('zuppa') || recipeName.includes('vellutata')) {
        mealCategories.push('Pranzo');
    }
    if (recipeName.includes('cena') || recipeName.includes('leggera') || recipeName.includes('pesce') || recipeName.includes('verdura') || recipeName.includes('insalata') || recipeName.includes('zuppa') || recipeName.includes('vellutata')) {
        mealCategories.push('Cena');
    }
    if (recipeName.includes('snack') || recipeName.includes('frutta') || recipeName.includes('frutta secca') || recipeName.includes('merenda') || recipeName.includes('yogurt')) {
        mealCategories.push('Merenda');
    }

    // Default if none matched
    if (mealCategories.length === 0) {
        mealCategories.push('Pranzo', 'Cena');
    }

    // Image selection based on keywords
    const imageKeywords = {
        'pasta': 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=400&h=300&fit=crop',
        'riso': 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop',
        'insalata': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
        'pollo': 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=300&fit=crop',
        'pesce': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=300&fit=crop',
        'zuppa': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
        'vellutata': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
        'colazione': 'https://images.unsplash.com/photo-1494390248081-4e521a5940db?w=400&h=300&fit=crop',
        'yogurt': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
        'frutta': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6bcd6?w=400&h=300&fit=crop',
        'carne': 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=300&fit=crop',
        'pane': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop',
        'uova': 'https://images.unsplash.com/photo-1506084868730-342b1f852e0d?w=400&h=300&fit=crop'
    };

    let selectedImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'; // Default
    for (const [key, url] of Object.entries(imageKeywords)) {
        if (recipeName.includes(key)) {
            selectedImage = url;
            break;
        }
    }

    return {
        ...recipe,
        image: selectedImage,
        prepTime: `${prepTime} min`,
        difficulty,
        steps,
        tips,
        mealCategories,
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
