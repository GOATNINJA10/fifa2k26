"use client";

import { useState, useEffect } from "react";
import { api, Highlight } from "@/lib/api";
import VideoCard from "@/components/live/VideoCard";
import VideoModal from "@/components/live/VideoModal";

const STAGE_OPTIONS = [
  { value: "", label: "All Stages" },
  { value: "group-stage", label: "Group Stage" },
  { value: "knockout", label: "Knockout" },
  { value: "final", label: "Final" },
];

export default function HighlightsPage() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [populating, setPopulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<Highlight | null>(null);

  useEffect(() => {
    loadHighlights();
  }, [selectedStage, selectedTeam]);

  const loadHighlights = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { stage?: string; team?: string; limit?: number } = {};
      if (selectedStage) params.stage = selectedStage;
      if (selectedTeam) params.team = selectedTeam;
      
      const response = await api.getHighlights(params);
      setHighlights(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load highlights");
      console.error("Error loading highlights:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoPopulate = async () => {
    setPopulating(true);
    try {
      const res = await api.autoPopulateHighlights();
      await loadHighlights();
    } catch (err) {
      console.error("Auto-populate error:", err);
    } finally {
      setPopulating(false);
    }
  };

  const filteredHighlights = searchQuery
    ? highlights.filter(
        (h) =>
          h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          h.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          h.team?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : highlights;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">⚽ Match Highlights</h1>
          <p className="text-gray-300">
            Watch the best moments from the 2026 FIFA World Cup
          </p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAutoPopulate}
              disabled={populating}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">{populating ? "sync" : "youtube_activity"}</span>
              {populating ? "Searching YouTube..." : "Auto-populate from YouTube"}
            </button>
            <button
              onClick={async () => {
                await api.clearAllHighlights();
                loadHighlights();
              }}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Stage Filter */}
          <div className="flex flex-wrap gap-3">
            {STAGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedStage(option.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedStage === option.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search highlights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Team Filter (Optional) */}
        <div className="mt-4">
          <input
            type="text"
            placeholder="Filter by team (e.g., Brazil, Argentina)..."
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full md:w-96 bg-gray-800 text-white placeholder-gray-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-400 text-lg">{error}</p>
            <button
              onClick={loadHighlights}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredHighlights.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-400 text-lg">No highlights found</p>
            <p className="text-gray-500 text-sm mt-2">
              Try adjusting your filters or check back later
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHighlights.map((highlight) => (
              <VideoCard
                key={highlight.id}
                highlight={highlight}
                onPlay={setSelectedVideo}
              />
            ))}
          </div>
        )}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal
          highlight={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
}