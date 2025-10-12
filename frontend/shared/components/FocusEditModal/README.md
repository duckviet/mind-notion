# FocusEditModal

A full-screen modal component for focused note editing, built with PortalModal for optimal user experience.

## Features

- **Full-screen editing**: Distraction-free writing environment
- **Auto-focus**: Automatically focuses and selects the title field
- **Tag management**: Add/remove tags with Enter key
- **Keyboard shortcuts**:
  - `⌘S` / `Ctrl+S`: Save note
  - `Esc`: Close modal
  - `Enter` (in tag input): Add new tag
- **Real-time stats**: Character and word count
- **Glassmorphism design**: Consistent with MyMind design system

## Usage

```tsx
import { FocusEditModal } from "@/shared/components/FocusEditModal";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState({
    id: "1",
    title: "My Note",
    content: "Note content...",
    tags: ["react", "typescript"],
  });

  const handleSave = (data) => {
    // Save note logic
    console.log("Saving:", data);
  };

  return (
    <FocusEditModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      note={note}
      onSave={handleSave}
    />
  );
}
```

## Props

| Prop      | Type             | Required | Description                    |
| --------- | ---------------- | -------- | ------------------------------ |
| `isOpen`  | `boolean`        | ✅       | Controls modal visibility      |
| `onClose` | `() => void`     | ✅       | Called when modal should close |
| `note`    | `Note`           | ✅       | Note object to edit            |
| `onSave`  | `(data) => void` | ✅       | Called when note is saved      |

## Note Object Structure

```typescript
interface Note {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  [key: string]: any;
}
```

## Keyboard Shortcuts

- **E**: Open focus edit (when note card is focused)
- **Double-click**: Open focus edit
- **⌘S / Ctrl+S**: Save note
- **Esc**: Close modal
- **Enter** (in tag input): Add new tag

## Integration with NoteCard

The FocusEditModal is integrated with NoteCard component:

1. **Context Menu**: Right-click → "Focus Edit"
2. **Double-click**: Double-click the note card
3. **Keyboard**: Focus the card and press `E`

## Design Features

- **Portal rendering**: Renders outside component tree for proper z-index
- **Smooth animations**: Framer Motion animations for open/close
- **Responsive**: Works on all screen sizes
- **Accessible**: Proper ARIA labels and keyboard navigation
- **Glassmorphism**: Consistent with MyMind design system
