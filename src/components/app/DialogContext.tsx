import { createContext, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type DialogType = "alert" | "confirm" | "prompt";

interface DialogOptions {
  title: string;
  description?: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  defaultValue?: string;
  danger?: boolean;
}

interface DialogContextValue {
  alert: (options: string | DialogOptions) => Promise<void>;
  confirm: (options: string | DialogOptions) => Promise<boolean>;
  prompt: (options: string | DialogOptions) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used within DialogProvider");
  return ctx;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DialogOptions>({ title: "" });
  const [value, setValue] = useState("");
  const [resolveFn, setResolveFn] = useState<{ fn: (val: any) => void } | null>(null);

  const openDialog = (opts: string | DialogOptions, defaultType: DialogType) => {
    return new Promise<any>((resolve) => {
      const parsedOpts = typeof opts === "string" ? { title: opts } : opts;
      setOptions({
        type: defaultType,
        ...parsedOpts,
      });
      setValue(parsedOpts.defaultValue || "");
      setResolveFn({ fn: resolve });
      setIsOpen(true);
    });
  };

  const alert = (opts: string | DialogOptions) => openDialog(opts, "alert");
  const confirm = (opts: string | DialogOptions) => openDialog(opts, "confirm");
  const prompt = (opts: string | DialogOptions) => openDialog(opts, "prompt");

  const handleClose = (result: any) => {
    setIsOpen(false);
    if (resolveFn) resolveFn.fn(result);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (options.type === "prompt") {
      handleClose(value);
    } else if (options.type === "confirm") {
      handleClose(true);
    } else {
      handleClose(undefined);
    }
  };

  return (
    <DialogContext.Provider value={{ alert, confirm, prompt }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => handleClose(options.type === "prompt" ? null : false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-[24px] border border-border/50 bg-card p-6 shadow-2xl"
            >
              <h2 className="text-[17px] font-semibold tracking-tight text-foreground">{options.title}</h2>
              {options.description && (
                <p className="mt-2 text-sm text-muted-foreground">{options.description}</p>
              )}

              {options.type === "prompt" && (
                <form onSubmit={handleSubmit} className="mt-4">
                  <input
                    type="text"
                    autoFocus
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  />
                </form>
              )}

              <div className="mt-6 flex items-center justify-end gap-3">
                {options.type !== "alert" && (
                  <button
                    onClick={() => handleClose(options.type === "prompt" ? null : false)}
                    className="rounded-xl px-4 py-2.5 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
                  >
                    {options.cancelText || "Cancel"}
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  className={cn(
                    "rounded-xl px-5 py-2.5 text-[14px] font-medium text-primary-foreground shadow-sm transition-colors",
                    options.danger 
                      ? "bg-red-500 hover:bg-red-600 text-white" 
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {options.confirmText || (options.type === "alert" ? "OK" : "Confirm")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
}
