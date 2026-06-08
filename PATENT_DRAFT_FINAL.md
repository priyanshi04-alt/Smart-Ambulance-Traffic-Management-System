FORM 2
THE PATENTS ACT, 1970
(39 of 1970)
&
THE PATENTS RULES, 2003

COMPLETE SPECIFICATION
(See section 10 and rule 13)

1. TITLE OF THE INVENTION
"A DECENTRALIZED PREDICTIVE EMERGENCY VEHICLE TRAFFIC ORCHESTRATION FRAMEWORK UTILIZING EDGE-BASED SPECTRAL SIREN VALIDATION AND TRAJECTORY-CONFIDENCE-SCALED SIGNAL PREEMPTION"

2. APPLICANT(S)
(a) Name: Dr. Navneet Kaur
(b) Nationality: Indian
(c) Address: Chitkara University, Atal Shiksha Kunj, Kalujhanda, Distt. Solan, 174103 Himachal Pradesh, India

(a) Name: Priyanshi
(b) Nationality: Indian
(c) Address: Sirmaur, Himachal Pradesh, India

(a) Name: Priya
(b) Nationality: Indian
(c) Address: Abohar, Punjab, India

(a) Name: Pratham Chadda
(b) Nationality: Indian
(c) Address: Sri Muktsar Sahib, Punjab, India

(a) Name: Raghav Garg
(b) Nationality: Indian
(c) Address: Mansa, Punjab, India

3. PREAMBLE TO THE DESCRIPTION
The following specification particularly describes the invention and the manner in which it is to be performed.

---

4. FIELD OF THE INVENTION
The present invention relates to Intelligent Transportation Systems (ITS) and real-time edge processing. More specifically, the present invention relates to a decentralized, low-latency, predictive emergency vehicle traffic orchestration framework that dynamically synchronizes and preempts traffic signals along predictive emergency corridors. The framework utilizes localized edge-based spectral and temporal validation of acoustic siren signatures, coupled with central real-time trajectory-confidence evaluation and estimated time of arrival (ETA) predictions, to optimize emergency vehicle transit while minimizing civilian traffic disruptions and preventing oscillatory phase transitions.

---

5. BACKGROUND OF THE INVENTION
As urban centers grow, traffic congestion increasingly delays emergency response vehicles, such as ambulances, fire trucks, and police cruisers. Even minor delays in emergency vehicle transit can lead to loss of life or severe property damage. Conventional solutions for emergency traffic preemption generally suffer from significant operational limitations:

1. **Reactive Traffic Control:** Classical systems are reactive. They rely on local decibel-based acoustic sensors, short-range RFID transponders, or line-of-sight infrared transceivers mounted directly at the intersection. Consequently, the signal preemption is only triggered when the emergency vehicle is physically proximate to the intersection. This forces the emergency vehicle to brake heavily while the intersection-box is cleared of civilian vehicles, creating hazardous traffic bottlenecks and reducing average transit velocity.

2. **High Infrastructure and Maintenance Costs:** Advanced systems rely on heavy infrastructure, such as camera-based computer vision monitoring or expensive LiDAR-assisted arrays deployed at every intersection. These systems are prohibitively expensive to install and maintain across extensive municipal grids. Furthermore, computer-vision models are environmentally dependent, suffering from severe performance degradation during adverse weather (e.g., fog, heavy rain, dust storms), poor ambient lighting conditions (e.g., night-time), or direct physical lens obstruction.

3. **False-Positive Siren Triggers:** Low-cost acoustic preemption attempts typically rely on decibel-based sound pressure level thresholding. However, such systems suffer from high rates of false-positive triggers. Standard urban noise, such as commercial truck horns, loud exhaust systems, pneumatic drills, and construction noise, frequently tricks decibel-based sensors into triggering preemption, severely disrupting regular civilian traffic flow.

4. **Network Vulnerability and Single Points of Failure:** Centralized GPS-only emergency routing frameworks depend entirely on uninterrupted, high-bandwidth connection to a centralized server. Under severe network drops, latency spikes, or server failures, these systems fail catastrophically, lock physical signal controllers, or drop active green corridors. Furthermore, GPS-only systems lack localized edge-validation, leading to false preemption triggers if an emergency vehicle is driving on an adjacent road, parallel alley, or overpass near an intersection but does not actually intend to pass through it.

5. **Inability to Arbitrate Multi-Vehicle Conflicts:** High-density smart cities frequently encounter scenarios where multiple emergency vehicles with conflicting trajectories (e.g., perpendicular routes) approach the same intersection. Conventional systems lack the decentralized arbitration logic necessary to dynamically rank, sequence, and clear these conflicting emergency corridors safely, leading to lockouts or dangerous gridlock.

6. **Oscillatory Traffic Phase Switching and Trapped Civilian Queues:** When an emergency vehicle's GPS signals fluctuate or experience temporary multi-path errors, conventional predictive systems execute rapid, unstable signal phase switching. This causes extreme driver confusion, increases rear-end collision probability, and traps civilian cars inside the intersection box due to a lack of staging intervals and dynamic, progressive corridor release.

