"""
WebSocket Server for ACL Risk Assessment
Integrates IMU sensors with React frontend for jump landing assessment.
"""

import asyncio
import json
import numpy as np
from ahrs.filters import Madgwick
import websockets
import time
from datetime import datetime
import os
from typing import Optional, Dict, Any

# Import IMU utilities from your existing code
DEG2RAD = np.pi / 180.0
RAD2DEG = 180.0 / np.pi

# 0: L shank, 1: R shank, 2: L thigh, 3: R thigh
MODE_1_IMUS = [0, 1, 2, 3]

# ---------- quaternion utils ----------
def quaternion_conjugate(q):
    q = np.asarray(q, float)
    return np.array([q[0], -q[1], -q[2], -q[3]], float)

def quaternion_multiply(q, r):
    q = np.asarray(q, float)
    r = np.asarray(r, float)
    w0, x0, y0, z0 = q
    w1, x1, y1, z1 = r
    return np.array([
        w0*w1 - x0*x1 - y0*y1 - z0*z1,
        w0*x1 + x0*w1 + y0*z1 - z0*y1,
        w0*y1 - x0*z1 + y0*w1 + z0*x1,
        w0*z1 + x0*y1 - y0*x1 + z0*w1
    ], float)

def rotm_to_quat(R):
    R = np.array(R, float)
    tr = np.trace(R)
    if tr > 0:
        S = np.sqrt(tr + 1.0) * 2.0
        w = 0.25 * S
        x = (R[2, 1] - R[1, 2]) / S
        y = (R[0, 2] - R[2, 0]) / S
        z = (R[1, 0] - R[0, 1]) / S
    else:
        if (R[0, 0] > R[1, 1]) and (R[0, 0] > R[2, 2]):
            S = np.sqrt(1.0 + R[0, 0] - R[1, 1] - R[2, 2]) * 2.0
            w = (R[2, 1] - R[1, 2]) / S
            x = 0.25 * S
            y = (R[0, 1] + R[1, 0]) / S
            z = (R[0, 2] + R[2, 0]) / S
        elif R[1, 1] > R[2, 2]:
            S = np.sqrt(1.0 + R[1, 1] - R[0, 0] - R[2, 2]) * 2.0
            w = (R[0, 2] - R[2, 0]) / S
            x = (R[0, 1] + R[1, 0]) / S
            y = 0.25 * S
            z = (R[1, 2] + R[2, 1]) / S
        else:
            S = np.sqrt(1.0 + R[2, 2] - R[0, 0] - R[1, 1]) * 2.0
            w = (R[1, 0] - R[0, 1]) / S
            x = (R[0, 2] + R[2, 0]) / S
            y = (R[1, 2] + R[2, 1]) / S
            z = 0.25 * S
    q = np.array([w, x, y, z], float)
    q /= np.linalg.norm(q)
    return q

# ---------- axis estimation ----------
def compute_gravity_axis(static_samples, imu_id):
    accs = [np.array(s["acc"], float) for s in static_samples if s["id"] == imu_id]
    if not accs:
        raise ValueError(f"No static samples for IMU {imu_id}")
    accs = np.vstack(accs)
    g_mean = accs.mean(axis=0)
    g_unit = g_mean / np.linalg.norm(g_mean)
    return g_unit

def compute_flexion_axis(flexion_samples, imu_id):
    gyrs = [np.array(s["gyr"], float) for s in flexion_samples if s["id"] == imu_id]
    if not gyrs:
        raise ValueError(f"No flexion samples for IMU {imu_id}")
    gyrs = np.vstack(gyrs)
    gyrs_centered = gyrs - gyrs.mean(axis=0)
    C = np.cov(gyrs_centered.T)
    vals, vecs = np.linalg.eig(C)
    idx = np.argmax(vals)
    f_axis = np.real(vecs[:, idx])
    f_axis /= np.linalg.norm(f_axis)
    return f_axis

def build_anatomical_frame(long_axis_s, flex_axis_s):
    z_s = long_axis_s / np.linalg.norm(long_axis_s)
    x_s = flex_axis_s / np.linalg.norm(flex_axis_s)
    x_s = x_s - np.dot(x_s, z_s) * z_s
    x_s /= np.linalg.norm(x_s)
    y_s = np.cross(z_s, x_s)
    y_s /= np.linalg.norm(y_s)
    R_sa = np.column_stack((x_s, y_s, z_s))
    return R_sa

