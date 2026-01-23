const fs = require('fs');
const path = require('path');

const FOODS_PATH = path.join(__dirname, 'data', 'foods.json');
const foods = JSON.parse(fs.readFileSync(FOODS_PATH, 'utf8'));

const updatedFoods = foods.map(food => {
    if (food.image && food.image.includes('loremflickr.com')) {
        // Clean up keywords: remove special characters like (), ', %, etc.
        let urlParts = food.image.split('/');
        let keywordsPart = urlParts[urlParts.length - 1];
        
        // Handle query params if any
        let [keywords, query] = keywordsPart.split('?');
        
        let tags = keywords.split(',');
        let cleanedTags = tags.map(tag => {
            // Remove everything that isn't alphanumeric or space
            return tag.replace(/[^a-zA-Z0-9]/g, ' ').trim().replace(/\s+/g, ' ');
        }).filter(tag => tag.length > 0);
        
        urlParts[urlParts.length - 1] = cleanedTags.join(',') + (query ? '?' + query : '');
        food.image = urlParts.join('/');
    }
    return food;
});

fs.writeFileSync(FOODS_PATH, JSON.stringify(updatedFoods, null, 4));
console.log(`Updated images for ${updatedFoods.length} foods.`);