Therefore, there exists a critical, unaddressed technical need for a low-cost, highly scalable, decentralized predictive emergency traffic orchestration framework. Such a framework must execute real-time edge-based acoustic signature validation to eliminate false positives, calculate confidence-scaled multi-intersection signal staging in advance, objectively arbitrate multi-vehicle conflicts, and progressively release corridors to minimize civilian traffic disruption without relying on expensive vision-based or centralized-only infrastructure.

---

6. OBJECTIVES OF THE INVENTION
The primary objective of the present invention is to provide a decentralized, predictive emergency vehicle traffic orchestration framework that overcomes the structural and operational drawbacks of the prior art.

Another objective of the present invention is to provide an ultra-low-cost edge-sensing node utilizing an ESP32 microcontroller and a specialized microphone module to perform real-time, localized Fast Fourier Transform (FFT) spectral siren validation, completely filtering out ambient urban noise and preventing false-positive preemption triggers.

Yet another objective of the present invention is to implement an anti-spoofing telemetry validation engine that cross-validates localized spectral siren signatures with authorized satellite-based GPS telemetry.

Still another objective of the present invention is to establish a bi-directional WebSocket-based real-time communication framework utilizing persistent Engine.io v4 pipelines between physical edge nodes and a centralized coordination engine, maintaining actuator response latency under 25 milliseconds.

A further objective of the present invention is to implement a confidence-scaled predictive signal staging algorithm that stages traffic light phases (READY, PREPARE, GREEN) dynamically based on predictive trajectory confidence, ensuring civilian vehicles are progressively cleared out of the intersection box before the emergency vehicle arrives.

Another objective of the present invention is to provide a hierarchical Priority Index (PI)-based arbitration mechanism to deterministically resolve overlapping or conflicting routes between multiple emergency vehicles.

Yet another objective of the present invention is to provide a convoy-aware emergency corridor management system that dynamically groups sequential or closely spaced emergency vehicles into a single convoy, preventing oscillatory signal switching.

Still another objective of the present invention is to implement a Conflict-Induced All-Red Lockout fail-safe mechanism that halts all conflicting traffic movements at an intersection during unresolved safety-critical disputes.

A further objective of the present invention is to incorporate temporal hysteresis buffers to prevent rapid, unstable phase changes caused by noisy GPS signals or temporary connection dropouts.

Another objective of the present invention is to provide an asynchronous dynamic corridor release algorithm that progressively de-allocates green corridor reservations the instant the emergency vehicle clears an intersection, changes direction, or abandons the trajectory (e.g., U-turns), thereby restoring standard municipal traffic flow and minimizing urban gridlock.

Finally, an objective of the present invention is to build a localized, autonomous hardware fail-safe disconnect fallback mode that forces physical edge-controllers into a localized flashing-yellow warning state if connection to the orchestration server is severed, maintaining safety under systemic communication failures.

---

7. BRIEF DESCRIPTION OF THE DRAWINGS
To understand the technical features, algorithmic workflows, and hardware layouts of the present invention in detail, reference is made to the accompanying drawings illustrating preferred embodiments:

FIG. 1 shows a schematic block diagram representing the high-level system architecture of the decentralized predictive emergency traffic orchestration framework, including the hardware sensing nodes, coordination engine, and physical/virtual intersection controllers.

FIG. 2 shows a detailed flowchart illustrating the edge-based spectral FFT siren validation algorithm executed by the decentralized sensing nodes, highlighting the Hamming windowing, noise bin isolation, and temporal persistence checks.

FIG. 3 shows a sequence diagram illustrating the real-time communication framework, persistent WebSocket connection, and hardware-server handshake protocol.

FIG. 4 shows a schematic representation of the confidence-scaled predictive ETA mapping model, demonstrating the application of the Haversine formula and angular vector filtering to isolate forward-trajectory intersections.

FIG. 5 shows a state-transition diagram of the hysteresis-stabilized signal phase machine, illustrating the transitions between the NORMAL, READY, PREPARE, and GREEN states.

FIG. 6 shows a structural flow diagram of the hierarchical Priority Arbitration Logic and Convoy-Aware Grouping system for resolving overlapping multi-vehicle emergency conflicts.

FIG. 7 shows a flow diagram of the Conflict-Induced All-Red Lockout fail-safe workflow triggered during unresolved safety-critical conflicts.

FIG. 8 shows a process flow illustrating the Asynchronous Dynamic Corridor Release and Route Abandonment tracking logic.

FIG. 9 shows a block diagram of the Asynchronous Cloud Persistence Registry, illustrating the forensic auditing, analytics, and diagnostic event persistence pipeline.

---

8. DETAILED DESCRIPTION OF THE INVENTION
The present invention provides a highly secure, low-latency, decentralized predictive emergency traffic orchestration framework designed to dynamically clear green corridors for emergency vehicles while minimizing civilian traffic disruption. The framework strictly decouples logical prediction from physical hardware actuation, enabling scaling across massive metropolitan grids containing both physical IoT intersections and simulated software nodes.