# ---------- IMU system ----------
class IMUSystem:
    def __init__(self):
        self.filters = {}
        self.quaternions = {}
        self.q_sensor_to_anat = {}
        self.calibrated = False
        self.neutral_knee_left = None
        self.neutral_knee_right = None
        self.gyr_norm_all = 0.0

    def init_filters(self, imu_ids, dt=0.01):
        for i in imu_ids:
            f = Madgwick()
            f.Dt = dt
            self.filters[i] = f
            self.quaternions[i] = np.array([1.0, 0.0, 0.0, 0.0], float)

    def update_filter(self, imu_id, acc, gyr, dt):
        if imu_id not in self.filters:
            return
        self.filters[imu_id].Dt = dt
        gyr = np.asarray(gyr, float)
        acc = np.asarray(acc, float)
        acc_norm_g = np.linalg.norm(acc) / 9.81
        if 0.8 < acc_norm_g < 1.2:
            acc_normalized = acc / np.linalg.norm(acc)
        else:
            acc_normalized = acc / np.linalg.norm(acc) if np.linalg.norm(acc) > 0.1 else np.zeros(3)
        gyr_rad = gyr * DEG2RAD
        q_prev = self.quaternions.get(imu_id, np.array([1.0, 0.0, 0.0, 0.0], float))
        q_new = self.filters[imu_id].updateIMU(q_prev, gyr=gyr_rad, acc=acc_normalized)
        if q_new is not None:
            self.quaternions[imu_id] = np.asarray(q_new, float)

    def run_anatomical_calibration(self, static_samples, flexion_samples):
        for imu_id in MODE_1_IMUS:
            g_s = compute_gravity_axis(static_samples, imu_id)
            long_axis = -g_s
            f_s = compute_flexion_axis(flexion_samples, imu_id)
            R_sa = build_anatomical_frame(long_axis, f_s)
            q_sa = rotm_to_quat(R_sa)
            self.q_sensor_to_anat[imu_id] = q_sa
        self.calibrated = True
        print("Anatomical calibration done.")
        self.capture_neutral_knees()

    def get_segment_orientation_anat(self, imu_id):
        q_ws = self.quaternions.get(imu_id, np.array([1.0, 0.0, 0.0, 0.0], float))
        q_sa = self.q_sensor_to_anat.get(imu_id, np.array([1.0, 0.0, 0.0, 0.0], float))
        q_wa = quaternion_multiply(q_ws, q_sa)
        q_wa /= np.linalg.norm(q_wa)
        return q_wa

    def compute_relative_quaternion(self, q_proximal, q_distal):
        return quaternion_multiply(quaternion_conjugate(q_proximal), q_distal)

    def quaternion_to_euler_xyz(self, q):
        q = np.asarray(q, float)
        w, x, y, z = q
        sinr_cosp = 2.0 * (w * x + y * z)
        cosr_cosp = 1.0 - 2.0 * (x * x + y * y)
        roll = np.arctan2(sinr_cosp, cosr_cosp)
        sinp = 2.0 * (w * y - z * x)
        sinp = np.clip(sinp, -1.0, 1.0)
        pitch = np.arcsin(sinp)
        siny_cosp = 2.0 * (w * z + x * y)
        cosy_cosp = 1.0 - 2.0 * (y * y + z * z)
        yaw = np.arctan2(siny_cosp, cosy_cosp)
        return roll, pitch, yaw

    def _deadzone(self, x, th=1.0):
        return 0.0 if abs(x) < th else x

    def capture_neutral_knees(self):
        q_thigh_left = self.get_segment_orientation_anat(2)
        q_shank_left = self.get_segment_orientation_anat(0)
        self.neutral_knee_left = self.compute_relative_quaternion(q_thigh_left, q_shank_left)
        q_thigh_right = self.get_segment_orientation_anat(3)
        q_shank_right = self.get_segment_orientation_anat(1)
        self.neutral_knee_right = self.compute_relative_quaternion(q_thigh_right, q_shank_right)
        print("Neutral knee reference captured.")

    def maybe_reanchor_neutral(self, q_rel_left, q_rel_right):
        roll_l, pitch_l, _ = self.quaternion_to_euler_xyz(q_rel_left)
        roll_r, pitch_r, _ = self.quaternion_to_euler_xyz(q_rel_right)
        flex_l = roll_l * RAD2DEG
        flex_r = roll_r * RAD2DEG
        abd_l = pitch_l * RAD2DEG
        abd_r = pitch_r * RAD2DEG
        if (abs(flex_l) < 5 and abs(flex_r) < 5 and
            abs(abd_l) < 5 and abs(abd_r) < 5 and
            self.gyr_norm_all < 5.0 and
            self.neutral_knee_left is not None and
            self.neutral_knee_right is not None):
            alpha = 0.02
            q_rel_left = (1.0 - alpha) * q_rel_left + alpha * self.neutral_knee_left
            q_rel_right = (1.0 - alpha) * q_rel_right + alpha * self.neutral_knee_right
            q_rel_left /= np.linalg.norm(q_rel_left)
            q_rel_right /= np.linalg.norm(q_rel_right)
        return q_rel_left, q_rel_right

    def compute_knee_angles(self):
        if not self.calibrated:
            return None
        if self.neutral_knee_left is None or self.neutral_knee_right is None:
            return None
        q_thigh_left = self.get_segment_orientation_anat(2)
        q_shank_left = self.get_segment_orientation_anat(0)
        q_rel_left = self.compute_relative_quaternion(q_thigh_left, q_shank_left)
        q_rel_left = quaternion_multiply(quaternion_conjugate(self.neutral_knee_left), q_rel_left)
        q_thigh_right = self.get_segment_orientation_anat(3)
        q_shank_right = self.get_segment_orientation_anat(1)
        q_rel_right = self.compute_relative_quaternion(q_thigh_right, q_shank_right)
        q_rel_right = quaternion_multiply(quaternion_conjugate(self.neutral_knee_right), q_rel_right)
        q_rel_left, q_rel_right = self.maybe_reanchor_neutral(q_rel_left, q_rel_right)
        roll_l, pitch_l, _ = self.quaternion_to_euler_xyz(q_rel_left)
        roll_r, pitch_r, _ = self.quaternion_to_euler_xyz(q_rel_right)
        flex_l = self._deadzone(roll_l * RAD2DEG, 1.0)
        flex_r = self._deadzone(roll_r * RAD2DEG, 1.0)
        abd_l = self._deadzone(pitch_l * RAD2DEG, 1.0)
        abd_r = self._deadzone(pitch_r * RAD2DEG, 1.0)
        flex_r = -flex_r
        return {
            "left_flexion": float(flex_l),
            "right_flexion": float(flex_r),
            "left_abduction": float(abd_l),
            "right_abduction": float(abd_r),
        }

