"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { ACTUAL_CITIES, City } from "@/lib/cities";

interface NodeData {
  position: THREE.Vector3;
  id: number;
  location?: string;
  ping?: number;
  isCustom?: boolean;
  timestamp?: number;
}

function latLongToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));

  return new THREE.Vector3(x, y, z);
}

// Inner component to handle data flow pulses
function Pulses({ lines, color }: { lines: { p1: THREE.Vector3; p2: THREE.Vector3 }[], color: string }) {
  const pulseCount = 30;

  const pulseData = useMemo(() => {
    if (lines.length === 0) return [];
    return Array.from({ length: pulseCount }).map(() => {
      const line = lines[Math.floor(Math.random() * lines.length)];
      return { line, t: Math.random(), speed: 0.002 + Math.random() * 0.003 };
    });
  }, [lines]);

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { matrix, position } = useMemo(() => ({
    matrix: new THREE.Matrix4(),
    position: new THREE.Vector3()
  }), []);

  useFrame(() => {
    if (!meshRef.current || lines.length === 0) return;

    pulseData.forEach((pulse, i) => {
      pulse.t += pulse.speed;
      if (pulse.t >= 1) {
        pulse.line = lines[Math.floor(Math.random() * lines.length)];
        pulse.t = 0;
      }

      position.lerpVectors(pulse.line.p1, pulse.line.p2, pulse.t);
      matrix.setPosition(position);
      meshRef.current!.setMatrixAt(i, matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (lines.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, pulseCount]}>
      <sphereGeometry args={[0.004, 8, 8]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
    </instancedMesh>
  );
}

export default function NeonGlobe({
  radius = 3,
  color = "#00e5ff",
  connectionDistance = 1.3,
  customNodes = [] // Nodes added dynamically by the user
}: { radius?: number, color?: string, connectionDistance?: number, customNodes?: { name: string, lat: number, lon: number, timestamp?: number }[] }) {

  const groupRef = useRef<THREE.Group>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [lastTouchTime, setLastTouchTime] = useState<number>(0);

  // Frame ticker to evaluate "new" node purple decay and auto-close panels
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      // Auto-close panel after 3 seconds of hover
      if (hoveredNode && Date.now() - lastTouchTime > 3000) {
        setHoveredNode(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [hoveredNode, lastTouchTime]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (hoveredNode) {
        setHoveredNode(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [hoveredNode]);

  // Fetch true Geographical boundaries
  useEffect(() => {
    fetch('/countries.geojson')
      .then(res => res.json())
      .then(data => setGeoJsonData(data))
      .catch(console.error);
  }, []);

  // Parse GeoJSON Borders into 3D Lines
  const { bordersGeometry, indiaGeometry, israelGeometry, iranGeometry } = useMemo(() => {
    if (!geoJsonData) return { bordersGeometry: null, indiaGeometry: null, israelGeometry: null, iranGeometry: null };
    const geo = new THREE.BufferGeometry();
    const indGeo = new THREE.BufferGeometry();
    const isrGeo = new THREE.BufferGeometry();
    const irnGeo = new THREE.BufferGeometry();

    const positions: number[] = [];
    const indPositions: number[] = [];
    const isrPositions: number[] = [];
    const irnPositions: number[] = [];

    const addPolygon = (coords: any[], targetArray: number[]) => {
      // GeoJSON maps in [longitude, latitude] arrays
      for (let i = 0; i < coords.length - 1; i++) {
        const p1 = latLongToVector3(coords[i][1], coords[i][0], radius);
        const p2 = latLongToVector3(coords[i + 1][1], coords[i + 1][0], radius);

        if (p1.distanceTo(p2) > 1.5) continue; // Skip huge boundary cuts in data across date line

        targetArray.push(p1.x, p1.y, p1.z);
        targetArray.push(p2.x, p2.y, p2.z);
      }
    };

    geoJsonData.features.forEach((feature: any) => {
      // Check feature properties for specific countries
      const admin = feature.properties?.ADMIN;
      const name = feature.properties?.name;
      const iso = feature.properties?.ISO_A3;

      let targetArray = positions; // Base default

      if (admin === "India" || name === "India" || iso === "IND") {
        targetArray = indPositions;
      } else if (admin === "Israel" || name === "Israel" || iso === "ISR" || admin === "Palestine" || name === "Palestine") {
        targetArray = isrPositions;
      } else if (admin === "Iran" || name === "Iran" || iso === "IRN" || name === "Islamic Republic of Iran") {
        targetArray = irnPositions;
      }

      const type = feature.geometry.type;

      if (type === 'Polygon') {
        feature.geometry.coordinates.forEach((c: any) => addPolygon(c, targetArray));
      } else if (type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach((poly: any[]) => poly.forEach((c: any) => addPolygon(c, targetArray)));
      }
    });

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    indGeo.setAttribute('position', new THREE.Float32BufferAttribute(indPositions, 3));
    isrGeo.setAttribute('position', new THREE.Float32BufferAttribute(isrPositions, 3));
    irnGeo.setAttribute('position', new THREE.Float32BufferAttribute(irnPositions, 3));

    return {
      bordersGeometry: geo,
      indiaGeometry: indGeo,
      israelGeometry: isrGeo,
      iranGeometry: irnGeo
    };
  }, [geoJsonData, radius]);

  // Combine Hardcoded + Search Nodes
  const nodes = useMemo(() => {
    const points: NodeData[] = [];

    // Core network hubs
    ACTUAL_CITIES.forEach((city, index) => {
      points.push({
        position: latLongToVector3(city.lat, city.lon, radius),
        id: index + 1,
        location: city.name,
        ping: Math.floor(Math.random() * 60) + 5,
        isCustom: false
      });
    });

    // Custom nodes pulled via Google Geocoding
    customNodes.forEach((node, index) => {
      points.push({
        position: latLongToVector3(node.lat, node.lon, radius),
        id: ACTUAL_CITIES.length + index + 1,
        location: node.name,
        ping: Math.floor(Math.random() * 8) + 1, // Custom inserted nodes have fast ping
        isCustom: true,
        timestamp: node.timestamp
      });
    });

    return points;
  }, [radius, customNodes]);

  // Determine connections based on proximity
  const lines = useMemo(() => {
    const _lines: { p1: THREE.Vector3; p2: THREE.Vector3 }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = nodes[i].position.distanceTo(nodes[j].position);
        if (d < connectionDistance) {
          _lines.push({ p1: nodes[i].position, p2: nodes[j].position });
        }
      }
    }
    return _lines;
  }, [nodes, connectionDistance]);

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(lines.length * 6);
    lines.forEach((line, i) => {
      positions[i * 6] = line.p1.x;
      positions[i * 6 + 1] = line.p1.y;
      positions[i * 6 + 2] = line.p1.z;
      positions[i * 6 + 3] = line.p2.x;
      positions[i * 6 + 4] = line.p2.y;
      positions[i * 6 + 5] = line.p2.z;
    });
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [lines]);

  // Removed automatic group rotation so the user can freely spin the globe manually

  return (
    <group ref={groupRef}>
      {/* Continental Neon Borders */}
      {bordersGeometry && (
        <lineSegments geometry={bordersGeometry}>
          <lineBasicMaterial color={color} transparent opacity={0.12} />
        </lineSegments>
      )}

      {indiaGeometry && (
        <lineSegments geometry={indiaGeometry}>
          <lineBasicMaterial color="#e97965" transparent opacity={0.4} />
        </lineSegments>
      )}

      {/* Israel Highlight Border */}
      {israelGeometry && (
        <lineSegments geometry={israelGeometry}>
          <lineBasicMaterial color="#ff0044" transparent opacity={0.6} />
        </lineSegments>
      )}

      {/* Iran Highlight Border */}
      {iranGeometry && (
        <lineSegments geometry={iranGeometry}>
          <lineBasicMaterial color="#00ff44" transparent opacity={0.5} />
        </lineSegments>
      )}

      {/* Node Geometries */}
      {nodes.map((node) => {
        const isHovered = hoveredNode === node.id;

        // Temporarily flash Purple for 5 seconds so it perfectly catches the camera arrival
        const isBrandNew = node.timestamp ? (currentTime - node.timestamp < 5000) : false;
        const nodeColor = isBrandNew ? "#a855f7" : color;

        return (
          <mesh
            key={node.id}
            position={node.position}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredNode(node.id);
              setLastTouchTime(Date.now());
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              // Don't immediately close on mobile - let timer handle it
              if (e.pointerType !== 'touch') {
                setHoveredNode(null);
              }
              document.body.style.cursor = 'auto';
            }}
            onClick={(e) => {
              e.stopPropagation();
              setLastTouchTime(Date.now());
              // Toggle panel on click/touch
              if (hoveredNode === node.id) {
                setHoveredNode(null);
              } else {
                setHoveredNode(node.id);
              }
            }}
          >
            <icosahedronGeometry args={[0.02, 0]} />
            <meshStandardMaterial
              color={isHovered ? "#ffffff" : nodeColor}
              emissive={isHovered ? "#ffffff" : nodeColor}
              emissiveIntensity={isHovered ? 5 : 2.5}
              toneMapped={false}
            />

            {isHovered && (
              <Html position={[0, 0.1, 0]} center className="pointer-events-none z-50 ">
                <div className="px-5 py-3 rounded-xl bg-black/80 backdrop-blur-md border shadow-[0_0_20px_rgba(0,229,255,0.7)] transition-all min-w-[160px]" style={{ borderColor: `${nodeColor}50` }}>
                  <div className="text-[10px] text-zinc-400 font-sans uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_5px_#00e5ff]" style={{ backgroundColor: nodeColor }}></span>
                    SERVER {node.id.toString().padStart(3, '0')}
                  </div>
                  <div className="text-white text-base font-bold tracking-wide whitespace-nowrap mb-1.5 max-w-[200px] truncate">
                    {node.location}
                  </div>
                  <div className="border-t pt-1.5 flex justify-between items-center" style={{ borderColor: `${nodeColor}30` }}>
                    <div className="text-[9px] font-mono tracking-wider" style={{ color: nodeColor }}>STATUS: SYNCED</div>
                    <div className="text-[9px] text-zinc-300 font-mono">{node.ping}ms</div>
                  </div>
                </div>
              </Html>
            )}
          </mesh>
        );
      })}

      {/* Network Strings */}
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Pulse Traffic */}
      <Pulses lines={lines} color={color} />
    </group>
  );
}
