# Multi-Zone Drag & Drop Guide

This guide explains how to implement drag and drop between multiple zones using the DND component system.

## Overview

The multi-zone DND system allows you to:
- Drag items from one zone to another
- Reorder items within each zone
- Visual feedback when hovering over drop zones
- Customizable drag overlays

## Components

### 1. MultiZoneDndProvider
Main provider that wraps all draggable zones. Handles global drag events.

### 2. DroppableZone
Creates a zone where items can be dropped. Each zone has a unique ID.

### 3. SortableItem
Makes individual items draggable and sortable within their context.

### 4. SortableContext
Defines the sorting strategy for items within a zone.

## Implementation Example

### Step 1: Wrap Your App with MultiZoneDndProvider

```tsx
import { MultiZoneDndProvider } from "@/shared/components/dnd";
import { DragEndEvent } from "@dnd-kit/core";

function App() {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    // Handle drag logic here
  };

  return (
    <MultiZoneDndProvider
      onDragEnd={handleDragEnd}
      renderOverlay={(activeId) => {
        // Render the dragging item
        return <YourDragOverlay id={activeId} />;
      }}
    >
      {/* Your zones here */}
    </MultiZoneDndProvider>
  );
}
```

### Step 2: Create Droppable Zones

```tsx
import { DroppableZone, SortableContext, SortableItem } from "@/shared/components/dnd";

function TopZone({ items }) {
  return (
    <SortableContext items={items.map(i => i.id)}>
      <DroppableZone
        id="top-zone"
        className="min-h-[120px] bg-blue-50"
        activeClassName="ring-2 ring-blue-400"
      >
        {items.map((item) => (
          <SortableItem key={item.id} id={item.id}>
            <ItemCard item={item} />
          </SortableItem>
        ))}
      </DroppableZone>
    </SortableContext>
  );
}

function BottomZone({ items }) {
  return (
    <SortableContext items={items.map(i => i.id)}>
      <DroppableZone
        id="bottom-zone"
        className="min-h-[120px] bg-green-50"
        activeClassName="ring-2 ring-green-400"
      >
        {items.map((item) => (
          <SortableItem key={item.id} id={item.id}>
            <ItemCard item={item} />
          </SortableItem>
        ))}
      </DroppableZone>
    </SortableContext>
  );
}
```

### Step 3: Handle Drag End Logic

```tsx
import { arrayMove } from "@/shared/components/dnd";

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  
  if (!over) return;
  
  const activeId = active.id.toString();
  const overId = over.id.toString();
  
  // Case 1: Dropping into a zone
  if (overId === "top-zone") {
    // Move item to top zone
    const itemToMove = bottomItems.find(i => i.id === activeId);
    if (itemToMove) {
      setTopItems([...topItems, itemToMove]);
      setBottomItems(bottomItems.filter(i => i.id !== activeId));
    }
    return;
  }
  
  if (overId === "bottom-zone") {
    // Move item to bottom zone
    const itemToMove = topItems.find(i => i.id === activeId);
    if (itemToMove) {
      setBottomItems([...bottomItems, itemToMove]);
      setTopItems(topItems.filter(i => i.id !== activeId));
    }
    return;
  }
  
  // Case 2: Reordering within top zone
  const activeInTop = topItems.find(i => i.id === activeId);
  const overInTop = topItems.find(i => i.id === overId);
  
  if (activeInTop && overInTop && activeId !== overId) {
    const oldIndex = topItems.findIndex(i => i.id === activeId);
    const newIndex = topItems.findIndex(i => i.id === overId);
    setTopItems(arrayMove(topItems, oldIndex, newIndex));
    return;
  }
  
  // Case 3: Reordering within bottom zone
  const activeInBottom = bottomItems.find(i => i.id === activeId);
  const overInBottom = bottomItems.find(i => i.id === overId);
  
  if (activeInBottom && overInBottom && activeId !== overId) {
    const oldIndex = bottomItems.findIndex(i => i.id === activeId);
    const newIndex = bottomItems.findIndex(i => i.id === overId);
    setBottomItems(arrayMove(bottomItems, oldIndex, newIndex));
  }
};
```

## Real-World Example: TopOfMind & Grid

This is the actual implementation in the HomePage:

