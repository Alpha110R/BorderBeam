
import React from "react";

export default function Layout({ children }) {
  return (
    <div className="bg-gray-100 min-h-screen flex flex-col"> {/* Use flex-col for sticky header */}
      <header className="bg-white shadow-md border-b sticky top-0 z-50" style={{ "--header-height": "60px" }}> {/* Define header height variable */}
        <div className="px-4 sm:px-6 lg:px-8 h-[60px] flex items-center"> {/* Set fixed height */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-xl font-bold text-blue-600">PointCloud Detection Viewer</span>
              </div>
            </div>
            {/* Placeholder for user actions or menu */}
          </div>
        </div>
      </header>
      <main className="flex-grow"> {/* flex-grow to take remaining space */}
        {children}
      </main>
    </div>
  );
}
