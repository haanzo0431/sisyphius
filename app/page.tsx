"use client";

import { useState, useEffect, useCallback } from 'react';
import { Terminal, ArrowUpRight, Plus, Search, Sun, Moon, Eye } from 'lucide-react';
import Link from 'next/link';
import { supabase } from './utils/supabase';

interface Dataset {
  id: string;
  node_id: string;
  title: string;
  description: string;
  author: string;
  format?: string;
  tags?: string[];
  views?: number;
  created_at: string;
}

export default function Home() {
  const [lightMode, setLightMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH DATASETS FUNCTION
  const fetchDatasets = useCallback(async (showLoadingState = true) => {
    if (showLoadingState) setLoading(true);
    
    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching datasets:', error);
    } else if (data) {
      setDatasets(data as Dataset[]);
    }
    
    if (showLoadingState) setLoading(false);
  }, []);

  // INITIAL MOUNT + LIVE POLLING (Updates views automatically)
  useEffect(() => {
    fetchDatasets(true); // Initial load with spinner

    // Silently refresh data every 5 seconds so views update when returning to grid
    const intervalId = setInterval(() => {
      fetchDatasets(false);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchDatasets]);

  const tags = ["ALL", "AI_SAFETY", "ETHICS", "GEN_Z", "NEUROSCIENCE", "SLEEP_STATE", "COGNITION"];

  const filteredDatasets = datasets.filter((ds) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = 
      ds.title?.toLowerCase().includes(query) ||
      ds.node_id?.toLowerCase().includes(query) ||
      ds.description?.toLowerCase().includes(query);
    
    const matchesTag = selectedTag && selectedTag !== "ALL" 
      ? ds.tags?.some(t => t.toUpperCase() === selectedTag.toUpperCase())
      : true;

    return matchesSearch && matchesTag;
  });

  return (
    <div className={`min-h-screen transition-colors duration-200 font-mono ${lightMode ? "bg-zinc-100 text-zinc-900" : "bg-black text-zinc-300"}`}>
      
      <header className={`border-b-2 px-6 py-4 flex items-center justify-between sticky top-0 z-50 ${lightMode ? "border-zinc-300 bg-white" : "border-zinc-800 bg-black"}`}>
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <span className="font-bold tracking-tight text-lg uppercase">Sisyphus // Open Core</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setLightMode(!lightMode)}
            className={`p-2 border-2 transition ${lightMode ? "border-black bg-zinc-100 text-black hover:bg-zinc-200" : "border-zinc-800 bg-zinc-950 text-white hover:border-white"}`}
            title="Toggle Light/Dark Mode"
          >
            {lightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <Link href="/upload" className={`flex items-center gap-1.5 text-xs font-bold uppercase px-3 py-2 border-2 transition ${lightMode ? "bg-black text-white border-black hover:bg-zinc-800" : "bg-white text-black border-white hover:bg-black hover:text-white"}`}>
            <Plus className="w-4 h-4" /> [Ingest_Node]
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-12 pb-24">
        <div className="mb-10 space-y-4">
          <div className={`flex items-center border-2 px-3 py-2 ${lightMode ? "border-black bg-white" : "border-zinc-800 bg-zinc-950"}`}>
            <Search className="w-4 h-4 text-zinc-500 mr-2.5 shrink-0" />
            <input 
              type="text" 
              placeholder="SEARCH_NODES // enter keywords, tags, or node IDs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`bg-transparent w-full focus:outline-none text-xs uppercase tracking-wider placeholder:text-zinc-600 font-mono py-0.5 ${lightMode ? "text-black" : "text-zinc-200"}`}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === "ALL" ? null : tag)}
                className={`text-[11px] font-bold px-2.5 py-1 border transition uppercase ${
                  (selectedTag === tag || (tag === "ALL" && !selectedTag))
                    ? lightMode ? "bg-black text-white border-black" : "bg-white text-black border-white"
                    : lightMode 
                      ? "border-zinc-300 text-zinc-600 hover:border-black" 
                      : "border-zinc-800 text-zinc-500 hover:border-zinc-500"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-xs font-bold uppercase text-zinc-500 animate-pulse">
            [CONNECTING_TO_SUPABASE_CORE...]
          </div>
        ) : filteredDatasets.length === 0 ? (
          <div className={`text-center py-20 border-2 border-dashed text-xs font-bold uppercase ${lightMode ? "border-zinc-300 text-zinc-500" : "border-zinc-800 text-zinc-500"}`}>
            [NO_NODES_FOUND // TRY_UPLOADING_ONE]
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredDatasets.map((ds) => (
              <div 
                key={ds.id} 
                className={`border-2 p-6 transition-colors group flex flex-col justify-between ${
                  lightMode 
                    ? "border-zinc-300 bg-white hover:border-black" 
                    : "border-zinc-800 bg-zinc-950 hover:border-white"
                }`}
              >
                <div>
                  <div className={`flex items-center justify-between border-b border-dashed pb-3 mb-4 ${lightMode ? "border-zinc-300" : "border-zinc-800"}`}>
                    <span className={`text-xs font-bold px-2 py-0.5 ${lightMode ? "bg-black text-white" : "bg-white text-black"}`}>
                      {ds.format || ".CSV"}
                    </span>
                    <div className="flex items-center gap-3">
                      {/* VIEW COUNTER FIX */}
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 transition-all">
                        <Eye className="w-3.5 h-3.5" /> {ds.views || 0}
                      </span>
                      <span className="text-xs font-bold text-zinc-500">
                        NODE_ID: {ds.node_id}
                      </span>
                    </div>
                  </div>

                  <h2 className={`text-xl font-bold uppercase mb-2 group-hover:text-emerald-400 transition-colors ${lightMode ? "text-black" : "text-white"}`}>
                    {ds.title}
                  </h2>
                    
                  <p className={`text-xs mb-6 line-clamp-3 leading-relaxed ${lightMode ? "text-zinc-600" : "text-zinc-400"}`}>
                    {ds.description}
                  </p>
                </div>

                <div>
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {ds.tags && ds.tags.map((t: string, i: number) => (
                      <span 
                        key={i} 
                        className={`text-[10px] border px-1.5 py-0.5 uppercase ${
                          lightMode 
                            ? "border-zinc-300 text-zinc-600" 
                            : "border-zinc-800 text-zinc-500"
                        }`}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  <div className={`flex items-center justify-between pt-4 border-t ${lightMode ? "border-zinc-200" : "border-zinc-900"}`}>
                    <span className="text-[11px] text-zinc-500 font-bold">
                      BY: {ds.author}
                    </span>

                    <Link 
                      href={`/dataset/${ds.node_id}`}
                      className={`flex items-center gap-1 text-xs font-bold uppercase px-3 py-1.5 border-2 transition-colors ${
                        lightMode 
                          ? "border-black text-black hover:bg-black hover:text-white" 
                          : "border-zinc-700 text-white hover:bg-white hover:text-black"
                      }`}
                    >
                      Access_Node <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}