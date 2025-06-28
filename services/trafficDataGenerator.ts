import { GraphNode, GraphEdge, TrafficPrediction } from '../types';

export class TrafficDataGenerator {
  private nodes: GraphNode[] = [];
  private edges: GraphEdge[] = [];
  private gnnWeights: number[][] = [];

  constructor() {
    this.generateBangaloreNodes();
    this.generateEdges();
    this.initializeGNN();
  }

  private generateBangaloreNodes(): void {
    const majorAreas = [
      { name: "MG Road", lat: 12.9716, lng: 77.5946, type: "commercial" },
      { name: "Brigade Road", lat: 12.9698, lng: 77.6103, type: "commercial" },
      { name: "Whitefield", lat: 12.9698, lng: 77.7500, type: "tech_hub" },
      { name: "Electronic City", lat: 12.8456, lng: 77.6603, type: "tech_hub" },
      { name: "Koramangala", lat: 12.9352, lng: 77.6245, type: "residential" },
      { name: "Indiranagar", lat: 12.9719, lng: 77.6412, type: "mixed" },
      { name: "Jayanagar", lat: 12.9279, lng: 77.5830, type: "residential" },
      { name: "Banashankari", lat: 12.9081, lng: 77.5574, type: "residential" },
      { name: "Marathahalli", lat: 12.9591, lng: 77.6974, type: "tech_hub" },
      { name: "HSR Layout", lat: 12.9082, lng: 77.6476, type: "residential" },
      { name: "Silk Board", lat: 12.9165, lng: 77.6224, type: "junction" },
      { name: "Hebbal", lat: 13.0358, lng: 77.5970, type: "junction" },
      { name: "Bellandur", lat: 12.9259, lng: 77.6815, type: "tech_hub" },
      { name: "BTM Layout", lat: 12.9165, lng: 77.6101, type: "residential" },
      { name: "Rajajinagar", lat: 12.9915, lng: 77.5554, type: "residential" }
    ];

    let nodeId = 0;
    
    for (const area of majorAreas) {
      // Generate multiple intersections per area
      const intersectionCount = Math.floor(Math.random() * 5) + 4; // 4-8 intersections
      
      for (let i = 0; i < intersectionCount; i++) {
        const latOffset = (Math.random() - 0.5) * 0.02;
        const lngOffset = (Math.random() - 0.5) * 0.02;
        
        const roadTypes = ["highway", "arterial", "local"];
        const weights = area.type === "residential" ? [0.2, 0.3, 0.5] : [0.4, 0.4, 0.2];
        const roadType = this.weightedChoice(roadTypes, weights);
        
        const node: GraphNode = {
          id: `node_${nodeId}`,
          name: `${area.name} Junction ${i + 1}`,
          lat: area.lat + latOffset,
          lng: area.lng + lngOffset,
          road_type: roadType,
          features: {
            area_type: area.type,
            capacity: Math.floor(Math.random() * 400) + 100,
            signal_count: Math.floor(Math.random() * 5) + 2
          }
        };
        
        this.nodes.push(node);
        nodeId++;
      }
    }
  }

  private generateEdges(): void {
    for (let i = 0; i < this.nodes.length; i++) {
      const node1 = this.nodes[i];
      const distances: Array<{ index: number; distance: number }> = [];
      
      for (let j = 0; j < this.nodes.length; j++) {
        if (i !== j) {
          const node2 = this.nodes[j];
          const distance = this.calculateDistance(node1, node2);
          distances.push({ index: j, distance });
        }
      }
      
      distances.sort((a, b) => a.distance - b.distance);
      const connectionCount = Math.floor(Math.random() * 3) + 2; // 2-4 connections
      
      for (let k = 0; k < Math.min(connectionCount, distances.length); k++) {
        const { index: targetIdx, distance } = distances[k];
        
        if (distance < 5.0) { // Only connect nearby intersections
          const targetNode = this.nodes[targetIdx];
          const roadTypes = ["highway", "arterial", "local"];
          
          const edge: GraphEdge = {
            source: node1.id,
            target: targetNode.id,
            distance,
            road_type: roadTypes[Math.floor(Math.random() * roadTypes.length)],
            weight: 1.0
          };
          
          // Avoid duplicate edges
          const exists = this.edges.some(e => 
            (e.source === edge.source && e.target === edge.target) ||
            (e.source === edge.target && e.target === edge.source)
          );
          
          if (!exists) {
            this.edges.push(edge);
          }
        }
      }
    }
  }

  private calculateDistance(node1: GraphNode, node2: GraphNode): number {
    const latDiff = node1.lat - node2.lat;
    const lngDiff = node1.lng - node2.lng;
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // Approximate km
  }

