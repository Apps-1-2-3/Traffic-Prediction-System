import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphNode, GraphEdge, TrafficPrediction } from '../types';

interface NetworkGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  predictions: Record<string, TrafficPrediction>;
  onNodeSelect: (node: GraphNode | null) => void;
  selectedNode: GraphNode | null;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  nodes,
  edges,
  predictions,
  onNodeSelect,
  selectedNode
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    content: ''
  });

  // Handle responsive sizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(600, rect.width - 48), // Account for padding
          height: Math.max(500, Math.min(700, rect.width * 0.75))
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const getCongestionColor = (level: number) => {
    // Smooth gradient from green to yellow to red
    if (level < 0.5) {
      const ratio = level * 2;
      const red = Math.floor(255 * ratio);
      const green = 255;
      return `rgb(${red}, ${green}, 0)`;
    } else {
      const ratio = (level - 0.5) * 2;
      const red = 255;
      const green = Math.floor(255 * (1 - ratio));
      return `rgb(${red}, ${green}, 0)`;
    }
  };

  const getRoadWidth = (roadType: string, congestionLevel: number = 0) => {
    const baseWidths = {
      highway: 6,
      arterial: 4,
      local: 2
    };
    const base = baseWidths[roadType as keyof typeof baseWidths] || 2;
    return base + (congestionLevel * 2); // Thicker roads for higher congestion
  };

  const getNodeSize = (roadType: string, congestionLevel: number = 0) => {
    const baseSizes = {
      highway: 12,
      arterial: 9,
      local: 6
    };
    const base = baseSizes[roadType as keyof typeof baseSizes] || 6;
    return base + (congestionLevel * 4); // Larger nodes for higher congestion
  };

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;
    const margin = 40;

    // Calculate bounds for Bangalore coordinates with padding
    const latExtent = d3.extent(nodes, d => d.lat) as [number, number];
    const lngExtent = d3.extent(nodes, d => d.lng) as [number, number];

    // Add padding to extents
    const latPadding = (latExtent[1] - latExtent[0]) * 0.1;
    const lngPadding = (lngExtent[1] - lngExtent[0]) * 0.1;

    const xScale = d3.scaleLinear()
      .domain([lngExtent[0] - lngPadding, lngExtent[1] + lngPadding])
      .range([margin, width - margin]);

    const yScale = d3.scaleLinear()
      .domain([latExtent[0] - latPadding, latExtent[1] + latPadding])
      .range([height - margin, margin]);

    // Create background with grid
    const defs = svg.append("defs");
    
    // Grid pattern
    const pattern = defs.append("pattern")
      .attr("id", "grid")
      .attr("width", 20)
      .attr("height", 20)
      .attr("patternUnits", "userSpaceOnUse");

    pattern.append("path")
      .attr("d", "M 20 0 L 0 0 0 20")
      .attr("fill", "none")
      .attr("stroke", "#374151")
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.3);

    // Background
    svg.append("rect")
       .attr("width", width)
       .attr("height", height)
       .attr("fill", "url(#grid)")
       .attr("stroke", "#4b5563")
       .attr("stroke-width", 2)
       .attr("rx", 12);

    // Add city boundary outline
    svg.append("rect")
       .attr("x", margin)
       .attr("y", margin)
       .attr("width", width - 2 * margin)
       .attr("height", height - 2 * margin)
       .attr("fill", "none")
       .attr("stroke", "#6b7280")
       .attr("stroke-width", 2)
       .attr("stroke-dasharray", "5,5")
       .attr("rx", 8)
       .attr("opacity", 0.5);

    // Create gradients for roads
    const roadGradient = defs.append("linearGradient")
      .attr("id", "road-gradient")
      .attr("x1", "0%")
      .attr("x2", "100%");

    roadGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#6b7280")
      .attr("stop-opacity", 0.8);

    roadGradient.append("stop")
      .attr("offset", "50%")
      .attr("stop-color", "#9ca3af")
      .attr("stop-opacity", 1);

    roadGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#6b7280")
      .attr("stop-opacity", 0.8);

    // Draw edges with enhanced styling
    const edgeGroups = svg.selectAll(".edge-group")
       .data(edges)
       .enter()
       .append("g")
       .attr("class", "edge-group");

    // Road shadows
    edgeGroups.append("line")
       .attr("class", "road-shadow")
       .attr("x1", d => {
         const sourceNode = nodes.find(n => n.id === d.source);
         return sourceNode ? xScale(sourceNode.lng) : 0;
       })
       .attr("y1", d => {
         const sourceNode = nodes.find(n => n.id === d.source);
         return sourceNode ? yScale(sourceNode.lat) : 0;
       })
       .attr("x2", d => {
         const targetNode = nodes.find(n => n.id === d.target);
         return targetNode ? xScale(targetNode.lng) : 0;
       })
       .attr("y2", d => {
         const targetNode = nodes.find(n => n.id === d.target);
         return targetNode ? yScale(targetNode.lat) : 0;
       })
       .attr("stroke", "#000000")
       .attr("stroke-width", d => getRoadWidth(d.road_type) + 2)
       .attr("opacity", 0.3)
       .attr("transform", "translate(2, 2)");

    // Main roads
    edgeGroups.append("line")
       .attr("class", "road")
       .attr("x1", d => {
         const sourceNode = nodes.find(n => n.id === d.source);
         return sourceNode ? xScale(sourceNode.lng) : 0;
       })
       .attr("y1", d => {
         const sourceNode = nodes.find(n => n.id === d.source);
         return sourceNode ? yScale(sourceNode.lat) : 0;
       })
       .attr("x2", d => {
         const targetNode = nodes.find(n => n.id === d.target);
         return targetNode ? xScale(targetNode.lng) : 0;
       })
       .attr("y2", d => {
         const targetNode = nodes.find(n => n.id === d.target);
         return targetNode ? yScale(targetNode.lat) : 0;
       })
       .attr("stroke", d => {
         // Color roads based on average congestion of connected nodes
         const sourceNode = nodes.find(n => n.id === d.source);
         const targetNode = nodes.find(n => n.id === d.target);
         if (sourceNode && targetNode && predictions[sourceNode.id] && predictions[targetNode.id]) {
           const avgCongestion = (predictions[sourceNode.id].congestion_level + predictions[targetNode.id].congestion_level) / 2;
           return getCongestionColor(avgCongestion);
         }
         return "url(#road-gradient)";
       })
       .attr("stroke-width", d => {
         const sourceNode = nodes.find(n => n.id === d.source);
         const targetNode = nodes.find(n => n.id === d.target);
         let avgCongestion = 0;
         if (sourceNode && targetNode && predictions[sourceNode.id] && predictions[targetNode.id]) {
           avgCongestion = (predictions[sourceNode.id].congestion_level + predictions[targetNode.id].congestion_level) / 2;
         }
         return getRoadWidth(d.road_type, avgCongestion);
       })
       .attr("opacity", 0.8)
       .attr("stroke-linecap", "round");

    // Road center lines for highways
    edgeGroups.filter(d => d.road_type === "highway")
       .append("line")
       .attr("class", "road-centerline")
       .attr("x1", d => {
         const sourceNode = nodes.find(n => n.id === d.source);
         return sourceNode ? xScale(sourceNode.lng) : 0;
       })
       .attr("y1", d => {
         const sourceNode = nodes.find(n => n.id === d.source);
         return sourceNode ? yScale(sourceNode.lat) : 0;
       })
       .attr("x2", d => {
         const targetNode = nodes.find(n => n.id === d.target);
         return targetNode ? xScale(targetNode.lng) : 0;
       })
       .attr("y2", d => {
         const targetNode = nodes.find(n => n.id === d.target);
         return targetNode ? yScale(targetNode.lat) : 0;
       })
       .attr("stroke", "#ffffff")
       .attr("stroke-width", 1)
       .attr("stroke-dasharray", "3,3")
       .attr("opacity", 0.6);

    // Draw nodes with enhanced styling
    const nodeGroups = svg.selectAll(".node-group")
       .data(nodes)
       .enter()
       .append("g")
       .attr("class", "node-group")
       .attr("transform", d => `translate(${xScale(d.lng)}, ${yScale(d.lat)})`)
       .style("cursor", "pointer");

    // Node shadows
    nodeGroups.append("circle")
       .attr("class", "node-shadow")
       .attr("r", d => {
         const prediction = predictions[d.id];
         const congestionLevel = prediction ? prediction.congestion_level : 0;
         return getNodeSize(d.road_type, congestionLevel) + 2;
       })
       .attr("fill", "#000000")
       .attr("opacity", 0.3)
       .attr("transform", "translate(2, 2)");

    // Node outer rings
    nodeGroups.append("circle")
       .attr("class", "node-ring")
       .attr("r", d => {
         const prediction = predictions[d.id];
         const congestionLevel = prediction ? prediction.congestion_level : 0;
         return getNodeSize(d.road_type, congestionLevel) + 3;
       })
       .attr("fill", "none")
       .attr("stroke", d => selectedNode?.id === d.id ? "#fbbf24" : "#ffffff")
       .attr("stroke-width", d => selectedNode?.id === d.id ? 3 : 1)
       .attr("opacity", 0.8);

    // Main node circles
    nodeGroups.append("circle")
       .attr("class", "node-main")
       .attr("r", d => {
         const prediction = predictions[d.id];
         const congestionLevel = prediction ? prediction.congestion_level : 0;
         return getNodeSize(d.road_type, congestionLevel);
       })
       .attr("fill", d => {
         const prediction = predictions[d.id];
         return prediction ? getCongestionColor(prediction.congestion_level) : '#6b7280';
       })
       .attr("stroke", "#ffffff")
       .attr("stroke-width", 1)
       .attr("opacity", 0.9);

    // Node inner highlights
    nodeGroups.append("circle")
       .attr("class", "node-highlight")
       .attr("r", d => {
         const prediction = predictions[d.id];
         const congestionLevel = prediction ? prediction.congestion_level : 0;
         return getNodeSize(d.road_type, congestionLevel) * 0.3;
       })
       .attr("fill", "#ffffff")
       .attr("opacity", 0.4)
       .attr("transform", "translate(-2, -2)");

    // Node labels with better positioning
    nodeGroups.append("text")
       .attr("class", "node-label")
       .attr("dx", d => {
         const prediction = predictions[d.id];
         const congestionLevel = prediction ? prediction.congestion_level : 0;
         return getNodeSize(d.road_type, congestionLevel) + 8;
       })
       .attr("dy", 4)
       .attr("fill", "#f9fafb")
       .attr("font-size", d => d.road_type === "highway" ? "12px" : "10px")
       .attr("font-weight", d => d.road_type === "highway" ? "600" : "500")
       .attr("text-shadow", "1px 1px 2px rgba(0,0,0,0.8)")
       .text(d => {
         const words = d.name.split(' ');
         if (d.road_type === "highway") {
           return words.slice(0, 3).join(' ');
         } else if (d.road_type === "arterial") {
           return words.slice(0, 2).join(' ');
         }
         return '';
       });

    // Traffic flow indicators for high congestion nodes
    nodeGroups.filter(d => {
      const prediction = predictions[d.id];
      return prediction && prediction.congestion_level > 0.7;
    }).append("circle")
       .attr("class", "traffic-indicator")
       .attr("r", 3)
       .attr("fill", "#ef4444")
       .attr("opacity", 0)
       .attr("transform", "translate(15, -15)")
       .transition()
       .duration(1000)
       .ease(d3.easeSinInOut)
       .attr("opacity", 1)
       .transition()
       .duration(1000)
       .attr("opacity", 0)
       .on("end", function() {
         d3.select(this).transition().duration(1000).attr("opacity", 1)
           .transition().duration(1000).attr("opacity", 0)
           .on("end", function() { d3.select(this).remove(); });
       });

    // Add interaction with enhanced feedback
    nodeGroups
       .on("click", (event, d) => {
         onNodeSelect(selectedNode?.id === d.id ? null : d);
       })
       .on("mouseover", function(event, d) {
         // Highlight connected roads
         svg.selectAll(".road")
           .filter(edge => edge.source === d.id || edge.target === d.id)
           .transition()
           .duration(200)
           .attr("stroke-width", edge => getRoadWidth(edge.road_type) + 2)
           .attr("opacity", 1);

         // Scale up node
         d3.select(this).select(".node-main")
           .transition()
           .duration(200)
           .attr("r", () => {
             const prediction = predictions[d.id];
             const congestionLevel = prediction ? prediction.congestion_level : 0;
             return getNodeSize(d.road_type, congestionLevel) * 1.2;
           });

         const prediction = predictions[d.id];
         if (prediction) {
           setTooltip({
             visible: true,
             x: event.pageX + 10,
             y: event.pageY - 10,
             content: `${d.name}
Area: ${d.features.area_type}
Road Type: ${d.road_type}
Congestion: ${(prediction.congestion_level * 100).toFixed(1)}%
Speed: ${prediction.predicted_speed} km/h
Volume: ${prediction.volume} vehicles
Wait Time: ${prediction.wait_time}s`
           });
         }
       })
       .on("mouseout", function(event, d) {
         // Reset road highlighting
         svg.selectAll(".road")
           .transition()
           .duration(200)
           .attr("stroke-width", edge => {
             const sourceNode = nodes.find(n => n.id === edge.source);
             const targetNode = nodes.find(n => n.id === edge.target);
             let avgCongestion = 0;
             if (sourceNode && targetNode && predictions[sourceNode.id] && predictions[targetNode.id]) {
               avgCongestion = (predictions[sourceNode.id].congestion_level + predictions[targetNode.id].congestion_level) / 2;
             }
             return getRoadWidth(edge.road_type, avgCongestion);
           })
           .attr("opacity", 0.8);

         // Reset node size
         d3.select(this).select(".node-main")
           .transition()
           .duration(200)
           .attr("r", () => {
             const prediction = predictions[d.id];
             const congestionLevel = prediction ? prediction.congestion_level : 0;
             return getNodeSize(d.road_type, congestionLevel);
           });

         setTooltip(prev => ({ ...prev, visible: false }));
       });

    // Enhanced legend
    const legend = svg.append("g")
       .attr("transform", `translate(${width - 180}, 20)`);

    legend.append("rect")
       .attr("width", 170)
       .attr("height", 140)
       .attr("fill", "#1f2937")
       .attr("stroke", "#4b5563")
       .attr("stroke-width", 2)
       .attr("rx", 8)
       .attr("opacity", 0.95);

    legend.append("text")
       .attr("x", 15)
       .attr("y", 20)
       .attr("fill", "#f9fafb")
       .attr("font-size", "14px")
       .attr("font-weight", "700")
       .text("Traffic Legend");

    // Congestion gradient
    const congestionGradient = defs.append("linearGradient")
       .attr("id", "congestion-legend-gradient")
       .attr("x1", "0%")
       .attr("x2", "100%");

    congestionGradient.append("stop")
       .attr("offset", "0%")
       .attr("stop-color", "#10b981");

    congestionGradient.append("stop")
       .attr("offset", "50%")
       .attr("stop-color", "#f59e0b");

    congestionGradient.append("stop")
       .attr("offset", "100%")
       .attr("stop-color", "#ef4444");

    legend.append("rect")
       .attr("x", 15)
       .attr("y", 35)
       .attr("width", 140)
       .attr("height", 12)
       .attr("fill", "url(#congestion-legend-gradient)")
       .attr("rx", 2);

    legend.append("text")
       .attr("x", 15)
       .attr("y", 60)
       .attr("fill", "#10b981")
       .attr("font-size", "11px")
       .attr("font-weight", "500")
       .text("Low");

    legend.append("text")
       .attr("x", 135)
       .attr("y", 60)
       .attr("fill", "#ef4444")
       .attr("font-size", "11px")
       .attr("font-weight", "500")
       .text("High");

    // Road type legend
    const roadTypes = [
      { type: "highway", label: "Highway", width: 6, color: "#9ca3af" },
      { type: "arterial", label: "Arterial", width: 4, color: "#6b7280" },
      { type: "local", label: "Local", width: 2, color: "#4b5563" }
    ];

    roadTypes.forEach((road, i) => {
      const y = 80 + i * 18;
      
      legend.append("line")
        .attr("x1", 15)
        .attr("x2", 35)
        .attr("y1", y)
        .attr("y2", y)
        .attr("stroke", road.color)
        .attr("stroke-width", road.width)
        .attr("stroke-linecap", "round");

      legend.append("text")
        .attr("x", 45)
        .attr("y", y + 4)
        .attr("fill", "#d1d5db")
        .attr("font-size", "11px")
        .text(road.label);
    });

  }, [nodes, edges, predictions, selectedNode, dimensions]);

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="border border-gray-600 rounded-lg bg-gray-900 shadow-2xl"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      
      {tooltip.visible && (
        <div
          className="absolute bg-gray-900 text-white p-3 rounded-lg shadow-xl text-xs whitespace-pre-line z-20 border border-gray-600 max-w-xs"
          style={{
            left: Math.min(tooltip.x, window.innerWidth - 200),
            top: Math.max(10, tooltip.y - 100),
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(17, 24, 39, 0.95)'
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};