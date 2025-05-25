import React from "react";
import { Loader2 } from "lucide-react";

export const Loading: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="animate-spin text-gray-500" size={24} />
    </div>
  );
};
