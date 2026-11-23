# ACL Injury Risk Assessment — Wearable IMU Jump-Landing Screening

A prototype system that uses four lower-limb inertial measurement units (IMUs) to estimate knee flexion and knee abduction (valgus) angles in real time during a jump-landing task, and compares them against a reference recording to flag movement patterns associated with anterior cruciate ligament (ACL) injury risk.

> **Course project** — Assistive Technology course, Systems & Biomedical Engineering, Cairo University (December 2025).
> **Status:** academic prototype. Tested only on team members, not on patients or athletes. The risk score is a heuristic and has **not** been clinically validated. Not for diagnostic use.

---

## Motivation

Dynamic knee valgus and reduced knee flexion at landing are widely studied biomechanical risk factors for non-contact ACL injury. Optical motion capture is the laboratory standard but is expensive and tied to a lab. This project explores whether a low-cost wearable set of IMUs can give a quick, portable screening of these two angles.

---

## System overview

```
 4 × IMU (L/R shank, L/R thigh)
          │  accel + gyro, JSON over Wi-Fi WebSocket (ESP-based hub, ws://192.168.4.1:81)
          ▼
 backend/websocket_server.py  ── Python: sensor fusion, calibration, knee angles, recording
          │  WebSocket (ws://localhost:8000)
          ▼
 frontend/ (React + Vite)      ── guided protocol, live status, risk report
```

The IMU hub firmware is not included in this repository.

### Sensor placement

| IMU id | Segment |
|---|---|
| 0 | Left shank |
| 1 | Right shank |
| 2 | Left thigh |
| 3 | Right thigh |

---

## Signal-processing pipeline (`backend/websocket_server.py`)

1. **Orientation estimation.** Each IMU's accelerometer and gyroscope stream is fused with a **Madgwick filter** (`ahrs` library) to produce a sensor-to-world orientation quaternion. The time step is taken from the hub's timestamps.
2. **Static calibration (10 s, standing still).** The mean accelerometer vector gives each segment's gravity direction, which is used as the segment's longitudinal axis.
3. **Functional flexion calibration (10 s, slow squats).** A principal-component analysis of the gyroscope signal (the eigenvector with the largest eigenvalue of the angular-velocity covariance) gives each segment's flexion–extension axis.
4. **Anatomical frames.** The two axes are orthogonalised (Gram–Schmidt) into a sensor-to-segment rotation for each IMU, so that angles are expressed in anatomical rather than sensor coordinates.
5. **Knee angles.** The knee orientation is the relative quaternion between thigh and shank, `q_knee = q_thigh* ⊗ q_shank`. It is referenced to the neutral standing posture captured at the end of calibration, then decomposed into Euler angles: rotation about the flexion axis is **flexion**, rotation about the anteroposterior axis is **abduction/valgus**. A 1° dead zone suppresses noise, and the neutral reference is slowly re-anchored when the subject is still and near neutral, which limits drift.
6. **Jump-landing task (10 s).** Angles are recorded and summarised per leg (min, max, mean, median, standard deviation, range) along with left–right symmetry metrics.

## Risk heuristic (`frontend/src/utils/riskCalculation.js`)

The task statistics are compared with a **reference recording**: one 10-second jump-landing trial by a team member at about 36 Hz (`frontend/src/config/referenceValues.js`).

- **Flexion risk:** rises when the mean knee flexion is *lower* than the reference by more than 10°.
- **Abduction risk:** rises when the mean knee abduction is *higher* than the reference by more than 10°.
- Each risk scales linearly from 0 % at a 10° deviation to 100 % at 30°. Results are banded as Low / Moderate / High / Very High.

**Limitations.** The reference comes from a single healthy subject, and the thresholds were chosen by the team rather than taken from a validated clinical model. The angle accuracy has not been benchmarked against optical motion capture. Validating the angles and replacing the heuristic with evidence-based cut-offs (or a model trained on labelled data) are the obvious next steps.

---

## Frontend

React 19 + Vite, with `three.js` / `@react-three/fiber` for the human-model view. The guided protocol is: connect → static calibration → flexion calibration → jump-landing task → report with per-leg angles, risk level and symmetry.

`backend/main.py` is a separate FastAPI service (SQLite) for user login and assessment history, with a trend analysis that compares the latest assessment to the previous one. **In its current version this service generates simulated angle and risk values for UI development.** It does not yet consume the IMU pipeline above.

The "ACL Rehabilitation" module on the start screen is a placeholder and has not been implemented.

---

## Running it

**Requirements:** Python 3.10+, Node.js 18+, and the IMU hub on the same Wi-Fi network.

```bash
# backend — IMU pipeline
cd backend
pip install -r requirements.txt
python websocket_server.py          # serves ws://localhost:8000

# frontend
cd frontend
npm install
npm run dev
```

---

## Team and contributions

| Member | Main contributions |
|---|---|
| Nour Bahgat | Project structure; IMU processing backend (sensor fusion, calibration, knee-angle computation, recording and statistics); guided assessment UI and risk calculation |
| Malak Saad | FastAPI service, SQLite user/assessment history, dashboard UI |
| Farida Hesham | Backend fixes |

AI coding assistants were used during development. The team designed the protocol and tested and integrated the system.
