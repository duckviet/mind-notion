import React from "react";

type Props = {
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  onEnter: () => void; // New prop to handle "Enter" key
};

export default function SearchField({ query, setQuery, onEnter }: Props) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onEnter(); // Trigger the "Enter" key handler
    }
  };

  return (
    <div className="mb-10">
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown} // Attach the keydown event
        className="w-full h-[60px] placeholder:text-md bg-transparent text-4xl focus:outline-none border-b-2 border-gray-200 py-2"
      />
    </div>
  );
}
