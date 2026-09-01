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
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
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
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm",
        className
      )}
    >
      {children}
      <ChevronDown className="w-4 h-4 opacity-50" />
    </button>
  );
}

export function SelectValue({ placeholder }) {
  const { value, labels } = useContext(SelectCtx);
  return <span className="truncate">{labels[value] || placeholder || value}</span>;
}

export function SelectContent({ children }) {
  const { open } = useContext(SelectCtx);
  if (!open) return null;
  return (
    <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg py-1 max-h-64 overflow-auto">
      {children}
    </div>
  );
}

// __item marker lets collectLabels distinguish items from other nodes.
SelectItem.defaultProps = { __item: true };
export function SelectItem({ value, children }) {
  const { onValueChange, setOpen, value: selected } = useContext(SelectCtx);
  return (
    <div
      onClick={() => {
        onValueChange(value);
        setOpen(false);
      }}
      className={cn(
        "cursor-pointer px-3 py-2 text-sm hover:bg-slate-100",
        selected === value && "bg-slate-50 font-medium"
      )}
    >
      {children}
    </div>
  );
}
