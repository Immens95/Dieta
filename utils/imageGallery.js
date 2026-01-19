export const foodImages = [
    { name: 'Pomodoro', url: 'https://images.unsplash.com/photo-1518977676601-b53f02bad673?w=400&h=300&fit=crop' },
    { name: 'Pollo', url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=300&fit=crop' },
    { name: 'Insalata', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop' },
    { name: 'Pasta', url: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=400&h=300&fit=crop' },
    { name: 'Mela', url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6bcd6?w=400&h=300&fit=crop' },
    { name: 'Pane', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop' },
    { name: 'Uova', url: 'https://images.unsplash.com/photo-1506084868730-342b1f852e0d?w=400&h=300&fit=crop' },
    { name: 'Pesce', url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=300&fit=crop' },
    { name: 'Riso', url: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400&h=300&fit=crop' },
    { name: 'Carne', url: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=300&fit=crop' },
    { name: 'Formaggio', url: 'https://images.unsplash.com/photo-1486297678162-ad2a19b05840?w=400&h=300&fit=crop' },
    { name: 'Yogurt', url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop' },
    { name: 'Legumi', url: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e2?w=400&h=300&fit=crop' },
    { name: 'Frutta Secca', url: 'https://images.unsplash.com/photo-1511066922824-1c78440073b0?w=400&h=300&fit=crop' },
    { name: 'Avocado', url: 'https://images.unsplash.com/photo-1523049673857-d188397b35a7?w=400&h=300&fit=crop' },
    { name: 'Zucchine', url: 'https://images.unsplash.com/photo-1592489639182-b2f82d972829?w=400&h=300&fit=crop' },
    { name: 'Olio EVO', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=300&fit=crop' },
    { name: 'Uva', url: 'https://images.unsplash.com/photo-1537640538966-79f369b41e8f?w=400&h=300&fit=crop' },
    { name: 'Cioccolato', url: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=400&h=300&fit=crop' }
];

export const recipeImages = [
    { name: 'Pasta al Pomodoro', url: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=400&h=300&fit=crop' },
    { name: 'Insalata Greca', url: 'https://images.unsplash.com/photo-1540420753420-319e744041ca?w=400&h=300&fit=crop' },
    { name: 'Pollo Arrosto', url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop' },
    { name: 'Salmone Grigliato', url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop' },
    { name: 'Risotto ai Funghi', url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop' },
    { name: 'Zuppa di Legumi', url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop' },
    { name: 'Bowl Proteica', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop' },
    { name: 'Colazione Sana', url: 'https://images.unsplash.com/photo-1494390248081-4e521a5940db?w=400&h=300&fit=crop' },
    { name: 'Risotto all\'Olio', url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop' },
    { name: 'Vellutata di Uva', url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop' }
];

export function getUnsplashUrl(query) {
    return `https://unsplash.com/s/photos/${encodeURIComponent(query)}?license=free`;
}

export async function searchUnsplashImages(query) {
    const clientId = 'v6fE8U6M7tU_z_J3l-1_W_z_J3l-1_W_z_J3l-1_W'; // Esempio
    
    try {
        // Tentativo 1: API ufficiale con una chiave (anche se probabilmente non valida)
        const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&client_id=${clientId}`);
        
        if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                return data.results.map(img => ({
                    name: img.alt_description || query,
                    url: img.urls.regular,
                    thumb: img.urls.small,
                    author: img.user.name,
                    link: img.links.html
                }));
            }
        }

        // Tentativo 2: Fallback tramite servizio affidabile (LoremFlickr è ottimo per parole chiave)
        console.warn('Unsplash API non disponibile o limite raggiunto. Uso fallback LoremFlickr.');
        
        return Array.from({ length: 12 }).map((_, i) => ({
            name: `${query} ${i + 1}`,
            url: `https://loremflickr.com/800/600/food,${encodeURIComponent(query)}?lock=${i}`,
            thumb: `https://loremflickr.com/400/300/food,${encodeURIComponent(query)}?lock=${i}`,
            author: 'Placeholder',
            link: `https://loremflickr.com/`
        }));

    } catch (error) {
        console.error('Errore nella ricerca Unsplash:', error);
        return [];
    }
}

