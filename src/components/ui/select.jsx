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
    const esc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", esc);
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
        "flex h-10 w-full items-center justify-between gap-2
