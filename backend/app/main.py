import asyncio
import math
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from uvicorn import Config, Server

from .simulator import simulator_db
from .batching import create_batches
from .routing import optimize_route, euclidean_distance

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

def dispatch_and_route():
    # 1. Generate Orders randomly 
    if len([o for o in simulator_db.orders if o['status'] == 'pending']) < 15:
        simulator_db.generate_orders(count=3)
        
    # 2. Batching
    batches = create_batches(simulator_db.orders, max_batch_size=3)
    
    # 3. Dispatch & Routing
    idle_riders = [r for r in simulator_db.riders if r['status'] == 'idle']
    
    for batch in batches:
        if not idle_riders:
            break # wait for riders to become free
            
        # Find nearest rider to first pickup in batch
        first_pickup = batch[0]['pickup']
        best_rider = min(idle_riders, key=lambda r: euclidean_distance(r['location'], first_pickup))
        idle_riders.remove(best_rider)
        
        # Optimize route for this batch and this rider
        route = optimize_route(best_rider, batch)
        if route:
            best_rider['active_route'] = route
            best_rider['status'] = 'enroute'
            # mark batch orders as 'batched'
            for o in batch:
                o['status'] = 'batched'
                
def simulate_movement():
    # Move riders towards their active route target
    for rider in simulator_db.riders:
        if rider['status'] == 'enroute' and rider['active_route']:
            target = rider['active_route'][0]
            # Move towards target. Step is approx 0.005 degrees
            step = 0.001
            
            curr_lat = rider['location']['lat']
            curr_lng = rider['location']['lng']
            t_lat = target['location']['lat']
            t_lng = target['location']['lng']
            
            dist = math.sqrt((t_lat - curr_lat)**2 + (t_lng - curr_lng)**2)
            
            if dist < step:
                # Reached target
                rider['location']['lat'] = t_lat
                rider['location']['lng'] = t_lng
                
                # Update order status
                order = next((o for o in simulator_db.orders if o['id'] == target['order_id']), None)
                if order:
                    if target['action'] == 'pickup':
                        order['status'] = 'enroute'
                    elif target['action'] == 'dropoff':
                        order['status'] = 'delivered'
                        
                # Pop target
                rider['active_route'].pop(0)
                
                if not rider['active_route']:
                    rider['status'] = 'idle'
            else:
                # interpolate movement
                rider['location']['lat'] += step * (t_lat - curr_lat) / dist
                rider['location']['lng'] += step * (t_lng - curr_lng) / dist

async def simulation_loop():
    while True:
        try:
            simulate_movement()
            dispatch_and_route()
            state = simulator_db.get_state()
            await manager.broadcast(state)
        except Exception as e:
            print("SIMULATION ERROR:", e)
        await asyncio.sleep(1) # Broadcast every 1 second

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(simulation_loop())

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
