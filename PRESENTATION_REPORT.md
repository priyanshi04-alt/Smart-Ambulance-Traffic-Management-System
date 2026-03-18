# Smart Ambulance Traffic Management System
**Project Status & Presentation Report**

## 1. Project Overview & Objective
The goal of this project is to create an intelligent, IoT-driven traffic management system that dramatically reduces the response time of emergency vehicles. By combining a digital software dashboard with physical IoT hardware, the system can automatically detect the presence of an ambulance and manipulate traffic intersections (creating a "Green Corridor") to allow for safe, uninterrupted passage.

---

## 2. Software Development: Completed & Ready for Demo
To date, the **Software Control Dashboard** has been fully developed, refined, and is ready for live demonstration. 

**Key Features Developed in the Dashboard:**
- **Live GPS Map Simulation:** A real-time tracking interface built using Leaflet.js that accurately plots the ambulance’s journey through city streets.
- **AI Co-Pilot Integration:** A complete Text-to-Speech (TTS) integration that vocally announces critical alerts, congestion warnings, and route changes to the driver.
- **Dynamic Re-Routing:** The system mathematically analyzes traffic conditions. As demonstrated in Scenario 2, if the main route is congested, the AI immediately wipes the old route from the map and draws a faster detour through side streets in real-time.
- **Smart Node Server Override (The "Green Corridor"):** A complex backend architecture using Node.js and Socket.io. When an ambulance approaches a red light (as seen in Scenarios 1 and 3), the system digitally overrides the traffic light state across the network.
- **Hospital-Side Integration & Vitals Tracking:** A real-time data link that transmits patient vitals (SPO2, Heart Rate) directly from the ambulance to the hospital dashboard, allowing doctors to prepare for the specific emergency before arrival.
- **Multimodal Role Dashboards:** Distinct and secure login experiences for **Admin** (System Control), **Driver** (Navigation), and **Hospital** (Emergency Readiness).
- **Trip Performance Analytics:** High-impact mission summary reports showing distance, time saved, and traffic overrides upon arrival.
- **Mock Civilian Driver Alerts:** Real-time simulation of how nearby drivers receive emergency notifications on their mobile devices.
- **Polished Choreography:** Perfectly synchronized ambulance movement, voice dialogue, and UI alerts for a professional demonstration.

*For the presentation, we can log into the dashboard (`http://localhost:3000`) and seamlessly demonstrate Scenarios 1, 2, and 3 to show the software reacting exactly as intended.*

---

## 3. Hardware Integration: Assembled & In Progress
The second phase of the project is the physical IoT hardware. 

**Current Hardware Status:**
- We have successfully procured and mapped out the necessary hardware components, centering around two **ESP32 Microcontrollers**.
- **Ambulance Sensing Unit:** We have fully assembled the breadboard circuitry connecting the **KY-037 Microphone Sound Sensor** to the first ESP32. We have analyzed the pinout and established the theoretical connection required to detect high-frequency siren noises.
- **Traffic Intersection Unit:** We have wired the physical **Red, Yellow, and Green 5mm LEDs** to the second ESP32, including the necessary resistor placements to regulate current safely across the breadboard.
- **Architectural Understanding:** We have mapped out exactly how these hardware components will communicate over Wi-Fi with our completed Node.js backend using HTTP POST/GET requests and JSON payloads. 

**Note for Presentation:** 
We have *completed the physical assembly and circuit design* of the hardware. The microcontrollers, sensors, and LEDs are wired together securely. However, the final stage of flashing the C++ codebase onto the microcontrollers to actuate the live hardware triggers is still in progress. The hardware serves as our visual prototype of the physical endpoints, while the dashboard successfully proves the underlying software logic works perfectly.

---

## 4. Next Steps (Future Scope)
Our immediate next steps following this presentation will be:
1. Flashing the complete C++ integration scripts onto the two ESP32 modules.
2. Replacing the software "Demo Buttons" on the dashboard with the live, physical HTTP triggers sent directly from the KY-037 Sound Sensor over Wi-Fi.
3. Having the physical LED Traffic Lights dynamically mirror the digital traffic states broadcasted by the Node.js server.

---

## 5. Development Challenges & System Resolutions

During the development of the Smart Ambulance Traffic Management Dashboard, we encountered several complex logical and synchronization challenges. Here are three major issues, how they failed, and how our engineering fixed them:

### A. Asynchronous State Synchronization (The "Ghost Ambulance" Problem)
* **The Issue:** Coordinating the front-end map animation with the real-time backend traffic light states.
* **Scenario of Failure:** When an ambulance approached a major intersection (Scenario 1), the visual map marker would sometimes continue driving straight through a red light on the dashboard *before* the backend Node.js server had actually triggered the "Green Corridor" override. This resulted in a visual desynchronization where the UI showed the ambulance safely passing, but the system logic stated it was still waiting.
* **The Fix:** We implemented a stricter **Event-Driven Architecture** using WebSockets (`Socket.io`). We decoupled the map animation from a simple timer and tied it directly to server confirmations. The ambulance's JavaScript movement logic was updated to halt at specific junction coordinates until a definitive `TRAFFIC_CLEARED` event was received from the server, ensuring perfect sync between the UI and the backend.

### B. Audio Overlap & Event Spamming (The "Chaotic Co-Pilot" Problem)
* **The Issue:** Managing multiple asynchronous Text-to-Speech (TTS) alerts simultaneously.
* **Scenario of Failure:** During rapid, dynamic events—such as detecting heavy congestion right as the emergency override was triggered—the AI Co-Pilot would attempt to speak multiple alerts at exactly the same time. The browser's speech synthesis would queue these up or overlap them, resulting in the system stuttering, talking over itself, and delivering garbled, confusing instructions to the driver.
* **The Fix:** We engineered a custom **Audio Queue Manager with Priority Cancellation**. We categorized alerts by priority levels. If a maximum-priority alert (e.g., *"Emergency Override Activated!"*) was triggered, the JavaScript function was written to immediately invoke `window.speechSynthesis.cancel()`, flush any pending low-priority alerts from the queue, and immediately speak the critical instruction, ensuring clear and concise audio feedback.

### C. Route Recalculation Rendering Glitches (The "Spaghetti Map" Problem)
* **The Issue:** Dynamically clearing and redrawing mapping layers in Leaflet.js without visual artifacts.
* **Scenario of Failure:** When demonstrating Scenario 2 (Dynamic Re-Routing), the system is supposed to erase the congested route and draw a faster detour. However, the map would occasionally fail to completely destroy the initial route object. As it continuously recalculated, it would draw the new route *on top* of the old one, resulting in a messy UI with overlapping, crisscrossing blue and red lines that made the map unreadable.
* **The Fix:** We refined the map rendering lifecycle by implementing **Strict Layer Instance Tracking**. We created a global variable specifically to hold the active `L.polyline` layer instance. Before the function is allowed to draw a newly calculated route array, it is forced to explicitly target and destroy the previous reference using `map.removeLayer(currentRouteLayer)`. This guarantees a clean, instant visual transition to the new path.

*Note: Fixing these bugs forced us to build a more robust, real-time architecture, moving away from simple timed animations to true, server-driven event handling.*
