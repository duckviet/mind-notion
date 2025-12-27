import { cn } from "@/lib/utils";
import React from "react";
type Props = {
  content: any;
  className?: string;
};
export default function NoteDisplay({ content, className }: Props) {
  return (
    <p
      className={cn(
        "text-gray-700 leading-relaxed mb-3 line-clamp-6 w-full",
        className
      )}
      style={{
        userSelect: "none",
        zoom: "0.75",
        MozTransform: "scale(0.75)",
        MozTransformOrigin: "top left",
        width: "133.33%",
        // Force wrapping on nested HTML elements
        wordBreak: "break-word",
        overflowWrap: "break-word",
        hyphens: "auto",
      }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
