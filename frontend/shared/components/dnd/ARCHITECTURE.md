# DND Architecture

## Component Hierarchy

```
MultiZoneDndProvider (Global DragContext)
│
├── DragOverlay (Shows dragging preview)
│
└── Page Content
    │
    ├── SortableContext (TopOfMind items)
    │   └── DroppableZone (id: "top-of-mind-zone")
    │       └── SortableItem × N
    │           └── TopOfMindCard
    │
    └── SortableContext (Grid items)
        └── DroppableZone (id: "grid-zone")
            └── SortableItem × N
                └── NoteCard
```

## Data Flow

```
┌─────────────────────────────────────────────────────┐
│           MultiZoneDndProvider                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  State: activeId                             │  │
│  │  Events: onDragStart, onDragEnd, onDragOver │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────┐    ┌──────────────────┐     │
│  │  TopOfMind Zone  │    │   Grid Zone      │     │
│  │  ┌────────────┐  │    │  ┌────────────┐  │     │
│  │  │ SortableCtx│  │    │  │ SortableCtx│  │     │
│  │  ├────────────┤  │    │  ├────────────┤  │     │
│  │  │ DroppableZ │  │    │  │ DroppableZ │  │     │
│  │  │            │  │    │  │            │  │     │
│  │  │  Item 1    │  │    │  │  Item A    │  │     │
│  │  │  Item 2    │  │    │  │  Item B    │  │     │
│  │  │  Item 3    │  │    │  │  Item C    │  │     │
│  │  └────────────┘  │    │  └────────────┘  │     │
│  └──────────────────┘    └──────────────────┘     │
└─────────────────────────────────────────────────────┘
```

## Event Flow

### 1. Drag Start

```
User starts dragging Item B
    ↓
SortableItem detects drag
    ↓
MultiZoneDndProvider.onDragStart
    ↓
Set activeId = "item-b"
    ↓
DragOverlay shows preview
```

### 2. Drag Over

```
User drags over TopOfMind Zone
    ↓
DroppableZone detects hover
    ↓
Apply activeClassName (blue ring)
    ↓
Visual feedback to user
```

### 3. Drag End

```
User releases over TopOfMind Zone
    ↓
MultiZoneDndProvider.onDragEnd
    ↓
Check overId
    │
    ├─ If zone ID: Move between zones
    │   ├─ Find item in source
    │   ├─ Add to target zone
    │   └─ Remove from source (if needed)
    │
    └─ If item ID: Reorder within zone
        ├─ Find old index
        ├─ Find new index
        └─ Call arrayMove()
```

## State Management

```typescript
// Parent Component (HomePage)
const [notes, setNotes] = useState([...]);
const [topOfMindNotes, setTopOfMindNotes] = useState([...]);

// Drag Logic
handleDragEnd(event) {
  const { active, over } = event;

  // Decision Tree
  if (over.id === "top-of-mind-zone") {
    // Case 1: Drop on TopOfMind zone
    moveToTopOfMind(active.id);
  }
  else if (over.id === "grid-zone") {
    // Case 2: Drop on Grid zone
    removeFromTopOfMind(active.id);
  }
  else if (isInTopOfMind(active.id) && isInTopOfMind(over.id)) {
    // Case 3: Reorder in TopOfMind
    reorderTopOfMind(active.id, over.id);
  }
  else if (isInGrid(active.id) && isInGrid(over.id)) {
    // Case 4: Reorder in Grid
    reorderGrid(active.id, over.id);
  }
}
```

## Component Communication

```
┌────────────────────────────────────────────┐
│            HomePage (Parent)               │
│  ┌──────────────────────────────────────┐ │
│  │  State:                              │ │
│  │  - notes[]                           │ │
│  │  - topOfMindNotes[]                  │ │
│  │                                      │ │
│  │  Handlers:                           │ │
│  │  - handleDragEnd()                   │ │
│  │  - setNotes()                        │ │
│  │  - setTopOfMindNotes()               │ │
│  └──────────────────────────────────────┘ │
│              ↓           ↓                 │
│    ┌─────────────┐  ┌─────────────┐       │
│    │ TopOfMind   │  │    Grid     │       │
│    │ (notes prop)│  │ (notes prop)│       │
│    └─────────────┘  └─────────────┘       │
└────────────────────────────────────────────┘
```

