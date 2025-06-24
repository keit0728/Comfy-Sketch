"use client";

import { useAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Plus, Trash2, GripVertical } from "lucide-react";
import * as THREE from "three";
import {
  layersAtom,
  activeLayerIdAtom,
  createLayerAtom,
  deleteLayerAtom,
  toggleLayerVisibilityAtom,
  updateLayerOpacityAtom,
  reorderLayersAtom,
} from "@/stores/sketchStore";
import { useState } from "react";

interface LayerItemProps {
  layer: {
    id: string;
    name: string;
    visible: boolean;
    opacity: number;
    zIndex: number;
    canvas: HTMLCanvasElement | null;
    texture: THREE.CanvasTexture | null;
  };
  isActive: boolean;
  index: number;
  onSelect: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onDelete: (layerId: string) => void;
  onOpacityChange: (layerId: string, opacity: number) => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  isDragOver: boolean;
}

function LayerItem({
  layer,
  isActive,
  index,
  onSelect,
  onToggleVisibility,
  onDelete,
  onOpacityChange,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragOver,
}: LayerItemProps) {
  const [showOpacitySlider, setShowOpacitySlider] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", layer.id);
    onDragStart(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    onDragOver(index);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDragEnd();
  };

  return (
    <div
      className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors ${
        isActive ? "bg-blue-100 border border-blue-300" : ""
      } ${isDragOver ? "bg-yellow-100 border-2 border-yellow-300 border-dashed" : ""}`}
      onClick={() => onSelect(layer.id)}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex-1 flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
        <span className="text-sm font-medium">{layer.name}</span>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(layer.id);
          }}
        >
          {layer.visible ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setShowOpacitySlider(!showOpacitySlider);
          }}
        >
          {Math.round(layer.opacity * 100)}%
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(layer.id);
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      {showOpacitySlider && (
        <div className="absolute right-0 mt-8 p-2 bg-white border rounded-md shadow-lg z-10">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={layer.opacity}
            onChange={(e) => onOpacityChange(layer.id, parseFloat(e.target.value))}
            className="w-20"
          />
        </div>
      )}
    </div>
  );
}

export default function LayerPanel() {
  const [layers] = useAtom(layersAtom);
  const [activeLayerId, setActiveLayerId] = useAtom(activeLayerIdAtom);
  const [, createLayer] = useAtom(createLayerAtom);
  const [, deleteLayer] = useAtom(deleteLayerAtom);
  const [, toggleLayerVisibility] = useAtom(toggleLayerVisibilityAtom);
  const [, updateLayerOpacity] = useAtom(updateLayerOpacityAtom);
  const [, reorderLayers] = useAtom(reorderLayersAtom);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleCreateLayer = () => {
    const layerCount = layers.length + 1;
    createLayer(`レイヤー ${layerCount}`);
  };

  const handleDeleteLayer = (layerId: string) => {
    if (layers.length > 1) {
      deleteLayer(layerId);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (index: number) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null) {
      reorderLayers(draggedIndex, dragOverIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Sort layers in top display order (largest zIndex first)
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="w-64 bg-white border-l border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">レイヤー</h3>
          <Button variant="outline" size="sm" onClick={handleCreateLayer}>
            <Plus className="w-4 h-4 mr-1" />
            追加
          </Button>
        </div>
      </div>
      
      <div className="flex-1 p-2 space-y-1 overflow-y-auto">
        {sortedLayers.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">レイヤーがありません</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={handleCreateLayer}>
              最初のレイヤーを作成
            </Button>
          </div>
        ) : (
          sortedLayers.map((layer, index) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              index={index}
              isActive={layer.id === activeLayerId}
              onSelect={setActiveLayerId}
              onToggleVisibility={toggleLayerVisibility}
              onDelete={handleDeleteLayer}
              onOpacityChange={updateLayerOpacity}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              isDragOver={dragOverIndex === index}
            />
          ))
        )}
      </div>
    </div>
  );
}