Referring to FIG. 1, the overall system architecture (100) comprises one or more emergency vehicles (102) equipped with onboard mobile telemetry transceivers, a plurality of decentralized acoustic edge-sensing nodes (104) deployed near physical intersections, a centralized coordination engine (106) executing on a secure processing core, and a plurality of traffic signal controllers (108) managing physical intersections (110) or simulated software intersections (112). 

### 1. Edge-Based Spectral Siren Validation (FIG. 2)
To eliminate the high cost of cameras and LiDAR while preventing false-positive triggers from urban noise, each edge-sensing node (104) comprises a low-cost microcontroller (such as an ESP32) paired with an analog microphone sensor module (such as a KY-037). Rather than performing raw decibel thresholding, the localized microcontroller executes an edge-based Fast Fourier Transform (FFT) spectral siren validation algorithm.

As shown in the flowchart of FIG. 2, the edge microcontroller continuously samples the surrounding acoustic environment through a dedicated microphone input pin (e.g., GPIO Pin 32). The validation process operates according to the following mathematical and algorithmic steps:

1. **Acoustic Signal Sampling:** The microcontroller samples the microphone input pin at a carefully defined sampling frequency ($F_s = 6000$ Hz) to construct a buffer of size $N = 256$ samples. This provides a sampling window of approximately $42.67$ milliseconds, with a sampling period ($T_s$) computed as:
   $$T_s = \frac{10^6}{F_s} \approx 166.67 \text{ microseconds}$$
   A localized hardware timer ensures highly precise sample intervals matching $T_s$.

2. **DC Offset Subtraction (Centering):** Before spectral conversion, the microcontroller computes the arithmetic mean of the sampled buffer values to determine the DC offset:
   $$\text{Mean} = \frac{1}{N} \sum_{i=0}^{N-1} v_{\text{Real}}[i]$$
   The mean is subtracted from each raw sample to center the sound wave around zero, eliminating low-frequency electrical bias:
   $$v_{\text{Real}}[i] \leftarrow v_{\text{Real}}[i] - \text{Mean}, \quad \forall i \in [0, N-1]$$
   The imaginary buffer components are initialized to zero ($v_{\text{Imag}}[i] \leftarrow 0$).

3. **Hamming Windowing:** To minimize spectral leakage and side-lobe interference, the microcontroller applies a Hamming windowing function to the centered buffer:
   $$v_{\text{Real}}[i] \leftarrow v_{\text{Real}}[i] \cdot \left( 0.54 - 0.46 \cos\left(\frac{2\pi i}{N-1}\right)\right)$$

4. **FFT Computation:** The microcontroller executes a forward FFT algorithm using a native double-precision floating-point library:
   $$\mathcal{F}(v_{\text{Real}}, v_{\text{Imag}}) \rightarrow \text{Forward FFT}$$
   The resulting complex values are converted to absolute magnitudes:
   $$\text{Magnitude}[i] = \sqrt{v_{\text{Real}}[i]^2 + v_{\text{Imag}}[i]^2}$$

5. **High-Pass Noise Bin Filtering:** To eliminate low-frequency urban rumbles, vehicle engine vibrations, and structural hums, the system ignores the first 15 frequency bins. Bins 0 through 14 represent frequencies below:
   $$F_{\text{cutoff}} = \frac{15 \times F_s}{N} = \frac{15 \times 6000}{256} \approx 351.56 \text{ Hz}$$
   The maximum amplitude ($A_{\text{max}}$) is evaluated exclusively across the upper spectral bins ($i \ge 15$ to $N/2$):
   $$A_{\text{max}} = \max\left(\text{Magnitude}[i]\right), \quad \forall i \in [15, 127]$$

6. **Amplitude Gating and Peak Frequency Extraction:** If $A_{\text{max}}$ falls below a noise gate threshold (e.g., $35$ units), the major peak frequency ($F_{\text{peak}}$) is automatically forced to $0$ Hz to suppress quiet ambient signals. Otherwise, $F_{\text{peak}}$ is extracted using barycentric or major peak identification.

7. **Spectral-Temporal Siren Match:** Traditional wail and yelp emergency sirens possess fundamental frequencies bounding between $600$ Hz and $2100$ Hz. The microcontroller checks if the detected peak satisfies:
   $$(F_{\text{peak}} \ge 600 \text{ Hz}) \land (F_{\text{peak}} \le 2100 \text{ Hz}) \land (A_{\text{max}} > 90)$$

