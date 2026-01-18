import { CodeBlockShiki } from "../CodeBlockShiki/code-block-shiki";
import React, { useState, useRef, useEffect } from "react";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { langMap } from "@/shiki-setup";
import { Copy, CopyCheck } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Button } from "../../ui/button";

// Sử dụng language list từ shiki-setup.ts
const languageList = Object.entries(langMap)
  .map(([key, value]) => ({ label: value, value: key }))

  .sort((a, b) => a.label.localeCompare(b.label));

const CodeBlockComponent = (props: any) => {
  const { node, updateAttributes, extension } = props;
  const [language, setLanguage] = useState(
    node.attrs.language || extension.options.defaultLanguage || "plaintext",
  );
  const selectRef = useRef<HTMLButtonElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Get code content as plain text
  const codeContent = node.textContent || "";

  useEffect(() => {
    if (node.attrs.language !== language) {
      setLanguage(node.attrs.language || "plaintext");
    }
  }, [node.attrs.language]);

  const handleChange = (e: React.ChangeEvent<HTMLButtonElement>) => {
    setLanguage(e.target.value);
    updateAttributes({ language: e.target.value });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch (err) {
      // Optionally handle copy failure
    }
  };

  return (
    <NodeViewWrapper
      as="div"
      className="relative group"
      data-language={language}
    >
      <div
        contentEditable={false}
        className="items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <div className="w-full p-2 flex justify-end">
          <Select
            onValueChange={(value) => {
              setLanguage(value);
              updateAttributes({ language: value });
            }}
            value={language}
          >
            <SelectTrigger
              ref={selectRef}
              className="h-6 w-fit px-2 rounded bg-surface text-text-primary border-none"
            >
              <SelectValue placeholder="Code Language" />
            </SelectTrigger>
            <SelectContent className="z-100 bg-surface  border-none shadow-md">
              {[
                { value: "plaintext", label: "plaintext" },
                ...languageList,
              ].map(({ label, value }) => (
                <SelectItem
                  className="focus:bg-surface-lowered text-primary"
                  value={value}
                  key={value}
                >
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            onClick={handleCopy}
            className="  h-6 ml-2 p-1 text-xs rounded border border-gray-200 bg-white font-mono shadow transition-all hover:bg-gray-100 active:scale-95"
            tabIndex={-1}
            aria-label="Copy code"
            type="button"
          >
            {isCopied ? (
              <CopyCheck className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      <pre
        className="p-4 -mt-10  font-mono  text-sm overflow-x-auto"
        spellCheck={false}
        data-language={language}
      >
        <NodeViewContent as="div" className="block" spellCheck={false} />
      </pre>
    </NodeViewWrapper>
  );
};

const CustomCodeBlock = CodeBlockShiki.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: "plaintext",
        parseHTML: (element) =>
          element.getAttribute("data-language") || "plaintext",
        renderHTML: (attributes) => ({
          "data-language": attributes.language || "plaintext",
        }),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },

  renderHTML({ HTMLAttributes, node }: any) {
    const language = node.attrs.language || "plaintext";
    const className =
      "p-4 rounded-lg bg-surface-lowered font-mono text-sm overflow-x-auto";
    const finalClass =
      (HTMLAttributes?.class ? `${HTMLAttributes.class} ` : "") + className;

    return [
      "pre",
      {
        ...HTMLAttributes,
        class: finalClass,
        "data-language": language, // ✅ Giờ luôn có value
      },
      [
        "code",
        {
          spellCheck: "false",
        },
        0,
      ],
    ];
  },
});

export default CustomCodeBlock;
