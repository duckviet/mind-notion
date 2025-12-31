# Custom Templates Feature

## Overview

Users can now create, manage, and use custom note templates in the collaborative editor. This feature allows users to save their frequently used note structures as reusable templates.

## Features

### 1. Template Management

- **Create** custom templates with rich text content
- **Edit** existing templates
- **Delete** unwanted templates
- **Browse** all templates (default + custom) in one place

### 2. Template Properties

Each template includes:

- **Name**: Display name of the template
- **Icon**: Icon identifier (e.g., "FileText", "Calendar", "Code")
- **Content**: HTML content of the template (created with rich text editor)
- **Tags**: Comma-separated tags for organization
- **Color**: Optional color code for visual distinction

## Usage

### For Users

#### Creating a Template

1. Open the template modal (use slash command `/` → "Browse Templates")
2. Click "Create Template" button
3. Fill in template details:
   - Name your template
   - Choose an icon identifier
   - Add tags (comma-separated)
   - Set a color (hex code)
   - Write your template content using the rich text editor
4. Click "Save Template"

#### Using a Template

1. In the editor, type `/` to open slash commands
2. Select "Browse Templates"
3. Click on any template to insert its content into your note

#### Managing Templates

1. Open the template modal
2. Click "Create Template" to access management interface
3. View all your custom templates
4. Edit or delete templates as needed

### For Developers

#### Backend API Endpoints

```
POST   /api/v1/templates           - Create new template
GET    /api/v1/templates/list      - List user's templates
GET    /api/v1/templates/{id}      - Get template by ID
PUT    /api/v1/templates/{id}/update - Update template
DELETE /api/v1/templates/{id}/delete - Delete template
```

#### Frontend Integration

**1. Use the Templates Hook**

```typescript
import { useTemplates } from "@/shared/hooks/useTemplates";

const { templates, createTemplate, updateTemplate, deleteTemplate } =
  useTemplates();
```

**2. Components**

- `<TemplatesModal />` - Browse and select templates
- `<ManageTemplatesModal />` - Create, edit, delete templates

**3. Example Usage**

```tsx
import { useState } from "react";
import { TemplatesModal } from "@/shared/components/RichTextEditor/TemplatesModal";
import { ManageTemplatesModal } from "@/shared/components/RichTextEditor/ManageTemplatesModal";

function MyEditor() {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showManage, setShowManage] = useState(false);

  return (
    <>
      <button onClick={() => setShowTemplates(true)}>Browse Templates</button>

      <TemplatesModal
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={(template) => {
          // Insert template content into editor
          editor.setContent(template.content);
        }}
        onManageTemplates={() => {
          setShowTemplates(false);
          setShowManage(true);
        }}
      />

      <ManageTemplatesModal
        isOpen={showManage}
        onClose={() => setShowManage(false)}
      />
    </>
  );
}
```

## Database Schema

```sql
CREATE TABLE templates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL,
  icon       VARCHAR(50) NOT NULL DEFAULT 'FileText',
  content    TEXT NOT NULL,
  tags       TEXT,  -- Comma-separated values
  color      VARCHAR(20),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

## Default Templates

The system includes 7 default templates:

1. **Blank Note** - Empty starting point
2. **Meeting Notes** - Structured meeting documentation
3. **To-Do List** - Task checklist
4. **Brainstorming** - Idea collection
5. **Project Plan** - Project organization
6. **Code Snippet** - Code documentation
7. **Daily Note** - Daily journal entry

## Architecture

### Backend

```
models/template.go           - Database model
repository/template_repo.go  - Data access layer
service/template_service.go  - Business logic
handlers/api_template.go     - HTTP handlers
```

### Frontend

```
hooks/useTemplates.ts                    - React Query hook
components/TemplatesModal.tsx            - Template browser
components/ManageTemplatesModal.tsx      - Template CRUD UI
components/RichTextEditor/templates.ts   - Default templates
```

## Future Enhancements

Potential improvements:

- [ ] Template sharing between users
- [ ] Template categories/folders
- [ ] Template preview before insertion
- [ ] Template variables/placeholders
- [ ] Import/export templates
- [ ] Template versioning
- [ ] Community template marketplace
