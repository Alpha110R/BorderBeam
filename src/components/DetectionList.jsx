
import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radar, AlertTriangle, Eye, Clock, Filter, FileText, Camera, ChevronDown } from "lucide-react";
import CameraStreamModal from "./CameraStreamModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const typeIcons = {
  "Obstacle": <Radar className="w-4 h-4" />,
  "Hazard": <AlertTriangle className="w-4 h-4" />,
  "Debris": <Eye className="w-4 h-4" />,
  "Structural Issue": <AlertTriangle className="w-4 h-4" />,
  "Uploaded LAS": <FileText className="w-4 h-4" />
};

const typeBadgeColors = {
  "Obstacle": "bg-blue-100 text-blue-800 border-blue-200",
  "Hazard": "bg-red-100 text-red-800 border-red-200",
  "Debris": "bg-amber-100 text-amber-800 border-amber-200",
  "Structural Issue": "bg-purple-100 text-purple-800 border-purple-200",
  "Uploaded LAS": "bg-green-100 text-green-800 border-green-200"
};

export default function DetectionList({ 
  detections, 
  selectedDetection, 
  onDetectionSelect, 
  onViewChange,
  currentView
}) {
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All Types");

  const detectionTypes = useMemo(() => {
    if (!detections || detections.length === 0) return ["All Types"];
    const types = new Set(detections.map(d => d.type));
    return ["All Types", ...Array.from(types)];
  }, [detections]);

  const filteredDetections = useMemo(() => {
    if (activeFilter === "All Types") {
      return detections;
    }
    return detections.filter(d => d.type === activeFilter);
  }, [detections, activeFilter]);

  return (
    <div className="relative h-full">
      <div className="space-y-3 h-full overflow-y-auto pb-16">
        <div className="flex items-center justify-between mb-3 sticky top-0 bg-gray-50 py-2 z-10 px-1">
          <h2 className="text-lg font-semibold text-gray-800">Detection List</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                <span className="truncate max-w-[100px]">
                  {activeFilter === "All Types" ? "Filter by Type" : activeFilter}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {detectionTypes.map(type => (
                <DropdownMenuItem
                  key={type}
                  onClick={() => setActiveFilter(type)}
                  className={cn(
                    "cursor-pointer",
                    activeFilter === type && "bg-accent text-accent-foreground"
                  )}
                >
                  {typeIcons[type] && React.cloneElement(typeIcons[type], { className: "w-4 h-4 mr-2 opacity-70"})}
                  {!typeIcons[type] && type !== "All Types" && <FileText className="w-4 h-4 mr-2 opacity-70" />}
                  {type}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <AnimatePresence>
          {filteredDetections.map((detection) => (
            <motion.div
              key={detection.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="px-1"
            >
              <Card 
                className={`mb-3 overflow-hidden transition-all duration-150 border-l-4 hover:shadow-md ${
                  selectedDetection?.id === detection.id 
                    ? "border-l-blue-500 shadow-md bg-blue-50"
                    : "border-l-transparent bg-white"
                }`}
                onClick={() => onDetectionSelect(detection)}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-start">
                       <Badge 
                          variant="secondary"
                          className={`${typeBadgeColors[detection.type] || 'bg-gray-100 text-gray-800 border-gray-200'} border flex items-center gap-1 text-xs px-1.5 py-0.5`}
                        >
                          {typeIcons[detection.type] || <FileText className="w-3 h-3" />}
                          {detection.type}
                        </Badge>
                    </div>
                    <p className="text-sm font-medium text-gray-700 truncate" title={detection.name}>{detection.name}</p>
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {format(new Date(detection.time), "MMM d, HH:mm")}
                    </span>
                    
                    <div className="flex gap-1.5">
                      <Button
                        size="xs"
                        variant={currentView === "original" && selectedDetection?.id === detection.id ? "default" : "outline"}
                        className={`transition-all flex-1 ${
                          currentView === "original" && selectedDetection?.id === detection.id
                            ? "bg-blue-600 hover:bg-blue-700"
                            : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDetectionSelect(detection);
                          onViewChange("original");
                        }}
                      >
                        Original
                      </Button>
                      <Button
                        size="xs"
                        variant={currentView === "detection" && selectedDetection?.id === detection.id ? "default" : "outline"}
                        className={`transition-all flex-1 ${
                          currentView === "detection" && selectedDetection?.id === detection.id
                            ? "bg-blue-600 hover:bg-blue-700"
                            : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDetectionSelect(detection);
                          onViewChange("detection");
                        }}
                        disabled={detection.isLasUpload || !detection.detectionPointCloud}
                        title={detection.isLasUpload ? "Detection view requires processing for LAS files" : ""}
                      >
                        Detection
                      </Button>
                      <Button
                        size="xs"
                        variant={currentView === "both" && selectedDetection?.id === detection.id ? "default" : "outline"}
                        className={`transition-all flex-1 ${
                          currentView === "both" && selectedDetection?.id === detection.id
                            ? "bg-blue-600 hover:bg-blue-700"
                            : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDetectionSelect(detection);
                          onViewChange("both");
                        }}
                        disabled={detection.isLasUpload || !detection.detectionPointCloud}
                        title={detection.isLasUpload ? "Combined view requires processing for LAS files" : ""}
                      >
                        Both
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
         {filteredDetections.length === 0 && (
          <div className="text-center text-gray-500 py-8 px-2">
            <Filter className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            {detections.length === 0 ? (
              <>
                <p className="font-medium">No detections yet.</p>
                <p className="text-sm">Upload a LAS file or connect a data source to see detections.</p>
              </>
            ) : (
              <>
                <p className="font-medium">No detections match "{activeFilter}"</p>
                <p className="text-sm">Try selecting "All Types" or a different filter.</p>
              </>
            )}
          </div>
        )}
      </div>

      <Button
        onClick={() => setIsCameraModalOpen(true)}
        className="absolute bottom-4 right-4 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out transform hover:scale-105"
        aria-label="Open Live Camera"
        size="icon"
      >
        <Camera className="w-6 h-6" />
      </Button>

      <CameraStreamModal 
        isOpen={isCameraModalOpen} 
        onClose={() => setIsCameraModalOpen(false)} 
      />
    </div>
  );
}