# ---------- data collection ----------
async def collect_samples(uri, duration_s, websocket_client=None):
    """Collect IMU samples for calibration or assessment"""
    samples = []
    start_time = time.time()
    
    async with websockets.connect(uri) as ws:
        start = None
        while True:
            msg = await ws.recv()
            data = json.loads(msg)
            t = data["t"]
            if start is None:
                start = t
            
            # Send progress update to frontend if provided
            elapsed = time.time() - start_time
            if websocket_client and elapsed % 1 < 0.1:  # Update every second
                await websocket_client.send(json.dumps({
                    "type": "progress",
                    "payload": {
                        "elapsed": elapsed,
                        "duration": duration_s
                    }
                }))
            
            if (t - start) > duration_s * 1000:
                break

            for d in data["imus"]:
                samples.append({
                    "id": d["id"],
                    "acc": [d["ax"], d["ay"], d["az"]],
                    "gyr": [d["gx"], d["gy"], d["gz"]],
                })
    return samples

# ---------- Recording and Analysis ----------
class JumpLandingRecorder:
    def __init__(self):
        self.recording_data = []
        self.recording_start = None
        self.is_recording = False

    def start_recording(self):
        self.recording_data = []
        self.recording_start = time.time()
        self.is_recording = True
        print(f"Recording started at {datetime.now().strftime('%H:%M:%S')}")

    def stop_recording(self):
        self.is_recording = False
        recording_duration = time.time() - self.recording_start
        print(f"Recording stopped. Duration: {recording_duration:.2f} seconds")
        print(f"Total samples: {len(self.recording_data)}")

    def add_sample(self, timestamp, angles):
        if self.is_recording:
            self.recording_data.append({
                "timestamp": timestamp,
                "time_elapsed_ms": int((time.time() - self.recording_start) * 1000),
                "angles": angles
            })

    def compute_statistics(self):
        if not self.recording_data:
            return None

        left_flexion = [sample["angles"]["left_flexion"] for sample in self.recording_data]
        right_flexion = [sample["angles"]["right_flexion"] for sample in self.recording_data]
        left_abduction = [sample["angles"]["left_abduction"] for sample in self.recording_data]
        right_abduction = [sample["angles"]["right_abduction"] for sample in self.recording_data]

        statistics = {
            "recording_info": {
                "duration_seconds": (self.recording_data[-1]["time_elapsed_ms"] - self.recording_data[0]["time_elapsed_ms"]) / 1000,
                "sample_count": len(self.recording_data),
                "sampling_rate_hz": len(self.recording_data) / ((self.recording_data[-1]["time_elapsed_ms"] - self.recording_data[0]["time_elapsed_ms"]) / 1000),
                "recording_timestamp": datetime.now().isoformat()
            },
            "left_flexion": {
                "min": float(np.min(left_flexion)),
                "max": float(np.max(left_flexion)),
                "mean": float(np.mean(left_flexion)),
                "std": float(np.std(left_flexion)),
                "range": float(np.max(left_flexion) - np.min(left_flexion)),
                "median": float(np.median(left_flexion)),
                "peak_to_peak": float(np.max(left_flexion) - np.min(left_flexion))
            },
            "right_flexion": {
                "min": float(np.min(right_flexion)),
                "max": float(np.max(right_flexion)),
                "mean": float(np.mean(right_flexion)),
                "std": float(np.std(right_flexion)),
                "range": float(np.max(right_flexion) - np.min(right_flexion)),
                "median": float(np.median(right_flexion)),
                "peak_to_peak": float(np.max(right_flexion) - np.min(right_flexion))
            },
            "left_abduction": {
                "min": float(np.min(left_abduction)),
                "max": float(np.max(left_abduction)),
                "mean": float(np.mean(left_abduction)),
                "std": float(np.std(left_abduction)),
                "range": float(np.max(left_abduction) - np.min(left_abduction)),
                "median": float(np.median(left_abduction)),
                "peak_to_peak": float(np.max(left_abduction) - np.min(left_abduction))
            },
            "right_abduction": {
                "min": float(np.min(right_abduction)),
                "max": float(np.max(right_abduction)),
                "mean": float(np.mean(right_abduction)),
                "std": float(np.std(right_abduction)),
                "range": float(np.max(right_abduction) - np.min(right_abduction)),
                "median": float(np.median(right_abduction)),
                "peak_to_peak": float(np.max(right_abduction) - np.min(right_abduction))
            },
            "symmetry_metrics": {
                "flexion_difference_mean": float(np.mean(left_flexion) - np.mean(right_flexion)),
                "flexion_difference_max": float(np.max(np.abs(np.array(left_flexion) - np.array(right_flexion)))),
                "abduction_difference_mean": float(np.mean(left_abduction) - np.mean(right_abduction)),
                "abduction_difference_max": float(np.max(np.abs(np.array(left_abduction) - np.array(right_abduction))))
            }
        }

        return statistics

