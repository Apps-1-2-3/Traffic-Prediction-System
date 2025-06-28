import { useState, useEffect, useCallback } from 'react';
import { GraphData, PredictionResponse, SimulationState } from '../types';
import { TrafficAPI } from '../services/api';

export const useTrafficSimulation = () => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [predictions, setPredictions] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [simulationState, setSimulationState] = useState<SimulationState>({
    time_of_day: 9,
    weather: 'sunny',
    day_type: 'weekday',
    isPlaying: false,
    speed: 1
  });

  // Load initial graph data
  useEffect(() => {
    const loadGraph = async () => {
      try {
        setIsLoading(true);
        const data = await TrafficAPI.fetchGraph();
        setGraphData(data);
      } catch (err) {
        setError('Failed to load graph data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadGraph();
  }, []);

  // Update predictions when simulation state changes
  const updatePredictions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await TrafficAPI.predictTraffic({
        time_of_day: simulationState.time_of_day,
        weather: simulationState.weather,
        day_type: simulationState.day_type
      });
      
      setPredictions(response);
    } catch (err) {
      setError('Failed to get predictions');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [simulationState.time_of_day, simulationState.weather, simulationState.day_type]);

  // Update predictions when simulation parameters change
  useEffect(() => {
    if (graphData.nodes.length > 0) {
      updatePredictions();
    }
  }, [updatePredictions, graphData.nodes.length]);

  // Auto-play simulation
  useEffect(() => {
    if (!simulationState.isPlaying) return;

    const interval = setInterval(() => {
      setSimulationState(prev => ({
        ...prev,
        time_of_day: (prev.time_of_day + 1) % 24
      }));
    }, 2000 / simulationState.speed);

    return () => clearInterval(interval);
  }, [simulationState.isPlaying, simulationState.speed]);

  const updateSimulation = (updates: Partial<SimulationState>) => {
    setSimulationState(prev => ({ ...prev, ...updates }));
  };

  const resetSimulation = () => {
    setSimulationState({
      time_of_day: 9,
      weather: 'sunny',
      day_type: 'weekday',
      isPlaying: false,
      speed: 1
    });
  };

  const exportData = async () => {
    try {
      setIsLoading(true);
      const data = await TrafficAPI.exportData();
      
      // Create and download CSV file
      const csv = [
        // Header
        Object.keys(data.dataset[0]).join(','),
        // Data rows
        ...data.dataset.map((row: any) => 
          Object.values(row).map(val => 
            typeof val === 'string' ? `"${val}"` : val
          ).join(',')
        )
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bangalore_traffic_data_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    graphData,
    predictions,
    simulationState,
    isLoading,
    error,
    updateSimulation,
    resetSimulation,
    exportData,
    refreshPredictions: updatePredictions
  };
};