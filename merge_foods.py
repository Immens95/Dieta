import json
import os

foods_path = r'c:\xampp\htdocs\Dieta\data\foods.json'
recipes_path = r'c:\xampp\htdocs\Dieta\data\recipes.json'

with open(foods_path, 'r', encoding='utf-8') as f:
    foods = json.load(f)

with open(recipes_path, 'r', encoding='utf-8') as f:
    recipes = json.load(f)

# 1. Identify groups of foods
# We group by name, and also handle "Name Bio" as the same food "Name"
def get_base_name(name):
    if name.endswith(' Bio'):
        return name[:-4]
    return name

grouped_foods = {}
for food in foods:
    base_name = get_base_name(food['name'])
    if base_name not in grouped_foods:
        grouped_foods[base_name] = []
    grouped_foods[base_name].append(food)

new_foods = []
id_mapping = {} # old_id -> new_id

for base_name, group in grouped_foods.items():
    if len(group) == 1 and not group[0]['name'].endswith(' Bio'):
        # No duplicates or bio version, just keep it
        new_foods.append(group[0])
        continue
    
    # We have duplicates or a bio version
    # Sort group so that the one with the lowest ID (usually the original) is first
    group.sort(key=lambda x: int(x['id']))
    
    main_food = group[0].copy()
    main_id = main_food['id']
    
    # Initialize variants if needed
    variants = []
    
    # Check if we should merge them
    # We'll compare the first food with others
    all_tags = set(main_food.get('tags', []))
    
    for other in group[1:]:
        # Map this other ID to the main ID
        id_mapping[other['id']] = main_id
        
        # Merge tags
        all_tags.update(other.get('tags', []))
        
        # Check if values differ
        values_differ = False
        for key in ['calories', 'protein', 'carbs', 'fats']:
            if main_food.get(key) != other.get(key):
                values_differ = True
                break
        
        if values_differ or other['name'].endswith(' Bio'):
            # Add as variant
            variant = {
                "name": other['name'],
                "calories": other.get('calories'),
                "protein": other.get('protein'),
                "carbs": other.get('carbs'),
                "fats": other.get('fats'),
                "tags": other.get('tags', [])
            }
            variants.append(variant)

    main_food['tags'] = sorted(list(all_tags))
    if variants:
        main_food['variants'] = variants
    
    # If the main food was actually a "Bio" version but it's the only one we have now
    # (shouldn't happen with the logic above but just in case)
    if main_food['name'].endswith(' Bio') and len(group) > 1:
        # This case is handled by the sorting and base name logic
        pass
        
    new_foods.append(main_food)

# 2. Update recipes.json with the new mapping
for recipe in recipes:
    for ingredient in recipe.get('ingredients', []):
        old_id = ingredient.get('foodId')
        if old_id in id_mapping:
            ingredient['foodId'] = id_mapping[old_id]

# 3. Write back the files
with open(foods_path, 'w', encoding='utf-8') as f:
    json.dump(new_foods, f, indent=4, ensure_ascii=False)

with open(recipes_path, 'w', encoding='utf-8') as f:
    json.dump(recipes, f, indent=4, ensure_ascii=False)

print(f"Merged {len(id_mapping)} duplicates.")
print(f"Updated recipes with new mappings.")
