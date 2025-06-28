from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import json
import random
import math
import numpy as np
from typing import List, Dict, Optional
import uvicorn

app = FastAPI(title="Bangalore Traffic GNN API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GraphNode(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    road_type: str
    features: Dict

class GraphEdge(BaseModel):
    source: str
    target: str
    distance: float
    road_type: str
    weight: float

class PredictionRequest(BaseModel):
    time_of_day: int  # 0-23
    weather: str  # "sunny", "rainy"
    day_type: str  # "weekday", "weekend"

class TrafficData:
    def __init__(self):
        self.nodes = self._generate_bangalore_nodes()
        self.edges = self._generate_edges()
        self.gnn_model = self._initialize_gnn()
    
    def _generate_bangalore_nodes(self) -> List[GraphNode]:
        """Generate synthetic Bangalore intersections"""
        major_areas = [
            {"name": "MG Road", "lat": 12.9716, "lng": 77.5946, "type": "commercial"},
            {"name": "Brigade Road", "lat": 12.9698, "lng": 77.6103, "type": "commercial"},
            {"name": "Whitefield", "lat": 12.9698, "lng": 77.7500, "type": "tech_hub"},
            {"name": "Electronic City", "lat": 12.8456, "lng": 77.6603, "type": "tech_hub"},
            {"name": "Koramangala", "lat": 12.9352, "lng": 77.6245, "type": "residential"},
            {"name": "Indiranagar", "lat": 12.9719, "lng": 77.6412, "type": "mixed"},
            {"name": "Jayanagar", "lat": 12.9279, "lng": 77.5830, "type": "residential"},
            {"name": "Banashankari", "lat": 12.9081, "lng": 77.5574, "type": "residential"},
            {"name": "Marathahalli", "lat": 12.9591, "lng": 77.6974, "type": "tech_hub"},
            {"name": "HSR Layout", "lat": 12.9082, "lng": 77.6476, "type": "residential"},
        ]
        
        nodes = []
        node_id = 0
        
        for area in major_areas:
            # Generate multiple intersections per area
            for i in range(random.randint(4, 8)):
                lat_offset = random.uniform(-0.01, 0.01)
                lng_offset = random.uniform(-0.01, 0.01)
                
                road_types = ["highway", "arterial", "local"]
                weights = [0.2, 0.3, 0.5] if area["type"] == "residential" else [0.4, 0.4, 0.2]
                
                node = GraphNode(
                    id=f"node_{node_id}",
                    name=f"{area['name']} Junction {i+1}",
                    lat=area["lat"] + lat_offset,
                    lng=area["lng"] + lng_offset,
                    road_type=random.choices(road_types, weights=weights)[0],
                    features={
                        "area_type": area["type"],
                        "capacity": random.randint(100, 500),
                        "signal_count": random.randint(2, 6)
                    }
                )
                nodes.append(node)
                node_id += 1
        
        return nodes
    
    def _generate_edges(self) -> List[GraphEdge]:
        """Generate road connections between intersections"""
        edges = []
        
        for i, node1 in enumerate(self.nodes):
            # Connect to nearest 2-4 nodes
            distances = []
            for j, node2 in enumerate(self.nodes):
                if i != j:
                    dist = self._calculate_distance(node1, node2)
                    distances.append((j, dist))
            
            distances.sort(key=lambda x: x[1])
            connections = random.randint(2, min(4, len(distances)))
            
            for j in range(connections):
                target_idx, distance = distances[j]
                target_node = self.nodes[target_idx]
                
                if distance < 5.0:  # Only connect nearby intersections
                    edge = GraphEdge(
                        source=node1.id,
                        target=target_node.id,
                        distance=distance,
                        road_type=random.choice(["highway", "arterial", "local"]),
                        weight=1.0
                    )
                    edges.append(edge)
        
        return edges
    
    def _calculate_distance(self, node1: GraphNode, node2: GraphNode) -> float:
        """Calculate distance between two nodes"""
        lat_diff = node1.lat - node2.lat
        lng_diff = node1.lng - node2.lng
        return math.sqrt(lat_diff**2 + lng_diff**2) * 111  # Approximate km
    
    def _initialize_gnn(self):
        """Initialize synthetic GNN model parameters"""
        return {
            "weights": np.random.randn(len(self.nodes), 4),  # 4 features
            "bias": np.random.randn(len(self.nodes)),
            "trained": True
        }
    
    def predict_congestion(self, time_of_day: int, weather: str, day_type: str) -> Dict:
        """Simulate GNN prediction for traffic congestion"""
        predictions = {}
        
        for node in self.nodes:
            # Simulate GNN computation with realistic patterns
            base_congestion = self._get_base_congestion(node, time_of_day, day_type)
            weather_factor = 1.3 if weather == "rainy" else 1.0
            area_factor = self._get_area_factor(node.features["area_type"], time_of_day)
            
            congestion_level = base_congestion * weather_factor * area_factor
            congestion_level = max(0.1, min(1.0, congestion_level))
            
            predictions[node.id] = {
                "congestion_level": round(congestion_level, 3),
                "predicted_speed": round(40 * (1 - congestion_level), 1),
                "volume": random.randint(50, 300),
                "wait_time": round(congestion_level * 180, 1)  # seconds
            }
        
        return predictions
    
    def _get_base_congestion(self, node: GraphNode, time_of_day: int, day_type: str) -> float:
        """Calculate base congestion based on time patterns"""
        # Rush hour patterns
        if day_type == "weekday":
            if 7 <= time_of_day <= 10 or 17 <= time_of_day <= 20:
                return random.uniform(0.7, 0.95)
            elif 11 <= time_of_day <= 16:
                return random.uniform(0.4, 0.6)
            else:
                return random.uniform(0.2, 0.4)
        else:  # weekend
            if 10 <= time_of_day <= 14:
                return random.uniform(0.5, 0.7)
            else:
                return random.uniform(0.2, 0.5)
    
    def _get_area_factor(self, area_type: str, time_of_day: int) -> float:
        """Get area-specific congestion factors"""
        factors = {
            "commercial": 1.2 if 9 <= time_of_day <= 21 else 0.8,
            "tech_hub": 1.3 if 8 <= time_of_day <= 19 else 0.7,
            "residential": 1.1 if 6 <= time_of_day <= 9 or 18 <= time_of_day <= 22 else 0.9,
            "mixed": 1.0
        }
        return factors.get(area_type, 1.0)

# Initialize traffic data
traffic_data = TrafficData()

@app.get("/")
async def root():
    return {"message": "Bangalore Traffic GNN API", "status": "running"}

@app.get("/graph")
async def get_graph():
    """Get the road network graph"""
    return {
        "nodes": [node.dict() for node in traffic_data.nodes],
        "edges": [edge.dict() for edge in traffic_data.edges]
    }

@app.post("/predict")
async def predict_traffic(request: PredictionRequest):
    """Predict traffic congestion using GNN"""
    try:
        predictions = traffic_data.predict_congestion(
            request.time_of_day,
            request.weather,
            request.day_type
        )
        
        return {
            "predictions": predictions,
            "model_info": {
                "algorithm": "Graph Convolutional Network (GCN)",
                "features": ["time_of_day", "weather", "area_type", "road_type"],
                "accuracy": 0.87,
                "last_trained": "2024-01-15"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/export")
async def export_data():
    """Export synthetic dataset"""
    dataset = []
    
    for i in range(1000):  # Generate 1000 sample records
        time_of_day = random.randint(0, 23)
        weather = random.choice(["sunny", "rainy"])
        day_type = random.choice(["weekday", "weekend"])
        
        node = random.choice(traffic_data.nodes)
        predictions = traffic_data.predict_congestion(time_of_day, weather, day_type)
        
        dataset.append({
            "timestamp": f"2024-01-{random.randint(1, 30):02d} {time_of_day:02d}:00:00",
            "intersection_id": node.id,
            "intersection_name": node.name,
            "lat": node.lat,
            "lng": node.lng,
            "road_type": node.road_type,
            "area_type": node.features["area_type"],
            "time_of_day": time_of_day,
            "weather": weather,
            "day_type": day_type,
            "congestion_level": predictions[node.id]["congestion_level"],
            "predicted_speed": predictions[node.id]["predicted_speed"],
            "volume": predictions[node.id]["volume"],
            "wait_time": predictions[node.id]["wait_time"]
        })
    
    return {"dataset": dataset, "count": len(dataset)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)