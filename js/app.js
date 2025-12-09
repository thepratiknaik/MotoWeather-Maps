import * as API from './api-service.js';
import * as FB from './firebase-service.js';

// --- STATE ---
let map, routeLayer;
let markers = [];
let currentRouteData = null;
let globalWeatherSamples = []; 
const weatherMarkerIcon = createMarkerIcon();

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    lucide.createIcons();
    setupEventListeners();
    
    // Initialize Backend
    FB.initFirebase((user) => {
        document.getElementById('saved-routes-container').classList.remove('hidden');
        document.getElementById('save-route-btn').classList.remove('hidden');
        loadSavedRoutes();
    });
});

function initMap() {
    map = L.map('map').setView([34.0522, -118.2437], 8);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);
    
    // Rain Layer
    L.tileLayer('https://tilecache.rainviewer.com/v2/radar/nowcast_latest/256/{z}/{x}/{y}/2/1_1.png', {
        opacity: 0.4
    }).addTo(map);
}

function createMarkerIcon() {
    const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f97316" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
    </svg>`;
    
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="width: 30px; height: 30px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));">${svgIcon}</div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42],
        popupAnchor: [0, -42]
    });
}

function setupEventListeners() {
    document.getElementById('toggle-settings-btn').addEventListener('click', () => {
        document.getElementById('api-settings').classList.toggle('hidden');
    });
    
    document.getElementById('plan-route-btn').addEventListener('click', handlePlanRoute);
    
    document.getElementById('save-route-btn').addEventListener('click', async () => {
        if (!currentRouteData) return;
        try {
            await FB.saveRoute(currentRouteData);
            const btn = document.getElementById('save-route-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> Saved!`;
            setTimeout(() => btn.innerHTML = originalText, 2000);
        } catch(e) { alert("Save failed"); }
    });

    document.getElementById('ai-insight-btn').addEventListener('click', () => generateAIResponse('insight'));
    document.getElementById('ai-packing-btn').addEventListener('click', () => generateAIResponse('packing'));
}

async function handlePlanRoute() {
    const startCity = document.getElementById('start-city').value;
    const endCity = document.getElementById('end-city').value;
    const orsKey = document.getElementById('ors-key').value;
    const owmKey = document.getElementById('owm-key').value;
    const errorDiv = document.getElementById('error-msg');
    const loadingOverlay = document.getElementById('loading-overlay');

    errorDiv.classList.add('hidden');
    loadingOverlay.classList.remove('hidden');
    
    // Reset Map
    if (routeLayer) map.removeLayer(routeLayer);
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    globalWeatherSamples = []; 

    try {
        if (!orsKey || !owmKey) throw new Error("Please enter your API keys in settings.");

        // 1. Geocode
        const startLoc = await API.geocodeCity(startCity);
        const endLoc = await API.geocodeCity(endCity);
        if (!startLoc || !endLoc) throw new Error("Could not find location.");

        // 2. Route
        const routeJson = await API.fetchRoute(startLoc, endLoc, orsKey);
        const feature = routeJson.features[0];
        const coordinates = feature.geometry.coordinates;
        const summary = feature.properties.segments[0];

        // 3. Draw Route
        const latLngs = coordinates.map(c => [c[1], c[0]]);
        routeLayer = L.polyline(latLngs, { color: '#f97316', weight: 5, opacity: 0.9 }).addTo(map);
        map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });

        // 4. Sample Points & Weather
        const line = turf.lineString(coordinates);
        const lengthKm = turf.length(line, { units: 'kilometers' });
        const step = 35; // km
        const samples = [coordinates[0]]; 
        for (let i = step; i < lengthKm; i += step) {
            samples.push(turf.along(line, i, { units: 'kilometers' }).geometry.coordinates);
        }
        samples.push(coordinates[coordinates.length - 1]);

        let lastDisplayedWeather = null;

        for (let i = 0; i < samples.length; i++) {
            const [lon, lat] = samples[i];
            const wData = await API.fetchWeather(lat, lon, owmKey);

            globalWeatherSamples.push({
                location: wData.name,
                temp: wData.main.temp,
                condition: wData.weather[0].main,
                wind: wData.wind.speed
            });

            // Filtering logic for markers
            let shouldDisplay = (i === 0 || i === samples.length - 1);
            if (!shouldDisplay && lastDisplayedWeather) {
                 if (Math.abs(wData.main.temp - lastDisplayedWeather.main.temp) > 3 ||
                     wData.weather[0].main !== lastDisplayedWeather.weather[0].main || 
                     i % 3 === 0) {
                     shouldDisplay = true;
                 }
            }

            if (shouldDisplay) {
                const popup = `
                    <div class="font-sans text-slate-800 p-4 min-w-[200px]">
                        <div class="font-bold border-b pb-2 mb-2 text-orange-700">${wData.name || "Checkpoint"}</div>
                        <div class="flex items-center gap-4 mb-3">
                            <img src="https://openweathermap.org/img/wn/${wData.weather[0].icon}@2x.png" class="w-12 h-12 bg-orange-100 rounded-full">
                            <div>
                                <div class="text-2xl font-bold">${Math.round(wData.main.temp)}°C</div>
                                <div class="text-xs text-gray-500 capitalize">${wData.weather[0].description}</div>
                            </div>
                        </div>
                    </div>`;
                const m = L.marker([lat, lon], { icon: weatherMarkerIcon }).bindPopup(popup).addTo(map);
                markers.push(m);
                lastDisplayedWeather = wData;
            }
        }

        // Stats
        document.getElementById('stat-dist').innerText = `${(summary.distance / 1000).toFixed(1)} km`;
        document.getElementById('stat-time').innerText = `${(summary.duration / 3600).toFixed(1)} hrs`;
        document.getElementById('route-stats').classList.remove('hidden');

        currentRouteData = { start: startCity, end: endCity, summary: summary };

    } catch (err) {
        errorDiv.innerText = err.message;
        errorDiv.classList.remove('hidden');
        if (err.message.includes("Key")) document.getElementById('api-settings').classList.remove('hidden');
    } finally {
        loadingOverlay.classList.add('hidden');
    }
}

