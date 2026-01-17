import React from "react";
import { cn } from "@/lib/utils";
import { Editor } from "@tiptap/react";

export type SlashCommand = {
  label: string;
  description: string;
  icon: React.ReactNode;
  action: (editor: Editor) => void;
};

export const SlashCommandMenu = ({
  position,
  commands,
  selectedIndex,
  onSelect,
}: {
  position: { x: number; y: number };
  commands: SlashCommand[];
  selectedIndex: number;
  onSelect: (command: SlashCommand) => void;
}) => {
  return (
    <div
      className="fixed z-50 w-64 rounded-lg border border-border bg-surface shadow-xl"
      style={{ top: position.y, left: position.x }}
    >
      <div className="flex flex-col py-2">
        {commands.map((command, index) => (
          <button
            key={command.label}
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(command);
            }}
            className={cn(
              "flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-text-primary hover:bg-gray-100",
              index === selectedIndex && "bg-surface-lowered/20",
            )}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-text-primary">
              {command.icon}
            </div>
            <div className="flex justify-between w-full items-center">
              <span className="font-medium text-text-primary text-sm">
                {command.label}
              </span>
              {/* <span className="text-xs text-gray-500">K</span> */}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
