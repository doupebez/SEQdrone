'use client';

import { useState, useCallback, ChangeEvent } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface FileUploaderProps {
    onImagesSelected: (images: File[]) => void;
    selectedImages: File[];
    onRemoveImage: (index: number) => void;
}

export function FileUploader({ onImagesSelected, selectedImages, onRemoveImage }: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
            if (files.length > 0) {
                onImagesSelected(files);
            }
        }
    }, [onImagesSelected]);

    const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
            if (files.length > 0) {
                onImagesSelected(files);
            }
        }
    };

    return (
        <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "relative flex flex-col items-center justify-center w-full min-h-[300px] rounded-3xl border-2 border-dashed transition-all duration-300 ease-out cursor-pointer overflow-hidden group",
                    isDragging
                        ? "border-primary bg-primary/10 scale-[1.01]"
                        : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50"
                )}
            >
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                    accept="image/*"
                    multiple
                    onChange={handleFileInput}
                />

                <div className="flex flex-col items-center justify-center p-6 text-center z-10">
                    <div className={cn(
                        "p-4 rounded-full mb-4 transition-all duration-300",
                        isDragging ? "bg-primary text-primary-foreground" : "bg-white/10 text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                    )}>
                        <Upload className="w-8 h-8" />
                    </div>
                    <p className="text-xl font-semibold mb-2 text-foreground">
                        {isDragging ? "Drop images now" : "Drag & drop survey images"}
                    </p>
                    <p className="text-sm text-muted-foreground max-w-xs">
                        Upload high-quality drone photos (JPG, PNG). We'll analyze them for damage automatically.
                    </p>
                </div>

                {/* Decorative background grid */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                        backgroundSize: '24px 24px'
                    }}
                />
            </div>

            {selectedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                    {selectedImages.map((file, index) => (
                        <div key={`${file.name}-${index}`} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/50">
                            <Image
                                src={URL.createObjectURL(file)}
                                alt="Preview"
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <button
                                onClick={() => onRemoveImage(index)}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