```tsx
function HomePage() {
  const [topOfMindNotes, setTopOfMindNotes] = useState([]);
  const [notes, setNotes] = useState([]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Dropping into TopOfMind
    if (overId === "top-of-mind-zone") {
      const noteToMove = notes.find((n) => n.id === activeId);
      if (noteToMove && !topOfMindNotes.find((n) => n.id === activeId)) {
        setTopOfMindNotes([...topOfMindNotes, noteToMove]);
      }
      return;
    }

    // Dropping back to grid
    if (overId === "grid-zone") {
      const wasInTopOfMind = topOfMindNotes.find((n) => n.id === activeId);
      if (wasInTopOfMind) {
        setTopOfMindNotes(topOfMindNotes.filter((n) => n.id !== activeId));
      }
      return;
    }

    // Reordering within TopOfMind
    const activeInTop = topOfMindNotes.find((n) => n.id === activeId);
    const overInTop = topOfMindNotes.find((n) => n.id === overId);
    if (activeInTop && overInTop && activeId !== overId) {
      const oldIndex = topOfMindNotes.findIndex((n) => n.id === activeId);
      const newIndex = topOfMindNotes.findIndex((n) => n.id === overId);
      setTopOfMindNotes(arrayMove(topOfMindNotes, oldIndex, newIndex));
      return;
    }

    // Reordering within grid
    const activeInGrid = notes.find((n) => n.id === activeId);
    const overInGrid = notes.find((n) => n.id === overId);
    if (activeInGrid && overInGrid && activeId !== overId) {
      const oldIndex = notes.findIndex((n) => n.id === activeId);
      const newIndex = notes.findIndex((n) => n.id === overId);
      setNotes(arrayMove(notes, oldIndex, newIndex));
    }
  };

  return (
    <MultiZoneDndProvider onDragEnd={handleDragEnd}>
      {/* TopOfMind Zone */}
      <SortableContext items={topOfMindNotes.map((n) => n.id)}>
        <TopOfMind notes={topOfMindNotes} />
      </SortableContext>

      {/* Grid Zone */}
      <SortableContext items={notes.map((n) => n.id)}>
        <DroppableZone id="grid-zone">
          {notes.map((note) => (
            <SortableItem key={note.id} id={note.id}>
              <NoteCard note={note} />
            </SortableItem>
          ))}
        </DroppableZone>
      </SortableContext>
    </MultiZoneDndProvider>
  );
}
```

## Key Concepts

### 1. Zone IDs
Each `DroppableZone` must have a unique `id`. This ID is used in the `onDragEnd` handler to determine where an item was dropped.

### 2. SortableContext
Each zone needs its own `SortableContext` with the items currently in that zone. This enables reordering within the zone.

### 3. Drag Logic Priority
The `onDragEnd` handler checks conditions in this order:
1. Was it dropped on a zone? (zone ID match)
2. Was it reordered within the same zone? (both items in same array)

### 4. Visual Feedback
- `activeClassName` on DroppableZone: Applied when hovering over the zone
- `renderOverlay`: Shows a preview of the dragging item

## Styling Tips

```tsx
// Highlight drop zone when active
<DroppableZone
  id="my-zone"
  className="border-2 border-dashed border-gray-300 transition-all"
  activeClassName="border-blue-500 bg-blue-50"
>
```

## Common Patterns

### Preventing Duplicates
```tsx
if (overId === "target-zone") {
  const item = sourceItems.find(i => i.id === activeId);
  // Only add if not already in target
  if (item && !targetItems.find(i => i.id === activeId)) {
    setTargetItems([...targetItems, item]);
  }
}
```

### Moving Between Zones
```tsx
if (overId === "target-zone") {
  const item = sourceItems.find(i => i.id === activeId);
  if (item) {
    // Add to target
    setTargetItems([...targetItems, item]);
    // Remove from source
    setSourceItems(sourceItems.filter(i => i.id !== activeId));
  }
}
```

### Limiting Zone Capacity
```tsx
if (overId === "limited-zone" && targetItems.length < MAX_ITEMS) {
  // Add item
}
```

## Troubleshooting

### Items not dragging?
- Check that each item has a unique `id`
- Ensure `SortableContext` includes all item IDs
- Verify `SortableItem` is properly wrapping your component

### Drop not working?
- Check zone IDs are unique
- Verify `onDragEnd` handler is properly checking zone IDs
- Make sure `DroppableZone` has a minimum height

### Visual glitches?
- Add `transition-all` to zones for smooth effects
- Ensure overlay component is lightweight
- Check z-index conflicts

## Advanced: Nested Zones

For nested drop zones, use more specific ID patterns:

```tsx
<DroppableZone id="category-1">
  <DroppableZone id="category-1-subcategory-a">
    {/* items */}
  </DroppableZone>
</DroppableZone>
```

Then handle in `onDragEnd`:
```tsx
if (overId.startsWith("category-1")) {
  // Handle category 1 drops
}
```

## Performance Tips

1. Use `useMemo` for item lists
2. Keep drag overlays simple
3. Debounce state updates if dealing with large lists
4. Consider virtualization for 100+ items

## Resources

- [dnd-kit Documentation](https://docs.dndkit.com/)
- [dnd-kit Examples](https://dndkit.com/examples)

