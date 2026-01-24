
$foodsPath = "c:\xampp\htdocs\Dieta\data\foods.json"
$recipesPath = "c:\xampp\htdocs\Dieta\data\recipes.json"

$foods = Get-Content $foodsPath | ConvertFrom-Json
$recipes = Get-Content $recipesPath | ConvertFrom-Json

function Get-BaseName($name) {
    if ($name.EndsWith(" Bio")) {
        return $name.Substring(0, $name.Length - 4)
    }
    return $name
}

$groupedFoods = $foods | Group-Object { Get-BaseName $_.name }
$idMapping = @{}
$newFoods = New-Object System.Collections.Generic.List[PSObject]

foreach ($group in $groupedFoods) {
    $items = $group.Group | Sort-Object { [int]$_.id }
    
    # Prefer the one without " Bio" as the main food
    $mainFoodItem = $items | Where-Object { -not $_.name.EndsWith(" Bio") } | Select-Object -First 1
    if (-not $mainFoodItem) {
        $mainFoodItem = $items[0]
    }
    
    $mainFood = $mainFoodItem.PSObject.Copy()
    $mainId = $mainFood.id
    $variants = New-Object System.Collections.Generic.List[PSObject]
    $allTags = New-Object System.Collections.Generic.HashSet[string]
    
    if ($mainFood.tags) {
        foreach ($tag in $mainFood.tags) { [void]$allTags.Add($tag) }
    }
    
    foreach ($other in $items) {
        if ($other.id -eq $mainId) { continue }
        
        $idMapping[$other.id] = $mainId
        
        if ($other.tags) {
            foreach ($tag in $other.tags) { [void]$allTags.Add($tag) }
        }
        
        $valuesDiffer = $false
        foreach ($key in "calories", "protein", "carbs", "fats") {
            if ($mainFood.$key -ne $other.$key) {
                $valuesDiffer = $true
                break
            }
        }
        
        if ($valuesDiffer -or $other.name.EndsWith(" Bio")) {
            $variant = [PSCustomObject]@{
                name = $other.name
                calories = $other.calories
                protein = $other.protein
                carbs = $other.carbs
                fats = $other.fats
                tags = $other.tags
            }
            $variants.Add($variant)
        }
    }
    
    $mainFood.tags = [string[]]($allTags | Sort-Object)
    if ($variants.Count -gt 0) {
        $mainFood | Add-Member -MemberType NoteProperty -Name "variants" -Value $variants.ToArray()
    }
    
    $newFoods.Add($mainFood)
}

# Update recipes
foreach ($recipe in $recipes) {
    if ($recipe.ingredients) {
        foreach ($ingredient in $recipe.ingredients) {
            $oldId = $ingredient.foodId
            if ($idMapping.ContainsKey($oldId)) {
                $ingredient.foodId = $idMapping[$oldId]
            }
        }
    }
}

# Write back
$newFoods | ConvertTo-Json -Depth 10 | Set-Content $foodsPath -Encoding UTF8
$recipes | ConvertTo-Json -Depth 10 | Set-Content $recipesPath -Encoding UTF8

Write-Host "Merged $($idMapping.Count) duplicates."
