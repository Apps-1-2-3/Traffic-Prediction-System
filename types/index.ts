export interface GraphNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  road_type: string;
  features: {
    area_type: string;
    capacity: number;
    signal_count: number;
  };
}

export interface GraphEdge {
  source: string;
  target: string;
  distance: number;
  road_type: string;
  weight: number;
}

export interface TrafficPrediction {
  congestion_level: number;
  predicted_speed: number;
  volume: number;
  wait_time: number;
}

export interface PredictionResponse {
  predictions: Record<string, TrafficPrediction>;
  model_info: {
    algorithm: string;
    features: string[];
    accuracy: number;
    last_trained: string;
  };
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface SimulationState {
  time_of_day: number;
  weather: 'sunny' | 'rainy';
  day_type: 'weekday' | 'weekend';
  isPlaying: boolean;
  speed: number;
}