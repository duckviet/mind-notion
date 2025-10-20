import React, { useState } from "react";

import { PreviewOverlay } from "@/shared/components/PreviewOverlay";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/shared/components/ui/context-menu";
import { Trash2Icon, Eye } from "lucide-react";
import { Card } from "@/shared/components/Card";
import WebArticleDisplay from "./WebArticleDisplay";

type Props = {
  match: {
    id: string;
    score: any;
    metadata: {
      type: string;
      title: string;
      content?: string;
      [key: string]: any;
    };
  };
  onDelete?: (id: string) => Promise<void>;
};

export default function ArticleCard({ match, onDelete }: Props) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(match.id);
    }
  };

  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card
          // role="article"
          aria-label={`Web Article card: ${match.metadata.title}`}
        >
          <div className="flex justify-between items-center w-full mb-3 gap-4">
            <h2 className="text-lg font-semibold text-text-primary leading-tight">
              {match.metadata.title}
            </h2>
          </div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-glass-border to-transparent mb-4"></div>
          <WebArticleDisplay metadata={match.metadata} />
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent className="glass-bg border-glass-border shadow-glass-lg">
        <ContextMenuItem
          onSelect={handlePreview}
          className="focus:bg-glass-hover"
        >
          <Eye className="w-4 h-4 mr-2" />
          <p className="text-sm">Preview</p>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={handleDelete}
          className="focus:bg-glass-hover text-red-500 hover:text-red-600"
        >
          <p className="text-sm">Delete</p>
          <ContextMenuShortcut>
            <Trash2Icon className="w-3 h-3" />
          </ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>

      {/* Preview Overlay */}
      <PreviewOverlay
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        item={match}
      />
    </ContextMenu>
  );
}
