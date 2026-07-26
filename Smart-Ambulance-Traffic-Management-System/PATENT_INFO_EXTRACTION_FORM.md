# Patent Information Extraction (PIE) Form

## General Information

* **TOPIC:** A Decentralized Predictive Emergency Vehicle Traffic Orchestration Framework Utilizing Edge-Based Spectral Siren Validation and Trajectory-Confidence-Scaled Signal Preemption
* **SCHOOL:** Chitkara University School of Engineering & Technology, Chitkara University, Himachal Pradesh
* **INVENTOR’S DETAIL WHO UPLOADED THE PATENT ON CHALKPAD:**
  * **NAME:** Dr. Navneet Kaur
  * **EMPLOYEE CODE:** CU1097
  * **MOBILE NO:** 9646800261
  * **MAIL ID (UNIVERSITY):** navneet.kaur_cse@chitkaruniversity.edu.in
  * **MAIL ID (PERSONAL):** navneetbrar5@gmail.com

## Other Inventors' Details

| S. NO. | NAME | EMP CODE / ROLL NO. | ADDRESS WITH EMAIL & MOBILE NO. |
|---|---|---|---|
| 1 | **Priyanshi** | 2411981435 | Sirmaur, Himachal Pradesh (priyanshi1435.be24@chitkarauniversity.edu.in, +91 90151-41053) |
| 2 | **Priya** | 2411981432 | Abohar, Punjab (priya1432.be24@chitkarauniversity.edu.in, +91 90416-04404) |
| 3 | **Pratham Chadda** | 2411981427 | Sri Muktsar Sahib, Punjab (pratham1427.be24@chitkarauniversity.edu.in, +91 77175-45677) |
| 4 | **Raghav Garg** | 2411981445 | Mansa, Punjab (raghav1445.be24@chitkarauniversity.edu.in, +91 92175-51755) |
| 5 | **Dr. Navneet Kaur** | CET1002173 | Chitkara University, Atal Shiksha Kunj, Kalujhanda, Distt. Solan, 174103 Himachal Pradesh, India (navneet.kaur_cse@chitkaruniversity.edu.in, +91-9646800261) |

---

## Detailed Questionnaire

### Q1. What was the problem?

**Answer:**
Conventional emergency vehicle traffic management systems primarily rely on reactive signal preemption, camera-based computer-vision monitoring, GPS-only tracking, or expensive LiDAR-assisted infrastructure. Such systems suffer from severe technical and operational limitations:

1. **Reactive Corridor Delays & Heavy Braking:** Systems relying on local proximity triggers (like infrared, short-range RFID, or local sound-pressure sensors) actuate traffic signals only when the emergency vehicle is immediately adjacent to the intersection. This forces the emergency vehicle to brake heavily while the intersection box is cleared, resulting in delayed corridor activation and emergency transit times.
2. **High Infrastructure Deployment and Maintenance Costs:** Advanced computer-vision (camera) or LiDAR monitoring frameworks require expensive and extensive municipal infrastructure. Furthermore, they suffer from environmental dependencies, exhibiting severe performance degradation in poor lighting, dark environments, and adverse weather (heavy rain, fog, dust storms).
3. **False-Positive Siren Triggers:** Decibel-based acoustic preemption systems cannot distinguish emergency sirens from ambient urban noise (horns, loud engine rumbles, construction), resulting in false-positive triggering and unnecessary civilian traffic gridlock.
4. **Network Vulnerability (Single Point of Failure):** Centralized GPS-only systems rely entirely on constant server connection and high-bandwidth telemetry channels. Network drops or server failures crash the preemption logic. Additionally, GPS-only systems lack localized verification, causing false corridor holds if an ambulance is merely traveling on an adjacent road, parallel alleyway, or elevated overpass near an intersection.
5. **Inefficient Conflict Resolution and Multi-Vehicle Deadlocks:** Prior systems are incapable of arbitrating overlapping or conflicting trajectories when multiple emergency vehicles (e.g., perpendicular emergency routes) approach the same intersection simultaneously.
6. **Oscillatory Traffic Phase Switching:** Fluctuating GPS signals or telemetry drops cause conventional systems to trigger rapid, unstable traffic light phase switching, trapping civilian queues and increasing collision risk.

Therefore, there existed a critical technical need for a low-cost, decentralized, predictive emergency traffic orchestration framework capable of localized edge-based validation and progressive, confidence-scaled signal preemption without relying on expensive vision-based or GPS-only centralized infrastructure.

---

### Q2. How did you solve it (Inventive Step)?

