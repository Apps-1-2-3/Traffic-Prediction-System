import React from 'react';
import { Play, Pause, RotateCcw, Download, Cloud, Sun, Calendar, Clock } from 'lucide-react';
import { SimulationState } from '../types';

interface ControlPanelProps {
  simulationState: SimulationState;
  onSimulationChange: (updates: Partial<SimulationState>) => void;
  onReset: () => void;
  onExport: () => void;
  isLoading: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  simulationState,
  onSimulationChange,
  onReset,
  onExport,
  isLoading
}) => {
  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-blue-400" />
        Simulation Controls
      </h3>
      
      <div className="space-y-6">
        {/* Time Control */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Time of Day: {formatTime(simulationState.time_of_day)}
          </label>
          <input
            type="range"
            min="0"
            max="23"
            value={simulationState.time_of_day}
            onChange={(e) => onSimulationChange({ time_of_day: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>12 AM</span>
            <span>6 AM</span>
            <span>12 PM</span>
            <span>6 PM</span>
            <span>11 PM</span>
          </div>
        </div>

        {/* Weather Control */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Weather Conditions
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => onSimulationChange({ weather: 'sunny' })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border transition-colors ${
                simulationState.weather === 'sunny'
                  ? 'bg-yellow-600 border-yellow-500 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Sun className="w-4 h-4" />
              Sunny
            </button>
            <button
              onClick={() => onSimulationChange({ weather: 'rainy' })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border transition-colors ${
                simulationState.weather === 'rainy'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Cloud className="w-4 h-4" />
              Rainy
            </button>
          </div>
        </div>

        {/* Day Type Control */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Day Type
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => onSimulationChange({ day_type: 'weekday' })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border transition-colors ${
                simulationState.day_type === 'weekday'
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Weekday
            </button>
            <button
              onClick={() => onSimulationChange({ day_type: 'weekend' })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border transition-colors ${
                simulationState.day_type === 'weekend'
                  ? 'bg-green-600 border-green-500 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Weekend
            </button>
          </div>
        </div>

        {/* Simulation Speed */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Simulation Speed: {simulationState.speed}x
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={simulationState.speed}
            onChange={(e) => onSimulationChange({ speed: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onSimulationChange({ isPlaying: !simulationState.isPlaying })}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {simulationState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {simulationState.isPlaying ? 'Pause' : 'Play'}
          </button>
          
          <button
            onClick={onReset}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>

        {/* Export Button */}
        <button
          onClick={onExport}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Dataset
        </button>
      </div>
    </div>
  );
};