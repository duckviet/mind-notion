import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";

const createCollaborationExtensions = (document: any, provider: any) => [
  Collaboration.configure({ document }),
  CollaborationCaret.configure({
    provider,
  }),
];

export default createCollaborationExtensions;
