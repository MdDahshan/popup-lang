import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export const MatchingChallenge = ({ data, isLatest, onSendAnswer }: { data: string, isLatest?: boolean, onSendAnswer?: (ans: string) => void }) => {
  const [lefts, setLefts] = useState<{id: string, label: string, matchId: string}[]>([]);
  const [rights, setRights] = useState<{id: string, label: string, matchId: string}[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [errorPair, setErrorPair] = useState<[string, string] | null>(null);
  const [completed, setCompleted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const rightRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const [lines, setLines] = useState<{id: string, path: string}[]>([]);

  useEffect(() => {
    const pairs = data.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
      const [left, right] = l.split('|');
      // If the AI somehow forgets the pipe, format gracefully:
      if (!right) return null;
      return { left: left.trim(), right: right.trim() };
    }).filter(Boolean) as {left: string, right: string}[];

    const lArr = pairs.map((p, i) => ({ id: `L${i}`, label: p.left, matchId: `R${i}` }));
    const rArr = pairs.map((p, i) => ({ id: `R${i}`, label: p.right, matchId: `L${i}` }));
    setLefts([...lArr].sort(() => Math.random() - 0.5));
    setRights([...rArr].sort(() => Math.random() - 0.5));
  }, [data]);

  const updateLines = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLines = Array.from(matchedIds).filter(id => id.startsWith('L')).map(leftId => {
      const leftBtn = leftRefs.current.get(leftId);
      const rightId = lefts.find(l => l.id === leftId)?.matchId;
      const rightBtn = rightId ? rightRefs.current.get(rightId) : null;
      if (!leftBtn || !rightBtn) return null;

      const lRect = leftBtn.getBoundingClientRect();
      const rRect = rightBtn.getBoundingClientRect();

      const x1 = lRect.right - containerRect.left;
      const y1 = lRect.top - containerRect.top + lRect.height / 2;
      
      const x2 = rRect.left - containerRect.left;
      const y2 = rRect.top - containerRect.top + rRect.height / 2;

      const dx = Math.max(Math.abs(x2 - x1) * 0.5, 30);
      const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

      return { id: leftId, path };
    }).filter(Boolean) as {id: string, path: string}[];

    setLines(prev => {
      const isSame = prev.length === newLines.length && prev.every((l, i) => l.id === newLines[i].id && l.path === newLines[i].path);
      return isSame ? prev : newLines;
    });
  }, [matchedIds, lefts]);

  // Use ResizeObserver for more robust line updating than just window resize
  useLayoutEffect(() => {
    updateLines();
    
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => updateLines());
    observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, [updateLines, matchedIds]);

  useEffect(() => {
    if (selectedLeft && selectedRight) {
      const leftObj = lefts.find(l => l.id === selectedLeft);
      if (leftObj?.matchId === selectedRight) {
        setMatchedIds(prev => new Set(prev).add(selectedLeft).add(selectedRight));
        setSelectedLeft(null);
        setSelectedRight(null);
      } else {
        setErrorPair([selectedLeft, selectedRight]);
        setTimeout(() => {
          setSelectedLeft(null);
          setSelectedRight(null);
          setErrorPair(null);
        }, 500);
      }
    }
  }, [selectedLeft, selectedRight, lefts]);

  useEffect(() => {
    if (lefts.length > 0 && matchedIds.size === lefts.length * 2 && !completed && isLatest) {
      setCompleted(true);
      setTimeout(() => {
        onSendAnswer?.("[[ANSWER]] Completed the matching challenge successfully.");
      }, 1000);
    }
  }, [matchedIds, lefts.length, completed, isLatest, onSendAnswer]);

  return (
    <div ref={containerRef} dir="ltr" className="relative flex gap-12 w-full my-4 p-5 rounded-xl bg-muted/20 border border-border/40 min-h-[100px] overflow-hidden">
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {lines.map(line => (
          <path 
            key={line.id} 
            d={line.path} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            className="text-primary/50 animate-in fade-in duration-500" 
            strokeLinecap="round" 
          />
        ))}
      </svg>
      
      <div className="flex flex-col gap-3 flex-1 z-10">
        {lefts.map(l => {
          const isSelected = selectedLeft === l.id;
          const isMatched = matchedIds.has(l.id);
          const isError = errorPair?.[0] === l.id;
          return (
            <button
              key={l.id}
              dir="auto"
              ref={el => { if (el) leftRefs.current.set(l.id, el); }}
              disabled={!isLatest || (selectedLeft !== null && !isSelected) || isMatched}
              onClick={() => setSelectedLeft(isSelected ? null : l.id)}
              className={cn(
                "px-4 py-3 rounded-xl border text-[14px] font-medium transition-all text-center break-words h-auto shadow-sm relative",
                isSelected ? "border-primary/60 bg-primary/10 text-primary shadow-primary/20 ring-1 ring-primary/40 scale-[1.02]" : "border-border/60 bg-card hover:bg-primary/5 cursor-pointer",
                isError && "border-red-500 bg-red-500/10 text-red-500 animate-shake",
                isMatched && "border-emerald-500/80 bg-emerald-500/15 text-foreground ring-1 ring-emerald-500/50 shadow-emerald-500/20",
                !isLatest && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                {l.label}
                {isMatched && <Check size={16} className="text-emerald-500" />}
              </div>
              <div className={cn("absolute top-1/2 -right-2 w-2 h-2 rounded-full -translate-y-1/2 transition-colors", isSelected || isMatched ? "bg-primary" : "bg-border")} />
            </button>
          )
        })}
      </div>
      
      <div className="flex flex-col gap-3 flex-1 z-10">
        {rights.map(r => {
          const isSelected = selectedRight === r.id;
          const isMatched = matchedIds.has(r.id);
          const isError = errorPair?.[1] === r.id;
          return (
            <button
              key={r.id}
              dir="auto"
              ref={el => { if (el) rightRefs.current.set(r.id, el); }}
              disabled={!isLatest || (selectedRight !== null && !isSelected) || isMatched}
              onClick={() => setSelectedRight(isSelected ? null : r.id)}
              className={cn(
                "px-4 py-3 rounded-xl border text-[14px] font-medium transition-all text-center break-words h-auto shadow-sm relative",
                isSelected ? "border-primary/60 bg-primary/10 text-primary shadow-primary/20 ring-1 ring-primary/40 scale-[1.02]" : "border-border/60 bg-card hover:bg-primary/5 cursor-pointer",
                isError && "border-red-500 bg-red-500/10 text-red-500 animate-shake",
                isMatched && "border-emerald-500/80 bg-emerald-500/15 text-foreground ring-1 ring-emerald-500/50 shadow-emerald-500/20",
                !isLatest && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className={cn("absolute top-1/2 -left-2 w-2 h-2 rounded-full -translate-y-1/2 transition-colors", isSelected || isMatched ? "bg-primary" : "bg-border")} />
              <div className="flex items-center justify-center gap-2">
                {isMatched && <Check size={16} className="text-emerald-500" />}
                {r.label}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  );
};
