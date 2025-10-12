
import { useState } from "react";

// Mock data - will be moved to entities layer later
const MOCK_RESULTS = [
  {
    id: "1",
    score: 0.92,
    metadata: {
      type: "note",
      title: "Learn React in 2024",
      content: "A beginner's roadmap to mastering React.js and its ecosystem.",
      tags: ["react", "javascript", "frontend"],
    },
  },
  {
    id: "2",
    score: 0.85,
    metadata: {
      type: "web_article",
      title: "Building REST APIs with Go",
      url: "https://example.com/go-rest",
      description:
        "Step-by-step guide for building and deploying REST APIs using the Go programming language.",
      source: "Go Journal",
      publishedAt: "2023-12-15",
    },
  },
  {
    id: "3",
    score: 0.81,
    metadata: {
      type: "note",
      title: "Collaborative Editing Patterns",
      content:
        "Understand the patterns and strategies behind real-time document editors.",
      tags: ["collaboration", "editing", "patterns"],
    },
  },
  {
    id: "4",
    score: 0.87,
    metadata: {
      type: "web_article",
      title: "Next.js Best Practices",
      url: "https://example.com/nextjs-best",
      description:
        "Tips, tricks, and best practices for building robust Next.js applications.",
      source: "Next Magazine",
      publishedAt: "2024-01-07",
    },
  },
  {
    id: "5",
    score: 0.78,
    metadata: {
      type: "note",
      title: "UI/UX Inspiration: 2024 Edition",
      content:
        "Showcase of inspiring user interface and user experience designs.",
      tags: ["ui", "ux", "inspiration"],
    },
  },
  {
    id: "6",
    score: 0.83,
    metadata: {
      type: "note",
      title: "TypeScript Utility Types",
      content:
        "A handy guide to TS utility types for more productive development.",
      tags: ["typescript", "utilities", "reference"],
    },
  },
];

export function useSearch() {
  const [query, setQuery] = useState<string>("");
  const [filteredResults, setFilteredResults] = useState(MOCK_RESULTS);

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredResults(MOCK_RESULTS);
      return;
    }

    const filtered = MOCK_RESULTS.filter(
      (item) =>
        item.metadata.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.metadata.content
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.metadata.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.metadata.tags?.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    setFilteredResults(filtered);
  };

  return { query, setQuery, filteredResults, handleSearch };
}
