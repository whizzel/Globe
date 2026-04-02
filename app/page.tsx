"use client";

import { useState, useEffect } from "react";
import Scene from "@/components/Scene";
import DeployBar from "@/components/DeployBar";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Home() {
  const [customNodes, setCustomNodes] = useState<{ name: string, lat: number, lon: number, timestamp?: number }[]>([]);
  const [focusCoord, setFocusCoord] = useState<{ lat: number, lon: number } | null>(null);

  useEffect(() => {
    if (!db) {
      console.warn("Database not initialized");
      return;
    }

    const q = query(collection(db, "nodes"), orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const nodesFromDB: { name: string, lat: number, lon: number, timestamp?: number }[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        nodesFromDB.push({
          name: data.name,
          lat: data.lat,
          lon: data.lon,
          timestamp: data.timestamp || 0
        });
      });
      setCustomNodes(nodesFromDB);
    }, (error) => {
      console.error("Firestore Error:", error);
    });

    return () => unsubscribe();
  }, []);

  return (
    <main className="relative w-full h-full bg-black overflow-hidden flex flex-col justify-center items-center">
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <Scene customNodes={customNodes} focusCoord={focusCoord} />
      </div>

      <DeployBar onDeploy={(coord) => setFocusCoord(coord)} />
    </main>
  );
}
