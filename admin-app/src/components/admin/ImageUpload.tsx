'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import { Upload, Loader2, X, ImageIcon } from 'lucide-react';

interface ImageUploadProps {
    imageUrl: string | null;
    onImageUploaded: (url: string) => void;
    onImageRemoved: () => void;
}

export default function ImageUpload({ imageUrl, onImageUploaded, onImageRemoved }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const displayImage = preview || imageUrl;

    const validateAspectRatio = (file: File): Promise<boolean> =>
        new Promise((resolve) => {
            const url = URL.createObjectURL(file);
            const img = new window.Image();
            img.onload = () => {
                URL.revokeObjectURL(url);
                const ratio = img.width / img.height;
                if (ratio < 0.75 || ratio > 1.33) {
                    const proceed = window.confirm(
                        `This image has a ${img.width}×${img.height} aspect ratio. ` +
                        'For the best display in the product grid, a square (1:1) image is recommended. Continue anyway?'
                    );
                    resolve(proceed);
                } else {
                    resolve(true);
                }
            };
            img.onerror = () => { URL.revokeObjectURL(url); resolve(true); };
            img.src = url;
        });

    const uploadFile = async (file: File) => {
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('Only JPEG, PNG, and WebP images are allowed');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be smaller than 5 MB');
            return;
        }

        const ratioOk = await validateAspectRatio(file);
        if (!ratioOk) return;

        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('image', file);
            const res = await fetch('/api/products/upload', { method: 'POST', body: fd });
            if (res.ok) {
                const data = await res.json();
                onImageUploaded(data.imageUrl);
                setPreview(URL.createObjectURL(file));
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to upload image');
            }
        } catch {
            alert('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadFile(file);
        e.target.value = '';
    };

    const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) uploadFile(file);
    };

    const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleRemove = () => {
        setPreview(null);
        onImageRemoved();
    };

    if (displayImage) {
        return (
            <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60">
                <div className="flex items-center gap-4 h-full p-4">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200/60 bg-white flex-shrink-0">
                        <Image src={displayImage} alt="Product preview" fill className="object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div>
                            <p className="text-[12px] text-slate-500">
                                Drag &amp; drop or{' '}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-indigo-600 hover:text-indigo-700 font-medium underline cursor-pointer"
                                >
                                    browse
                                </button>
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                Recommended: 800×800 px square · JPEG, PNG or WebP · max 5 MB
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleRemove}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploading}
                />
            </div>
        );
    }

    return (
        <label
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`flex items-center gap-4 p-4 h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                isDragging
                    ? 'border-indigo-400 bg-indigo-50/50'
                    : uploading
                    ? 'opacity-50 pointer-events-none border-slate-200'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30'
            }`}
        >
            <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center flex-shrink-0">
                {uploading ? (
                    <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
                ) : (
                    <ImageIcon className="h-6 w-6 text-slate-300" />
                )}
            </div>
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    {uploading ? (
                        <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
                    ) : (
                        <Upload className="h-4 w-4 text-slate-400" />
                    )}
                    <span className="text-[13px] text-slate-500">
                        {uploading ? 'Uploading & optimising...' : (
                            <>
                                Drag &amp; drop or{' '}
                                <span className="text-indigo-600 font-medium underline">browse</span>
                            </>
                        )}
                    </span>
                </div>
                {!uploading && (
                    <p className="text-[11px] text-slate-400 ml-6">
                        Recommended: 800×800 px square · JPEG, PNG or WebP · max 5 MB
                    </p>
                )}
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
            />
        </label>
    );
}
