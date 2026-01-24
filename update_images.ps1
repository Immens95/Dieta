# Questo script aggiorna le immagini nei file JSON di foods e recipes
# utilizzando loremflickr.com con tag basati sul nome dell'alimento/ricetta.
# Questo garantisce immagini appropriate e libere da copyright.

function Update-Images($filePath, $isFood) {
    $content = Get-Content $filePath -Raw | ConvertFrom-Json
    $count = 0
    
    foreach ($item in $content) {
        $cleanName = $item.name -replace '[^a-zA-Z0-9]', ','
        $lockId = $item.id
        
        $imgUrl = if ($isFood) {
            "https://loremflickr.com/300/200/food,$cleanName?lock=$lockId"
        } else {
            "https://loremflickr.com/800/600/food,cooked,$cleanName?lock=$lockId"
        }
        
        # Aggiunge o aggiorna la proprietà image
        if ($null -eq $item.PSObject.Properties['image']) {
            $item | Add-Member -MemberType NoteProperty -Name "image" -Value $imgUrl
        } else {
            $item.image = $imgUrl
        }
        $count++
    }
    
    $content | ConvertTo-Json -Depth 10 | Set-Content $filePath -Encoding UTF8
    Write-Host "Aggiornate $count immagini in $filePath"
}

$foodsPath = "c:\xampp\htdocs\Dieta\data\foods.json"
$recipesPath = "c:\xampp\htdocs\Dieta\data\recipes.json"

Update-Images $foodsPath $true
Update-Images $recipesPath $false