8. **Rolling Temporal Persistence Buffer:** To prevent false positives from brief transient sounds (like a sharp car horn or a whistle), the microcontroller implements a temporal rolling validation buffer. A persistence counter ($C_{\text{persist}}$) tracks consecutive positive matches:
   * If a spectral-temporal siren match is true, the counter increments: $C_{\text{persist}} \leftarrow \min(C_{\text{persist}} + 1, 4)$.
   * If the match is false, the counter decrements: $C_{\text{persist}} \leftarrow \max(C_{\text{persist}} - 1, 0)$.
   * A **Validation Event** is triggered *exclusively* when $C_{\text{persist}}$ reaches the apex value of $4$ consecutive matching frames. Once triggered, the node enters a lock-out state for a cooling-down interval ($T_{\text{cooldown}} = 10,000$ ms) to prevent redundant reports.

Once validated, the edge node (104) immediately transmits an authenticated acoustic detection payload (e.g., `{"direction": "north", "active": true}`) to the centralized coordination engine (106) using a lightweight REST POST or WebSocket packet.

### 2. Real-Time Communication & Persistent WebSockets (FIG. 3)
To ensure the transition commands are executed at the physical intersections (110) in under 25 milliseconds, the system avoids standard high-latency HTTP polling. As illustrated in the sequence diagram of FIG. 3, physical traffic signal controllers (108) maintain a permanent, bi-directional WebSocket connection based on the Engine.io v4 protocol to a dedicated gateway of the coordination engine (106). 

The connection executes a continuous heartbeat ping-pong sequence (e.g., every $5000$ ms) to monitor connection health. By maintaining an open TCP socket, the coordination engine (106) can push preemption instructions as raw, minified JSON payloads (e.g., `{"event":"traffic-state","data":{"signals":{"north":"green","south":"red"...}}}`) that are immediately deserialized by the local controller using rapid JSON parsers (e.g., ArduinoJson). This yields a real-world physical actuation latency of less than 25 milliseconds from the instant the server computes a state transition.

### 3. Centralized Predictive Trajectory Mapping & ETA Staging (FIG. 4)
The centralized coordination engine (106) executes on an asynchronous processing core, continuously executing a trajectory assessment cycle at a repeating Recomputation Interval ($I_{\text{rec}} = 1000$ ms). At each interval, the coordination engine ingests real-time telemetry from active emergency vehicles (102), which includes GPS coordinates (Latitude $\phi_t$, Longitude $\lambda_t$), heading vectors, and emergency classification details.

To minimize computational overhead and avoid unnecessary phase holds at unrelated intersections, the coordination engine applies a multi-step predictive trajectory mapping algorithm as shown in FIG. 4:

1. **Velocity Computation ($V_t$):** To avoid relying on vehicle-side speedometers, the server computes the vehicle's true velocity through positional deltas over time using the Haversine formula:
   $$V_t = \frac{\text{Haversine}(\phi_t, \lambda_t, \phi_{t-1}, \lambda_{t-1})}{t - t_{t-1}}$$
   Where the Haversine function calculates the precise spherical surface distance between sequential coordinates.

2. **Directional Vector Filtering (Angular Heading Boundary):** The coordination engine checks the vehicle's current bearing angle $B_{\text{veh}}$ against the geographical bearing vector $B_{\text{node}, i}$ from the vehicle to each intersection node $N_i$ in the database. The angular difference ($\theta$) is evaluated:
   $$\theta = \arccos\left(\frac{\vec{V}_{\text{veh}} \cdot \vec{V}_{\text{node}, i}}{\|\vec{V}_{\text{veh}}\| \|\vec{V}_{\text{node}, i}\|}\right)$$
   If the angular deviation exceeds a configurable forward-trajectory rejection boundary (e.g., $|\theta| > 90^{\circ}$), the intersection node $N_i$ is classified as non-forward and is immediately discarded from the active tracking matrix. This prevents activating signals on parallel roads or behind the vehicle.

3. **Geospatial Distance Mapping ($D_i$):** For all validated forward-trajectory intersections, the spherical distance $D_i$ is calculated using the Haversine formula:
   $$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_t) \cdot \cos(\phi_{\text{node}, i}) \cdot \sin^2\left(\frac{\Delta\lambda}{2}\right)$$
   $$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$
   $$D_i = R \cdot c$$
   Where $R = 6,371,000$ meters represents the volumetric mean radius of the Earth, $\Delta\phi = \phi_{\text{node}, i} - \phi_t$, and $\Delta\lambda = \lambda_{\text{node}, i} - \lambda_t$.

4. **Estimated Time of Arrival (ETA) Calculation:** The estimated time of arrival ($ETA_i$) for each forward node is computed:
   $$ETA_i = \frac{D_i}{V_t}$$
   
5. **Zero-Velocity Overrides:** If the computed velocity $V_t$ drops below a predefined minimum threshold (e.g., $V_{\text{min}} \le 0.5$ m/s), indicating that the emergency vehicle is trapped in gridlock, standard division operations are suspended. The coordination engine holds the current queue states constant instead of transmuting them to infinity, maintaining system stability.

6. **Deterministic Priority Queue Sorting:** All validated forward nodes are inserted into a structured priority queue sorted in ascending order of $ETA_i$. The queue is programmatically truncated at a max boundary $K_{\text{max}} = 3$ nodes to prevent cascading preemption overhead across the municipal grid.

