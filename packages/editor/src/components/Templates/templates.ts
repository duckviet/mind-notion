"use client";

export type TemplateIcon =
  | "FileText"
  | "CheckSquare"
  | "Lightbulb"
  | "Calendar"
  | "Code"
  | "ListTodo"
  | "Briefcase";

export type Template = {
  id: string;
  name: string;
  icon: TemplateIcon;
  content: string;
  tags: string[];
  color?: string;
};

const today = new Date();

export const defaultTemplates: Template[] = [
  {
    id: "blank",
    name: "Blank Note",
    icon: "FileText",
    content: "<p>Start writing...</p>",
    tags: [],
  },
  {
    id: "meeting",
    name: "Meeting Notes",
    icon: "Calendar",
    content: `<h2>Meeting Notes</h2>
<p><strong>Date:</strong> ${today.toLocaleDateString("en-GB")}</p>
<p><strong>Attendees:</strong></p>
<ul>
  <li></li>
</ul>
<p><strong>Agenda:</strong></p>
<ul>
  <li></li>
</ul>
<p><strong>Discussion:</strong></p>
<p></p>
<p><strong>Action Items:</strong></p>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="false"></li>
</ul>`,
    tags: ["Meeting"],
    color: "#5a8a7d",
  },
  {
    id: "todo",
    name: "To-Do List",
    icon: "CheckSquare",
    content: `<h2>To-Do List</h2>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="false">Task 1</li>
  <li data-type="taskItem" data-checked="false">Task 2</li>
  <li data-type="taskItem" data-checked="false">Task 3</li>
</ul>`,
    tags: ["Tasks"],
    color: "#a55252",
  },
  {
    id: "brainstorm",
    name: "Brainstorming",
    icon: "Lightbulb",
    content: `<h2>Brainstorming Session</h2>
<p><strong>Topic:</strong></p>
<p></p>
<p><strong>Ideas:</strong></p>
<ul>
  <li><strong>Idea 1:</strong> </li>
  <li><strong>Idea 2:</strong> </li>
  <li><strong>Idea 3:</strong> </li>
</ul>
<p><strong>Next Steps:</strong></p>
<ul>
  <li></li>
</ul>`,
    tags: ["Ideas"],
    color: "#8a7d5a",
  },
  {
    id: "project",
    name: "Project Plan",
    icon: "Briefcase",
    content: `<h2>Project Plan</h2>
<p><strong>Project Name:</strong></p>
<p></p>
<p><strong>Overview:</strong></p>
<p></p>
<p><strong>Goals:</strong></p>
<ul>
  <li></li>
</ul>
<p><strong>Timeline:</strong></p>
<ul>
  <li><strong>Phase 1:</strong> </li>
  <li><strong>Phase 2:</strong> </li>
  <li><strong>Phase 3:</strong> </li>
</ul>
<p><strong>Resources:</strong></p>
<ul>
  <li></li>
</ul>`,
    tags: ["Project", "Planning"],
    color: "#7d5a8a",
  },
  {
    id: "code",
    name: "Code Snippet",
    icon: "Code",
    content: `<h2>Code Snippet</h2>
<p><strong>Language:</strong></p>
<p></p>
<p><strong>Description:</strong></p>
<p></p>
<p><strong>Code:</strong></p>
<pre><code>// Your code here</code></pre>
<p><strong>Notes:</strong></p>
<p></p>`,
    tags: ["Code"],
    color: "#5a7d8a",
  },
  {
    id: "daily",
    name: "Daily Note",
    icon: "ListTodo",
    content: `<h2>${today.toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}</h2>
<p><strong>Priorities Today:</strong></p>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="false"></li>
  <li data-type="taskItem" data-checked="false"></li>
  <li data-type="taskItem" data-checked="false"></li>
</ul>
<p><strong>Notes:</strong></p>
<p></p>
<p><strong>Gratitude:</strong></p>
<p></p>`,
    tags: ["Daily"],
    color: "#8a5a7d",
  },
];
