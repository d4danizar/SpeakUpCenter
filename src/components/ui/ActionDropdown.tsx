"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";

export type DropdownItem = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
};

interface ActionDropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  disabled?: boolean;
}

export function ActionDropdown({ trigger, items, disabled }: ActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Calculate position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      
      // We'll align the dropdown's top-right corner with the trigger's bottom-right corner 
      // (a distance of `rect.bottom + window.scrollY` from the absolute top)
      setCoords({
        top: rect.bottom + window.scrollY + 8, // 8px margin
        left: rect.right + window.scrollX - 192, // 192 is the w-48 equivalent width
      });
    }
  }, [isOpen]);

  // Handle click outside (Portal version uses a full-screen overlay)
  
  return (
    <>
      <button 
        ref={triggerRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center justify-center relative"
      >
        {trigger}
      </button>

      {isOpen && typeof document !== "undefined" && createPortal(
        <>
          <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }} 
          />
          <div 
            className="absolute w-48 rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50 py-1 origin-top-right animate-in fade-in zoom-in-95 duration-100 border border-slate-100"
            style={{ 
              top: `${coords.top}px`, 
              left: `${coords.left}px` 
            }}
          >
            {items.map((item, idx) => (
              <button 
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  if (!item.disabled) item.onClick();
                }}
                disabled={item.disabled}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 ${
                  item.danger 
                    ? "text-red-600 hover:bg-red-50" 
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className={item.danger ? "text-red-500 w-4 h-4 flex items-center justify-center" : "text-slate-400 w-4 h-4 flex items-center justify-center"}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  );
}
