import { Button } from "@/shared/components/ui/button";
import { Plus } from "lucide-react";
import React from "react";

const CommentSection = () => {
  return (
    <div>
      <div className="flex justify-between items-center">
        <span className="text-gray-500 text-lg font-medium">Comments</span>
        <Button className="cursor-pointer text-gray-600 hover:text-gray-800">
          <Plus className="w-6 h-6" />
        </Button>
      </div>
      <div className="flex flex-col gap-4">
        <span className="text-center text-white text-sm mt-3 bg-gray-200 rounded-md p-4">
          No comments yet
        </span>
      </div>
    </div>
  );
};

export default CommentSection;
