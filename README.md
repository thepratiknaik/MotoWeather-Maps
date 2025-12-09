🏍️ MotoWeather Maps
A Smart Route Planner & Weather Assistant for Motorcyclists

MotoWeather Maps is a client-side web application designed to help motorcyclists plan safer and more comfortable trips. Unlike standard weather apps that only show start and end conditions, MotoWeather samples weather data along the entire route, filters for significant changes, and uses Generative AI to provide custom riding advice and gear checklists.

🚀 Key Features
📍 Moto-Specific Routing: Calculates driving routes optimized for motorcycles using OpenRouteService.

wx Smart Weather Sampling: Automatically checks weather conditions every 35km along the route using geospatial analysis (Turf.js).

🧠 AI Co-Pilot: Integrated Google Gemini AI analyzes the route's weather data to generate a "Ride Difficulty Score" and a "Custom Packing List" (e.g., "Bring rain gear for the mountain pass").

🌑 Dark Mode Map: Custom "Dark Matter" map tiles with a real-time Rain Radar overlay.

☁️ Cloud Sync: Save and manage your favorite routes instantly using Google Firebase (Firestore).

⚡ Modern UI: Built with Tailwind CSS for a responsive, clean, and distraction-free interface.

🛠️ Tech Stack
Frontend: HTML5, Vanilla JavaScript (ES6 Modules), Tailwind CSS

Mapping: Leaflet.js, Turf.js (Geospatial Logic), CartoDB Tiles, RainViewer

Backend (BaaS): Google Firebase (Firestore & Anonymous Auth)

APIs:

OpenRouteService (Navigation)

OpenWeatherMap (Weather Data)

Google Gemini (Generative AI)

⚙️ Setup & Installation
This project uses ES6 Modules, so it requires a local server to run (it will not work if you just double-click index.html).

Clone the Repo

Bash
git clone https://github.com/yourusername/moto-weather-maps.git
cd moto-weather-maps
Run Locally

VS Code: Install the "Live Server" extension, right-click index.html, and choose "Open with Live Server".

Python: python -m http.server

Node: npx serve

Configure APIs

Launch the app.

Click "API Settings" in the top right.

Enter your free API keys for OpenRouteService, OpenWeatherMap, and Google Gemini.

(Keys are stored temporarily in browser memory for security).

📂 Project Structure
Plaintext
/moto-weather-maps
 ├── index.html              # Main UI Skeleton
 ├── styles.css              # Custom Map Styles
 └── js
     ├── app.js              # Main Controller (DOM & Map Logic)
     ├── api-service.js      # API Handling (Weather, Route, AI)
     └── firebase-service.js # Backend Logic (Database & Auth)
🛡️ License
This project is open-source and available under the MIT License.
