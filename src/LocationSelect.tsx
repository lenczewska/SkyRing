import { useEffect, useRef, useState, type KeyboardEvent } from "react";

export type SelectOption = {
  value: string;
  label: string;
  icon?: string;
  sublabel?: string;
};

type LocationSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
  allowCustom?: boolean;
  hint?: string;
  language?: "en" | "ru";
};

export default function LocationSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  disabled = false,
  emptyMessage,
  allowCustom = true,
  hint,
  language = "ru",
}: LocationSelectProps) {
  const defaultPlaceholder = language === "en" ? "Select..." : "Выберите...";
  const effectivePlaceholder = placeholder ?? defaultPlaceholder;
  const defaultEmpty = language === "en" ? "No results found" : "Ничего не найдено";
  const effectiveEmptyMessage = emptyMessage ?? defaultEmpty;
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync external value with local query
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Filter options based on query
  const filteredOptions = query.trim()
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(query.toLowerCase()) ||
          opt.value.toLowerCase().includes(query.toLowerCase()) ||
          (opt.sublabel && opt.sublabel.toLowerCase().includes(query.toLowerCase()))
      )
    : options;

  // Find active option for icon display
  const currentOption = options.find(
    (opt) => opt.value.toLowerCase() === value.toLowerCase() || opt.label.toLowerCase() === value.toLowerCase()
  );

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // If not custom allowed and value doesn't match, revert query to value
        if (!allowCustom && !currentOption) {
          setQuery(value);
        }
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [allowCustom, currentOption, value]);

  // Auto scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (option: SelectOption) => {
    onChange(option.value);
    setQuery(option.value);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleInputChange = (text: string) => {
    setQuery(text);
    if (!isOpen) setIsOpen(true);
    setHighlightedIndex(0);

    // If typing custom value is allowed, update immediately
    if (allowCustom) {
      onChange(text);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        } else if (allowCustom && query.trim()) {
          onChange(query.trim());
          setIsOpen(false);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`location-select-container ${isOpen ? "open" : ""} ${disabled ? "disabled" : ""}`}
    >
      <label className="location-select-label">
        <span className="location-select-title">
          {label} {required && <strong className="required-star">*</strong>}
        </span>

        <div className="location-input-wrapper">
          {currentOption?.icon && (
            <span className="location-selected-icon" aria-hidden="true">
              {currentOption.icon}
            </span>
          )}

          <input
            ref={inputRef}
            type="text"
            className="location-select-input"
            value={query}
            placeholder={effectivePlaceholder}
            disabled={disabled}
            required={required}
            autoComplete="off"
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (!disabled) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
          />

          {value && (
            <button
              type="button"
              className="location-clear-btn"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear"
            >
              ✕
            </button>
          )}

          <button
            type="button"
            className="location-toggle-arrow"
            onClick={(e) => {
              e.preventDefault();
              if (!disabled) {
                setIsOpen(!isOpen);
                inputRef.current?.focus();
              }
            }}
            aria-label="Toggle dropdown"
            tabIndex={-1}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </label>

      {hint && <small className="location-select-hint">{hint}</small>}

      {isOpen && !disabled && (
        <div className="location-dropdown-menu" role="listbox">
          <ul ref={listRef} className="location-options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected =
                  opt.value.toLowerCase() === value.toLowerCase() ||
                  opt.label.toLowerCase() === value.toLowerCase();
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={`${opt.value}-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    className={`location-option-item ${isSelected ? "selected" : ""} ${isHighlighted ? "highlighted" : ""}`}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent input blur before click
                      handleSelect(opt);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                  >
                    <div className="option-label-wrapper">
                      {opt.icon && <span className="option-flag">{opt.icon}</span>}
                      <span className="option-name">{opt.label}</span>
                    </div>

                    {opt.sublabel && (
                      <span className="option-sublabel">{opt.sublabel}</span>
                    )}

                    {isSelected && <span className="option-check">✓</span>}
                  </li>
                );
              })
            ) : (
              <li className="location-empty-item">
                <span>{effectiveEmptyMessage}</span>
                {allowCustom && query.trim() && (
                  <button
                    type="button"
                    className="location-use-custom-btn"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(query.trim());
                      setIsOpen(false);
                    }}
                  >
                    {language === "en"
                      ? `Use "${query.trim()}" ↵`
                      : `Использовать «${query.trim()}» ↵`}
                  </button>
                )}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
