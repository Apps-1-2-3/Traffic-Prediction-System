import { TrafficDataGenerator } from './trafficDataGenerator';
import { PredictionResponse } from '../types';

class FrontendTrafficAPI {
  private dataGenerator: TrafficDataGenerator;

  constructor() {
    this.dataGenerator = new TrafficDataGenerator();
  }

  async fetchGraph() {
    // Simulate API delay for realism
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.dataGenerator.getGraphData();
  }

  async predictTraffic(params: {
    time_of_day: number;
    weather: string;
    day_type: string;
  }): Promise<PredictionResponse> {
    // Simulate API delay for realism
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const predictions = this.dataGenerator.predictCongestion(
      params.time_of_day,
      params.weather,
      params.day_type
    );
    
    return {
      predictions,
      model_info: {
        algorithm: "Graph Convolutional Network (GCN)",
        features: ["time_of_day", "weather", "area_type", "road_type"],
        accuracy: 0.87,
        last_trained: "2024-01-15"
      }
    };
  }

  async exportData() {
    // Simulate API delay for realism
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const dataset = this.dataGenerator.generateDataset(1000);
    
    return {
      dataset,
      count: dataset.length
    };
  }
}

// Export singleton instance
export const TrafficAPI = new FrontendTrafficAPI();