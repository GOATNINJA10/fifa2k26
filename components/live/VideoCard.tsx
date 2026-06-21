"use client";

import { Highlight } from "@/lib/api";

interface VideoCardProps {
  highlight: Highlight;
  onPlay: (highlight: Highlight) => void;
}

export default function VideoCard({ highlight, onPlay }: VideoCardProps) {
  const thumbnailUrl = highlight.thumbnailUrl || `https://img.youtube.com/vi/${highlight.videoId}/mqdefault.jpg`;

  const stageLabels: Record<string, string> = {
    "group-stage": "Group Stage",
    knockout: "Knockout",
    final: "Final",
  };

  const stageColor: Record<string, string> = {
    "group-stage": "bg-blue-600",
    knockout: "bg-orange-600",
    final: "bg-yellow-600",
  };

  return (
    <div
      className="group relative bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
      onClick={() => onPlay(highlight)}
      onKeyDown={(e) => e.key === "Enter" && onPlay(highlight)}
      tabIndex={0}
      role="button"
      aria-label={`Play ${highlight.title}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={thumbnailUrl}
          alt={highlight.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors duration-300 flex items-center justify-center">
          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <svg
              className="w-8 h-8 text-gray-900 ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Stage Badge */}
        <div className={`absolute top-3 left-3 ${stageColor[highlight.stage] || "bg-gray-600"} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
          {stageLabels[highlight.stage] || highlight.stage}
        </div>

        {/* Duration Badge (placeholder) */}
        <div className="absolute bottom-3 right-3 bg-black/80 text-white text-xs font-medium px-2 py-1 rounded">
          3:45
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
          {highlight.title}
        </h3>
        
        {highlight.description && (
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
            {highlight.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          {highlight.team && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              {highlight.team}
            </span>
          )}
          <span>
            {new Date(highlight.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}