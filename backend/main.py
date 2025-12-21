"""
Enhanced WebSocket Server for ACL Risk Assessment with User Authentication
Includes user login, assessment history tracking, and trend analysis
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import json
import asyncio
import sqlite3
import hashlib
from typing import Optional, List, Dict
import time

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
def init_database():
    """Initialize SQLite database with tables for users and assessments"""
    conn = sqlite3.connect('acl_assessment.db')
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Assessments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            left_knee_flexion REAL,
            left_knee_valgus REAL,
            left_knee_risk REAL,
            right_knee_flexion REAL,
            right_knee_valgus REAL,
            right_knee_risk REAL,
            raw_data TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized successfully")

init_database()

# Pydantic models
class UserLogin(BaseModel):
    user_id: str
    name: str

class AssessmentResult(BaseModel):
    user_id: str
    left_knee_flexion: float
    left_knee_valgus: float
    left_knee_risk: float
    right_knee_flexion: float
    right_knee_valgus: float
    right_knee_risk: float
    raw_data: Optional[dict] = None

# Database functions
def create_or_get_user(user_id: str, name: str) -> dict:
    """Create a new user or get existing user"""
    conn = sqlite3.connect('acl_assessment.db')
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute('SELECT id, name, created_at FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    if user:
        # User exists - update name if changed
        if user[1] != name:
            cursor.execute('UPDATE users SET name = ? WHERE id = ?', (name, user_id))
            conn.commit()
        
        result = {
            "user_id": user[0],
            "name": name,
            "created_at": user[2],
            "is_new": False
        }
    else:
        # Create new user
        cursor.execute(
            'INSERT INTO users (id, name) VALUES (?, ?)',
            (user_id, name)
        )
        conn.commit()
        
        cursor.execute('SELECT created_at FROM users WHERE id = ?', (user_id,))
        created_at = cursor.fetchone()[0]
        
        result = {
            "user_id": user_id,
            "name": name,
            "created_at": created_at,
            "is_new": True
        }
    
    conn.close()
    return result

def save_assessment(assessment: AssessmentResult) -> int:
    """Save assessment results to database"""
    conn = sqlite3.connect('acl_assessment.db')
    cursor = conn.cursor()
    
    raw_data_json = json.dumps(assessment.raw_data) if assessment.raw_data else None
    
    cursor.execute('''
        INSERT INTO assessments (
            user_id, left_knee_flexion, left_knee_valgus, left_knee_risk,
            right_knee_flexion, right_knee_valgus, right_knee_risk, raw_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        assessment.user_id,
        assessment.left_knee_flexion,
        assessment.left_knee_valgus,
        assessment.left_knee_risk,
        assessment.right_knee_flexion,
        assessment.right_knee_valgus,
        assessment.right_knee_risk,
        raw_data_json
    ))
    
    assessment_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return assessment_id

def get_user_assessment_history(user_id: str) -> List[dict]:
    """Get all assessments for a user"""
    conn = sqlite3.connect('acl_assessment.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, assessment_date, left_knee_flexion, left_knee_valgus, left_knee_risk,
               right_knee_flexion, right_knee_valgus, right_knee_risk
        FROM assessments
        WHERE user_id = ?
        ORDER BY assessment_date DESC
    ''', (user_id,))
    
    assessments = []
    for row in cursor.fetchall():
        assessments.append({
            "id": row[0],
            "date": row[1],
            "left_knee_flexion": row[2],
            "left_knee_valgus": row[3],
            "left_knee_risk": row[4],
            "right_knee_flexion": row[5],
            "right_knee_valgus": row[6],
            "right_knee_risk": row[7]
        })
    
    conn.close()
    return assessments

def get_risk_trend_analysis(user_id: str) -> dict:
    """Analyze risk trends for a user"""
    history = get_user_assessment_history(user_id)
    
    if len(history) < 2:
        return {
            "trend": "insufficient_data",
            "message": "Need at least 2 assessments to analyze trends",
            "assessment_count": len(history)
        }
    
    # Get most recent and previous assessment
    latest = history[0]
    previous = history[1]
    
    # Calculate changes
    left_risk_change = latest["left_knee_risk"] - previous["left_knee_risk"]
    right_risk_change = latest["right_knee_risk"] - previous["right_knee_risk"]
    
    # Determine trend
    if left_risk_change < -5 and right_risk_change < -5:
        trend = "improving"
        message = "Both knees show decreased risk!"
    elif left_risk_change > 5 and right_risk_change > 5:
        trend = "worsening"
        message = "Both knees show increased risk. Consider consulting a specialist."
    elif abs(left_risk_change) < 5 and abs(right_risk_change) < 5:
        trend = "stable"
        message = "Risk levels remain stable."
    else:
        trend = "mixed"
        message = "Mixed results between knees."
    
    return {
        "trend": trend,
        "message": message,
        "left_knee_change": round(left_risk_change, 2),
        "right_knee_change": round(right_risk_change, 2),
        "assessment_count": len(history),
        "latest_assessment_date": latest["date"],
        "previous_assessment_date": previous["date"]
    }

# REST API endpoints
@app.post("/api/login")
async def login(user_data: UserLogin):
    """User login endpoint"""
    user = create_or_get_user(user_data.user_id, user_data.name)
    
    # Get user's assessment history
    history = get_user_assessment_history(user_data.user_id)
    
    return {
        "success": True,
        "user": user,
        "assessment_count": len(history),
        "latest_assessments": history[:5] if history else []
    }

@app.get("/api/user/{user_id}/history")
async def get_history(user_id: str):
    """Get user's assessment history"""
    history = get_user_assessment_history(user_id)
    trend = get_risk_trend_analysis(user_id)
    
    return {
        "user_id": user_id,
        "assessments": history,
        "trend_analysis": trend
    }

