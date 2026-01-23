import { Input } from "@/shared/components/ui/input";
import { X } from "lucide-react";

const NoteTagsSection = ({
  tags,
  newTag,
  onNewTagChange,
  onTagAdd,
  onTagRemove,
  disabled,
}: {
  tags: string[];
  newTag: string;
  onNewTagChange: (val: string) => void;
  onTagAdd: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onTagRemove: (tag: string) => void;
  disabled: boolean;
}) => {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-text-secondary text-lg font-medium">
          Tags ({tags.length})
        </span>
      </div>
      <div className="flex flex-wrap gap-2 mb-3 overflow-auto max-h-40">
        {tags.map((t) => (
          <div
            key={t}
            className=" bg-accent-50 rounded px-2 py-1 text-sm cursor-pointer hover:bg-accent/70"
            onClick={() => onTagRemove(t)}
          >
            #{t} <X className="w-3 h-3 inline" />
          </div>
        ))}
      </div>
      <Input
        value={newTag}
        onChange={(e) => onNewTagChange(e.target.value)}
        onKeyDown={onTagAdd}
        placeholder="New tag..."
        maxLength={50}
        disabled={disabled}
        className="bg-accent  border border-border focus-visible:ring-1 focus-visible:ring-ring shadow-sm"
      />
    </div>
  );
};

export default NoteTagsSection;