# ---------- WebSocket Server for Frontend Communication ----------
class AssessmentServer:
    def __init__(self, imu_uri="ws://192.168.4.1:81"):
        self.imu_uri = imu_uri
        self.imu_system = IMUSystem()
        self.recorder = JumpLandingRecorder()
        self.static_samples = None
        self.flexion_samples = None
        self.frontend_client = None

    async def handle_start_calibration(self, websocket):
        """Handle static calibration (stand still for 10 seconds)"""
        print("Starting static calibration...")
        
        await websocket.send(json.dumps({
            "type": "calibration_status",
            "payload": {"status": "running", "message": "Stand still..."}
        }))
        
        # Collect static samples
        self.static_samples = await collect_samples(self.imu_uri, duration_s=10.0, websocket_client=websocket)
        
        print(f"Static calibration complete. Collected {len(self.static_samples)} samples")
        
        await websocket.send(json.dumps({
            "type": "calibration_status",
            "payload": {"status": "complete", "message": "Static calibration complete"}
        }))

    async def handle_start_flexion_calibration(self, websocket):
        """Handle flexion calibration (squat for 10 seconds)"""
        print("Starting flexion calibration...")
        
        await websocket.send(json.dumps({
            "type": "flexion_calibration_status",
            "payload": {"status": "running", "message": "Perform squats..."}
        }))
        
        # Collect flexion samples
        self.flexion_samples = await collect_samples(self.imu_uri, duration_s=10.0, websocket_client=websocket)
        
        print(f"Flexion calibration complete. Collected {len(self.flexion_samples)} samples")
        
        # Run anatomical calibration
        self.imu_system.init_filters(MODE_1_IMUS, dt=0.01)
        self.imu_system.run_anatomical_calibration(self.static_samples, self.flexion_samples)
        
        await websocket.send(json.dumps({
            "type": "calibration_done",
            "payload": {"message": "All calibration complete. Ready for assessment."}
        }))

    async def handle_start_task(self, websocket, task_name):
        """Handle jump landing task (10 seconds of recording)"""
        print(f"Starting task: {task_name}")
        
        await websocket.send(json.dumps({
            "type": "task_status",
            "payload": {"status": "running", "task": task_name}
        }))
        
        # Start recording
        self.recorder.start_recording()
        
        # Connect to IMU sensors and record data
        async with websockets.connect(self.imu_uri) as imu_ws:
            prev_t = None
            recording_start_time = time.time()
            
            while True:
                # Check if 10 seconds have passed
                elapsed = time.time() - recording_start_time
                if elapsed > 10.0:
                    self.recorder.stop_recording()
                    break
                
                # Send progress every second
                if int(elapsed) != int(elapsed - 0.1):
                    await websocket.send(json.dumps({
                        "type": "task_progress",
                        "payload": {"elapsed": elapsed, "duration": 10.0}
                    }))
                
                message = await imu_ws.recv()
                data = json.loads(message)
                t = data["t"]

                if prev_t is None:
                    dt = 0.01
                else:
                    dt_ms = t - prev_t
                    dt = dt_ms / 1000.0 if dt_ms > 0 else 0.01
                prev_t = t

                gyr_norms = []
                for imu_data in data["imus"]:
                    i = imu_data["id"]
                    ax = imu_data["ax"]
                    ay = imu_data["ay"]
                    az = imu_data["az"]
                    gx = imu_data["gx"]
                    gy = imu_data["gy"]
                    gz = imu_data["gz"]

                    gyr_norms.append(np.linalg.norm([gx, gy, gz]))
                    self.imu_system.update_filter(i, [ax, ay, az], [gx, gy, gz], dt=dt)

                self.imu_system.gyr_norm_all = float(np.mean(gyr_norms)) if gyr_norms else 0.0

                angles = self.imu_system.compute_knee_angles()
                if angles:
                    self.recorder.add_sample(t, angles)
        
        # Compute statistics
        print("Computing statistics...")
        statistics = self.recorder.compute_statistics()
        
        if statistics:
            print("Sending results to frontend...")
            await websocket.send(json.dumps({
                "type": "task_result",
                "payload": statistics
            }))
        else:
            await websocket.send(json.dumps({
                "type": "error",
                "payload": {"message": "Failed to compute statistics"}
            }))

    async def handle_client(self, websocket, path):
        """Handle frontend WebSocket connection"""
        self.frontend_client = websocket
        print(f"Frontend client connected from {websocket.remote_address}")
        
        try:
            async for message in websocket:
                data = json.loads(message)
                msg_type = data.get("type")
                payload = data.get("payload", {})
                
                print(f"Received command: {msg_type}")
                
                if msg_type == "start_calibration":
                    await self.handle_start_calibration(websocket)
                    
                elif msg_type == "start_flexion_calibration":
                    await self.handle_start_flexion_calibration(websocket)
                    
                elif msg_type == "start_task":
                    task_name = payload.get("task", "unknown")
                    await self.handle_start_task(websocket, task_name)
                    
                else:
                    print(f"Unknown command type: {msg_type}")
                    
        except websockets.exceptions.ConnectionClosed:
            print("Frontend client disconnected")
        finally:
            self.frontend_client = None

async def main():
    """Start the WebSocket server"""
    imu_uri = "ws://192.168.4.1:81"
    server = AssessmentServer(imu_uri)
    
    print("=" * 60)
    print("ACL RISK ASSESSMENT WEBSOCKET SERVER")
    print("=" * 60)
    print(f"IMU Sensor URI: {imu_uri}")
    print("WebSocket Server: ws://localhost:8000")
    print("Waiting for frontend connection...")
    print("=" * 60)
    
    async with websockets.serve(server.handle_client, "localhost", 8000):
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())