### 4. Confidence-Scaled Signal Staging (FIG. 5)
Rather than executing abrupt, binary red-to-green transitions that startle drivers and cause accidents, the coordination engine utilizes a three-phase signal staging algorithm. The aggressiveness of the staging is scaled dynamically based on a Trajectory Confidence Score ($CS_{\text{trajectory}}$), which is evaluated from GPS telemetry stability, multi-node directional consistency, and local spectral validation hits from the edge nodes.

Referring to the state machine of FIG. 5, the signal staging workflow operates as follows:

* **NORMAL State (Baseline):** Regular pre-programmed local traffic light cycles are maintained.
* **READY Phase ($ETA_i < 30$ seconds):** Triggered when $ETA_i$ falls below 30 seconds. The signal controller initiates omnidirectional yellow flashing lights or digital warning signs to alert civilian drivers of an approaching emergency vehicle. This phase is triggered even with low confidence ($CS_{\text{trajectory}} \ge 40\%$).
* **PREPARE Phase ($ETA_i < 15$ seconds):** Requires higher trajectory confidence ($CS_{\text{trajectory}} \ge 70\%$). Perpendicular traffic phases are brought to an immediate, structured stop (transitioning through yellow to red), and the primary emergency axis is prepared. This clears trapped civilian cars out of the intersection box.
* **GREEN Phase ($ETA_i < 5$ seconds):** Requires absolute trajectory confidence ($CS_{\text{trajectory}} \ge 90\%$). The primary emergency axis is granted a definitive green preemption lock, ensuring uninterrupted right-of-way.

### 5. Hierarchical Priority Arbitration (FIG. 6)
In dense metropolitan areas, multiple emergency vehicles with overlapping or conflicting routes may approach the same intersection. To resolve these conflicts without manual intervention, the centralized coordination engine (106) implements a Hierarchical Priority Index (PI)-based arbitration mechanism.

As shown in FIG. 6, when two or more emergency vehicles ($V_1, V_2, \dots$) compete for dominance at node $N_i$, the coordination engine calculates a competitive priority index ($PI_v$) for each vehicle:
$$PI_v = \left( W_1 \cdot \text{SeverityLevel}_v \right) - \left( W_2 \cdot ETA_{v, i} \right) + \left( W_3 \cdot C_{\text{convoy}} \right)$$

Where:
* $\text{SeverityLevel}_v$: A numerical rank assigned to the emergency vehicle class (e.g., $10$ for high-urgency cardiac ambulances/disaster response, $8$ for active fire trucks, $6$ for standard police patrols).
* $ETA_{v, i}$: The computed ETA of the vehicle to the intersection.
* $C_{\text{convoy}}$: A binary weight ($0$ or $1$) indicating if the vehicle is part of an active emergency convoy.
* $W_1, W_2, W_3$: Municipal-configured mathematical scaling weights.

**Arbitration Resolution Rules:**
1. The intersection node $N_i$ engages preemption staging exclusively for the vehicle generating the absolute mathematical apex value for $PI_v$.
2. The subordinate vehicles are subjected to **Subordinate Suppression**, meaning their preemption requests are temporarily held. The system alerts the drivers of the subordinate vehicles (via an onboard navigation interface) to yield or halt at the intersection boundary until the dominant vehicle clears the node.

### 6. Convoy-Aware Emergency Corridor Management (FIG. 6)
To maintain corridor continuity during closely grouped mission sequences (e.g., multiple fire engines responding to the same emergency), the coordination engine includes convoy-aware grouping logic.

If a trailing emergency vehicle is detected behind a leading emergency vehicle with an identical heading and a spatial-temporal gap below a predefined threshold (e.g., distance deltas $< 150$ meters, $ETA$ deltas $< 10$ seconds), the vehicles are mathematically grouped as a unified convoy entity ($C_{\text{convoy}} = 1$). The green preemption lock at the forward intersections is held continuously green, suppressing standard clearance cycles, until the final vehicle in the convoy group clears the intersection, preventing hazardous oscillatory green-red-green phase switching.

### 7. Hysteresis-Stabilized Signal Transitions
To prevent rapid, unstable traffic light phase switching caused by noisy GPS telemetry, severe multi-path signal drops, or brief data packet dropouts, the system incorporates temporal hysteresis buffers. Once a signal controller transitions to a higher preemption stage (e.g., from READY to PREPARE, or PREPARE to GREEN), it is locked into that stage for a minimum hysteresis window ($T_{\text{hysteresis}} = 3000$ ms). Even if a subsequent telemetry packet suggests the vehicle's ETA has temporarily fluctuated back above the threshold, the phase transition remains stable, protecting physical drivers from erratic signal changes.

