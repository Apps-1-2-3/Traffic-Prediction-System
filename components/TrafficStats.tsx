import React from 'react';
import { TrafficPrediction, GraphNode } from '../types';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface TrafficStatsProps {
  predictions: Record<string, TrafficPrediction>;
  nodes: GraphNode[];
  selectedNode: GraphNode | null;
}

export const TrafficStats: React.FC<TrafficStatsProps> = ({
  predictions,
  nodes,
  selectedNode
}) => {
  const getOverallStats = () => {
    const predictionValues = Object.values(predictions);
    if (predictionValues.length === 0) return null;

    const avgCongestion = predictionValues.reduce((sum, p) => sum + p.congestion_level, 0) / predictionValues.length;
    const avgSpeed = predictionValues.reduce((sum, p) => sum + p.predicted_speed, 0) / predictionValues.length;
    const totalVolume = predictionValues.reduce((sum, p) => sum + p.volume, 0);
    const criticalIntersections = predictionValues.filter(p => p.congestion_level > 0.8).length;

    return {
      avgCongestion,
      avgSpeed,
      totalVolume,
      criticalIntersections,
      totalIntersections: predictionValues.length
    };
  };

  const stats = getOverallStats();
  const selectedPrediction = selectedNode ? predictions[selectedNode.id] : null;

  const getCongestionStatus = (level: number) => {
    if (level < 0.3) return { status: 'Low', color: 'text-green-400', icon: CheckCircle };
    if (level < 0.7) return { status: 'Moderate', color: 'text-yellow-400', icon: TrendingUp };
    return { status: 'High', color: 'text-red-400', icon: AlertTriangle };
  };

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Network Overview</h3>
        
        {stats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Avg Congestion</span>
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-1">
                {(stats.avgCongestion * 100).toFixed(1)}%
              </div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Avg Speed</span>
                <TrendingDown className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-1">
                {stats.avgSpeed.toFixed(1)} km/h
              </div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Total Volume</span>
                <TrendingUp className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-1">
                {stats.totalVolume.toLocaleString()}
              </div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Critical Points</span>
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-1">
                {stats.criticalIntersections}/{stats.totalIntersections}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Intersection Details */}
      {selectedNode && selectedPrediction && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Selected Intersection</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-white">{selectedNode.name}</h4>
              <p className="text-sm text-gray-400">
                {selectedNode.features.area_type} • {selectedNode.road_type} road
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-300">Congestion Level</span>
                <div className="flex items-center gap-2">
                  {(() => {
                    const { status, color, icon: Icon } = getCongestionStatus(selectedPrediction.congestion_level);
                    return (
                      <>
                        <Icon className={`w-4 h-4 ${color}`} />
                        <span className={`font-medium ${color}`}>
                          {status} ({(selectedPrediction.congestion_level * 100).toFixed(1)}%)
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-300">Predicted Speed</span>
                <span className="font-medium text-white">
                  {selectedPrediction.predicted_speed} km/h
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-300">Vehicle Volume</span>
                <span className="font-medium text-white">
                  {selectedPrediction.volume} vehicles
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-300">Wait Time</span>
                <span className="font-medium text-white">
                  {selectedPrediction.wait_time}s
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Information */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">GNN Model Info</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Algorithm:</span>
            <span className="text-white font-medium">Graph Convolutional Network</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Accuracy:</span>
            <span className="text-green-400 font-medium">87%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Features:</span>
            <span className="text-white font-medium">4 input features</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Last Updated:</span>
            <span className="text-white font-medium">2024-01-15</span>
          </div>
        </div>
      </div>
    </div>
  );
};