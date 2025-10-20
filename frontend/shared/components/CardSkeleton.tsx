import React from "react";
export default function CardSkeleton({ index }: { index: number }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow-md flex flex-col h-fit w-full animate-pulse">
      <div className="flex justify-between items-center w-full mb-2 gap-4">
        <div className="flex items-center gap-2 w-full">
          <div className="w-6 h-6 bg-gray-200 rounded">
            {/* Index placeholder */}
          </div>
          <div className="h-6  bg-gray-200 rounded w-full">
            {/* Title placeholder */}
          </div>
        </div>
      </div>
      <div className="h-[1px] w-full bg-gray-300 mb-3"></div>

      {/* Description placeholder */}

      <div className="space-y-2 mb-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
      {/* Author placeholder */}
      <div className="text-sm mb-2">
        <div className="h-4 bg-gray-200 rounded w-48"></div>
      </div>

      {/* Read more placeholder */}
      <div className="h-4 bg-gray-200 rounded w-24"></div>
    </div>
  );
}