**Answer:**
The proposed invention provides a decentralized predictive emergency vehicle traffic orchestration framework utilizing edge-based spectral siren validation and trajectory-confidence-scaled signal preemption. The core inventive steps include:

1. **Edge-Based Spectral Siren Validation:** Utilizing localized ESP32 edge microcontrollers and microphone sensors to perform real-time Fast Fourier Transform (FFT) spectral siren validation. This mathematically subtracts DC offset electrical bias, applies a Hamming window, filters out low-frequency urban noise below $351$ Hz, and cross-checks peak frequencies ($600$-$2100$ Hz) and amplitudes ($>90$) against a 4-frame rolling temporal persistence buffer.
2. **Predictive ETA-Based Signal Staging:** Implementing a three-phase signal staging workflow (**READY**, **PREPARE**, and **GREEN** phases) dynamically scaled according to estimated arrival times and a calculated Trajectory Confidence Score ($CS_{\text{trajectory}}$).
3. **Hierarchical Priority Index (PI)-Based Arbitration:** Dynamically resolving overlapping multi-vehicle emergency conflicts at an intersection using a multi-weight competitive Priority Index formula:
   $$PI_v = \left( W_1 \cdot \text{SeverityLevel}_v \right) - \left( W_2 \cdot ETA_{v, i} \right) + \left( W_3 \cdot C_{\text{convoy}} \right)$$
   where preemption is granted strictly to the vehicle generating the absolute mathematical apex value for $PI_v$ while subordinate vehicles are subjected to boundary suppression.
4. **Convoy-Aware Emergency Corridor Management:** Automatically grouping sequential or closely spaced emergency vehicles (spatial gap $<150$ meters, $ETA$ delta $<10$ seconds) into a unified convoy entity ($C_{\text{convoy}} = 1$) to maintain uninterrupted green wave corridor continuity.
5. **Conflict-Induced All-Red Lockout:** Actuating an immediate solid RED phase across all intersection approaches during safety-critical deadlocks when competing Priority Index scores are mathematically equal.
6. **Hysteresis-Stabilized Signal Transitions:** Implementing a temporal hysteresis buffer ($3000$ ms) that locks active preemption phases to prevent oscillatory switching caused by noisy GPS signals or packet drops.
7. **Asynchronous Dynamic Corridor Release:** Progressively and asynchronously de-allocating green preemption locks in under $1000$ milliseconds the instant the emergency vehicle clears the center point of an intersection, changed its route, or abandoned the trajectory (reverse-vector deviation $>90^{\circ}$).
8. **Autonomous Localized Fallback State:** Utilizing a local 10-second connection countdown timer on physical edge-controllers to autonomously strip logical server authority and fallback to a localized flashing-yellow warning state if communication is severed.
9. **Asynchronous Cloud Persistence Registry:** Implementing a Redis-queue-based persistent logging engine for non-blocking forensic auditing, diagnostics, and municipal traffic optimization.

---

### Q3. What were the other possible solutions and why they could not be done?

**Answer:**
Alternative solutions included camera-based computer-vision monitoring, LiDAR-assisted detection frameworks, RFID-based preemption, and GPS-only centralized routing. 

However, these solutions were not preferred due to structural, technical, and operational limitations:
* **Camera-Based Computer Vision:** Prohibitively high infrastructure deployment costs, massive computational processing overhead, and vulnerable to poor weather (fog, heavy rain, dust), lens obstruction, and night-time low-light conditions.
* **LiDAR-Assisted Detection:** Extremely expensive hardware, high maintenance overhead, and range limitations.
* **RFID-Based Preemption:** Reactive, proximity-only detection that lacks predictive routing. Because preemption is activated too late, civilian cars remain trapped in the intersection box, blocking the ambulance and causing emergency vehicle braking.
* **GPS-Only Centralized Preemption:** Single point of failure under network dropouts. It lacks localized edge verification, causing high false-positive triggers when an ambulance is near an intersection but traveling on parallel streets, adjacent alleys, or high-level overpasses.

The proposed invention overcomes these limitations through low-cost localized edge processing, predictive angular heading filters, hierarchical priority arbitration, and progressive, confidence-scaled corridor release.

---

### Q4. What are the advantages of the solution proposed by you?

