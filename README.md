# 🌐 Digital Brain Network (NeonGlobe)

The Digital Brain Network is a high-performance, real-time 3D multiplayer global visualization interface. It maps actual geographical topographies and allows clients worldwide to deploy nodes onto a perfectly scaled interactive cyber-globe via Google Geocoding, synced across all browsers universally in ms using Firebase WebSockets.

## 🚀 Architecture Overview

### Frontend Stack
- **Next.js 16.2.2 (App Router)**: Orchestrates server/client components and high-speed delivery
- **Three.js 0.183.2 & React Three Fiber 9.5.0**: Handles the intense 3D mathematical rendering loop, translating standard React states into a WebGL Canvas
- **React Three Drei 10.7.7**: Used for optimal Camera Controllers (OrbitControls), 3D HTML Tooltips (`<Html>`), Stars, and Sparkles effects
- **Post-processing**: Utilizes `@react-three/postprocessing 3.0.4` Bloom filters to accomplish the glowing "Neon / Cyberpunk" aesthetic natively via GPU shader injections
- **TypeScript 5**: Full type safety and production-ready code structure

### Backend Stack
- **Firebase 12.11.0**: Sets up a NoSQL global database collection (`nodes`)
- **WebSockets / Snapshot Listeners**: `onSnapshot` queries Firebase in real-time, removing the requirement to refresh browsers by streaming data globally securely
- **Google Maps Geocoding API**: Rest API pipeline turning raw user text ("Delhi") into precise mathematical Earth coordinates (`lat`/`lon`)

### Project Structure
```
├── app/
│   └── page.tsx              # Main application entry point with Firebase integration
├── components/
│   ├── NeonGlobe.tsx        # Core 3D globe component with city nodes and connections
│   ├── Scene.tsx            # 3D scene setup with camera controls and effects
│   └── DeployBar.tsx        # UI search bar for adding new cities
├── lib/
│   ├── cities.ts             # Production-ready city data with TypeScript interfaces
│   └── firebase.ts          # Firebase configuration and initialization
└── public/
    └── countries.geojson     # Raw geographical boundary data
```

---

## 🧠 Core Engineering & Logic

### 1. Spatial Math Geometry (`latLongToVector3`)
Since the globe is a true `THREE.SphereGeometry`, calculating the node position requires mapping a 2D spherical coordinate (Latitude/Longitude) onto a 3D Cartesian grid. 

We process raw coordinates into Radian arrays:
```typescript
const phi = (90 - lat) * (Math.PI / 180);
const theta = (lon + 180) * (Math.PI / 180);
const x = -(radius * Math.sin(phi) * Math.cos(theta));
const z = (radius * Math.sin(phi) * Math.sin(theta));
const y = (radius * Math.cos(phi));
```
This forces all geometry (cities and country borders) to anchor perfectly along the exact radius of the virtual globe.

### 2. Live Geo-Political Mapping
The system does not use pre-rendered 3D models. It fetches a raw `countries.geojson` topographical map asynchronously on load.
The parser splits out thousands of polygons into exact vertices. It actively separates global entities for localized thematic highlighting:
- Base Borders: Faint Cyan/Blue (`#00e5ff`)
- India: Red (`#e97965`)
- Israel: Deep Red (`#ff0044`)
- Iran: Neon Green (`#00ff44`)
These boundaries are merged into massive `THREE.BufferGeometry` arrays to prevent memory overflow that would result from rendering thousands of localized standard meshes.

### 3. Cinematic Camera Target Controller (Interpolation)
The component `CameraAnimator` inside `Scene.tsx` uses standard reactive hooks to take a raw geographic deploy location from the Search Bar and converts it into a `target_vector`.
Instead of teleporting, it uses a framerate-independent mathematical vector interpolation (`lerp`) to dynamically sweep the camera through 3D space recursively across `useFrame`, locking exactly onto the newly deployed city without sacrificing user control.

**Default Camera Position**: `[0, 0, -7]` - Shows the opposite side of Earth by default

### 4. Multiplayer Real-time Streams
Data architecture runs on Google Cloud Firestore. When the UI geocodes an address, it writes an immutable timestamped payload:
`{ name: "Paris", lat: 48.8, lon: 2.3, timestamp: Date.now() }`

Every active user's browser processes this push via WebSockets in `page.tsx`, directly binding the global NoSQL output stream down into React Three Fiber's render loop, guaranteeing 100% synchronicity and state distribution across all worldwide users without local caching conflicts.

### 5. Interactive Node System
- **61 Pre-configured Cities**: Major global network hubs with realistic ping values
- **Dynamic Node Deployment**: Users can add custom cities via geocoding
- **Hover Tooltips**: Transform-aware HTML tooltips that maintain consistent distance during zoom
- **Connection Visualization**: Dynamic network lines between proximate nodes (distance < 1.3)
- **Animated Data Pulses**: Moving dots along connections representing data flow (size: 0.004)

### 6. Performance Optimizations
- **Instanced Rendering**: Pulse effects use `THREE.InstancedMesh` for 30 animated particles
- **Buffer Geometry**: Country borders use optimized `BufferGeometry` for thousands of vertices
- **Memoization**: Heavy computations cached with `useMemo`
- **Frame-based Animation**: Smooth 60fps animations via `useFrame`

---

## 🛠 Deployment & Setup

1. **Install Modules**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Populate all external backend parameters in `.env.local`:
   ```bash
   # Google Cloud Network
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_api_key

   # Firebase Architecture
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

3. **Database Permissions**
   In Firestore, establish baseline read/write capabilities (or switch to authenticated rules for strict production environments).
   ```javascript
   match /{document=**} {
      allow read, write: if true; 
   }
   ```

4. **Launch Application Array**
   ```bash
   npm run dev
   ```

## 📱 Mobile Responsiveness
UI modules leverage Tailwind CSS 4 breakpoint utilities `md:`, `sm:`, enabling the interface flexboxes and bottom overlays to cleanly resize from ultrawide 4k desktop orientations down to iOS/Android mobile screens instantly. The `Canvas` naturally supports pure `w-full h-full` viewports.

## 🎮 User Interactions
- **Orbit Controls**: Click and drag to rotate the globe
- **Zoom**: Scroll wheel to zoom in/out
- **Node Hover**: Hover over city nodes to see detailed information
- **City Deployment**: Search and add new cities to the network
- **Real-time Sync**: All changes appear instantly for all users

## 🔧 Key Features
- ✅ Real-time multiplayer synchronization
- ✅ 61 pre-configured global cities
- ✅ Dynamic city addition via geocoding
- ✅ Animated data flow visualization
- ✅ Political boundary highlighting
- ✅ Responsive design for all devices
- ✅ Production-ready TypeScript architecture
- ✅ Optimized 3D rendering pipeline
# Globe
