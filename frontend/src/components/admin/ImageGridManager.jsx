import React, { useState, useRef, useEffect } from "react";
import { IoClose } from "react-icons/io5";

function ImageGridManager({ onImagesChange }) {
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [dragIndex, setDragIndex] = useState(null);
  console.log("files: ", files);

  // Generate preview URLs from File[]
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  // Inform parent whenever files change
  useEffect(() => {
    if (onImagesChange) {
      onImagesChange(files); // File[]
    }
  }, [files, onImagesChange]);

  const handleAddClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  const handleDragStart = (index) => {
    setDragIndex(index);
  };

  const handleDrop = (index) => {
    if (dragIndex === null || dragIndex === index) return;
    setFiles((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(index, 0, moved);
      return updated;
    });
    setDragIndex(null);
  };

  const handleDelete = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-lg font-semibold text-slate-900">Images</h2>
        <p className="text-xs text-slate-500">
          Drag to reorder, click × to remove.
        </p>
      </div>

      <div
        className="
          grid gap-3
          grid-cols-2
          sm:grid-cols-3
          md:grid-cols-5
        "
      >
        {files.map((file, index) => (
          <div
            key={index}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(index)}
            className="relative w-full aspect-square rounded-xl border-2 overflow-hidden bg-white cursor-grab active:cursor-grabbing transition shadow-sm border-slate-200 hover:border-indigo-300 hover:shadow-md"
          >
            <img
              src={previews[index]}
              alt={file.name}
              className="w-full h-full object-cover"
            />

            <button
              type="button"
              onClick={() => handleDelete(index)}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 text-white text-xs flex items-center justify-center shadow hover:bg-rose-700"
              title="Delete"
            >
              <IoClose />
            </button>
          </div>
        ))}

        {/* Add image box */}
        <button
          type="button"
          onClick={handleAddClick}
          className="relative w-full aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 hover:border-indigo-400 hover:text-indigo-500 bg-slate-50/60 hover:bg-indigo-50/60 transition"
        >
          <span className="text-3xl leading-none mb-1">＋</span>
          <span className="text-xs font-medium">Add image</span>
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

export default ImageGridManager;
