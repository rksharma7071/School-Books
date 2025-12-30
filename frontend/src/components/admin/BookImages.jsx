import React, { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ---------------- SORTABLE ITEM ---------------- */
function SortableImage({ img, index, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: img.publicId || img.tempId,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative cursor-grab rounded-lg overflow-hidden border border-gray-400 bg-white shadow-sm active:cursor-grabbing"
    >
      <img
        src={img.url || img.preview}
        className="h-36 w-full object-contain bg-gray-50"
      />

      <button
        type="button"
        onClick={() => onRemove(img)}
        className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition"
      >
        ✕
      </button>

      <span className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
        #{index + 1}
      </span>
    </div>
  );
}

/* ---------------- MAIN COMPONENT ---------------- */
function BookImages({ existingImages, onImagesChange, onMetaChange }) {
  const [images, setImages] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    const mapped = existingImages.map((img) => ({
      ...img,
      isNew: false,
    }));
    setImages(mapped);
  }, [existingImages]);

  /* ---------------- ADD NEW IMAGES ---------------- */
  const handleNewImages = (e) => {
    const files = Array.from(e.target.files);

    const previews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      tempId: crypto.randomUUID(),
      isNew: true,
    }));

    setImages((prev) => [...prev, ...previews]);
    onImagesChange(files);
  };

  /* ---------------- REMOVE IMAGE ---------------- */
  const removeImage = (img) => {
    setImages((prev) => prev.filter((i) => i !== img));

    if (!img.isNew) {
      onMetaChange((prev) => ({
        ...prev,
        removedPublicIds: [...prev.removedPublicIds, img.publicId],
      }));
    }
  };

  /* ---------------- DRAG END ---------------- */
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setImages((prev) => {
      const oldIndex = prev.findIndex(
        (i) => (i.publicId || i.tempId) === active.id
      );
      const newIndex = prev.findIndex(
        (i) => (i.publicId || i.tempId) === over.id
      );

      const updated = arrayMove(prev, oldIndex, newIndex);

      const order = updated.map((img, index) => ({
        publicId: img.publicId || img.tempId,
        position: index + 1,
      }));

      onMetaChange((prevMeta) => ({ ...prevMeta, order }));
      return updated;
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-gray-700">
          Book Images
        </label>
        <span className="text-xs text-gray-400">
          Drag & drop to reorder
        </span>
      </div>

      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
        <input
          type="file"
          multiple
          onChange={handleNewImages}
          className="hidden"
        />
        <p className="text-sm font-medium text-gray-600">
          Click to upload images
        </p>
        <p className="text-xs text-gray-400">PNG, JPG</p>
      </label>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={images.map((i) => i.publicId || i.tempId)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-5">
            {images.map((img, index) => (
              <SortableImage
                key={img.publicId || img.tempId}
                img={img}
                index={index}
                onRemove={removeImage}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

export default BookImages;
