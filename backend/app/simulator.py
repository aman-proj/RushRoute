import random
from uuid import uuid4
from datetime import datetime, timedelta

# Center around a typical city coordinate (e.g., Connaught Place, New Delhi)
CENTER_LAT = 28.6304
CENTER_LNG = 77.2177

# Spread in degrees (~5km radius)
SPREAD = 0.04

def generate_random_coords():
    return {
        "lat": CENTER_LAT + random.uniform(-SPREAD, SPREAD),
        "lng": CENTER_LNG + random.uniform(-SPREAD, SPREAD)
    }

class Simulator:
    def __init__(self):
        self.riders = []
        self.orders = []
        self._init_riders()

    def _init_riders(self, count=10):
        for _ in range(count):
            self.riders.append({
                "id": str(uuid4())[:8],
                "location": generate_random_coords(),
                "status": "idle", # idle, picking_up, delivering
                "capacity": 3,
                "active_route": []
            })
            
    def generate_orders(self, count=5):
        new_orders = []
        for _ in range(count):
            now = datetime.now()
            order = {
                "id": str(uuid4())[:8],
                "pickup": generate_random_coords(),
                "dropoff": generate_random_coords(),
                "timestamp": now.isoformat(),
                "status": "pending", # pending, batched, enroute, delivered
            }
            new_orders.append(order)
            self.orders.append(order)
            
        return new_orders

    def get_state(self):
        return {
            "riders": self.riders,
            "orders": self.orders,
        }

simulator_db = Simulator()
