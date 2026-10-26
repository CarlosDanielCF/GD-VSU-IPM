import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { NeighborhoodCell, BlockCell, UrbanPOI, ShockScenario, PolicyScenario } from '../../types';
import { 
  Box, 
  Layers, 
  Activity, 
  ShieldAlert, 
  Zap, 
  Compass, 
  Maximize2, 
  RotateCw, 
  Sun, 
  Moon, 
  Eye, 
  Flame, 
  Cpu, 
  Radio,
  Sliders,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Video,
  Play,
  Pause,
  Wifi,
  Droplets
} from 'lucide-react';

interface DigitalTwin3DViewerProps {
  neighborhoods: NeighborhoodCell[];
  blocks: BlockCell[];
  pois: UrbanPOI[];
  selectedNeighborhood: NeighborhoodCell | null;
  onSelectNeighborhood: (neighborhood: NeighborhoodCell) => void;
  activeShocks: ShockScenario[];
  activePolicies: PolicyScenario[];
  currentYear: number;
  onOpenGuide?: () => void;
}

export const DigitalTwin3DViewer: React.FC<DigitalTwin3DViewerProps> = ({
  neighborhoods,
  blocks,
  pois,
  selectedNeighborhood,
  onSelectNeighborhood,
  activeShocks,
  activePolicies,
  currentYear,
  onOpenGuide
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const hoveredMeshRef = useRef<THREE.Mesh | null>(null);
  
  // Dynamic Objects Refs
  const buildingsGroupRef = useRef<THREE.Group>(new THREE.Group());
  const agentParticlesRef = useRef<THREE.Points | null>(null);
  const shockRingsGroupRef = useRef<THREE.Group>(new THREE.Group());
  const policyDomesGroupRef = useRef<THREE.Group>(new THREE.Group());
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const poiPinsGroupRef = useRef<THREE.Group>(new THREE.Group());
  const iotSensorsGroupRef = useRef<THREE.Group>(new THREE.Group());
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);

  // 3D View States
  const [renderMode, setRenderMode] = useState<'cyber_lidar' | 'satellite_night' | 'thermal_ipm' | 'topographic'>('cyber_lidar');
  const [cameraPreset, setCameraPreset] = useState<'isometric' | 'top_down' | 'street_flyover' | 'hillside_focus'>('isometric');
  const [extrusionScale, setExtrusionScale] = useState<number>(1.8);
  const [showSwarmAgents, setShowSwarmAgents] = useState<boolean>(true);
  const [showHazardRings, setShowHazardRings] = useState<boolean>(true);
  const [showPolicyShields, setShowPolicyShields] = useState<boolean>(true);
  const [showIoTSensors, setShowIoTSensors] = useState<boolean>(true);
  const [hoveredData, setHoveredData] = useState<NeighborhoodCell | null>(null);
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [isCinematicTour, setIsCinematicTour] = useState<boolean>(false);
  const [timeOfDay, setTimeOfDay] = useState<'night' | 'sunset' | 'day'>('night');
  const [swarmSpeed, setSwarmSpeed] = useState<number>(1.0);

  // Dynamically compute geographical centroid of active department/city neighborhoods
  const centerGeo = useMemo(() => {
    if (!neighborhoods || neighborhoods.length === 0) {
      return { lat: -12.0850, lng: -77.0100 };
    }
    const sumLat = neighborhoods.reduce((acc, n) => acc + (n.centroide?.[0] || -12.0850), 0);
    const sumLng = neighborhoods.reduce((acc, n) => acc + (n.centroide?.[1] || -77.0100), 0);
    return {
      lat: sumLat / neighborhoods.length,
      lng: sumLng / neighborhoods.length
    };
  }, [neighborhoods]);

  const scaleGeo = 420; // coordinate scale multiplier

  const latLngTo3D = useCallback((lat: number, lng: number, elevation: number = 0): [number, number, number] => {
    const x = (lng - centerGeo.lng) * scaleGeo;
    const z = -(lat - centerGeo.lat) * scaleGeo;
    const y = elevation;
    return [x, y, z];
  }, [centerGeo]);

  // Color mapping based on renderMode and metric
  const getNeighborhoodColor = (n: NeighborhoodCell, mode: string): THREE.Color => {
    if (mode === 'thermal_ipm') {
      if (n.ipm_M0 >= 0.45) return new THREE.Color(0xff1133); // Red critical
      if (n.ipm_M0 >= 0.35) return new THREE.Color(0xff6600); // Orange high
      if (n.ipm_M0 >= 0.20) return new THREE.Color(0xffbb00); // Yellow medium
      return new THREE.Color(0x00e5a3); // Green low
    }
    if (mode === 'satellite_night') {
      const lum = Math.min(1, Math.max(0.05, n.luminosidadNocturnaVIIRS / 60));
      return new THREE.Color(0.1 + lum * 0.4, 0.4 + lum * 0.6, 0.9 + lum * 0.1);
    }
    if (mode === 'topographic') {
      // Topographic slope color based on zone and morphological terrain
      const elevNorm = n.zona === 'periferia_ladera' ? 0.85 : n.zona === 'expansion_sur' ? 0.45 : 0.15;
      return new THREE.Color(0.2 + elevNorm * 0.6, 0.3 + (1 - elevNorm) * 0.4, 0.2);
    }
    // Default cyber lidar mode
    if (n.ipm_M0 >= 0.45) return new THREE.Color(0xff3366);
    if (n.ipm_M0 >= 0.35) return new THREE.Color(0xffaa00);
    return new THREE.Color(0x00ffc2);
  };

  // Initialize Three.js Scene, Camera, Lights, and Orbit Controls
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0b);
    scene.fog = new THREE.FogExp2(0x0a0a0b, 0.0055);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(65, 75, 75);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    
    // Clear existing canvas if any
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const dirLight = new THREE.DirectionalLight(0x00ffc2, 1.6);
    dirLight.position.set(50, 120, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    const blueSubLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    blueSubLight.position.set(-60, 80, -60);
    scene.add(blueSubLight);

    // 5. Add Groups to Scene
    scene.add(buildingsGroupRef.current);
    scene.add(shockRingsGroupRef.current);
    scene.add(policyDomesGroupRef.current);
    scene.add(poiPinsGroupRef.current);
    scene.add(iotSensorsGroupRef.current);

    // 6. Base Topographic Grid Plane
    const gridHelper = new THREE.GridHelper(240, 48, 0x00ffc2, 0x1f2937);
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);

    // 7. Hillside Topographic Elevation Mesh
    const terrainGeo = new THREE.PlaneGeometry(240, 240, 48, 48);
    terrainGeo.rotateX(-Math.PI / 2);
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      // Simulate coastal foothills (Laderas de Lima / Cerros San Cristobal, Comas, SJM)
      const distFromCenter = Math.sqrt(x * x + z * z);
      const hillWave = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 6;
      const slopeRise = (x * 0.08 + z * 0.04) * (distFromCenter > 30 ? 1.5 : 0.4);
      posAttr.setY(i, Math.max(0, hillWave + slopeRise - 2));
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x111115,
      roughness: 0.85,
      metalness: 0.2,
      wireframe: renderMode === 'cyber_lidar',
      wireframeLinewidth: 1
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // 8. Mouse Interaction (Orbiting & Raycasting)
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let cameraAngle = Math.PI / 4;
    let cameraHeight = 75;
    let cameraRadius = 110;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - prevMousePos.x;
        const deltaY = e.clientY - prevMousePos.y;
        cameraAngle -= deltaX * 0.007;
        cameraHeight = Math.max(15, Math.min(160, cameraHeight - deltaY * 0.35));
        cameraRadius = Math.max(35, Math.min(220, cameraRadius - deltaY * 0.15));

        camera.position.x = Math.sin(cameraAngle) * cameraRadius;
        camera.position.z = Math.cos(cameraAngle) * cameraRadius;
        camera.position.y = cameraHeight;
        camera.lookAt(0, 4, 0);

        prevMousePos = { x: e.clientX, y: e.clientY };
      } else {
        // Raycaster for hover telemetry
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
        const intersects = raycaster.intersectObjects(buildingsGroupRef.current.children, true);

        if (intersects.length > 0) {
          const hitObj = intersects[0].object as THREE.Mesh;
          if (hitObj.userData && hitObj.userData.neighborhood) {
            setHoveredData(hitObj.userData.neighborhood);
            container.style.cursor = 'pointer';
          }
        } else {
          setHoveredData(null);
          container.style.cursor = 'default';
        }
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraRadius = Math.max(30, Math.min(220, cameraRadius + e.deltaY * 0.06));
      camera.position.x = Math.sin(cameraAngle) * cameraRadius;
      camera.position.z = Math.cos(cameraAngle) * cameraRadius;
      camera.lookAt(0, 4, 0);
    };

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      const intersects = raycaster.intersectObjects(buildingsGroupRef.current.children, true);

      if (intersects.length > 0) {
        const hitObj = intersects[0].object as THREE.Mesh;
        if (hitObj.userData && hitObj.userData.neighborhood) {
          onSelectNeighborhood(hitObj.userData.neighborhood);
        }
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });
    domElement.addEventListener('click', onClick);

    // Touch Support for Mobile / Tablet Devices
    let touchStartDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDist = Math.sqrt(dx * dx + dy * dy);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDragging) {
        const deltaX = e.touches[0].clientX - prevMousePos.x;
        const deltaY = e.touches[0].clientY - prevMousePos.y;
        cameraAngle -= deltaX * 0.007;
        cameraHeight = Math.max(15, Math.min(160, cameraHeight - deltaY * 0.35));
        cameraRadius = Math.max(35, Math.min(220, cameraRadius - deltaY * 0.15));

        camera.position.x = Math.sin(cameraAngle) * cameraRadius;
        camera.position.z = Math.cos(cameraAngle) * cameraRadius;
        camera.position.y = cameraHeight;
        camera.lookAt(0, 4, 0);

        prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.sqrt(dx * dx + dy * dy);
        const distDiff = touchStartDist - currentDist;
        
        cameraRadius = Math.max(30, Math.min(220, cameraRadius + distDiff * 0.2));
        camera.position.x = Math.sin(cameraAngle) * cameraRadius;
        camera.position.z = Math.cos(cameraAngle) * cameraRadius;
        camera.lookAt(0, 4, 0);
        touchStartDist = currentDist;
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 9. Animation Render Loop
    let clock = new THREE.Clock();
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Autopilot: Cinematic Tour or Auto-rotation
      if (isCinematicTour) {
        cameraAngle += delta * 0.16;
        const tourRadius = 88 + Math.sin(elapsedTime * 0.3) * 32;
        const tourHeight = 46 + Math.cos(elapsedTime * 0.25) * 26;
        camera.position.x = Math.sin(cameraAngle) * tourRadius;
        camera.position.z = Math.cos(cameraAngle) * tourRadius;
        camera.position.y = tourHeight;
        camera.lookAt(0, 4, 0);
      } else if (isRotating) {
        cameraAngle += delta * 0.15;
        camera.position.x = Math.sin(cameraAngle) * cameraRadius;
        camera.position.z = Math.cos(cameraAngle) * cameraRadius;
        camera.lookAt(0, 4, 0);
      }

      // Animate Swarm Agents Movement
      if (agentParticlesRef.current) {
        const posArr = agentParticlesRef.current.geometry.attributes.position.array as Float32Array;
        const count = posArr.length / 3;
        for (let i = 0; i < count; i++) {
          const idx = i * 3;
          // Drift along local street axes
          posArr[idx] += Math.sin(elapsedTime * swarmSpeed + i) * 0.08 * swarmSpeed;
          posArr[idx + 2] += Math.cos(elapsedTime * swarmSpeed * 0.7 + i) * 0.08 * swarmSpeed;
          
          // Keep bounded
          if (posArr[idx] > 110) posArr[idx] = -110;
          if (posArr[idx] < -110) posArr[idx] = 110;
          if (posArr[idx + 2] > 110) posArr[idx + 2] = -110;
          if (posArr[idx + 2] < -110) posArr[idx + 2] = 110;
        }
        agentParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Pulse Shock Hazard Rings
      shockRingsGroupRef.current.children.forEach((ring, idx) => {
        const mesh = ring as THREE.Mesh;
        const scaleVal = 1 + (Math.sin(elapsedTime * 3 + idx) * 0.15);
        mesh.scale.set(scaleVal, 1, scaleVal);
        if (mesh.material instanceof THREE.MeshBasicMaterial) {
          mesh.material.opacity = 0.4 + Math.sin(elapsedTime * 4 + idx) * 0.3;
        }
      });

      // Pulse Policy Domes
      policyDomesGroupRef.current.children.forEach((dome, idx) => {
        const mesh = dome as THREE.Mesh;
        mesh.rotation.y = elapsedTime * 0.4 + idx;
      });

      // Pulse IoT Sensor Beacons
      iotSensorsGroupRef.current.children.forEach((beacon, idx) => {
        const group = beacon as THREE.Group;
        const ring = group.getObjectByName('beaconRing');
        if (ring) {
          const s = 1 + (Math.sin(elapsedTime * 4.5 + idx * 1.8) * 0.35);
          ring.scale.set(s, s, s);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      domElement.removeEventListener('click', onClick);
      domElement.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [isRotating, renderMode, swarmSpeed]);

  // Re-build 3D Buildings & Urban Blocks when data or extrusion changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const group = buildingsGroupRef.current;
    
    // Clear old buildings
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }

    // Build 3D Extruded Blocks from Neighborhoods
    neighborhoods.forEach((n) => {
      const lat = n.centroide?.[0] ?? -12.085;
      const lng = n.centroide?.[1] ?? -77.010;
      const [centerX, , centerZ] = latLngTo3D(lat, lng);
      const isSelected = selectedNeighborhood?.id === n.id;
      
      // Height proportional to Poverty Index (M0) or Density
      const rawHeight = (n.ipm_M0 ?? 0.25) * 28 * extrusionScale;
      const height = Number.isFinite(rawHeight) && rawHeight > 0 ? Math.max(1.5, rawHeight) : 6.0;
      
      // Area in hectares to footprint sizing
      const areaHectares = typeof n.areaHectareas === 'number' && !isNaN(n.areaHectareas) ? n.areaHectareas : 80;
      const rawSize = Math.sqrt(areaHectares / 100) * 7.5;
      const width = Number.isFinite(rawSize) && rawSize > 0 ? Math.max(4.5, Math.min(10, rawSize)) : 6.5;
      const depth = width;

      const boxGeo = new THREE.BoxGeometry(width, height, depth);
      const color = getNeighborhoodColor(n, renderMode);

      const mat = new THREE.MeshStandardMaterial({
        color: isSelected ? 0xffffff : color,
        emissive: isSelected ? 0x00ffc2 : (n.ipm_M0 >= 0.45 ? 0x330011 : 0x001111),
        emissiveIntensity: isSelected ? 0.7 : 0.25,
        roughness: 0.35,
        metalness: 0.65,
        wireframe: renderMode === 'cyber_lidar' && !isSelected
      });

      const mesh = new THREE.Mesh(boxGeo, mat);
      mesh.position.set(centerX, height / 2, centerZ);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { neighborhood: n };

      group.add(mesh);

      // Add 3D Beacon Antenna or Hologram Tag for Critical Neighborhoods
      if (n.ipm_M0 >= 0.40) {
        const beaconGeo = new THREE.CylinderGeometry(0.15, 0.15, 6, 8);
        const beaconMat = new THREE.MeshBasicMaterial({ 
          color: n.ipm_M0 >= 0.45 ? 0xff3366 : 0xffaa00,
          transparent: true,
          opacity: 0.85
        });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(centerX, height + 3, centerZ);
        group.add(beacon);

        // Warning Sphere on top
        const sphereGeo = new THREE.SphereGeometry(0.8, 8, 8);
        const sphereMat = new THREE.MeshBasicMaterial({ color: 0xff1144 });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.position.set(centerX, height + 6, centerZ);
        group.add(sphere);
      }
    });

  }, [neighborhoods, selectedNeighborhood, renderMode, extrusionScale, latLngTo3D]);

  // Update 3D Synthetic Agent Particle Swarm
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    if (agentParticlesRef.current) {
      scene.remove(agentParticlesRef.current);
      agentParticlesRef.current.geometry.dispose();
      (agentParticlesRef.current.material as THREE.Material).dispose();
      agentParticlesRef.current = null;
    }

    if (!showSwarmAgents || neighborhoods.length === 0) return;

    const particleCount = 1200;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Pick a random neighborhood centroid as origin
      const n = neighborhoods[i % neighborhoods.length];
      const lat = n?.centroide?.[0] ?? -12.085;
      const lng = n?.centroide?.[1] ?? -77.010;
      const [nx, , nz] = latLngTo3D(lat, lng);
      
      const spread = 8.0;
      positions[i * 3] = nx + (Math.random() - 0.5) * spread * 2;
      positions[i * 3 + 1] = 0.5 + Math.random() * 3.5;
      positions[i * 3 + 2] = nz + (Math.random() - 0.5) * spread * 2;

      // Color based on simulated poverty status
      const isPoor = Math.random() < (n?.ipm_H ?? 0.3);
      if (isPoor) {
        colors[i * 3] = 1.0; // Red/Yellow
        colors[i * 3 + 1] = 0.2;
        colors[i * 3 + 2] = 0.3;
      } else {
        colors[i * 3] = 0.0; // Cyan
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 0.76;
      }
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    agentParticlesRef.current = particles;

  }, [neighborhoods, showSwarmAgents, latLngTo3D]);

  // Update 3D Shock Wavefronts
  useEffect(() => {
    const group = shockRingsGroupRef.current;
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        obj.material.dispose();
      }
    }

    if (!showHazardRings) return;

    activeShocks.filter(s => s.activo).forEach((shock, sIdx) => {
      if (shock.epicentroLat && shock.epicentroLng) {
        const [sx, , sz] = latLngTo3D(shock.epicentroLat, shock.epicentroLng);
        const radius = (shock.radioAfectacionKm || 3.5) * 4.5;

        // Shock expanding ring
        const ringGeo = new THREE.RingGeometry(radius * 0.8, radius, 32);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
          color: shock.tipoChoque === 'inflacion_alimentos' ? 0xffaa00 : 0xff2244,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.set(sx, 0.4 + sIdx * 0.2, sz);
        group.add(ringMesh);

        // Hazard Pillar
        const pillarGeo = new THREE.CylinderGeometry(0.3, 0.3, 30, 12);
        const pillarMat = new THREE.MeshBasicMaterial({
          color: 0xff3355,
          transparent: true,
          opacity: 0.75
        });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(sx, 15, sz);
        group.add(pillar);
      }
    });
  }, [activeShocks, showHazardRings, latLngTo3D]);

  // Update 3D Policy Domes & Protective Force Fields
  useEffect(() => {
    const group = policyDomesGroupRef.current;
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        obj.material.dispose();
      }
    }

    if (!showPolicyShields) return;

    activePolicies.filter(p => p.activo).forEach((policy) => {
      policy.barriosObjetivoIds.forEach((bId) => {
        const barrio = neighborhoods.find(n => n.id === bId);
        if (barrio) {
          const [bx, , bz] = latLngTo3D(barrio.centroide[0], barrio.centroide[1]);
          const domeGeo = new THREE.SphereGeometry(7.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
          const domeMat = new THREE.MeshBasicMaterial({
            color: 0x00ffc2,
            wireframe: true,
            transparent: true,
            opacity: 0.45
          });
          const dome = new THREE.Mesh(domeGeo, domeMat);
          dome.position.set(bx, 0.1, bz);
          group.add(dome);
        }
      });
    });
  }, [activePolicies, neighborhoods, showPolicyShields, latLngTo3D]);

  // Adjust Lighting & Atmosphere based on TimeOfDay
  useEffect(() => {
    if (!dirLightRef.current || !ambientLightRef.current || !sceneRef.current) return;
    const scene = sceneRef.current;

    if (timeOfDay === 'night') {
      scene.fog = new THREE.FogExp2(0x0a0a0c, 0.005);
      dirLightRef.current.color.setHex(0x00ffc2);
      dirLightRef.current.intensity = 1.4;
      ambientLightRef.current.color.setHex(0x1a2030);
      ambientLightRef.current.intensity = 0.6;
    } else if (timeOfDay === 'sunset') {
      scene.fog = new THREE.FogExp2(0x1c1014, 0.004);
      dirLightRef.current.color.setHex(0xff7733);
      dirLightRef.current.intensity = 2.0;
      ambientLightRef.current.color.setHex(0x401824);
      ambientLightRef.current.intensity = 0.85;
    } else { // day
      scene.fog = new THREE.FogExp2(0x182430, 0.003);
      dirLightRef.current.color.setHex(0xffffff);
      dirLightRef.current.intensity = 2.2;
      ambientLightRef.current.color.setHex(0x5a6d7c);
      ambientLightRef.current.intensity = 1.1;
    }
  }, [timeOfDay]);

  // Update 3D IoT Sensor Beacons on City Topography
  useEffect(() => {
    const group = iotSensorsGroupRef.current;
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        obj.material.dispose();
      }
    }

    if (!showIoTSensors || neighborhoods.length === 0) return;

    // Place sensor beacons on relevant neighborhoods
    const sensorDefinitions = [
      { type: 'water', color: 0x38bdf8, label: 'SEDAPAL-HYD', zoneKey: 'periferia_ladera', heightOffset: 12 },
      { type: 'air', color: 0xffaa00, label: 'AIR-PM25', zoneKey: 'comercial', heightOffset: 14 },
      { type: 'slope', color: 0xff3355, label: 'GEO-SLOPE', zoneKey: 'periferia_ladera', heightOffset: 16 },
      { type: 'viirs', color: 0x00ffc2, label: 'SAT-VIIRS', zoneKey: 'expansion_sur', heightOffset: 13 },
      { type: 'transit', color: 0xbb66ff, label: 'METRO-L1', zoneKey: 'centro', heightOffset: 15 }
    ];

    sensorDefinitions.forEach((sDef, idx) => {
      const matchNeigh = neighborhoods.find(n => n.zona === sDef.zoneKey) || neighborhoods[idx % neighborhoods.length];
      if (!matchNeigh) return;

      const [bx, , bz] = latLngTo3D(matchNeigh.centroide[0], matchNeigh.centroide[1]);
      const beaconSubGroup = new THREE.Group();
      beaconSubGroup.position.set(bx, 0, bz);

      // Antenna mast
      const mastGeo = new THREE.CylinderGeometry(0.2, 0.35, sDef.heightOffset, 8);
      const mastMat = new THREE.MeshStandardMaterial({
        color: 0x333340,
        metalness: 0.8,
        roughness: 0.2
      });
      const mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.y = sDef.heightOffset / 2;
      beaconSubGroup.add(mast);

      // Glowing sensor head
      const headGeo = new THREE.SphereGeometry(0.9, 12, 12);
      const headMat = new THREE.MeshBasicMaterial({ color: sDef.color });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = sDef.heightOffset + 0.5;
      beaconSubGroup.add(head);

      // Pulsing telemetry ring
      const ringGeo = new THREE.RingGeometry(1.6, 2.2, 24);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: sDef.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.name = 'beaconRing';
      ring.position.y = sDef.heightOffset + 0.5;
      beaconSubGroup.add(ring);

      group.add(beaconSubGroup);
    });
  }, [showIoTSensors, neighborhoods, latLngTo3D]);

  // Change Camera Preset
  const handleCameraPreset = (preset: 'isometric' | 'top_down' | 'street_flyover' | 'hillside_focus') => {
    setCameraPreset(preset);
    if (!cameraRef.current) return;
    const camera = cameraRef.current;

    if (preset === 'isometric') {
      camera.position.set(65, 75, 75);
      camera.lookAt(0, 0, 0);
    } else if (preset === 'top_down') {
      camera.position.set(0, 140, 0.001);
      camera.lookAt(0, 0, 0);
    } else if (preset === 'street_flyover') {
      camera.position.set(25, 14, 30);
      camera.lookAt(0, 4, 0);
    } else if (preset === 'hillside_focus') {
      camera.position.set(-60, 45, -50);
      camera.lookAt(10, 8, 10);
    }
  };

  return (
    <div className="relative w-full h-[540px] lg:h-[640px] rounded-sm overflow-hidden border border-[#2A2A2E] bg-[#0A0A0B] shadow-2xl flex flex-col font-mono select-none">
      
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: 3D Render Mode & Interactive Guide Callout */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5 bg-[#0F0F11]/95 backdrop-blur-md p-1.5 rounded-sm border border-[#2A2A2E] shadow-xl text-xs">
        <span className="text-[10px] uppercase font-bold tracking-widest text-[#00FFC2] px-1.5 flex items-center gap-1">
          <Cpu className="w-3.5 h-3.5 text-[#00FFC2]" /> MODO 3D:
        </span>

        <button
          onClick={() => setRenderMode('cyber_lidar')}
          className={`px-2 py-1 text-[10px] rounded-sm font-bold uppercase transition-all ${
            renderMode === 'cyber_lidar' 
              ? 'bg-[#00FFC2] text-[#0A0A0B]' 
              : 'text-[#8E9299] hover:text-white hover:bg-[#1A1A1D]'
          }`}
          title="Modo LIDAR Cyber Holográfico"
        >
          Cyber LIDAR
        </button>

        <button
          onClick={() => setRenderMode('thermal_ipm')}
          className={`px-2 py-1 text-[10px] rounded-sm font-bold uppercase transition-all ${
            renderMode === 'thermal_ipm' 
              ? 'bg-[#FF4D4D] text-white' 
              : 'text-[#8E9299] hover:text-white hover:bg-[#1A1A1D]'
          }`}
          title="Modo Térmico de Pobreza Multidimensional IPM"
        >
          Térmico IPM
        </button>

        <button
          onClick={() => setRenderMode('satellite_night')}
          className={`px-2 py-1 text-[10px] rounded-sm font-bold uppercase transition-all ${
            renderMode === 'satellite_night' 
              ? 'bg-[#38BDF8] text-[#0A0A0B]' 
              : 'text-[#8E9299] hover:text-white hover:bg-[#1A1A1D]'
          }`}
          title="Modo Satelital Nocturno VIIRS"
        >
          Satelital VIIRS
        </button>

        <button
          onClick={() => setRenderMode('topographic')}
          className={`px-2 py-1 text-[10px] rounded-sm font-bold uppercase transition-all ${
            renderMode === 'topographic' 
              ? 'bg-[#FFAA00] text-[#0A0A0B]' 
              : 'text-[#8E9299] hover:text-white hover:bg-[#1A1A1D]'
          }`}
          title="Modo Topográfico y Pendientes de Ladera"
        >
          Topografía
        </button>

        {onOpenGuide && (
          <button
            onClick={onOpenGuide}
            className="ml-2 flex items-center space-x-1 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase bg-[#1A1A1D] border border-[#00FFC2] text-[#00FFC2] hover:bg-[#00FFC2] hover:text-[#0A0A0B] transition-all shadow-sm cursor-pointer animate-pulse"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Guía Interactiva 3D</span>
          </button>
        )}
      </div>

      {/* Top Right: Camera Angles & Simulation Swarm Controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 bg-[#0F0F11]/95 backdrop-blur-md p-2 rounded-sm border border-[#2A2A2E] shadow-xl text-xs max-w-[210px]">
        <div className="text-[10px] font-bold text-[#8E9299] uppercase tracking-wider mb-0.5 flex items-center justify-between">
          <span>CÁMARA & TOUR 3D</span>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => {
                setIsCinematicTour(!isCinematicTour);
                if (!isCinematicTour) setIsRotating(false);
              }}
              className={`px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-0.5 cursor-pointer ${
                isCinematicTour ? 'bg-[#00FFC2] text-[#0A0A0B]' : 'text-[#8E9299] hover:text-white bg-[#141416]'
              }`}
              title="Tour Cinemático Autopilot en 360°"
            >
              <Video className="w-2.5 h-2.5" />
              <span>{isCinematicTour ? 'TOUR ON' : 'TOUR'}</span>
            </button>
            <button 
              onClick={() => {
                setIsRotating(!isRotating);
                if (!isRotating) setIsCinematicTour(false);
              }}
              className={`p-1 rounded-sm cursor-pointer ${isRotating ? 'text-[#00FFC2] bg-[#141416]' : 'text-[#8E9299]'}`}
              title="Auto-rotación orbital"
            >
              <RotateCw className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => handleCameraPreset('isometric')}
            className={`px-1.5 py-0.5 text-[9px] rounded-sm uppercase ${cameraPreset === 'isometric' ? 'bg-[#00FFC2] text-[#0A0A0B] font-bold' : 'text-[#8E9299] hover:bg-[#1A1A1D]'}`}
          >
            Orbital 45°
          </button>
          <button
            onClick={() => handleCameraPreset('top_down')}
            className={`px-1.5 py-0.5 text-[9px] rounded-sm uppercase ${cameraPreset === 'top_down' ? 'bg-[#00FFC2] text-[#0A0A0B] font-bold' : 'text-[#8E9299] hover:bg-[#1A1A1D]'}`}
          >
            Cenital SIG
          </button>
          <button
            onClick={() => handleCameraPreset('street_flyover')}
            className={`px-1.5 py-0.5 text-[9px] rounded-sm uppercase ${cameraPreset === 'street_flyover' ? 'bg-[#00FFC2] text-[#0A0A0B] font-bold' : 'text-[#8E9299] hover:bg-[#1A1A1D]'}`}
          >
            Calle Rasante
          </button>
          <button
            onClick={() => handleCameraPreset('hillside_focus')}
            className={`px-1.5 py-0.5 text-[9px] rounded-sm uppercase ${cameraPreset === 'hillside_focus' ? 'bg-[#00FFC2] text-[#0A0A0B] font-bold' : 'text-[#8E9299] hover:bg-[#1A1A1D]'}`}
          >
            Laderas
          </button>
        </div>

        {/* Atmosphere & Lighting Mode */}
        <div className="pt-1.5 mt-0.5 border-t border-[#2A2A2E]">
          <div className="text-[9px] text-[#8E9299] mb-1 font-bold">ATMÓSFERA URBANA:</div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setTimeOfDay('night')}
              className={`px-1 py-0.5 text-[8px] rounded uppercase font-bold flex items-center justify-center gap-0.5 ${
                timeOfDay === 'night' ? 'bg-[#141F28] text-[#38BDF8] border border-[#38BDF8]/40' : 'text-[#8E9299] hover:text-white bg-[#141416]'
              }`}
            >
              <Moon className="w-2.5 h-2.5" />
              <span>Noche</span>
            </button>
            <button
              onClick={() => setTimeOfDay('sunset')}
              className={`px-1 py-0.5 text-[8px] rounded uppercase font-bold flex items-center justify-center gap-0.5 ${
                timeOfDay === 'sunset' ? 'bg-[#261805] text-[#FFAA00] border border-[#FFAA00]/40' : 'text-[#8E9299] hover:text-white bg-[#141416]'
              }`}
            >
              <Sun className="w-2.5 h-2.5" />
              <span>Ocaso</span>
            </button>
            <button
              onClick={() => setTimeOfDay('day')}
              className={`px-1 py-0.5 text-[8px] rounded uppercase font-bold flex items-center justify-center gap-0.5 ${
                timeOfDay === 'day' ? 'bg-[#182430] text-white border border-[#666]' : 'text-[#8E9299] hover:text-white bg-[#141416]'
              }`}
            >
              <Sun className="w-2.5 h-2.5" />
              <span>Día</span>
            </button>
          </div>
        </div>

        {/* 3D Visual Layers Toggles */}
        <div className="pt-2 mt-1 border-t border-[#2A2A2E] space-y-1">
          <button
            onClick={() => setShowIoTSensors(!showIoTSensors)}
            className={`w-full flex items-center justify-between px-2 py-0.5 rounded-sm text-[9px] uppercase transition-colors ${
              showIoTSensors ? 'text-[#38BDF8] bg-[#141416] border border-[#38BDF8]/40' : 'text-[#8E9299] hover:bg-[#1A1A1D]'
            }`}
          >
            <span className="flex items-center gap-1">
              <Wifi className="w-2.5 h-2.5" />
              <span>Sensores IoT 3D</span>
            </span>
            <span className="text-[8px] font-bold">{showIoTSensors ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowSwarmAgents(!showSwarmAgents)}
            className={`w-full flex items-center justify-between px-2 py-0.5 rounded-sm text-[9px] uppercase transition-colors ${
              showSwarmAgents ? 'text-[#00FFC2] bg-[#141416] border border-[#00FFC2]/40' : 'text-[#8E9299] hover:bg-[#1A1A1D]'
            }`}
          >
            <span>Swarm Agentes 3D</span>
            <span className="text-[8px] font-bold">{showSwarmAgents ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowHazardRings(!showHazardRings)}
            className={`w-full flex items-center justify-between px-2 py-0.5 rounded-sm text-[9px] uppercase transition-colors ${
              showHazardRings ? 'text-[#FF4D4D] bg-[#141416] border border-[#FF4D4D]/40' : 'text-[#8E9299] hover:bg-[#1A1A1D]'
            }`}
          >
            <span>Ondas de Choque</span>
            <span className="text-[8px] font-bold">{showHazardRings ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowPolicyShields(!showPolicyShields)}
            className={`w-full flex items-center justify-between px-2 py-0.5 rounded-sm text-[9px] uppercase transition-colors ${
              showPolicyShields ? 'text-[#38BDF8] bg-[#141416] border border-[#38BDF8]/40' : 'text-[#8E9299] hover:bg-[#1A1A1D]'
            }`}
          >
            <span>Cúpulas Políticas</span>
            <span className="text-[8px] font-bold">{showPolicyShields ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Extrusion Slider */}
        <div className="pt-2 mt-1 border-t border-[#2A2A2E]">
          <div className="flex justify-between text-[9px] text-[#8E9299] mb-1">
            <span>EXTRUSIÓN IPM</span>
            <span className="text-white font-bold">{extrusionScale.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.1"
            value={extrusionScale}
            onChange={(e) => setExtrusionScale(parseFloat(e.target.value))}
            className="w-full h-1 bg-[#1A1A1D] accent-[#00FFC2] rounded-none cursor-pointer"
          />
        </div>
      </div>

      {/* Bottom Left: Coordinates & 3D Telemetry HUD */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5 text-[9px]">
          <div className="px-2 py-0.5 bg-[#0F0F11]/90 border border-[#2A2A2E] text-[#00FFC2] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FFC2] animate-ping" />
            SIMULADOR 3D: 60 FPS
          </div>
          <div className="px-2 py-0.5 bg-[#0F0F11]/90 border border-[#2A2A2E] text-[#38BDF8]">
            AGENTES: 10,000 SINTÉTICOS
          </div>
          <div className="px-2 py-0.5 bg-[#0F0F11]/90 border border-[#2A2A2E] text-[#FFAA00]">
            IoT: TELEMETRÍA 10 Hz
          </div>
          <div className="px-2 py-0.5 bg-[#0F0F11]/90 border border-[#2A2A2E] text-[#8E9299]">
            HORIZONTE: {currentYear}
          </div>
        </div>

        {/* 3D Instructions Tip */}
        <div className="bg-[#0F0F11]/95 backdrop-blur-md p-2.5 rounded-sm border border-[#2A2A2E] shadow-xl text-[10px] text-[#8E9299] max-w-xs space-y-1">
          <div className="text-white font-bold uppercase flex items-center gap-1">
            <Compass className="w-3 h-3 text-[#00FFC2]" /> Controles de Navegación 3D:
          </div>
          <div>• <strong>Click + Arrastrar:</strong> Rotar e inclinar cámara en 360°</div>
          <div>• <strong>Rueda del Ratón:</strong> Zoom in / Zoom out</div>
          <div>• <strong>Click en Manzana/Barrio:</strong> Inspeccionar telemetría y Alkire-Foster</div>
        </div>
      </div>

      {/* Hover or Selected Neighborhood Live 3D Hologram Badge */}
      {(hoveredData || selectedNeighborhood) && (
        <div className="absolute bottom-4 right-4 z-20 bg-[#0F0F11]/95 backdrop-blur-md p-3.5 rounded-sm border border-[#00FFC2] shadow-2xl text-xs max-w-sm font-mono animate-in fade-in duration-100">
          {(() => {
            const target = hoveredData || selectedNeighborhood!;
            return (
              <>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00FFC2] animate-ping" />
                    <span className="font-bold text-white text-xs uppercase">{target.nombre}</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase ${
                    target.nivelAlerta === 'critica_roja' ? 'bg-[#1E1114] text-[#FF4D4D] border border-[#FF4D4D]' :
                    target.nivelAlerta === 'alta' ? 'bg-[#241B08] text-[#FFAA00] border border-[#FFAA00]' :
                    'bg-[#0D221D] text-[#00FFC2] border border-[#00FFC2]'
                  }`}>
                    {target.nivelAlerta}
                  </span>
                </div>

                <div className="text-[10px] text-[#8E9299] mb-2">
                  {target.distrito} · Zona: {target.zona.replace('_', ' ')} · Población: {target.poblacionTotal.toLocaleString()}
                </div>

                <div className="grid grid-cols-3 gap-2 bg-[#141416] p-2 rounded-sm border border-[#2A2A2E] text-center">
                  <div>
                    <div className="text-[8px] text-[#8E9299] uppercase font-bold">IPM (M₀)</div>
                    <div className="font-bold text-[#00FFC2] text-xs font-mono">{target.ipm_M0.toFixed(3)}</div>
                  </div>
                  <div>
                    <div className="text-[8px] text-[#8E9299] uppercase font-bold">Incidencia (H)</div>
                    <div className="font-bold text-white text-xs font-mono">{(target.ipm_H * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-[8px] text-[#8E9299] uppercase font-bold">Intensidad (A)</div>
                    <div className="font-bold text-[#FFAA00] text-xs font-mono">{(target.ipm_A * 100).toFixed(0)}%</div>
                  </div>
                </div>

                <div className="mt-2 text-[9px] text-[#8E9299] flex justify-between">
                  <span>VIIRS Luz: <strong className="text-white font-mono">{target.luminosidadNocturnaVIIRS} nW</strong></span>
                  <span>GHSL Informal: <strong className="text-[#FF4D4D] font-mono">{(target.coberturaGHSLInformal * 100).toFixed(0)}%</strong></span>
                </div>
              </>
            );
          })()}
        </div>
      )}

    </div>
  );
};
