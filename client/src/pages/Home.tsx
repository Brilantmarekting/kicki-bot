import { useState } from "react";
import KickiChat from "@/components/KickiChat";
import TalkingMode from "@/components/TalkingMode";
import { Mic } from "lucide-react";

export default function Home() {
  const [showTalkingMode, setShowTalkingMode] = useState(false);

  return (
    <div className="min-h-screen bg-[#faf7f4]">
      {/* Top bar */}
      <div className="absolute top-4 right-4 z-40 flex gap-2">
        <button
          onClick={() => setShowTalkingMode(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all text-sm font-medium text-gray-700"
        >
          <Mic className="w-4 h-4" />
          Talk to Kicki
        </button>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-2">
          KICKS <span className="italic text-orange-400 font-serif">Beauty</span>
        </h1>
        <p className="text-gray-500 text-lg mt-4 max-w-md">
          Discover your best version with our premium selection of cosmetics and personal care.
        </p>
        <p className="text-gray-800 font-semibold mt-4">
          Talk to Kicki for expert advice.
        </p>

        {/* Hero card */}
        <div className="mt-12 w-full max-w-2xl h-72 rounded-3xl bg-gradient-to-br from-orange-100 via-pink-50 to-orange-200 shadow-lg flex items-end p-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">New Collection</h2>
            <p className="text-gray-500">Winter 2025</p>
          </div>
        </div>
      </div>

      {/* KickiChat bubble */}
      <KickiChat />

      {/* TalkingMode fullscreen */}
      {showTalkingMode && (
        <TalkingMode onClose={() => setShowTalkingMode(false)} />
      )}
    </div>
  );
}
