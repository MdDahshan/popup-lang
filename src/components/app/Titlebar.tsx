import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X, Sparkles } from 'lucide-react';

export function Titlebar() {
  const appWindow = getCurrentWindow();

  return (
    <div 
      className="h-10 select-none flex justify-between items-center bg-transparent relative z-[9999] px-2 w-full shrink-0 border-b border-border/10 cursor-grab active:cursor-grabbing"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.drag-handle')) {
          appWindow.startDragging();
        }
      }}
      onDoubleClick={() => appWindow.toggleMaximize()}
    >
      <div className="flex items-center gap-2 pl-2 text-foreground/60 drag-handle pointer-events-none">
        <Sparkles size={14} className="pointer-events-none" />
        <span className="text-[12px] font-semibold tracking-wider uppercase pointer-events-none">popup-lang</span>
      </div>
      <div className="flex items-center gap-1">
        <button 
          className="inline-flex justify-center items-center size-7 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors" 
          onClick={() => appWindow.minimize()}
          aria-label="Minimize"
        >
          <Minus size={14} />
        </button>
        <button 
          className="inline-flex justify-center items-center size-7 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors" 
          onClick={() => appWindow.toggleMaximize()}
          aria-label="Maximize"
        >
          <Square size={12} />
        </button>
        <button 
          className="inline-flex justify-center items-center size-7 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" 
          onClick={() => appWindow.close()}
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>
      <ResizeEdges appWindow={appWindow} />
    </div>
  );
}

export function ResizeEdges({ appWindow }: { appWindow: any }) {
  // Use fixed positioning so they sit on the absolute edges of the entire window viewport
  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-1 cursor-n-resize z-[10000]" onPointerDown={() => appWindow.startResizeDragging('North')} />
      <div className="fixed bottom-0 left-0 right-0 h-1 cursor-s-resize z-[10000]" onPointerDown={() => appWindow.startResizeDragging('South')} />
      <div className="fixed top-0 bottom-0 left-0 w-1 cursor-w-resize z-[10000]" onPointerDown={() => appWindow.startResizeDragging('West')} />
      <div className="fixed top-0 bottom-0 right-0 w-1 cursor-e-resize z-[10000]" onPointerDown={() => appWindow.startResizeDragging('East')} />
      
      <div className="fixed top-0 left-0 w-2 h-2 cursor-nw-resize z-[10001]" onPointerDown={() => appWindow.startResizeDragging('NorthWest')} />
      <div className="fixed top-0 right-0 w-2 h-2 cursor-ne-resize z-[10001]" onPointerDown={() => appWindow.startResizeDragging('NorthEast')} />
      <div className="fixed bottom-0 left-0 w-2 h-2 cursor-sw-resize z-[10001]" onPointerDown={() => appWindow.startResizeDragging('SouthWest')} />
      <div className="fixed bottom-0 right-0 w-2 h-2 cursor-se-resize z-[10001]" onPointerDown={() => appWindow.startResizeDragging('SouthEast')} />
    </>
  );
}
