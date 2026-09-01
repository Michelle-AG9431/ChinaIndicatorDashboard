import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const SelectCtx = createContext(null);

// Recursively collect {value: label} from <SelectItem> descendants.
function collectLabels(children, map) {
  React.Children.forEach(children, (child) => {
    if (!child || !child.props) return;
    if (child.props.value !== undefined && child.props.__item) {
      map[child.props.value] = child.props.children;
    }
    if (child.props.children) collectLabels(child.props.children, map);
  });
  return map;
}

export function Select({ value, onValueChange, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const labels = collectLabels(children, {});

  return (
    <SelectCtx.Provider value={{ value, onValueChange, open, setOpen, labels }}>
      <div className="relative" ref={ref}>
        {children}
      </div>
    </SelectCtx.Provider>
  );
}

export function SelectTrigger({ className, children }) {
  const { setOpen, open } = useContext(SelectCtx);
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      aria-haspopup="listbox"
      aria-expanded={open}
      className={cn(
        "flex h-10 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm",
        "border border-white/25 bg-white/5 text-white transition-colors",
        "hover:bg-white/15 hover:border-white/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
        className
      )}
    >
      {children}
      <ChevronDown
        className={cn(
          "w-4 h-4 shrink-0 opacity-60 transition-transform",
          open && "rotate-180"
        )}
      />
    </button>
  );
}

export function SelectValue({ placeholder }) {
  const { value, labels } = useContext(SelectCtx);
  return (
    <span className="truncate text-left">
      {labels[value] || placeholder || value}
    </span>
  );
}

export function SelectContent({ children }) {
  const { open } = useContext(SelectCtx);
  if (!open) return null;
  return (
    <div
      role="listbox"
      className="absolute z-50 mt-1 w-full min-w-[10rem] rounded-lg border border-white/15 bg-slate-900 text-slate-100 shadow-xl shadow-black/40 py-1 max-h-64 overflow-auto"
    >
      {children}
    </div>
  );
}

export function SelectItem({ value, children }) {
  const { onValueChange, setOpen, value: selected } = useContext(SelectCtx);
  return (
    <div
      role="option"
      aria-selected={selected === value}
      onClick={() => {
        onValueChange(value);
        setOpen(false);
      }}
      className={cn(
        "cursor-pointer px-3 py-2 text-sm text-slate-200 transition-colors",
        "hover:bg-white/10 hover:text-white",
        selected === value && "bg-white/15 text-white font-medium"
      )}
    >
      {children}
    </div>
  );
}

// __item marker lets collectLabels distinguish items from other nodes.
SelectItem.defaultProps = { __item: true };
