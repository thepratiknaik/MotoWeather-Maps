/**
 * Geocodes a city name to Lat/Lon
 */
export async function geocodeCity(city) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`);
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
                name: data[0].display_name
            };
        }
    } catch (err) {
        console.error(err);
        throw new Error(`Could not find location: ${city}`);
    }
    return null;
}

/**
 * Fetches route from OpenRouteService
 */
export async function fetchRoute(startLoc, endLoc, apiKey) {
    // Using driving-car for Moto routes (better than driving-hgv, standard for moto touring)
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${startLoc.lon},${startLoc.lat}&end=${endLoc.lon},${endLoc.lat}`;
    const res = await fetch(url);
    if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(`Routing Error: ${errorJson.error?.message || "Check API Key"}`);
    }
    return await res.json();
}

/**
 * Fetches weather for a specific point
 */
export async function fetchWeather(lat, lon, apiKey) {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
    if (!res.ok) {
        const errData = await res.json();
        throw new Error(`Weather API Error: ${errData.message || res.statusText}`);
    }
    return await res.json();
}

/**
 * Calls Gemini AI
 */
export async function fetchGeminiInsight(promptText, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }]
        })
    });

    if (!response.ok) throw new Error("Gemini API request failed.");
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}