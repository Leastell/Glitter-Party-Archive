import { useState } from "react";
import { Button } from "@/components/ui/button";

const DECADES = ["All", "1950s", "1960s", "1970s", "1980s", "1990s", "2000s"];
const TAGS = ["All", "dry", "open", "22' kick", "20' kick", "muted", "tight", "loose", "compressed", "raw", "filtered", "heavy", "light", "vintage", "modern"];

export default function FilterControls({
  selectedDecade,
  setSelectedDecade,
  selectedTags,
  setSelectedTags,
  onShuffle,
  onClearFilters,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleTag = (tag) => {
    if (tag === "All") {
      setSelectedTags([]);
      return;
    }
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const FilterButton = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`font-mono text-xs px-2 py-1 border border-black transition-all duration-150 whitespace-nowrap ${
        isActive ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center">
        {/* Filter Button */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white text-black border border-black rounded-none font-mono text-xs px-3 py-1 hover:bg-gray-100 transition-colors"
        >
          filter
        </Button>

        {/* Shuffle Button */}
        <Button
          onClick={onShuffle}
          className="bg-white text-black border border-black rounded-none font-mono text-xs px-3 py-1 hover:bg-gray-100 transition-colors"
        >
          shuffle
        </Button>
      </div>
      
      {/* Filter Panel - Horizontal layout with better spacing */}
      {isOpen && (
        <div className="mt-3 border border-black bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-6">
            
            {/* Decades Section */}
            <div className="flex-shrink-0">
              <h3 className="font-mono text-xs text-black mb-2">★ decade:</h3>
              <div className="flex flex-wrap gap-1">
                {DECADES.map((decade) => (
                  <FilterButton
                    key={decade}
                    label={decade === "All" ? "all" : decade}
                    isActive={
                      selectedDecade === decade || (decade === "All" && !selectedDecade)
                    }
                    onClick={() => setSelectedDecade(decade === "All" ? "" : decade)}
                  />
                ))}
              </div>
            </div>

            {/* Tags Section */}
            <div className="flex-1 min-w-0">
              <h3 className="font-mono text-xs text-black mb-2">★ tags:</h3>
              <div className="flex flex-wrap gap-1">
                {TAGS.map((tag) => (
                  <FilterButton
                    key={tag}
                    label={tag === "All" ? "all" : tag}
                    isActive={
                      selectedTags.includes(tag) || (tag === "All" && selectedTags.length === 0)
                    }
                    onClick={() => toggleTag(tag)}
                  />
                ))}
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="flex-shrink-0 self-end">
              <button
                onClick={() => { onClearFilters(); setIsOpen(false); }}
                className="font-mono text-xs underline hover:text-gray-600 transition-colors"
              >
                clear filters
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}