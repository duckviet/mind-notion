import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";

// Export Collaboration extensions as an array to avoid duplicate keyed plugin registration
const createCollaborationExtensions = (document: any, provider: any) => [
  Collaboration.configure({ document }),
  CollaborationCaret.configure({
    provider,
  }),
];

export default createCollaborationExtensions;
