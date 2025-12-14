from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
import time
import random

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock state
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print("Client connected")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print("Client disconnected")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_text(json.dumps(message))

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_text(json.dumps(message))

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            print(f"Received command: {message}")
            
            msg_type = message.get("type")
            
            if msg_type == "start_calibration":
                # Simulate calibration process
                print("Starting calibration...")
                
                # Send posture status immediately
                await manager.send_personal_message({
                    "type": "posture_status",
                    "payload": {"upright": True}
                }, websocket)
                
                # Simulate calibration time (3 seconds for sensor calibration)
                await asyncio.sleep(3)
                
                print("Calibration done")
                await manager.send_personal_message({
                    "type": "calibration_done",
                    "payload": {}
                }, websocket)
                
            elif msg_type == "start_task":
                task_name = message.get("payload", {}).get("task")
                print(f"Starting task: {task_name}")
                
                # Simulate task running for 10 seconds (collecting sensor data)
                # Send periodic updates during the task
                for i in range(10):
                    await asyncio.sleep(1)
                    print(f"Task {task_name} - second {i+1}/10")
                
                # Generate mock results after task completes
                results = {
                    "leftKneeFlexion": random.uniform(25, 35),
                    "leftKneeValgus": random.uniform(5, 15),
                    "leftKneeRisk": random.uniform(10, 80),
                    "rightKneeFlexion": random.uniform(25, 35),
                    "rightKneeValgus": random.uniform(5, 15),
                    "rightKneeRisk": random.uniform(10, 80)
                }
                
                print(f"Task {task_name} complete - Sending results")
                await manager.send_personal_message({
                    "type": "task_result",
                    "payload": results
                }, websocket)

    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)