"use client";

import React, { FC, ComponentProps } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  layersAtom,
  currentLayerIdAtom,
  addLayerAtom,
  reorderLayersAtom,
  updateLayerAtom,
  removeLayerAtom,
} from "@/stores/layer-store";
import { Layer } from "@/lib/drawing/types";
import {
  Plus,
  GripVertical,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Edit2,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface SortableLayerItemProps {
  layer: Layer;
  isActive: boolean;
  isEditing: boolean;
  editingName: string;
  onSelect: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onToggleLock: (layerId: string) => void;
  onDelete: (layerId: string) => void;
  onEdit: (layerId: string) => void;
  onEditComplete: () => void;
  onEditNameChange: (name: string) => void;
  onOpacityChange: (layerId: string, opacity: number) => void;
}

const SortableLayerItem: FC<SortableLayerItemProps> = ({
  layer,
  isActive,
  isEditing,
  editingName,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDelete,
  onEdit,
  onEditComplete,
  onEditNameChange,
  onOpacityChange,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: layer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group w-full rounded px-2 py-2 text-left text-sm hover:bg-gray-100",
        isActive && "bg-gray-100 font-medium",
        isDragging && "opacity-50",
      )}
    >
      <div className="flex w-full items-center">
        <div
          {...attributes}
          {...listeners}
          className="mr-2 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        {isEditing ? (
          <input
            type="text"
            value={editingName}
            onChange={(e) => onEditNameChange(e.target.value)}
            onBlur={onEditComplete}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onEditComplete();
              } else if (e.key === "Escape") {
                onEditNameChange(layer.name);
                onEditComplete();
              }
            }}
            className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
            autoFocus
          />
        ) : (
          <button
            onClick={() => onSelect(layer.id)}
            className="flex min-w-0 flex-1 items-center text-left"
          >
            <span className="truncate">{layer.name}</span>
          </button>
        )}
        <button
          onClick={() => onToggleVisibility(layer.id)}
          className="rounded p-1 hover:bg-gray-200"
        >
          {layer.visible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4 text-gray-400" />
          )}
        </button>
        <button
          onClick={() => onToggleLock(layer.id)}
          className="rounded p-1 hover:bg-gray-200"
        >
          {layer.locked ? (
            <Lock className="h-4 w-4" />
          ) : (
            <Unlock className="h-4 w-4 text-gray-400" />
          )}
        </button>
        <button
          onClick={() => onEdit(layer.id)}
          className="rounded p-1 hover:bg-gray-200"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(layer.id)}
          className="rounded p-1 hover:bg-gray-200"
          disabled={isActive}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 flex items-center px-8">
        <span className="mr-2 text-xs text-gray-500">不透明度:</span>
        <Slider
          value={[layer.opacity * 100]}
          onValueChange={([value]: number[]) =>
            onOpacityChange(layer.id, value / 100)
          }
          min={0}
          max={100}
          step={1}
          className="flex-1"
        />
        <span className="ml-2 text-xs text-gray-500">
          {Math.round(layer.opacity * 100)}%
        </span>
      </div>
    </div>
  );
};

interface LayerListProps extends ComponentProps<"div"> {
  onClose?: () => void;
}

export const LayerList: FC<LayerListProps> = ({
  className,
  onClose,
  ...props
}) => {
  const layers = useAtomValue(layersAtom);
  const [currentLayerId, setCurrentLayerId] = useAtom(currentLayerIdAtom);
  const addLayer = useSetAtom(addLayerAtom);
  const reorderLayers = useSetAtom(reorderLayersAtom);
  const updateLayer = useSetAtom(updateLayerAtom);
  const removeLayer = useSetAtom(removeLayerAtom);
  const t = useTranslations("home.toolbar");
  const [editingLayerId, setEditingLayerId] = React.useState<string | null>(
    null,
  );
  const [editingLayerName, setEditingLayerName] = React.useState<string>("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = layers.findIndex((layer) => layer.id === active.id);
      const newIndex = layers.findIndex((layer) => layer.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderLayers(oldIndex, newIndex);
      }
    }
  };

  const handleSelectLayer = (layerId: string) => {
    setCurrentLayerId(layerId);
    onClose?.();
  };

  const handleAddLayer = () => {
    addLayer();
    onClose?.();
  };

  const handleToggleVisibility = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (layer) {
      updateLayer(layerId, { visible: !layer.visible });
    }
  };

  const handleToggleLock = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (layer) {
      updateLayer(layerId, { locked: !layer.locked });
    }
  };

  const handleDelete = (layerId: string) => {
    if (layers.length > 1) {
      removeLayer(layerId);
    }
  };

  const handleEdit = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (layer) {
      setEditingLayerId(layerId);
      setEditingLayerName(layer.name);
    }
  };

  const handleOpacityChange = (layerId: string, opacity: number) => {
    updateLayer(layerId, { opacity });
  };

  const handleEditComplete = () => {
    if (editingLayerId && editingLayerName.trim()) {
      updateLayer(editingLayerId, { name: editingLayerName.trim() });
    }
    setEditingLayerId(null);
    setEditingLayerName("");
  };

  return (
    <div className={cn("space-y-1", className)} {...props}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={layers.map((layer) => layer.id)}
          strategy={verticalListSortingStrategy}
        >
          {layers.map((layer) => (
            <SortableLayerItem
              key={layer.id}
              layer={layer}
              isActive={currentLayerId === layer.id}
              isEditing={editingLayerId === layer.id}
              editingName={editingLayerName}
              onSelect={handleSelectLayer}
              onToggleVisibility={handleToggleVisibility}
              onToggleLock={handleToggleLock}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onEditComplete={handleEditComplete}
              onEditNameChange={setEditingLayerName}
              onOpacityChange={handleOpacityChange}
            />
          ))}
        </SortableContext>
      </DndContext>
      <button
        onClick={handleAddLayer}
        className="flex w-full items-center rounded px-2 py-2 text-left text-sm hover:bg-gray-100"
      >
        <Plus className="mr-2 h-4 w-4" />
        {t("addLayer")}
      </button>
    </div>
  );
};