### 8. Conflict-Induced All-Red Lockout (FIG. 7)
In safety-critical scenarios where the Priority Index scores of two conflicting emergency vehicles are mathematically equal ($PI_{V1} = PI_{V2}$) and the spatial separation is too small to clear one before the other, the coordination engine triggers the **Conflict-Induced All-Red Lockout** workflow as detailed in FIG. 7.

The central arbitrator overrides all preemption logic and transmits an immediate lockout command to the target signal controller (108). The controller forces all four approaches of the physical intersection (110) into a steady, solid RED state. Simultaneously, digital audio-visual warning systems are activated, and the onboard navigation systems of both vehicles are immediately alerted of the deadlock. This lockout is held until one vehicle physically clears the intersection (sensed by the edge acoustic node or telemetry) or is manually overridden, completely preventing collisions in the junction.

### 9. Asynchronous Dynamic Corridor Release & Route Abandonment (FIG. 8)
To prevent civilian gridlock, the coordination engine must not hold green corridors open longer than absolutely necessary. As shown in the process workflow of FIG. 8, the coordination engine continuously tracks the spatial relationship of the emergency vehicle relative to the active green corridor nodes. The system executes an **Asynchronous Dynamic Corridor Release** algorithm:

1. **Clearance Detection:** The instant the emergency vehicle's GPS coordinates indicate it has crossed the center point of the intersection $N_i$ (or the local edge acoustic node 104 confirms a frequency drop and directional change), the green preemption lock is immediately revoked. 
2. **Progressive Restoration:** The system does not wait for the vehicle to complete its entire journey. Instead, it asynchronously and progressively de-allocates corridor reservations at each node the instant the vehicle clears them, returning the local signal controller to regular municipal cycles in under 1000 milliseconds.
3. **Route Abandonment & Reverse-Vector Invalidation:** If the emergency vehicle executes an unexpected turn, makes a U-turn, or pulls over (route abandonment), the calculated angular bearing deviation between the vehicle's heading $B_{\text{veh}}$ and the target node vector $B_{\text{node}, i}$ will exceed the $90^{\circ}$ rejection boundary. The coordination engine immediately detects this reverse-vector deviation, invalidates the active reservation, and releases all downstream intersections, preventing empty intersections from blocking civilian traffic.

### 10. Autonomous Hardware Fail-Safe Disconnect Mode
Built directly into the physical traffic signal controllers (108) is an autonomous fail-safe disconnect sequence. In the event of a total network dropout or server crash, the physical controller (108) will fail to receive the persistent WebSocket pings from the coordination engine (106). 

If the WebSocket connection is lost, the local controller initiates a $10$-second countdown validation. If the connection is not re-established within this window, the controller autonomously strips away all logical server authority and forces the physical intersection (110) into a localized "Flashing-Yellow Warning State" (flashing yellow lights on the primary axis, flashing red on the minor axis). This ensures that a total communication failure never results in locked red lights or catastrophic municipal accidents, allowing traffic to flow under localized caution rules.

### 11. Asynchronous Cloud Persistence Registry (FIG. 9)
As illustrated in FIG. 9, all system activities, telemetry streams, edge FFT validation events, priority arbitration calculations, signal state transitions, WebSocket latencies, and fail-safe triggers are asynchronously streamed to a Cloud Persistence Registry (900). By utilizing asynchronous queuing models (such as Redis or BullMQ), logging operations do not block the real-time routing logic. The persistent data is securely stored in a cloud database for forensic auditing, legal diagnostics, performance analytics, and city-wide municipal traffic optimization.

---

9. I / WE CLAIM:

1. A decentralized predictive emergency vehicle traffic orchestration framework utilizing edge-based spectral validation and trajectory-confidence-scaled signal preemption, the framework comprising:
   - a plurality of decentralized edge-sensing nodes (104) deployed near physical traffic intersections, each node comprising an acoustic microphone module and an edge microcontroller configured to perform localized spectral siren validation;
   - a centralized coordination engine (106) executing on a processing core, configured to ingest real-time emergency vehicle telemetry and perform predictive trajectory mapping, estimated time of arrival (ETA) calculations, and priority arbitration; and
   - a plurality of traffic signal controllers (108) maintaining a permanent, bi-directional persistent WebSocket connection to said centralized coordination engine (106) for real-time traffic signal actuation at physical intersections (110) or simulated intersections (112).

2. The framework as claimed in claim 1, wherein said edge microcontroller performs localized spectral siren validation by executing a Fast Fourier Transform (FFT) algorithm, comprising:
   - sampling acoustic signals at a sampling frequency of $6000$ Hz to populate a buffer of $256$ samples;
   - subtracting the arithmetic mean of said samples to eliminate low-frequency electrical DC offset bias;
   - applying a Hamming windowing function to said centered samples;
   - computing a forward FFT to obtain frequency magnitudes;
   - ignoring low-frequency noise bins under $351$ Hz representing urban rumbles;
   - isolating a peak frequency and verifying if it lies within a standard emergency siren fundamental band of $600$ Hz to $2100$ Hz with an amplitude exceeding $90$; and
   - integrating a rolling temporal persistence counter that triggers an authenticated validation event only after detecting four consecutive positive matching spectral frames.

