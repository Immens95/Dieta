
$recipesPath = "c:\xampp\htdocs\Dieta\data\recipes.json"
$recipes = Get-Content $recipesPath | ConvertFrom-Json

$groupedRecipes = $recipes | Group-Object { $_.name.ToLower().Trim() }
$newRecipes = New-Object System.Collections.Generic.List[PSObject]
$nextId = 1

foreach ($group in $groupedRecipes) {
    # Sort by detail level (number of ingredients + number of steps)
    $bestRecipe = $group.Group | Sort-Object { 
        $score = 0
        if ($_.ingredients) { $score += $_.ingredients.Count }
        if ($_.steps) { $score += $_.steps.Count }
        if ($_.instructions) { $score += 1 }
        $score
    } -Descending | Select-Object -First 1
    
    # Assign a new sequential ID to keep things clean
    $bestRecipe.id = $nextId.ToString()
    $nextId++
    
    $newRecipes.Add($bestRecipe)
}

$newRecipes | ConvertTo-Json -Depth 10 | Set-Content $recipesPath -Encoding UTF8
Write-Host "Merged recipes. Unique count: $($newRecipes.Count)"