**Answer:**
Advantages of the proposed invention include:
* **Ultra-Low-Cost Deployment:** Eliminates the need for expensive cameras, LiDAR, radar, or RFID municipal infrastructure by utilizing low-cost microcontrollers (ESP32) and microphone modules.
* **Decentralized Edge-Node Processing:** Offloads heavy acoustic processing to localized edge-sensing nodes, reducing centralized computational dependency and ensuring zero-latency signature validation.
* **Reduced Emergency Response Latency:** Activates the green waves predictive corridors in advance, boosting average emergency transit speed.
* **Confidence-Scaled Adaptive Signal Staging:** Progressively clears intersections across READY, PREPARE, and GREEN phases, reducing civilian traffic disruption.
* **Robust Multi-Vehicle Conflict Resolution:** Mathematically arbitrates concurrent overlapping trajectories using a competitive Priority Index (PI) calculation.
* **Convoy-Aware Corridor Continuity:** Grouping sequential emergency vehicles to avoid rapid signal phase flickers.
* **Hysteresis-Stabilized Transitions:** Dampens GPS signal noise and telemetry drops through temporal lock windows.
* **Dynamic Progressive Corridor Release:** Restores downstream and upstream intersections immediately and asynchronously after emergency vehicle clearance, preventing urban gridlock.
* **Fail-Safe Operational Behavior:** Autonomously transitions physical nodes to local flashing-yellow safety modes if communication to the server is lost.
* **Forensic Analytics and Auditing:** Incorporates an asynchronous, non-blocking cloud persistence registry for post-incident audits and municipal routing reviews.

---

### Q5. Explain the stepwise working of the innovation explaining all the components used in the invention and the specific function they are performing.

**Answer:**

1. **Localized Acoustic Sampling & DC Centering:** The **Decentralized Acoustic Sensing Node (ESP32 microcontroller paired with a KY-037 sound module)** continuously monitors surrounding sound waves at traffic intersections, sampling an analog input pin at a frequency of $F_s = 6000$ Hz to populate a buffer of $256$ samples. It subtracts the arithmetic mean of the buffer from each sample to center the soundwave and remove DC electrical offset bias.
2. **Edge-Based FFT & Spectral Validation:** The sensing node applies a Hamming window to the centered samples, computes a forward Fast Fourier Transform (FFT) to convert signals to frequency magnitudes, and ignores low-frequency noise bins below $351$ Hz. It isolates the major peak frequency ($F_{\text{peak}}$) and checks if it falls within the emergency siren fundamental band of $600$ Hz to $2100$ Hz with an amplitude above $90$.
3. **Temporal Persistence Gating:** To filter out brief transient horn blares or construction noise, a localized persistence counter increments on spectral matches and decrements on non-matches. An authorized **Siren Validation Event** is triggered strictly upon logging 4 consecutive positive matching spectral frames, which initiates a 10,000ms cooldown lock.
4. **WebSocket Ingestion Pipeline:** Validated siren detections are immediately transmitted via an open, bi-directional persistent WebSocket pipeline (Engine.io v4) to the **Centralized Coordination Engine (Node.js Server)**, maintaining transmission latencies under $25$ milliseconds.
5. **Predictive Trajectory Filtering:** The coordination engine runs an assessment cycle at a repeating Recomputation Interval ($I_{\text{rec}} = 1000$ ms) where it ingests vehicle telemetry, calculates velocity ($V_t$) through coordinate deltas using a Haversine formula, and filters out irrelevant intersections using an angular heading filter. If the angular deviation ($\theta$) between the vehicle's heading vector and the vector to the intersection exceeds a forward rejection boundary of $90$ degrees ($\theta = \arccos\left(\frac{\vec{V}_{\text{veh}} \cdot \vec{V}_{\text{node}}}{\|\vec{V}_{\text{veh}}\| \|\vec{V}_{\text{node}}\|}\right) > 90^\circ$), the intersection is systematically dropped from the active queue.
6. **Zero-Velocity Override:** If velocity drops below a trapped-vehicle threshold ($V_{\text{min}} \le 0.5$ m/s), the coordination engine suspends normal ETA calculations and freezes queue states constant, avoiding division-by-zero or infinite freeze-states.
7. **Sorted Priority Queue Truncation:** Validated forward-trajectory intersections are appended with their computed ETA ($D_i / V_t$) into a prioritized execution heap sorted in ascending order of arrival time. The heap is truncated at $K_{\text{max}} = 3$ nodes to control network overhead.
8. **Confidence-Scaled Signal Staging:** The target **Signal Controllers** actuate staged phase transitions scaled by a Trajectory Confidence Score ($CS_{\text{trajectory}}$):
   * **READY Phase ($ETA < 30$s, $CS \ge 40\%$):** Actuates omnidirectional flashing yellow lights to caution drivers.
   * **PREPARE Phase ($ETA < 15$s, $CS \ge 70\%$):** Stops perpendicular traffic phases to clear the intersection.
   * **GREEN Phase ($ETA < 5$s, $CS \ge 90\%$):** Locks a solid green corridor along the primary emergency vehicle axis.