3. The framework as claimed in claim 1, wherein said telemetry is cross-validated with validated spectral siren signatures by said centralized coordination engine (106) to prevent unauthorized signal preemption spoofing.

4. The framework as claimed in claim 1, wherein said centralized coordination engine (106) executes a trajectory assessment cycle at a repeating recomputation interval ($I_{\text{rec}}$) of $1000$ milliseconds, wherein the vehicle's velocity ($V_t$) is calculated in real-time through sequential coordinate deltas using a Haversine formula, and wherein division calculations are programmatically suspended if $V_t$ drops below a minimum velocity threshold ($V_{\text{min}} \le 0.5$ m/s) to prevent infinite freeze-states.

5. The framework as claimed in claim 4, wherein said centralized coordination engine (106) executes directional vector filtering to compare the vehicle's angular bearing ($B_{\text{veh}}$) with a geometric bearing vector ($B_{\text{node}, i}$) to each intersection node ($N_i$), and wherein a target intersection is systematically discarded from preemption tracking if the angular deviation ($\theta$) exceeds a forward-trajectory rejection boundary of $90$ degrees.

6. The framework as claimed in claim 1, wherein said traffic signal controllers (108) execute confidence-scaled signal preemption staging, wherein the preemption aggressiveness is scaled across three distinct states based on estimated arrival thresholds and trajectory confidence:
   - a READY state initiated when the vehicle's estimated arrival is under $30$ seconds, triggering omnidirectional yellow warning flashes;
   - a PREPARE state initiated when the estimated arrival is under $15$ seconds, bringing perpendicular traffic phases to a structured stop; and
   - a GREEN state initiated when the estimated arrival is under $5$ seconds, granting a definitive green preemption lock along the primary emergency vehicle axis.

7. The framework as claimed in claim 1, wherein said centralized coordination engine (106) resolves overlapping multi-vehicle emergency conflicts at an intersection node ($N_i$) using a hierarchical Priority Index (PI) arbitration logic, wherein a competitive rank ($PI_v$) is evaluated for each competing vehicle according to:
   $$PI_v = \left( W_1 \cdot \text{SeverityLevel}_v \right) - \left( W_2 \cdot ETA_{v, i} \right) + \left( W_3 \cdot C_{\text{convoy}} \right)$$
   and wherein said intersection node ($N_i$) grants preemption staging exclusively to the vehicle generating the apex value for $PI_v$, while subordinate vehicles are subjected to boundary suppression.

8. The framework as claimed in claim 7, wherein a Conflict-Induced All-Red Lockout is triggered if the Priority Index scores of conflicting emergency vehicles are mathematically equal and the spatial separation is below a safety limit, forcing all approaches of said intersection into a solid RED state to prevent collisions.

9. The framework as claimed in claim 1, wherein said centralized coordination engine (106) incorporates convoy-aware grouping logic, wherein sequential emergency vehicles approaching with a spatial gap under $150$ meters and an arrival delta under $10$ seconds are grouped as a single convoy entity, and wherein the green preemption lock is held continuously green until the final vehicle in said convoy group clears the intersection to prevent oscillatory signal switching.

10. The framework as claimed in claim 1, wherein said traffic signal controllers (108) implement temporal hysteresis buffers, locking a physical signal phase for a minimum duration of $3000$ milliseconds upon transition to prevent erratic phase switching caused by unstable GPS telemetry.

11. The framework as claimed in claim 1, further comprising an Asynchronous Dynamic Corridor Release algorithm, wherein the green preemption lock at a target intersection node is progressively and asynchronously revoked and returned to standard municipal cycles in under $1000$ milliseconds the instant the emergency vehicle clears the center point of said intersection.

12. The framework as claimed in claim 5, wherein said centralized coordination engine (106) automatically detects route abandonment if the vehicle's angular bearing deviation exceeds $90$ degrees, and asynchronously releases all downstream intersection reservations.

13. The framework as claimed in claim 1, wherein said traffic signal controllers (108) comprise an autonomous hardware fail-safe disconnect mode, wherein the local controller monitors connection health via WebSocket pings, and autonomously forces the physical intersection into a localized flashing-yellow warning state if connection to the centralized coordination engine (106) is lost for more than $10$ seconds.

14. The framework as claimed in claim 1, wherein said centralized coordination engine (106) explicitly separates prediction logic from hardware execution, wherein virtual nodes designated as simulated maintain state updates purely in computational memory, while real preemption packets are routed exclusively to identifiers designated as physical hardware controllers.

15. The framework as claimed in claim 1, further comprising a Cloud Persistence Registry, wherein all telemetry logs, spectral validation events, arbitration decisions, and transition latencies are streamed asynchronously to a cloud database for diagnostics, forensics, and performance analytics.

