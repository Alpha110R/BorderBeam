
import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, HardDriveUpload, Expand, Minimize, Layers, Rows } from "lucide-react"; // Added Layers and Rows icons
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Standalone helper function for creating point clouds
const createPointCloud = (color, size, spread, densityFactor) => {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const numPoints = 5000 * densityFactor;
  for (let i = 0; i < numPoints; i++) {
    const x = (Math.random() - 0.5) * spread;
    const y = (Math.random() - 0.5) * spread;
    const z = (Math.random() - 0.5) * spread;
    vertices.push(x, y, z);
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  const material = new THREE.PointsMaterial({ size, color, sizeAttenuation: true });
  return new THREE.Points(geometry, material);
};

export default function PotreeViewer({ detection, viewMode, isFullScreen, onToggleFullScreen }) {
  const mainContainerRef = useRef(null);
  const topContainerRef = useRef(null);
  const bottomContainerRef = useRef(null);
  
  const [threeObjects, setThreeObjects] = useState({ main: null, top: null, bottom: null });
  const [isBothViewCombined, setIsBothViewCombined] = useState(false); // State for combined/split toggle
  const animationFrameRef = useRef(null);

  const initThreeScene = useCallback((container, pointCloudConfigs = []) => {
    if (!container) return null;
    container.innerHTML = '';
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 200;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 20;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    
    const pointCloudGroup = new THREE.Group();
    scene.add(pointCloudGroup);

    pointCloudConfigs.forEach(config => {
      if (config) { // Ensure config is not null/undefined
        const points = createPointCloud(config.color, config.size, config.spread, config.density);
        if (config.offsetX) points.position.x = config.offsetX; // Optional offset
        pointCloudGroup.add(points);
      }
    });
    
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const handleMouseDown = (event) => { isDragging = true; previousMousePosition = { x: event.offsetX, y: event.offsetY }; };
    const handleMouseUp = () => { isDragging = false; };
    const handleMouseMove = (event) => {
      if (!isDragging) return;
      const deltaMove = { x: event.offsetX - previousMousePosition.x, y: event.offsetY - previousMousePosition.y };
      pointCloudGroup.rotation.y += deltaMove.x * 0.005;
      pointCloudGroup.rotation.x += deltaMove.y * 0.005;
      previousMousePosition = { x: event.offsetX, y: event.offsetY };
    };
    const handleWheel = (event) => {
      event.preventDefault();
      camera.position.z += event.deltaY * 0.1;
      camera.position.z = Math.max(1, Math.min(100, camera.position.z));
    };
    
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });
    renderer.domElement.addEventListener('mouseout', handleMouseUp);
    
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth > 0 && newHeight > 0) {
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      }
    };
    
    const cleanup = () => {
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('mouseout', handleMouseUp);
      while(pointCloudGroup.children.length > 0) {
        const child = pointCloudGroup.children[0];
        if(child.geometry) child.geometry.dispose();
        if(child.material) child.material.dispose();
        pointCloudGroup.remove(child);
      }
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
    
    return { scene, camera, renderer, pointCloudGroup, container, handleResize, cleanup };
  }, []);

  useEffect(() => {
    if (threeObjects.main?.cleanup) threeObjects.main.cleanup();
    if (threeObjects.top?.cleanup) threeObjects.top.cleanup();
    if (threeObjects.bottom?.cleanup) threeObjects.bottom.cleanup();
    
    const newThreeObjects = { main: null, top: null, bottom: null };
    const isLas = detection?.originalPointCloud?.startsWith("LAS_FILE:");

    const originalConfig = detection ? { 
      color: isLas ? 0x009900 : 0x007bff, size: 0.05, spread: 10, density: isLas ? 1.5 : 1 
    } : null;
    const detectionConfig = detection ? { 
      color: isLas ? 0xff8c00 : 0xdc3545, size: isLas ? 0.06 : 0.05, spread: isLas ? 10 : 8, density: isLas ? 1.2 : 1
    } : null;
    
    if (detection) {
      if (viewMode === "both") {
        if (isBothViewCombined) {
          if (mainContainerRef.current) {
            newThreeObjects.main = initThreeScene(mainContainerRef.current, [originalConfig, detectionConfig]);
          }
        } else {
          if (topContainerRef.current) newThreeObjects.top = initThreeScene(topContainerRef.current, [originalConfig]);
          if (bottomContainerRef.current) newThreeObjects.bottom = initThreeScene(bottomContainerRef.current, [detectionConfig]);
        }
      } else if (viewMode === "original") {
        if (mainContainerRef.current) newThreeObjects.main = initThreeScene(mainContainerRef.current, [originalConfig]);
      } else if (viewMode === "detection") {
        if (mainContainerRef.current) newThreeObjects.main = initThreeScene(mainContainerRef.current, [detectionConfig]);
      }
    }
    
    setThreeObjects(newThreeObjects);
    
    // Animation loop setup (moved outside for clarity)
    // Cleanup is handled by returning from this useEffect
  }, [detection, viewMode, isBothViewCombined, initThreeScene]);


  // Centralized Animation Loop & Global Resize
  useEffect(() => {
    const activeInstances = Object.values(threeObjects).filter(Boolean);
    
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      activeInstances.forEach(inst => {
        if (inst?.renderer && inst.scene && inst.camera) {
          inst.renderer.render(inst.scene, inst.camera);
        }
      });
    };
    animationFrameRef.current = requestAnimationFrame(animate);

    const handleGlobalResize = () => {
      activeInstances.forEach(inst => inst?.handleResize?.());
    };
    window.addEventListener('resize', handleGlobalResize);
    
    // Initial resize call after a short delay
    const resizeTimer = setTimeout(handleGlobalResize, 100);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleGlobalResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      // Instance cleanup is handled by the main useEffect that depends on [detection, viewMode, ...]
    };
  }, [threeObjects]);


  useEffect(() => {
    const timer = setTimeout(() => {
      Object.values(threeObjects).filter(Boolean).forEach(inst => inst?.handleResize?.());
    }, 200);
    return () => clearTimeout(timer);
  }, [isFullScreen, threeObjects]);

  const isLasFile = detection?.originalPointCloud?.startsWith("LAS_FILE:");
  const lasFileName = isLasFile ? detection.originalPointCloud.substring("LAS_FILE:".length) : "";

  return (
    <div className="relative h-full w-full">
      {/* Full Screen Toggle Button */}
      <Button
        variant="outline" size="icon" onClick={onToggleFullScreen}
        className="absolute top-2 right-2 z-20 bg-white/80 hover:bg-white shadow-sm"
        title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
      >
        {isFullScreen ? <Minimize className="h-5 w-5" /> : <Expand className="h-5 w-5" />}
      </Button>

      {/* Combine/Split Toggle Button for "Both" mode */}
      {viewMode === "both" && detection && (
        <Button
          variant="outline" size="sm"
          onClick={() => setIsBothViewCombined(prev => !prev)}
          className="absolute top-2 right-12 z-20 bg-white/80 hover:bg-white shadow-sm flex items-center"
          title={isBothViewCombined ? "Split View" : "Combine View"}
        >
          {isBothViewCombined ? <Rows className="h-4 w-4 mr-1" /> : <Layers className="h-4 w-4 mr-1" />}
          {isBothViewCombined ? "Split" : "Combine"}
        </Button>
      )}
      
      {!detection && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 backdrop-blur-sm z-10">
          <Alert className="w-auto max-w-md bg-white shadow-xl">
            <Info className="h-5 w-5" />
            <AlertTitle>No Detection Selected</AlertTitle>
            <AlertDescription>
              Select a detection from the list or upload a LAS file.
            </AlertDescription>
          </Alert>
        </div>
      )}
      {isLasFile && (viewMode !== "both" || (viewMode === "both" && isBothViewCombined)) && (
        <div className="absolute top-2 left-2 right-14 z-10">
          <Alert variant="default" className="bg-yellow-100/90 border-yellow-400 text-yellow-800 shadow-md">
            <HardDriveUpload className="h-5 w-5 text-yellow-700" />
            <AlertTitle className="font-semibold">LAS File Simulation</AlertTitle>
            <AlertDescription className="text-xs">
              Displaying simulated view for <span className="font-medium">{lasFileName}</span>
            </AlertDescription>
          </Alert>
        </div>
      )}
      {detection && (viewMode !== "both" || (viewMode === "both" && isBothViewCombined)) && !isLasFile && (
        <div className="absolute top-14 left-4 z-10 sm:top-4">
          <Badge className="text-sm bg-white/80 backdrop-blur-sm text-gray-800 border shadow-sm">
            {viewMode === "original" ? "Original Point Cloud" : "Detection Point Cloud"}
          </Badge>
        </div>
      )}

      {/* Container for "original", "detection", or COMBINED "both" mode */}
      {(viewMode !== "both" || (viewMode === "both" && isBothViewCombined)) && (
        <div 
          ref={mainContainerRef}
          className="w-full h-full cursor-grab active:cursor-grabbing bg-gray-100"
        >
          {/* LAS File Alert in Combined View */}
          {viewMode === "both" && isBothViewCombined && isLasFile && (
             <div className="absolute top-2 left-2 z-10 right-auto">
                <Alert variant="default" className="bg-yellow-100/90 border-yellow-400 text-yellow-800 shadow-md p-2">
                    <HardDriveUpload className="h-4 w-4 text-yellow-700 inline mr-1" />
                    <span className="font-semibold text-xs">LAS (Simulated - Combined)</span>
                </Alert>
             </div>
          )}
          {/* Mode Badge in Combined View */}
          {viewMode === "both" && isBothViewCombined && !isLasFile && (
             <div className="absolute top-2 left-2 z-10">
                <Badge className="text-sm bg-white/80 backdrop-blur-sm text-gray-800 border shadow-sm">Combined View</Badge>
             </div>
          )}
        </div>
      )}
      
      {/* Split View Containers for "both" mode when NOT combined */}
      {viewMode === "both" && !isBothViewCombined && (
        <div className="flex flex-col w-full h-full">
          <div className="w-full h-1/2 pb-0.5 relative">
            <div ref={topContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing bg-gray-100"></div>
            <Badge className="absolute top-2 left-2 z-10 text-sm bg-white/80 backdrop-blur-sm text-gray-800 border shadow-sm">Original</Badge>
            {isLasFile && (<div className="absolute top-2 right-2 z-10"><Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300"><HardDriveUpload className="h-3 w-3 mr-1" />LAS</Badge></div>)}
          </div>
          <div className="w-full h-1/2 pt-0.5 relative">
            <div ref={bottomContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing bg-gray-100"></div>
            <Badge className="absolute top-2 left-2 z-10 text-sm bg-white/80 backdrop-blur-sm text-gray-800 border shadow-sm">Detection</Badge>
            {isLasFile && (<div className="absolute top-2 right-2 z-10"><Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300"><HardDriveUpload className="h-3 w-3 mr-1" />Sim. Detection</Badge></div>)}
          </div>
        </div>
      )}
    </div>
  );
}
