"use client";

import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface DeployBarProps {
  onDeploy: (coord: { lat: number, lon: number }) => void;
}

export default function DeployBar({ onDeploy }: DeployBarProps) {
  const [queryInput, setQueryInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;
    setLoading(true);

    try {

      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(queryInput)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`);
      const data = await res.json();

      if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        let name = data.results[0].formatted_address;

        if (name.includes(",")) {
          const parts = name.split(",");
          name = parts[0] + "," + parts[parts.length - 1];
        }

        setQueryInput("");

        if (db) {
          await addDoc(collection(db, "nodes"), {
            name,
            lat,
            lon: lng,
            timestamp: Date.now()
          });
        }

        onDeploy({ lat, lon: lng });

      } else {
        alert("wrong item");
      }
    } catch (e: any) {
      console.error(e);
      alert("wrong item");
    }
    setLoading(false);
  };

  return (
    <div className="z-50 fixed bottom-4 left-0 right-0 px-4 flex justify-center">
      <form onSubmit={handleSearch} className="flex w-full max-w-xl pointer-events-auto shadow-[0_0_30px_rgba(0,229,255,0.2)] rounded-xl md:rounded-2xl bg-black/80 backdrop-blur-xl border border-[#00e5ff]/40 overflow-hidden">
        <div className="hidden sm:flex items-center justify-center px-4 text-[#00e5ff]/60 border-r border-[#00e5ff]/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
        <input
          type="text"
          placeholder="Add your city now..."
          className="flex-1 w-full bg-transparent text-[#00e5ff] placeholder-[#00e5ff]/40 px-2 sm:px-4 py-3 md:py-4 outline-none font-mono text-sm tracking-wide"
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[#00e5ff]/10 hover:bg-[#00e5ff]/30 transition-colors text-[#00e5ff] px-4 md:px-6 py-3 md:py-4 font-bold font-mono text-xs md:text-sm tracking-widest disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? "deploying.." : "DEPLOY"}
        </button>
      </form>
    </div>
  );
}
