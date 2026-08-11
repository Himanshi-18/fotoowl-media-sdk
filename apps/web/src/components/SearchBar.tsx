import { useState, type FormEvent } from "react";

export interface SearchBarProps {
  placeholder?: string;
  disabled?: boolean;
  onSubmit: (query: string) => void;
}

/** Plain controlled search input — Enter or the button both submit via the form's onSubmit. */
export function SearchBar({ placeholder, disabled, onSubmit }: SearchBarProps) {
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onSubmit(trimmed);
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={placeholder}
      />
      <button type="submit" disabled={disabled || value.trim() === ""}>
        Search
      </button>
    </form>
  );
}
