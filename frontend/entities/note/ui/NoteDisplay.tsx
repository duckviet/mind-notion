import React from "react";
type Props = {
  metadata: any;
};
export default function NoteDisplay({ metadata }: Props) {
  return (
    <p className="text-gray-700 leading-relaxed mb-3 line-clamp-6">
      {metadata.content}
    </p>
  );
}
