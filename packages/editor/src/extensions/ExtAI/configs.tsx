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
    icon: <Wand2 className="h-4 w-4 text-brand-600" />,
    description: "Enhance clarity and style",
  },
  {
    id: "fix",
    label: "Fix spelling & grammar",
    icon: <CheckCircle2 className="h-4 w-4 text-brand-600" />,
    description: "Correct all errors",
  },
  {
    id: "continue",
    label: "Continue writing",
    icon: <MessageSquare className="h-4 w-4 text-brand-600" />,
    description: "Generate next sentences",
  },
  {
    id: "summarize",
    label: "Summarize",
    icon: <ListChecks className="h-4 w-4 text-brand-600" />,
    description: "Key points only",
  },
  {
    id: "shorter",
    label: "Make shorter",
    icon: <FileText className="h-4 w-4 text-brand-600" />,
    description: "Brief and concise",
  },
  {
    id: "explain",
    label: "Explain this",
    icon: <BookOpen className="h-4 w-4 text-brand-600" />,
    description: "Simplify complex ideas",
  },
];
