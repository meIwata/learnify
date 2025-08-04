import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, Trash2 } from 'lucide-react';
import type { SubmissionFile } from '../lib/api';

interface ImageGalleryProps {
  files: SubmissionFile[];
  projectTitle: string;
  canDelete?: boolean;
  onDeleteFile?: (fileId: number) => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ files, projectTitle, canDelete = false, onDeleteFile }) => {
  const [showModal, setShowModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!files || files.length === 0) {
    return null;
  }

  const openModal = (index: number) => {
    setCurrentImageIndex(index);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % files.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + files.length) % files.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
  };

  const handleDeleteFile = (fileId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening the modal
    if (onDeleteFile && confirm('Are you sure you want to delete this screenshot?')) {
      onDeleteFile(fileId);
    }
  };

  return (
    <>
      {/* Thumbnail Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {files.map((file, index) => (
          <div key={file.id} className="flex justify-center">
            <div className="relative group">
              <img
                src={file.file_url}
                alt={`${projectTitle} screenshot ${index + 1}`}
                className="w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openModal(index)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              
              {/* Fallback for failed images */}
              <div className="hidden w-20 h-20 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <span className="text-xs">Preview unavailable</span>
                </div>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                <div className="bg-white bg-opacity-90 rounded-full p-1">
                  <ZoomIn className="w-3 h-3 text-gray-700" />
                </div>
              </div>

              {/* Delete button */}
              {canDelete && onDeleteFile && (
                <button
                  onClick={(e) => handleDeleteFile(file.id, e)}
                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  title="Delete screenshot"
                >
                  <X className="w-3 h-3" />
                </button>
              )}

              {/* Image counter */}
              {files.length > 1 && !canDelete && (
                <div className="absolute top-1 right-1 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded">
                  {index + 1}
                </div>
              )}
              
              {/* Image counter for deleteable images (positioned differently) */}
              {files.length > 1 && canDelete && (
                <div className="absolute top-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded">
                  {index + 1}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onKeyDown={handleKeyDown}
          onClick={closeModal}
          tabIndex={0}
        >
          <div className="relative max-w-5xl max-h-full" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Navigation buttons */}
            {files.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-2"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-2"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Full size image */}
            <img
              src={files[currentImageIndex].file_url}
              alt={`${projectTitle} screenshot ${currentImageIndex + 1} - full size`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Image info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent rounded-b-lg p-4">
              <div className="text-white">
                <h3 className="font-semibold text-lg">{projectTitle}</h3>
                <div className="flex items-center justify-between text-sm text-gray-300">
                  <span>
                    Image {currentImageIndex + 1} of {files.length}
                  </span>
                  <span>Click anywhere to close • Use arrow keys to navigate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery;