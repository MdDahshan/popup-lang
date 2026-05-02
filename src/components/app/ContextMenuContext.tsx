import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  shortcut?: string;
  danger?: boolean;
  separator?: boolean;
}

interface ContextMenuContextValue {
  showMenu: (e: React.MouseEvent | MouseEvent, items: ContextMenuItem[]) => void;
  hideMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

export function useContextMenu() {
  const ctx = useContext(ContextMenuContext);
  if (!ctx) throw new Error("useContextMenu must be used within ContextMenuProvider");
  return ctx;
}

export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [menuItems, setMenuItems] = useState<ContextMenuItem[]>([]);

  const showMenu = (e: React.MouseEvent | MouseEvent, items: ContextMenuItem[]) => {
    e.preventDefault();
    // 220 is approx max menu width. Provide breathing room.
    const x = Math.min(e.clientX, window.innerWidth - 220); 
    const y = Math.min(e.clientY, window.innerHeight - (items.length * 40 + 20)); 
    
    setPosition({ x, y });
    setMenuItems(items);
    setIsOpen(true);
  };

  const hideMenu = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = () => hideMenu();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") hideMenu();
    };

    if (isOpen) {
      // Small timeout to prevent immediate closure from the click that opened it
      setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
        document.addEventListener("contextmenu", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
      }, 10);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("contextmenu", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <ContextMenuContext.Provider value={{ showMenu, hideMenu }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ left: position.x, top: position.y }}
            className="fixed z-[200] min-w-[180px] overflow-hidden rounded-xl border border-border/50 bg-card/95 p-1.5 shadow-xl backdrop-blur-md"
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {menuItems.map((item, idx) => {
              if (item.separator) {
                return <div key={`sep-${idx}`} className="my-1.5 h-px bg-border/50" />;
              }

              return (
                <button
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    item.onClick?.();
                    hideMenu();
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                    item.danger 
                      ? "text-red-500 hover:bg-red-500/10" 
                      : "text-foreground/90 hover:bg-secondary/80 hover:text-foreground"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {item.icon && <span className="flex size-4 items-center justify-center opacity-80">{item.icon}</span>}
                    {item.label}
                  </span>
                  {item.shortcut && (
                    <span className="text-[10px] tracking-widest text-muted-foreground opacity-70">
                      {item.shortcut}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </ContextMenuContext.Provider>
  );
}
