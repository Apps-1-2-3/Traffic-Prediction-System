import React, { useState } from 'react';
import { NetworkGraph } from './components/NetworkGraph';
import { ControlPanel } from './components/ControlPanel';
import { TrafficStats } from './components/TrafficStats';
import { useTrafficSimulation } from './hooks/useTrafficSimulation';
import { GraphNode } from './types';
import { Brain, MapPin, Activity, Navigation } from 'lucide-react';

function App() {
  const {
    graphData,
    predictions,
    simulationState,
    isLoading,
    error,
    updateSimulation,
    resetSimulation,
    exportData
  } = useTrafficSimulation();

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-red-900 border border-red-700 rounded-lg p-6 max-w-md">
          <h2 className="text-red-100 font-semibold mb-2">System Error</h2>
          <p className="text-red-200 text-sm">
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60 sticky top-0 z-30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Bangalore Traffic GNN
                </h1>
                <p className="text-gray-400 text-sm">Real-time Traffic Congestion Prediction</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full border border-gray-700">
                <Navigation className="w-4 h-4 text-green-400" />
                <span>{graphData.nodes.length} Intersections</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full border border-gray-700">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>{graphData.edges.length} Roads</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full border border-gray-700">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className={isLoading ? 'text-yellow-400' : 'text-green-400'}>
                  {isLoading ? 'Computing...' : 'Live GNN'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Network Visualization */}
          <div className="xl:col-span-2">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  Interactive Bangalore Road Network
                </h2>
                <div className="text-xs text-gray-400 bg-gray-700 px-3 py-1 rounded-full">
                  Click intersections for details
                </div>
              </div>
              
              {graphData.nodes.length > 0 ? (
                <div className="relative">
                  <NetworkGraph
                    nodes={graphData.nodes}
                    edges={graphData.edges}
                    predictions={predictions?.predictions || {}}
                    onNodeSelect={setSelectedNode}
                    selectedNode={selectedNode}
                  />
                  
                  {/* Network Info Overlay */}
                  <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur rounded-lg p-3 text-xs border border-gray-600">
                    <div className="text-gray-300 mb-1">Network Status</div>
                    <div className="text-green-400 font-medium">
                      {Object.keys(predictions?.predictions || {}).length} Active Predictions
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-96 bg-gray-700 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    <p className="text-gray-400">Generating Bangalore network...</p>
                    <p className="text-gray-500 text-sm mt-1">Creating realistic traffic graph</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="xl:col-span-1">
            <ControlPanel
              simulationState={simulationState}
              onSimulationChange={updateSimulation}
              onReset={resetSimulation}
              onExport={exportData}
              isLoading={isLoading}
            />
          </div>

          {/* Statistics */}
          <div className="xl:col-span-1">
            <TrafficStats
              predictions={predictions?.predictions || {}}
              nodes={graphData.nodes}
              selectedNode={selectedNode}
            />
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-blue-400 mb-3">GNN Architecture</h3>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>• Graph Convolutional Network (GCN)</li>
              <li>• Neighbor aggregation with distance weighting</li>
              <li>• Multi-feature input vectors</li>
              <li>• Sigmoid activation for congestion levels</li>
            </ul>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-green-400 mb-3">Data Features</h3>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>• Time of day patterns</li>
              <li>• Weather conditions</li>
              <li>• Area type characteristics</li>
              <li>• Road type hierarchy</li>
            </ul>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">Real-time Simulation</h3>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>• Live traffic pattern generation</li>
              <li>• Dynamic congestion updates</li>
              <li>• Interactive visualization</li>
              <li>• Exportable datasets</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
          <p>
            Powered by Graph Neural Networks • Synthetic Bangalore Traffic Data • 
            Real-time Congestion Prediction • Frontend-Only Implementation
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;