"use client";
import { Card } from "@/shared/components/CardComponent";
import { MasonryGrid } from "@/shared/components/MasonryGrid";
import { SearchField } from "@/shared/components/SearchField";
import { Textarea } from "@/shared/components/ui/textarea";

import { useState } from "react";

export default function Home() {
  const [query, setQuery] = useState<string>("");
  const [topK, setTopK] = useState(6);

  const handleQueryIndex = () => {};

  return (
    <div className="p-6 font-sans bg-gray-100 min-h-screen">
      {/* Index Name Input */}
      <SearchField
        query={query}
        setQuery={setQuery}
        onEnter={handleQueryIndex}
      />

      {/* Query Results */}
      {/* {isLoading && <>Loading</>}
      {queryResults && queryResults.result && ( */}
      <div className="mt-4">
        <h3 className="font-medium text-gray-800 mb-4">Query Results:</h3>

        <MasonryGrid
          data={{
            result: [],
          }}
          isLoading={false}
          handleDelete={async () => {}}
        />
      </div>
      {/* )} */}

      {/* Error Handling */}
      {/* {error && <p className="text-red-600 mt-4">Error: {error}</p>} */}
    </div>
  );
}