16. A computer-implemented method for coordinated predictive emergency vehicle traffic orchestration, the method executing on a centralized coordination engine (106) and a plurality of decentralized edge-sensing nodes (104), the method comprising the steps of:
   - sampling acoustic signals at a physical intersection node and executing an edge-based spectral siren validation algorithm via a Fast Fourier Transform (FFT) to authenticate emergency sirens while filtering urban noise;
   - establishing a persistent WebSocket connection between a physical traffic signal controller (108) and a centralized coordination engine (106) to maintain transmission latency under $25$ milliseconds;
   - calculating a real-time velocity ($V_t$) and an estimated time of arrival ($ETA_i$) for an active emergency vehicle relative to a plurality of forward-trajectory intersections using a Haversine formula;
   - filtering out non-forward intersections using an angular bearing deviation limit of $90$ degrees;
   - sorting validated forward intersections in ascending order of ETA in a priority queue truncated at a maximum size of three nodes;
   - initiating confidence-scaled signal preemption staging across a READY state, a PREPARE state, and a GREEN state governed by trajectory confidence and arrival thresholds;
   - arbitrating concurrent multi-vehicle conflicts at a target intersection node using a mathematical Priority Index (PI) equation, granting preemption exclusively to the vehicle with the apex index score; and
   - progressively and asynchronously releasing green preemption locks at each node the instant the emergency vehicle clears the intersection center point or exhibits route abandonment.

17. The computer-implemented method as claimed in claim 16, wherein said step of executing an edge-based spectral siren validation algorithm comprises:
   - sampling acoustic data at $6000$ Hz to fill a $256$-sample buffer;
   - subtracting the sample mean to remove DC offset;
   - applying a Hamming window and executing a forward FFT;
   - filtering out low-frequency noise bins representing frequencies below $351$ Hz; and
   - identifying a peak frequency between $600$ Hz and $2100$ Hz with an amplitude above $90$, and validating the siren only after four consecutive positive matching frames are logged in a rolling counter.

18. The computer-implemented method as claimed in claim 16, wherein said step of arbitrating multi-vehicle conflicts further comprises triggering a Conflict-Induced All-Red Lockout if the index scores of perpendicular emergency vehicles are equal, forcing all approaches of said intersection into a solid red phase.

19. A non-transitory computer-readable medium storing instructions that, when executed by a processing core of a centralized coordination engine (106) and a localized edge microcontroller of a sensing node (104), cause the system to perform a method for predictive traffic orchestration, the method comprising:
   - performing localized spectral siren validation on sampled acoustic waveforms using an edge-based FFT Hamming-windowed check to isolate emergency frequencies between $600$ Hz and $2100$ Hz while ignoring noise below $351$ Hz, requiring four consecutive matches in a rolling buffer;
   - establishing a persistent Engine.io v4 WebSocket pipeline to maintain a real-time transmission channel between a traffic signal controller (108) and the coordination engine (106);
   - evaluating a vehicle's forward trajectory using Haversine distance calculations and a $90$-degree angular vector rejection filter;
   - staging signal phases through READY, PREPARE, and GREEN preemption states depending on estimated arrival times and trajectory confidence;
   - resolving overlapping route conflicts via a Priority Index comparison incorporating vehicle severity weights and ETA; and
   - progressively releasing active green corridor locks at physical intersections asynchronously upon vehicle passage or directional vector invalidation.

20. The non-transitory computer-readable medium as claimed in claim 19, wherein said instructions further cause the system to trigger a flashing-yellow warning fallback state at a physical traffic signal controller if the WebSocket connection to the centralized coordination engine (106) is lost for a continuous duration of $10$ seconds.

---

10. ABSTRACT
A low-cost, decentralized, predictive emergency vehicle traffic orchestration framework utilizing edge-based spectral siren validation and trajectory-confidence-scaled preemption is disclosed. The framework comprises ESP32-based acoustic edge-sensing nodes that execute localized FFT algorithms with Hamming windowing and temporal rolling persistence filters to authenticate emergency sirens, completely eliminating false positives from urban noise. Physical traffic signal controllers maintain permanent, persistent WebSocket connections to a centralized coordination engine, guaranteeing preemption execution under 25 milliseconds. The coordination engine utilizes Haversine distance mapping and 90-degree angular bearing filters to dynamically generate a prioritized queue of forward-trajectory intersections. Preemption is executed progressively across READY, PREPARE, and GREEN stages scaled by trajectory confidence. Multi-vehicle conflicts are resolved mathematically via a Priority Index (PI) arbitration logic, with convoy-aware grouping and conflict-induced all-red lockout protection. The framework asynchronously and progressively de-allocates green corridor locks the instant a vehicle passes an intersection or abandons its route, minimizing civilian traffic gridlock while maintaining emergency route continuity.

Dated this 23rd day of May, 2026.

Signatures of the Applicants:

1. __________________________
   (Dr. Navneet Kaur)

2. __________________________
   (Priyanshi)

3. __________________________
   (Priya)

4. __________________________
   (Pratham Chadda)

5. __________________________
   (Raghav Garg)
