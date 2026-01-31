import { cn } from "@/lib/utils";
import React, { useEffect, useMemo, useRef } from "react";
type Props = {
  content: any;
  className?: string;
  zoom?: number;
  width?: number;
};
export default function NoteDisplay({
  content,
  className,
  zoom,
  width,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const html = useMemo(() => content ?? "", [content]);
  useEffect(() => {
    if (!ref.current) return;

    // Chỉ set khi content thực sự thay đổi
    ref.current.innerHTML = html;

    // Optional: chỉnh img attrs 1 lần sau khi set HTML
    const imgs = ref.current.querySelectorAll("img");
    imgs.forEach((img) => {
      img.setAttribute("loading", "eager");
      img.setAttribute("decoding", "async");
      img.style.maxWidth = "100%";
      img.style.height = "auto";
    });
  }, [html]);
  return (
    <div
      ref={ref}
      className={cn(
        "text-gray-700 leading-relaxed mb-3 line-clamp-6 w-full",
        className,
      )}
      style={{
        userSelect: "none",
        zoom: zoom ?? "0.75",
        MozTransform: "scale(0.75)",
        MozTransformOrigin: "top left",
        width: width ?? "150%",
        wordBreak: "break-word",
        overflowWrap: "break-word",
        hyphens: "auto",
      }}
    />
  );
}
