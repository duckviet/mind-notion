import { ResDetailNote } from "@/shared/services/generated/api";
import dayjs from "dayjs";

const NoteMetadataPanel = ({ note }: { note?: ResDetailNote }) => {
  return (
    <div>
      <div className="text-sm  flex items-center">
        <span className="text-gray-500"> Created by:</span>
        <span className="ml-auto font-medium">Unknown</span>
      </div>
      <div className="text-sm  mt-1 flex items-center">
        <span className="text-gray-500">Created:</span>
        <span className="ml-auto font-medium">
          {note?.created_at
            ? dayjs(note.created_at).format("DD/MM/YYYY HH:mm")
            : dayjs().format("DD/MM/YYYY HH:mm")}
        </span>
      </div>
      <div className="text-sm  mt-1 flex items-center">
        <span className="text-gray-500"> Last modified: </span>
        <span className="ml-auto font-medium">
          {note?.updated_at
            ? dayjs(note.updated_at).format("DD/MM/YYYY HH:mm")
            : dayjs().format("DD/MM/YYYY HH:mm")}
        </span>
      </div>
    </div>
  );
};
export default NoteMetadataPanel;