async function generateAIResponse(type) {
    const geminiKey = document.getElementById('gemini-key').value;
    if (!geminiKey) return alert("Enter Gemini Key in settings");
    
    const container = document.getElementById('ai-result-container');
    const contentDiv = document.getElementById('ai-content');
    const loading = document.getElementById('ai-loading');
    
    container.classList.remove('hidden');
    loading.classList.remove('hidden');
    contentDiv.innerHTML = "";

    try {
        let prompt = "";
        if (type === 'insight') {
            prompt = `I am riding a motorcycle from ${currentRouteData.start} to ${currentRouteData.end}. Weather samples: ${JSON.stringify(globalWeatherSamples)}. Give a 3-sentence summary of ride difficulty and one pro safety tip.`;
        } else {
             prompt = `Create a short bulleted motorcycle gear checklist for these conditions: ${JSON.stringify(globalWeatherSamples)}`;
        }

        const text = await API.fetchGeminiInsight(prompt, geminiKey);
        contentDiv.innerHTML = marked.parse(text);
    } catch (e) {
        contentDiv.innerText = "Error: " + e.message;
    } finally {
        loading.classList.add('hidden');
    }
}

function loadSavedRoutes() {
    FB.listenToRoutes((routes) => {
        const list = document.getElementById('saved-routes-list');
        list.innerHTML = "";
        routes.forEach(data => {
            const el = document.createElement('div');
            el.className = "group p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-all cursor-pointer flex justify-between";
            el.innerHTML = `
                <div>
                    <div class="font-medium text-slate-200 text-sm">${data.start} ➝ ${data.end}</div>
                    <div class="text-xs text-slate-500 mt-1">${(data.summary.distance/1000).toFixed(0)}km</div>
                </div>
                <button class="delete-btn text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            `;
            el.addEventListener('click', (e) => {
                if(e.target.closest('.delete-btn')) return;
                document.getElementById('start-city').value = data.start;
                document.getElementById('end-city').value = data.end;
                handlePlanRoute();
            });
            el.querySelector('.delete-btn').addEventListener('click', () => FB.deleteRoute(data.id));
            list.appendChild(el);
        });
        lucide.createIcons();
    });
}