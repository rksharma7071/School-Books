import React, { useState, useRef, useEffect } from "react";
import { IoClose } from "react-icons/io5";

function BookImages({
    existingImages = [],
    onImagesChange,
    onMetaChange
}) {
    const fileInputRef = useRef(null);

    const [images, setImages] = useState([]);
    const [dragIndex, setDragIndex] = useState(null);
    const [removedPublicIds, setRemovedPublicIds] = useState([]);

    // 🔹 Load existing images
    useEffect(() => {
        if (existingImages.length) {
            setImages(
                existingImages.map((img) => ({
                    ...img,
                    isExisting: true,
                }))
            );
        }
    }, [existingImages]);

    // 🔹 Send NEW files to parent
    useEffect(() => {
        const newFiles = images
            .filter((img) => !img.isExisting)
            .map((img) => img.file);

        onImagesChange?.(newFiles);
    }, [images]);

    // 🔹 Send meta (removed ids + order)
    useEffect(() => {
        const order = images.map((img) =>
            img.isExisting ? img.publicId : null
        );

        onMetaChange?.({
            removedPublicIds,
            order,
        });
    }, [images, removedPublicIds]);

    const handleAddClick = () => fileInputRef.current?.click();

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);

        const newImages = files.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            isExisting: false,
        }));

        setImages((prev) => [...prev, ...newImages]);
        e.target.value = "";
    };

    const handleDelete = (index) => {
        setImages((prev) => {
            const img = prev[index];

            if (img.isExisting && img.publicId) {
                setRemovedPublicIds((ids) => [...ids, img.publicId]);
            }

            if (!img.isExisting) {
                URL.revokeObjectURL(img.preview);
            }

            return prev.filter((_, i) => i !== index);
        });
    };

    const handleDragStart = (index) => setDragIndex(index);

    const handleDrop = (index) => {
        if (dragIndex === null || dragIndex === index) return;

        setImages((prev) => {
            const updated = [...prev];
            const [moved] = updated.splice(dragIndex, 1);
            updated.splice(index, 0, moved);
            return updated;
        });

        setDragIndex(null);
    };

    return (
        <div className="w-full bg-white rounded-2xl border border-gray-300 p-5">
            <div className="flex items-center gap-3 mb-3">
                <h2 className="text-lg font-semibold">Images</h2>
                <p className="text-xs text-gray-500">
                    Drag to reorder, click × to remove
                </p>
            </div>

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
                {images.map((img, index) => (
                    <div
                        key={img.publicId || index}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(index)}
                        className="relative aspect-square rounded-xl border overflow-hidden"
                    >
                        <img
                            src={img.isExisting ? img.url : img.preview}
                            className="w-full h-full object-cover"
                            alt=""
                        />

                        <button
                            type="button"
                            onClick={() => handleDelete(index)}
                            className="absolute top-1 right-1 bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        >
                            <IoClose />
                        </button>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={handleAddClick}
                    className="aspect-square rounded-xl border-dashed border-2 flex flex-col items-center justify-center text-gray-400"
                >
                    <span className="text-3xl">＋</span>
                    <span className="text-xs">Add</span>
                </button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleFileChange}
            />
        </div>
    );
}

export default BookImages;
