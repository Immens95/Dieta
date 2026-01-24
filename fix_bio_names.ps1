
$foodsPath = "c:\xampp\htdocs\Dieta\data\foods.json"
$foods = Get-Content $foodsPath | ConvertFrom-Json

foreach ($food in $foods) {
    if ($food.name.EndsWith(" Bio")) {
        $baseName = $food.name.Substring(0, $food.name.Length - 4)
        
        # Check if there is a variant that should be the main food
        if ($food.variants) {
            $baseVariant = $food.variants | Where-Object { $_.name -eq $baseName } | Select-Object -First 1
            if ($baseVariant) {
                # Swap main food name with this variant
                $bioVariantName = $food.name
                $food.name = $baseName
                $baseVariant.name = $bioVariantName
                Write-Host "Swapped Bio name for $($food.name)"
            } else {
                # Just rename it if no such variant exists (shouldn't happen but safe)
                $food.name = $baseName
                Write-Host "Renamed $($food.name) Bio to $($food.name)"
            }
        } else {
            # No variants, just rename
            $food.name = $baseName
            Write-Host "Renamed $($food.name) Bio to $($food.name)"
        }
    }
}

$foods | ConvertTo-Json -Depth 10 | Set-Content $foodsPath -Encoding UTF8
