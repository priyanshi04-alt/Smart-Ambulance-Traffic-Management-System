# Smart Ambulance Traffic Management System
> **An AI & IoT-based Next-Generation Green Corridor Solution**

## 1. Project Overview
The **Smart Ambulance Traffic Management System** is a real-time, cross-platform software and hardware integration designed to eliminate ambulance delays caused by urban traffic congestion. Unlike traditional manual VIP corridor methods, this system uses **Acoustic IoT Sensors (Sound Detection)** and a **Dynamic WebSocket Engine** to autonomously detect, track, and clear traffic intersections the moment an ambulance approaches. 

The system seamlessly connects three distinct entities—the Ambulance Driver, the Traffic Control Admin, and the Destination Hospital—into a single synchronized ecosystem.

---

## 2. Core Functionalities

### A. Hardware IoT Integration (The Physical Layer)
* **Acoustic Siren Detection (ESP32):** Microphones deployed at intersections filter ambient noise and specifically listen for the high-decibel frequency of an ambulance siren. 
* **Autonomous Signal Override:** Upon detecting a siren, the local ESP32 microcontroller overrides the standard traffic routine, immediately turning the approaching lane **GREEN** and all other lanes **RED**.
* **Zero-Latency Orchestration:** Hardware devices maintain a constant 2-way continuous WebSocket connection with the central Node.js server. Changes on the physical traffic light reflect instantly on the central dashboard, and vice-versa.

### B. Admin Command Center (Traffic Controller)
* **Global City Network Map:** A bird's-eye view using Leaflet.js that visually tracks the live GPS location of every active ambulance moving through the city grid.
* **Live Intersection Visualizer:** A dynamic 3x3 grid visualization of the intersection. It shows real-time signal phases (Red/Yellow/Green) and alerts the admin with flashing red visuals if a physical override occurs.
* **Manual Override & Density Control:** Admins possess the master capability to manually trigger North/South/East/West green paths during an emergency, bypassing normal algorithm flow. They can also artificially adjust traffic volume timing (Low, Medium, High density thresholds).
* **Civilian Device Simulation:** An embedded mock-up demonstrating how regular civilian drivers using standard navigation apps are forcefully "pinged" to pull over when an ambulance enters their vicinity.

### C. Paramedic / Driver Dashboard (Mobile First)
* **One-Click Green Corridor Initiation:** Drivers possess an emergency highly visible red "Request Green Corridor" button. When triggered, the system calculates the path to their destination and begins systematically forcing signals to turn green ahead of the vehicle.
* **Advanced Patient & Vitals Handshake:** Rather than calling ahead, the driver inputs key patient data—Condition, Heart Rate (BPM), Blood Oxygen (SPO2), and Critical Status Checkbox—which is transferred encrypted and immediately to the destination hospital's UI.
* **AI Co-Pilot Assist:** A predictive sidebar analyzes the ongoing trip data and provides the driver with continuous background diagnostics (e.g., "Analyzing traffic delays," "Warning Hospital of massive trauma").

### D. Destination Hospital Tracking Bay
* **Live ETA Countdown Timer:** Replaces guesswork with a massive, live digital countdown timer calculating exactly how many minutes/seconds until the ambulance hits the emergency room doors.
* **Resource Readiness Engine:** Hospitals can track internal resource capacity directly alongside the incoming feed:
   * **Emergency Beds & Operation Theaters:** Live fill-bars (e.g., 05/10 beds available).
   * **Staff Preparation:** Shows on-call surgeons and ER nurses moving from "Standby" to "Assigned" specifically for this incoming ambulance.
* **Triage Ahead-of-Time:** The dashboard streams the live Heart Rate and SPO2 values directly from the moving ambulance, allowing doctors to assign severity levels and prep life-saving equipment before the patient physically arrives.

---

## 3. Key Technological Differentiators

1. **Progressive Web App (PWA) Architecture:** The entire interface transforms into a 100% Native Mobile App without app stores. The interface scales and operates offline or under restricted network conditions utilizing Service Workers and locally cached Content Delivery Networks (CDNs).
2. **Bi-Directional WebSocket Streaming:** No traditional HTTP polling delays. The system operates entirely on Socket.IO event streams (Event-driven Architecture). If an ambulance hits 60km/h, its speed updates smoothly on all three dashboards at 60 frames per second.
3. **Decentralized Security Fallback:** In the event the external internet fails, the entire application drops down to the local edge-network router, caching capabilities, and offline mode seamlessly, allowing the critical life-saving functions to continue uninterrupted locally.

---
## Conclusion
This ecosystem is actively shifting the paradigm of emergency response. Moving away from reactive traffic clearing towards an intelligent, autonomous, and zero-trust pre-emptive clearing model, it significantly reduces the Golden Hour transport time, directly increasing patient survival rates in densely populated metropolitan infrastructures.
