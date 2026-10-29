import React, { useRef, useState } from 'react';
import { ImagePlus, RotateCcw, Upload, X } from 'lucide-react';
import { Product } from '../data/products';

interface UploadPhotoModalProps {
  isOpen: boolean;
  products: Product[];
  onClose: () => void;
  onUploadProductPhoto: (productId: string, dataUrl: string | undefined) => void;
}

export const UploadPhotoModal: React.FC<UploadPhotoModalProps> = ({
  isOpen,
  products,
  onClose,
  onUploadProductPhoto,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[3]?.id || products[0].id
  );
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentProd =
    products.find((p) => p.id === selectedProductId) || products[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUploadProductPhoto(currentProd.id, reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    onUploadProductPhoto(currentProd.id, imageUrlInput.trim());
    setImageUrlInput('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Upload original clothes photo"
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
    >
      <div className="bg-[#F6F2EC] text-stone-900 rounded-xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[88vh] overflow-y-auto custom-scroll">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[11px] font-mono-tech uppercase tracking-widest text-[#E85D2A]">
              Studio Garment Manager
            </div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-stone-900">
              How Original Clothes Work + Live Photo Uploader
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close studio photo uploader"
            className="w-9 h-9 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Explanation Box answering the user's question directly */}
        <div className="bg-white border border-stone-200/90 rounded-lg p-4 mb-5 text-xs text-stone-700 space-y-2 leading-relaxed">
          <p className="font-semibold text-stone-900">
            How the 2027 Shopify Rail shows 100% original clothes:
          </p>
          <p>
            1. <strong>Dual-View Studio Cutouts (Side + Front PNG)</strong>: On the rail, garments rest in a <em>Side-Profile</em> view. When you hover over any hanger, neighboring pieces part along the wire and the hovered garment turns 90° to reveal its <em>Front-Facing</em> studio cutout.
          </p>
          <p>
            2. <strong>Try Uploading Your Own Transparent PNG Below</strong>: Select any hanger on the rail and upload your own transparent-background clothing photo (`.png` / `.webp`) to see it hang and swing in 3D immediately.
          </p>
        </div>

        {/* Select Garment Slot */}
        <div className="mb-4">
          <label
            htmlFor="studio-product-select"
            className="block text-xs font-mono-tech uppercase tracking-wider text-stone-600 mb-1.5"
          >
            1. Select Hanger on the Rail
          </label>
          <select
            id="studio-product-select"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 bg-white text-xs font-medium text-stone-900"
          >
            {products.map((p, idx) => (
              <option key={p.id} value={p.id}>
                Hanger #{idx + 1} — {p.title} ({p.shortLabel})
              </option>
            ))}
          </select>
        </div>

        {/* Upload PNG/WebP File */}
        <div className="mb-4">
          <span className="block text-xs font-mono-tech uppercase tracking-wider text-stone-600 mb-1.5">
            2. Upload Transparent Garment Photo (PNG / WebP / JPG)
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/webp,image/jpeg"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-[#181716] hover:bg-stone-800 text-white rounded-lg py-3 px-4 text-xs font-mono-tech flex items-center justify-center gap-2 transition"
            >
              <Upload className="w-4 h-4" />
              <span>Choose Garment Image from Device</span>
            </button>
            {currentProd.customFrontImage && (
              <button
                type="button"
                onClick={() => onUploadProductPhoto(currentProd.id, undefined)}
                className="bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg py-3 px-3.5 text-xs font-mono-tech flex items-center gap-1.5 transition"
                title="Restore built-in studio garment"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Or Paste Direct Image URL */}
        <form onSubmit={handleApplyUrl} className="mb-4">
          <label
            htmlFor="custom-img-url"
            className="block text-xs font-mono-tech uppercase tracking-wider text-stone-600 mb-1.5"
          >
            Or Paste Transparent PNG URL
          </label>
          <div className="flex gap-2">
            <input
              id="custom-img-url"
              type="url"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="https://example.com/my-hoodie-cutout.png"
              className="flex-1 px-3.5 py-2 rounded-lg border border-stone-300 bg-white text-xs text-stone-900"
            />
            <button
              type="submit"
              className="bg-[#E85D2A] hover:bg-[#d44e1d] text-white px-4 py-2 rounded-lg text-xs font-mono-tech uppercase tracking-wider transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              <span>Apply URL</span>
            </button>
          </div>
        </form>

        <div className="flex justify-end pt-3 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="bg-stone-900 text-white px-5 py-2 rounded-md text-xs font-mono-tech uppercase tracking-wider"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
