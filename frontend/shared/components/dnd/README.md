# DND Component with dnd-kit

A comprehensive drag-and-drop solution built with `@dnd-kit` for React applications.

## Installation

The required packages are already installed:

- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`

## Components

### DndProvider

Main provider component that handles drag and drop logic.

### SortableItem

A reusable component for creating sortable/draggable items.

## Usage

### Basic Example

```tsx
import { DndProvider, SortableItem } from "@/shared/components/dnd";
import { useState } from "react";

interface Item {
  id: string;
  title: string;
  content: string;
}

function MyComponent() {
  const [items, setItems] = useState<Item[]>([
    { id: "1", title: "Item 1", content: "Content 1" },
    { id: "2", title: "Item 2", content: "Content 2" },
    { id: "3", title: "Item 3", content: "Content 3" },
  ]);

  const handleReorder = (reorderedItems: Item[]) => {
    setItems(reorderedItems);
  };

  return (
    <DndProvider items={items} onReorder={handleReorder} strategy="grid">
      {items.map((item) => (
        <SortableItem key={item.id} id={item.id}>
          <div className="p-4 border rounded">
            <h3>{item.title}</h3>
            <p>{item.content}</p>
          </div>
        </SortableItem>
      ))}
    </DndProvider>
  );
}
```

### With Custom Overlay

```tsx
import { DndProvider, SortableItem } from "@/shared/components/dnd";

function MyComponent() {
  const [items, setItems] = useState<Item[]>([...]);

  return (
    <DndProvider
      items={items}
      onReorder={setItems}
      strategy="grid"
      renderOverlay={(activeItem) => (
        activeItem ? (
          <div className="opacity-50 p-4 border rounded bg-white shadow-lg">
            <h3>{activeItem.title}</h3>
          </div>
        ) : null
      )}
    >
      {items.map((item) => (
        <SortableItem key={item.id} id={item.id}>
          <div className="p-4 border rounded">
            <h3>{item.title}</h3>
            <p>{item.content}</p>
          </div>
        </SortableItem>
      ))}
    </DndProvider>
  );
}
```

### Integration with NoteCard

Example of using DND with existing NoteCard component:

```tsx
import { DndProvider, SortableItem } from "@/shared/components/dnd";
import NoteCard from "@/entities/note/ui/NoteCard";

function NotesGrid() {
  const [notes, setNotes] = useState([...]);

  return (
    <DndProvider
      items={notes}
      onReorder={setNotes}
      strategy="grid"
      renderOverlay={(activeNote) => (
        activeNote ? (
          <NoteCard
            match={activeNote}
            onDelete={() => {}}
            onUpdateNote={() => {}}
          />
        ) : null
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map((note) => (
          <SortableItem key={note.id} id={note.id}>
            <NoteCard
              match={note}
              onDelete={handleDelete}
              onUpdateNote={handleUpdate}
            />
          </SortableItem>
        ))}
      </div>
    </DndProvider>
  );
}
```

## Props

### DndProvider Props

| Prop            | Type                                   | Required | Default  | Description                       |
| --------------- | -------------------------------------- | -------- | -------- | --------------------------------- |
| `items`         | `T[]`                                  | Yes      | -        | Array of items to be sorted       |
| `onReorder`     | `(items: T[]) => void`                 | No       | -        | Callback when items are reordered |
| `children`      | `ReactNode`                            | Yes      | -        | Child components                  |
| `strategy`      | `"vertical" \| "grid"`                 | No       | `"grid"` | Sorting strategy                  |
| `renderOverlay` | `(activeItem: T \| null) => ReactNode` | No       | -        | Custom overlay component          |

### SortableItem Props

| Prop        | Type               | Required | Default | Description       |
| ----------- | ------------------ | -------- | ------- | ----------------- |
| `id`        | `string \| number` | Yes      | -       | Unique identifier |
| `children`  | `ReactNode`        | Yes      | -       | Child component   |
| `disabled`  | `boolean`          | No       | `false` | Disable dragging  |
| `className` | `string`           | No       | `""`    | CSS classes       |
| `style`     | `CSSProperties`    | No       | `{}`    | Inline styles     |

## Advanced Usage

### Custom Sorting Strategy

```tsx
import {
  DndProvider,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@/shared/components/dnd";

// Vertical list
<DndProvider items={items} strategy="vertical">
  {/* ... */}
</DndProvider>

// Grid (default)
<DndProvider items={items} strategy="grid">
  {/* ... */}
</DndProvider>
```

### Using Low-Level Hooks

For more control, you can use the low-level dnd-kit hooks:

```tsx
import { useSortable, CSS } from "@/shared/components/dnd";

function CustomSortableItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}
```

## Features

- ✅ Grid and vertical list sorting strategies
- ✅ Keyboard navigation support
- ✅ Touch device support
- ✅ Customizable drag overlay
- ✅ TypeScript support
- ✅ Activation constraint (8px movement required)
- ✅ Collision detection
- ✅ Automatic array reordering

## Tips

1. **Activation Distance**: The component requires 8px of movement before starting a drag. This prevents accidental drags when clicking.

2. **Overlay Performance**: For better performance, keep the overlay component simple and lightweight.

3. **Item Keys**: Always provide stable, unique keys for each item.

4. **Grid Layout**: When using `strategy="grid"`, wrap your items in an appropriate grid container (CSS Grid or Flexbox).

5. **Persistence**: Remember to persist the reordered state (e.g., to a database) in the `onReorder` callback.