9. **Hierarchical Priority Index (PI) Arbitration:** When perpendicular emergency trajectories overlap, a centralized arbitrator evaluates the Priority Index ($PI_v = \left( W_1 \cdot \text{SeverityLevel}_v \right) - \left( W_2 \cdot ETA_{v, i} \right) + \left( W_3 \cdot C_{\text{convoy}} \right)$) for each competing vehicle. Preemption is granted strictly to the vehicle with the apex index, while subordinate vehicles are subjected to boundary suppression and instructed to yield.
10. **Convoy Grouping Integration:** Trailing emergency vehicles detected behind a leading emergency vehicle with an identical heading, a spatial separation under $150$ meters, and an arrival delta under $10$ seconds are grouped as a single convoy ($C_{\text{convoy}} = 1$). The green preemption lock is held continuously green, suppressing standard phase switches, until the last convoy vehicle clears the junction.
11. **Hysteresis Buffering & Conflict All-Red Lockout:** Active preemption phases are locked into a minimum temporal hysteresis window of $3000$ ms to prevent rapid switching from telemetry drops. If competing Priority Index scores are equal and spacing is safety-critical, the arbitrator overrides normal routines and initiates a **Conflict-Induced All-Red Lockout**, forcing all intersection approaches to a solid RED phase until deadlocks are cleared.
12. **Asynchronous Corridor Release & Fallbacks:** Intersections are progressively and asynchronously de-allocated and returned to standard municipal cycles in under $1000$ milliseconds the instant a vehicle passes the intersection center point, makes a U-turn, or exhibits route abandonment (vector deviation $>90^{\circ}$).
13. **Local Hardware Fail-Safe:** If WebSocket connection is severed for $>10$ seconds, the localized intersection controller autonomously strips server authority and triggers a flashing-yellow warning fallback state.
14. **Cloud Persistent Auditing:** All telemetry streams, FFT events, and transition latencies are asynchronously queued (Redis/BullMQ) and pushed to a **Cloud Persistence Registry** for non-blocking forensics and municipal analytics.

---

### Q6. Attach drawing hand-made/computer-made showing all the components of the invention.

**Answer:**
Computer-generated architectural and functional diagrams illustrating the system workflow, edge-based spectral validation framework, predictive orchestration engine, hierarchical arbitration logic, communication framework, signal staging mechanisms, conflict management framework, and asynchronous corridor release architecture are attached separately in the patent specification as:

* **FIG. 1:** Schematic Block Diagram of the High-Level Decoupled Hardware-Software System Architecture (including decentralized sensing nodes, coordination engine, and physical/virtual intersection controller layout).
* **FIG. 2:** Detailed Flowchart of the Edge-Based Spectral FFT Siren Validation Algorithm (Hamming windowing, noise bin isolation, and rolling persistence validation).
* **FIG. 3:** Sequence Diagram of the Real-Time WebSocket Communication Pipeline and Ping-Pong Heartbeat Protocol.
* **FIG. 4:** Schematic of the Confidence-Scaled Predictive ETA Mapping Model (Haversine calculations and $90^\circ$ angular heading filter).
* **FIG. 5:** State-Transition Diagram of the Hysteresis-Stabilized Signal Phase Machine (READY, PREPARE, and GREEN states).
* **FIG. 6:** Structural Flow Diagram of the Hierarchical Priority Index (PI) Arbitration and Convoy Grouping resolver.
* **FIG. 7:** Flowchart of the Conflict-Induced All-Red Lockout Deadlock Override workflow.
* **FIG. 8:** Process Flow of the Asynchronous Dynamic Corridor Release and Route Abandonment Tracking.
* **FIG. 9:** Block Diagram of the Asynchronous Cloud Persistence Registry and Forensic Audit Pipeline.

---

## Relevant Key Phrases

| S. NO. | Key phrases |
|---|---|
| 1 | Decentralized predictive traffic orchestration |
| 2 | Edge-based spectral siren validation |
| 3 | Trajectory-confidence-scaled signal preemption |
| 4 | Hierarchical Priority Index (PI) arbitration |
| 5 | Convoy-aware emergency corridor continuity |
| 6 | Dynamic conflict-aware corridor orchestration |
| 7 | Hysteresis-stabilized signal phase transitions |
| 8 | Asynchronous dynamic corridor release |
| 9 | FFT-based acoustic siren validation |
| 10 | Intelligent Transportation Systems (ITS) |
