import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, FileText, Image, Link } from "lucide-react";
import { cn } from "@/lib/utils";
import Portal from "../PortalModal/PortalModal";

interface PreviewOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    metadata: {
      type: string;
      title: string;
      content?: string;
      url?: string;
      description?: string;
      source?: string;
      publishedAt?: string;
      tags?: string[];
    };
  };
  className?: string;
}

export default function PreviewOverlay({
  isOpen,
  onClose,
  item,
  className,
}: PreviewOverlayProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "web_article":
        return <ExternalLink className="w-4 h-4" />;
      case "note":
        return <FileText className="w-4 h-4" />;
      case "image":
        return <Image className="w-4 h-4" />;
      default:
        return <Link className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "web_article":
        return "text-blue-500";
      case "note":
        return "text-green-500";
      case "image":
        return "text-purple-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <Portal lockScroll={isOpen || false}>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={onClose}
            />

            {/* Preview Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={cn(
                "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
                "w-full max-w-md mx-4 glass-bg rounded-glass shadow-glass-xl border-glass-border",
                "z-50 max-h-[80vh] overflow-hidden",
                className
              )}
              role="dialog"
              aria-modal="true"
              aria-labelledby="preview-title"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-glass-border">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg bg-glass-hover",
                      getTypeColor(item.metadata.type)
                    )}
                  >
                    {getTypeIcon(item.metadata.type)}
                  </div>
                  <div>
                    <h3
                      id="preview-title"
                      className="font-semibold text-text-primary"
                    >
                      {item.metadata.type === "web_article"
                        ? "Article"
                        : "Note"}
                    </h3>
                    <p className="text-sm text-text-muted">
                      {item.metadata.source || "Personal"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-glass-hover transition-colors duration-200"
                  aria-label="Close preview"
                >
                  <X className="w-4 h-4 text-text-muted" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <h2 className="text-xl font-semibold text-text-primary mb-4">
                  {item.metadata.title}
                </h2>

                {item.metadata.description && (
                  <p className="text-text-secondary mb-4 leading-relaxed">
                    {item.metadata.description}
                  </p>
                )}

                {item.metadata.content && (
                  <div className="text-text-secondary leading-relaxed">
                    <p className="whitespace-pre-wrap">
                      {item.metadata.content}
                    </p>
                  </div>
                )}

                {item.metadata.url && (
                  <div className="mt-4 p-3 glass-bg rounded-lg border border-glass-border">
                    <a
                      href={item.metadata.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-blue hover:text-accent-purple transition-colors duration-200 flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open original
                    </a>
                  </div>
                )}

                {item.metadata.tags && item.metadata.tags.length > 0 && (
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {item.metadata.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs glass-bg rounded-full text-text-muted border border-glass-border"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  );
}
