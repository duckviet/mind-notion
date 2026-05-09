import { AIActionItem } from "./types";

import {
  MessageSquare,
  ListChecks,
  Wand2,
  FileText,
  CheckCircle2,
  BookOpen,
} from "lucide-react";

export const AI_ACTIONS: AIActionItem[] = [
  {
    id: "improve",
    label: "Improve writing",
    icon: <Wand2 className="w-4 h-4 text-purple-500" />,
    description: "Enhance clarity and style",
  },
  {
    id: "fix",
    label: "Fix spelling & grammar",
    icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    description: "Correct all errors",
  },
  {
    id: "continue",
    label: "Continue writing",
    icon: <MessageSquare className="w-4 h-4 text-blue-500" />,
    description: "Generate next sentences",
  },
  {
    id: "summarize",
    label: "Summarize",
    icon: <ListChecks className="w-4 h-4 text-orange-500" />,
    description: "Key points only",
  },
  {
    id: "shorter",
    label: "Make shorter",
    icon: <FileText className="w-4 h-4 text-slate-500" />,
    description: "Brief and concise",
  },
  {
    id: "explain",
    label: "Explain this",
    icon: <BookOpen className="w-4 h-4 text-emerald-500" />,
    description: "Simplify complex ideas",
  },
];
