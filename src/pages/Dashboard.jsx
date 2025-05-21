
import React, { useState, useEffect, useRef } from "react";
import DetectionList from "../components/DetectionList";
import PotreeViewer from "../components/PotreeViewer";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils"; // Import cn for conditional classes

export default function Dashboard() {
  const [detections, setDetections] = useState([
    {
      id: 1,
      type: "Obstacle",
      time: "2023-06-15T10:30:00",
      name: "Pre-processed Scan 1",
      originalPointCloud: "/pointclouds/original1.json",
      detectionPointCloud: "/pointclouds/detection1.json",
      isLasUpload: false,
    },
    {
      id: 2,
      type: "Hazard",
      time: "2023-06-15T11:45:00",
      name: "Pre-processed Scan 2",
      originalPointCloud: "/pointclouds/original2.json",
      detectionPointCloud: "/pointclouds/detection2.json",
      isLasUpload: false,
    },
  ]);

  const [currentView, setCurrentView] = useState("original");
  const [selectedDetection, setSelectedDetection] = useState(null);
  const fileInputRef = useRef(null);
  const [isViewerFullScreen, setIsViewerFullScreen] = useState(false); // New state for full-screen

  useEffect(() => {
    if (detections.length > 0 && !selectedDetection) {
      setSelectedDetection(detections[0]);
    }
  }, [detections, selectedDetection]);

  const handleDetectionSelect = (detection) => {
    setSelectedDetection(detection);
    if (detection.isLasUpload) {
      setCurrentView("original");
    }
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file && file.name.toLowerCase().endsWith(".las")) {
      const newDetectionId = detections.length > 0 ? Math.max(...detections.map(d => d.id)) + 1 : 1;
      const newDetection = {
        id: newDetectionId,
        type: "Uploaded LAS",
        time: new Date().toISOString(),
        name: file.name,
        originalPointCloud: `LAS_FILE:${file.name}`, 
        detectionPointCloud: null,
        isLasUpload: true,
      };
      setDetections(prevDetections => [...prevDetections, newDetection]);
      setSelectedDetection(newDetection);
      setCurrentView("original");
    } else {
      alert("Please select a .las file.");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toggleViewerFullScreen = () => {
    setIsViewerFullScreen(prev => !prev);
  };

  return (
    <div className={cn(
      "flex h-[calc(100vh-var(--header-height,60px))] bg-gray-50",
      isViewerFullScreen ? "flex-col" : "flex-col md:flex-row" // Adjust layout based on full-screen state
    )}>
      <div className={cn(
        "p-4",
        isViewerFullScreen ? "w-full h-full" : "md:w-2/3 h-full" // Viewer takes full width/height if full-screen
      )}>
        <Card className="h-full overflow-hidden shadow-lg border-0">
          <PotreeViewer 
            detection={selectedDetection} 
            viewMode={currentView}
            isFullScreen={isViewerFullScreen} // Pass full-screen state
            onToggleFullScreen={toggleViewerFullScreen} // Pass toggle function
          />
        </Card>
      </div>

      {!isViewerFullScreen && ( // Conditionally render the detection list panel
        <>
          <Separator orientation="vertical" className="hidden md:block" />
          <div className="md:w-1/3 h-full p-4 flex flex-col">
            <div className="mb-4">
              <Button 
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload LAS File
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".las" 
                className="hidden" 
              />
            </div>
            <div className="flex-grow overflow-auto">
              <DetectionList 
                detections={detections}
                selectedDetection={selectedDetection}
                onDetectionSelect={handleDetectionSelect}
                onViewChange={handleViewChange}
                currentView={currentView}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
