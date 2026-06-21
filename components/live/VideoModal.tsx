"use client";

import { Highlight } from "@/lib/api";
import { useEffect } from "react";

interface VideoModalProps {
  highlight: Highlight | null;
  onClose: () => void;
}

export default function VideoModal({ highlight, onClose }: VideoModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (highlight) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [highlight, onClose]);

  if (!highlight) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
        aria-label="Close video player"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Video Container */}
      <div
        className="relative w-full max-w-5xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video Title */}
        <div className="mb-4">
          <h2 id="modal-title" className="text-2xl font-bold text-white mb-2">
            {highlight.title}
          </h2>
          {highlight.description && (
            <p className="text-gray-400 text-sm">{highlight.description}</p>
          )}
        </div>

        {/* Watch on YouTube */}
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl flex items-center justify-center">
          <img
            src={`https://img.youtube.com/vi/${highlight.videoId}/hqdefault.jpg`}
            alt={highlight.title}
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
          <div className="relative z-10 text-center">
            <svg className="w-20 h-20 mx-auto text-red-600 mb-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21.543 6.498C22 8.28 22 12 22 12s0 3.72-.457 5.502c-.254.985-.997 1.76-1.938 2.022C17.896 20 12 20 12 20s-5.893 0-7.605-.476c-.945-.266-1.687-1.04-1.938-2.022C2 15.72 2 12 2 12s0-3.72.457-5.502c.254-.985.997-1.76 1.938-2.022C6.107 4 12 4 12 4s5.896 0 7.605.476c.945.266 1.687 1.04 1.938 2.022zM10 15.5l6-3.5-6-3.5v7z"/>
            </svg>
            <a
              href={`https://www.youtube.com/watch?v=${highlight.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors text-lg"
            >
              Watch on YouTube
            </a>
            <p className="text-gray-400 text-sm mt-3">Opens in a new tab</p>
          </div>
        </div>

        {/* Video Info */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-4">
            {highlight.team && (
              <span className="flex items-center gap-1">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                {highlight.team}
              </span>
            )}
            <span>
              {new Date(highlight.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <span className="capitalize bg-gray-800 px-3 py-1 rounded-full">
            {highlight.stage.replace("-", " ")}
          </span>
        </div>
      </div>
    </div>
  );
}