@app.get("/api/user/{user_id}/trend")
async def get_trend(user_id: str):
    """Get risk trend analysis for user"""
    return get_risk_trend_analysis(user_id)

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}  # user_id -> websocket

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"User {user_id} connected via WebSocket")

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"User {user_id} disconnected")

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            await websocket.send_text(json.dumps(message))

manager = ConnectionManager()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint with user identification"""
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            print(f"Received from user {user_id}: {message['type']}")
            
            msg_type = message.get("type")
            
            if msg_type == "start_calibration":
                print(f"Starting calibration for user {user_id}...")
                
                # Send posture status
                await manager.send_personal_message({
                    "type": "posture_status",
                    "payload": {"upright": True}
                }, user_id)
                
                # Simulate calibration time
                await asyncio.sleep(3)
                
                print(f"Calibration done for user {user_id}")
                await manager.send_personal_message({
                    "type": "calibration_done",
                    "payload": {}
                }, user_id)
                
            elif msg_type == "start_task":
                task_name = message.get("payload", {}).get("task")
                print(f"Starting task '{task_name}' for user {user_id}")
                
                # Simulate task running
                for i in range(10):
                    await asyncio.sleep(1)
                    await manager.send_personal_message({
                        "type": "task_progress",
                        "payload": {
                            "elapsed": i + 1,
                            "duration": 10
                        }
                    }, user_id)
                
                # Generate mock results
                import random
                results = {
                    "leftKneeFlexion": round(random.uniform(25, 35), 2),
                    "leftKneeValgus": round(random.uniform(5, 15), 2),
                    "leftKneeRisk": round(random.uniform(10, 40), 2),
                    "rightKneeFlexion": round(random.uniform(25, 35), 2),
                    "rightKneeValgus": round(random.uniform(5, 15), 2),
                    "rightKneeRisk": round(random.uniform(10, 40), 2)
                }
                
                # Save assessment to database
                assessment = AssessmentResult(
                    user_id=user_id,
                    left_knee_flexion=results["leftKneeFlexion"],
                    left_knee_valgus=results["leftKneeValgus"],
                    left_knee_risk=results["leftKneeRisk"],
                    right_knee_flexion=results["rightKneeFlexion"],
                    right_knee_valgus=results["rightKneeValgus"],
                    right_knee_risk=results["rightKneeRisk"],
                    raw_data=results
                )
                assessment_id = save_assessment(assessment)
                results["assessment_id"] = assessment_id
                
                # Get trend analysis
                trend = get_risk_trend_analysis(user_id)
                results["trend_analysis"] = trend
                
                print(f"Task complete for user {user_id} - Assessment ID: {assessment_id}")
                await manager.send_personal_message({
                    "type": "task_result",
                    "payload": results
                }, user_id)

    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        print(f"Error for user {user_id}: {e}")
        manager.disconnect(user_id)

if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("ACL RISK ASSESSMENT SERVER WITH USER AUTHENTICATION")
    print("=" * 60)
    print("REST API: http://localhost:8000")
    print("WebSocket: ws://localhost:8000/ws/{user_id}")
    print("API Docs: http://localhost:8000/docs")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8001)