  private weightedChoice<T>(choices: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < choices.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return choices[i];
      }
    }
    
    return choices[choices.length - 1];
  }

  private initializeGNN(): void {
    // Initialize synthetic GNN weights for each node (4 features)
    this.gnnWeights = this.nodes.map(() => [
      Math.random() * 2 - 1, // time feature weight
      Math.random() * 2 - 1, // weather feature weight
      Math.random() * 2 - 1, // area type feature weight
      Math.random() * 2 - 1  // road type feature weight
    ]);
  }

  public getGraphData() {
    return {
      nodes: this.nodes,
      edges: this.edges
    };
  }

  public predictCongestion(timeOfDay: number, weather: string, dayType: string): Record<string, TrafficPrediction> {
    const predictions: Record<string, TrafficPrediction> = {};
    
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      const weights = this.gnnWeights[i];
      
      // Create feature vector
      const timeFeature = this.getTimeFeature(timeOfDay, dayType);
      const weatherFeature = weather === 'rainy' ? 1.3 : 1.0;
      const areaFeature = this.getAreaFeature(node.features.area_type, timeOfDay);
      const roadFeature = this.getRoadTypeFeature(node.road_type);
      
      // Simulate GNN computation with neighbor aggregation
      const neighborInfluence = this.getNeighborInfluence(node.id, timeOfDay, weather, dayType);
      
      // Weighted sum with GNN weights
      let congestionLevel = (
        weights[0] * timeFeature +
        weights[1] * weatherFeature +
        weights[2] * areaFeature +
        weights[3] * roadFeature +
        neighborInfluence * 0.3
      );
      
      // Apply sigmoid activation and normalize
      congestionLevel = 1 / (1 + Math.exp(-congestionLevel));
      congestionLevel = Math.max(0.1, Math.min(1.0, congestionLevel));
      
      // Add some realistic noise
      congestionLevel += (Math.random() - 0.5) * 0.1;
      congestionLevel = Math.max(0.05, Math.min(0.95, congestionLevel));
      
      predictions[node.id] = {
        congestion_level: Math.round(congestionLevel * 1000) / 1000,
        predicted_speed: Math.round((40 * (1 - congestionLevel)) * 10) / 10,
        volume: Math.floor(Math.random() * 250) + 50,
        wait_time: Math.round(congestionLevel * 180 * 10) / 10
      };
    }
    
    return predictions;
  }

  private getTimeFeature(timeOfDay: number, dayType: string): number {
    if (dayType === "weekday") {
      if ((timeOfDay >= 7 && timeOfDay <= 10) || (timeOfDay >= 17 && timeOfDay <= 20)) {
        return 0.8 + Math.random() * 0.2; // Rush hour
      } else if (timeOfDay >= 11 && timeOfDay <= 16) {
        return 0.4 + Math.random() * 0.2; // Moderate
      } else {
        return 0.1 + Math.random() * 0.2; // Low
      }
    } else {
      if (timeOfDay >= 10 && timeOfDay <= 14) {
        return 0.5 + Math.random() * 0.2; // Weekend moderate
      } else {
        return 0.2 + Math.random() * 0.2; // Weekend low
      }
    }
  }

  private getAreaFeature(areaType: string, timeOfDay: number): number {
    const factors: Record<string, number> = {
      commercial: (timeOfDay >= 9 && timeOfDay <= 21) ? 1.2 : 0.8,
      tech_hub: (timeOfDay >= 8 && timeOfDay <= 19) ? 1.3 : 0.7,
      residential: (timeOfDay >= 6 && timeOfDay <= 9) || (timeOfDay >= 18 && timeOfDay <= 22) ? 1.1 : 0.9,
      mixed: 1.0,
      junction: 1.1
    };
    return factors[areaType] || 1.0;
  }

  private getRoadTypeFeature(roadType: string): number {
    const factors: Record<string, number> = {
      highway: 1.2,
      arterial: 1.0,
      local: 0.8
    };
    return factors[roadType] || 1.0;
  }

  private getNeighborInfluence(nodeId: string, timeOfDay: number, weather: string, dayType: string): number {
    // Find connected neighbors
    const connectedEdges = this.edges.filter(edge => 
      edge.source === nodeId || edge.target === nodeId
    );
    
    if (connectedEdges.length === 0) return 0;
    
    // Simulate neighbor congestion influence
    let totalInfluence = 0;
    for (const edge of connectedEdges) {
      const neighborId = edge.source === nodeId ? edge.target : edge.source;
      const neighbor = this.nodes.find(n => n.id === neighborId);
      
      if (neighbor) {
        const neighborCongestion = this.getBaseCongestion(neighbor, timeOfDay, dayType);
        const weatherFactor = weather === 'rainy' ? 1.2 : 1.0;
        totalInfluence += neighborCongestion * weatherFactor / edge.distance;
      }
    }
    
    return totalInfluence / connectedEdges.length;
  }

  private getBaseCongestion(node: GraphNode, timeOfDay: number, dayType: string): number {
    const timeFeature = this.getTimeFeature(timeOfDay, dayType);
    const areaFeature = this.getAreaFeature(node.features.area_type, timeOfDay);
    return (timeFeature + areaFeature) / 2;
  }

  public generateDataset(sampleCount: number = 1000) {
    const dataset = [];
    
    for (let i = 0; i < sampleCount; i++) {
      const timeOfDay = Math.floor(Math.random() * 24);
      const weather = Math.random() > 0.7 ? 'rainy' : 'sunny';
      const dayType = Math.random() > 0.7 ? 'weekend' : 'weekday';
      
      const node = this.nodes[Math.floor(Math.random() * this.nodes.length)];
      const predictions = this.predictCongestion(timeOfDay, weather, dayType);
      const prediction = predictions[node.id];
      
      dataset.push({
        timestamp: `2024-01-${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')} ${String(timeOfDay).padStart(2, '0')}:00:00`,
        intersection_id: node.id,
        intersection_name: node.name,
        lat: node.lat,
        lng: node.lng,
        road_type: node.road_type,
        area_type: node.features.area_type,
        time_of_day: timeOfDay,
        weather,
        day_type: dayType,
        congestion_level: prediction.congestion_level,
        predicted_speed: prediction.predicted_speed,
        volume: prediction.volume,
        wait_time: prediction.wait_time
      });
    }
    
    return dataset;
  }
}