
$foodsPath = "c:\xampp\htdocs\Dieta\data\foods.json"
$content = Get-Content $foodsPath -Raw

# Remove the messed up part
$badStart = '            {'
$badEnd = '    },' # This might match too much.

# Let's just use a more precise regex or string replacement to restore the first food
# and extract the new foods.

# The messed up part starts at line 16 of the previous read.
# "low-fat"\n            {\n        "id": "1224" ... "id": "1228" ... "tags": [\n            "gluten-free"\n        ]\n    },\n],

# I'll just rewrite the whole file correctly.
$foods = Get-Content $foodsPath | ConvertFrom-Json
# Wait, ConvertFrom-Json will fail because it's invalid JSON now.

# I'll use regex to fix it.
# Restore "low-fat" tags array
$content = $content -replace '"low-fat"\s+\{', '"low-fat" ],'
# Remove the extra ], that was inserted
$content = $content -replace '\},\s+\],', '},'

# Now I'll try to parse it. If it fails, I'll have to be more careful.
try {
    $json = $content | ConvertFrom-Json
    # If successful, find the new foods (1224-1228) and move them to the end of the list.
    # They are currently inside the first food's variants or somewhere else?
    # No, they are actually just sitting there in the array after the first food's tags.
    
    # Wait, the way it was inserted:
    # "tags": [ "low-fat" { "id": "1224" ... }, ... ], "variants": ...
    # This means 1224-1228 are elements of the "tags" array of the first food.
    
    $firstFood = $json[0]
    $newItems = $firstFood.tags | Where-Object { $_ -is [PSCustomObject] }
    $firstFood.tags = $firstFood.tags | Where-Object { $_ -is [string] }
    
    $remainingFoods = $json | Select-Object -Skip 1
    
    $allFoods = @($firstFood) + $remainingFoods + $newItems
    $allFoods | ConvertTo-Json -Depth 10 | Set-Content $foodsPath -Encoding UTF8
    Write-Host "Fixed foods.json syntax and moved new items to the end."
} catch {
    Write-Error "Failed to fix JSON: $_"
}
