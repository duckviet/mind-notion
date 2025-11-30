import React from "react";
type Props = {
  content: any;
};
export default function NoteDisplay({ content }: Props) {
  return (
    <p
      className="text-gray-700 leading-relaxed mb-3 line-clamp-6"
      style={{ userSelect: "none" }}
    >
      {content}
    </p>
  );
}
