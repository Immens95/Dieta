
$foodsPath = "c:\xampp\htdocs\Dieta\data\foods.json"
$foods = Get-Content $foodsPath | ConvertFrom-Json

$newItems = @(
    [PSCustomObject]@{
        id = "1224"
        name = "Amarone della Valpolicella"
        category = "Snack/Varie"
        calories = 85
        protein = 0
        carbs = 3
        fats = 0
        unit = "100ml"
        image = "https://loremflickr.com/300/200/wine"
        tags = @("gluten-free", "lactose-free")
    },
    [PSCustomObject]@{
        id = "1225"
        name = "Provolone del Monaco"
        category = "Latticini"
        calories = 350
        protein = 25
        carbs = 1
        fats = 28
        unit = "100g"
        image = "https://loremflickr.com/300/200/cheese"
        tags = @("gluten-free")
    },
    [PSCustomObject]@{
        id = "1226"
        name = "Scialatielli"
        category = "Cereali"
        calories = 350
        protein = 12
        carbs = 70
        fats = 1.5
        unit = "100g"
        image = "https://loremflickr.com/300/200/pasta"
        tags = @("lactose-free")
    },
    [PSCustomObject]@{
        id = "1227"
        name = "Pane di Genzano"
        category = "Cereali"
        calories = 260
        protein = 9
        carbs = 52
        fats = 1
        unit = "100g"
        image = "https://loremflickr.com/300/200/bread"
        tags = @("lactose-free")
    },
    [PSCustomObject]@{
        id = "1228"
        name = "Pecorino di Pienza"
        category = "Latticini"
        calories = 380
        protein = 26
        carbs = 1
        fats = 31
        unit = "100g"
        image = "https://loremflickr.com/300/200/cheese"
        tags = @("gluten-free")
    },
    [PSCustomObject]@{
        id = "1229"
        name = "Cinghiale (carne)"
        category = "Proteine"
        calories = 120
        protein = 21
        carbs = 0
        fats = 3.3
        unit = "100g"
        image = "https://loremflickr.com/300/200/meat"
        tags = @("gluten-free", "lactose-free")
    },
    [PSCustomObject]@{
        id = "1230"
        name = "Funghi Porcini freschi"
        category = "Verdura"
        calories = 26
        protein = 3.9
        carbs = 0.7
        fats = 0.4
        unit = "100g"
        image = "https://loremflickr.com/300/200/mushrooms"
        tags = @("gluten-free", "lactose-free", "low-acid")
    }
)

$allFoods = $foods + $newItems
$allFoods | ConvertTo-Json -Depth 10 | Set-Content $foodsPath -Encoding UTF8
Write-Host "Added $($newItems.Count) new foods safely."