## Collision Detection

```
MultiZoneDndProvider uses closestCorners
    │
    ├── Calculates distance to all droppable zones
    ├── Calculates distance to all sortable items
    └── Returns the closest match
        │
        ├─ If closest = zone → drop on zone
        └─ If closest = item → reorder near item
```

## Visual States

```
┌─────────────────────────────────────────────┐
│  Item States                                │
├─────────────────────────────────────────────┤
│  1. Idle          → opacity: 1.0            │
│  2. Dragging      → opacity: 0.5            │
│  3. In Overlay    → opacity: 0.8            │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Zone States                                │
├─────────────────────────────────────────────┤
│  1. Idle          → default styling         │
│  2. Hover (drag)  → ring + bg highlight    │
│  3. Empty         → show placeholder text   │
└─────────────────────────────────────────────┘
```

## Sensors & Activation

```
PointerSensor (Mouse/Touch)
  ├─ activationConstraint: { distance: 8px }
  └─ Prevents accidental drags on click

KeyboardSensor
  ├─ Arrow keys to move
  ├─ Space to pick up/drop
  └─ Escape to cancel
```

## Strategy Pattern

```typescript
// Grid Layout
<SortableContext
  items={items}
  strategy={rectSortingStrategy}
>
  // Calculates positions based on 2D grid
</SortableContext>

// List Layout
<SortableContext
  items={items}
  strategy={verticalListSortingStrategy}
>
  // Calculates positions based on 1D list
</SortableContext>
```

## Performance Considerations

```
┌─────────────────────────────────────────────┐
│  Optimizations                              │
├─────────────────────────────────────────────┤
│  ✓ useMemo for item lists                  │
│  ✓ Lightweight drag overlays               │
│  ✓ No full re-render on drag               │
│  ✓ Only update affected zones              │
│  ✓ CSS transitions instead of JS           │
└─────────────────────────────────────────────┘
```

## Error Handling

```typescript
handleDragEnd(event) {
  const { active, over } = event;

  // Guard clause
  if (!over) return;

  try {
    // Handle drag logic
    if (overId === "zone-1") {
      moveItem(active.id);
    }
  } catch (error) {
    console.error("Drag failed:", error);
    // Optionally: show toast notification
    // Optionally: revert state
  }
}
```

## Testing Strategy

```
Unit Tests:
  ├─ arrayMove function
  ├─ Zone ID matching logic
  └─ Item finding logic

Integration Tests:
  ├─ Drag from Grid to TopOfMind
  ├─ Drag from TopOfMind to Grid
  ├─ Reorder within zones
  └─ Edge cases (empty zones, etc.)

E2E Tests:
  ├─ Full user flow
  ├─ Keyboard navigation
  └─ Mobile touch interactions
```

## Extension Points

```typescript
// Custom Sensors
const customSensor = useSensor(CustomSensor, {
  // Custom activation logic
});

// Custom Collision Detection
const customCollision = (args) => {
  // Custom collision logic
  return closestCorners(args);
};

// Custom Overlay
renderOverlay={(activeId) => {
  // Custom preview component
  return <CustomPreview id={activeId} />;
}}
```

## Accessibility

```
Keyboard Navigation:
  ├─ Tab: Focus items
  ├─ Space: Activate drag
  ├─ Arrow keys: Move item
  ├─ Space: Drop item
  └─ Escape: Cancel drag

Screen Readers:
  ├─ ARIA labels on items
  ├─ Announce drag state
  ├─ Announce drop location
  └─ Announce reorder result
```

## Browser Support

```
✓ Chrome/Edge 90+
✓ Firefox 88+
✓ Safari 14+
✓ Mobile Safari
✓ Chrome Mobile
✓ Samsung Internet
```

## Debug Mode

```typescript
// Enable dnd-kit debug mode
<MultiZoneDndProvider
  onDragStart={(e) => {
    console.log("Drag Start:", e);
  }}
  onDragEnd={(e) => {
    console.log("Drag End:", e);
    console.log("Active:", e.active);
    console.log("Over:", e.over);
  }}
>
```
