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
} from "@/stores/layer-store";
import { Layer } from "@/lib/drawing/types";
import { Plus, GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface SortableLayerItemProps {
  layer: Layer;
  isActive: boolean;
  onSelect: (layerId: string) => void;
}

const SortableLayerItem: FC<SortableLayerItemProps> = ({
  layer,
  isActive,
  onSelect,
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
        "flex w-full items-center rounded px-2 py-2 text-left text-sm hover:bg-gray-100",
        isActive && "bg-gray-100 font-medium",
        isDragging && "opacity-50",
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="mr-2 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      <button onClick={() => onSelect(layer.id)} className="flex-1 text-left">
        {layer.name}
      </button>
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
  const t = useTranslations("home.toolbar");

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
              onSelect={handleSelectLayer}
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
