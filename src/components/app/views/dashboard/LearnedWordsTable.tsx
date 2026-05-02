import { useEffect, useState, useMemo } from "react";
import * as api from "@/lib/tauri";
import type { Word } from "@/types";
import { getContentDirection } from "@/lib/rtl";
import { Search, Filter, ChevronDown, ListFilter } from "lucide-react";

export function LearnedWordsTable({ limit }: { limit?: number }) {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getLearnedWords();
        setWords(data || []);
      } catch (err: any) {
        console.error("Failed to fetch learned words:", err);
        setErrorMsg(err.toString());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      const matchesSearch = 
        w.word_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.translation.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === "all" || w.word_type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [words, searchQuery, selectedType]);

  const displayWords = useMemo(() => {
    if (limit && !isExpanded) {
      return filteredWords.slice(0, limit);
    }
    return filteredWords;
  }, [filteredWords, limit, isExpanded]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 mt-8 pt-8 border-t border-border/30">
        <h3 className="text-xl font-bold tracking-tight text-foreground">Learned Library</h3>
        <div className="h-40 rounded-2xl border border-border/50 bg-secondary/20 animate-pulse" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col gap-4 mt-8 pt-8 border-t border-border/30 text-center">
        <h3 className="text-xl text-left font-bold tracking-tight text-foreground">Learned Library</h3>
        <div className="rounded-2xl border-2 border-red-500/50 bg-red-500/10 p-12">
          <p className="text-sm font-semibold text-red-500">Backend System Error: {errorMsg}</p>
          <p className="text-xs text-red-400 mt-2">You MUST completely restart the app.</p>
        </div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="shrink-0 flex flex-col gap-4 mt-8 pt-8 border-t border-border/30 text-center">
        <h3 className="text-xl text-left font-bold tracking-tight text-foreground">Learned Library</h3>
        <div className="rounded-2xl border border-border/50 bg-transparent p-12">
          <p className="text-sm font-semibold text-muted-foreground/60">No words learned yet. Start your journey today!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 flex flex-col gap-6 mt-8 pt-10 border-t border-border/30 w-full overflow-hidden">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[13px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Weekly Collection</p>
          <h3 className="text-2xl font-extrabold tracking-tight text-foreground">Learned Library</h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input
              type="text"
              placeholder="Search words..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary/20 border border-border/40 rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 bg-secondary/20 border border-border/40 rounded-xl px-3 py-2.5">
            <ListFilter size={14} className="text-muted-foreground" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="noun">Nouns</option>
              <option value="verb">Verbs</option>
              <option value="adjective">Adjectives</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-transparent overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-secondary/30 backdrop-blur-md border-b border-border/60 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="font-bold py-4 px-6 text-primary">Original Word</th>
                <th className="font-bold py-4 px-6">Pronunciation</th>
                <th className="font-bold py-4 px-6">Translation</th>
                <th className="font-bold py-4 px-6">Type</th>
                <th className="font-bold py-4 px-6 text-right">Learned On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {displayWords.map((word) => {
                const wordDir = getContentDirection(word.word_text);
                const transDir = getContentDirection(word.translation);
                
                return (
                  <tr key={word.id} className="transition-colors hover:bg-secondary/10 group">
                    <td className="py-4 px-6 font-bold text-foreground">
                      <span dir={wordDir} className="px-2 py-1 rounded bg-primary/5 group-hover:bg-primary/10 transition-colors">{word.word_text}</span>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground">
                      <span className="font-mono text-xs">{word.pronunciation}</span>
                    </td>
                    <td className="py-4 px-6 text-foreground font-medium">
                      <span dir={transDir}>{word.translation}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-[10px] uppercase font-black px-2 py-1 rounded-md bg-secondary text-muted-foreground">
                        {word.word_type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-muted-foreground/60 text-[11px]">
                      {new Date(word.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {limit && filteredWords.length > limit && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border border-dashed border-border/60 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all font-bold text-sm"
        >
          {isExpanded ? "Show Less" : `View All ${filteredWords.length} Words`}
          <ChevronDown size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  );
}
