"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Terminal, ArrowLeft, Download, Database, Calendar, User, Eye, Trash2, Code } from 'lucide-react';
import { supabase } from '../../utils/supabase';

interface Dataset {
  id: string;
  node_id: string;
  title: string;
  description: string;
  author: string;
  format?: string;
  file_url?: string;
  tags?: string[];
  views?: number;
  delete_key?: string;
  created_at: string;
}

// Robust CSV Parser that handles quoted fields containing commas and newlines
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let field = '';
  
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    
    if (inQuotes) {
      if (c === '"') {
        if (next === '"') {
          field += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field.trim());
        field = '';
      } else if (c === '\r' && next === '\n') {
        row.push(field.trim());
        rows.push(row);
        row = [];
        field = '';
        i++;
      } else if (c === '\n' || c === '\r') {
        row.push(field.trim());
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += c;
      }
    }
  }
  
  if (field !== '' || row.length > 0) {
    row.push(field.trim());
    rows.push(row);
  }
  
  return rows.filter(r => r.length > 0 && !(r.length === 1 && r[0] === ''));
}

export default function DatasetDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileContent, setFileContent] = useState<string[][] | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [loadingFile, setLoadingFile] = useState(false);
  
  // Preview & Delete UI States
  const [showPreview, setShowPreview] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [passcode, setPasscode] = useState("");

  useEffect(() => {
    if (!id) return;

    async function fetchAndIncrement() {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .eq('node_id', id)
        .single();

      if (error || !data) {
        console.error('Error fetching dataset:', error);
        setLoading(false);
        return;
      }

      const fetchedDataset = data as Dataset;
      setDataset(fetchedDataset);

      // View Counter Logic
      const todayDate = new Date().toISOString().split('T')[0];
      const storageKey = `viewed_node_${id}`;
      const lastViewed = localStorage.getItem(storageKey);

      if (lastViewed !== todayDate) {
        const newViews = (fetchedDataset.views || 0) + 1;
        
        await supabase
          .from('datasets')
          .update({ views: newViews })
          .eq('node_id', id);

        setDataset((prev) => prev ? { ...prev, views: newViews } : null);
        localStorage.setItem(storageKey, todayDate);
      }

      if (fetchedDataset.file_url) {
        fetchFilePreview(fetchedDataset.file_url, fetchedDataset.format || '');
      }

      setLoading(false);
    }

    fetchAndIncrement();
  }, [id]);

  const fetchFilePreview = async (url: string, format: string) => {
    try {
      setLoadingFile(true);
      const res = await fetch(url);
      const text = await res.text();
      setRawText(text);

      const fmt = format.toLowerCase();
      
      if (fmt.includes('csv') || url.endsWith('.csv')) {
        const parsedRows = parseCSV(text);
        setFileContent(parsedRows);
      } 
      else if (fmt.includes('json') || url.endsWith('.json')) {
        try {
          const parsedJson = JSON.parse(text);
          setRawText(JSON.stringify(parsedJson, null, 2));
        } catch {
          // Fallback to raw string
        }
      }
    } catch (err) {
      console.error('Error fetching file contents:', err);
    } finally {
      setLoadingFile(false);
    }
  };

  const executeDelete = async () => {
    if (!dataset) return;

    if (passcode.trim() !== dataset.delete_key) {
      alert("ERR_SYS: AUTHORIZATION_FAILED. Invalid Passcode.");
      return;
    }

    setIsDeleting(true);

    try {
      if (dataset.file_url) {
        const urlParts = dataset.file_url.split('/');
        const rawFileName = urlParts[urlParts.length - 1];
        const fileName = decodeURIComponent(rawFileName);
        
        await supabase.storage.from('dataset_files').remove([fileName]);
      }

      const { error } = await supabase
        .from('datasets')
        .delete()
        .eq('node_id', id);

      if (error) throw error;

      alert("NODE_PURGED: Dataset successfully removed from storage core.");
      router.push('/');
    } catch (err: any) {
      console.error(err);
      alert(`ERR_SYS: DELETE_FAILED. ${err?.message || "Check console for details."}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-zinc-300 font-mono flex items-center justify-center">
        <p className="text-xs uppercase tracking-widest animate-pulse text-zinc-500">
          [CONNECTING_TO_CORE // LOADING_NODE_METADATA...]
        </p>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="min-h-screen bg-black text-zinc-300 font-mono flex flex-col items-center justify-center p-6">
        <p className="text-red-400 text-sm uppercase font-bold mb-4">[ERR_SYS: NODE_NOT_FOUND :: {id}]</p>
        <Link href="/" className="text-xs border-2 border-white px-4 py-2 hover:bg-white hover:text-black uppercase transition text-white">
          [/return_to_core]
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-mono px-6 py-12 selection:bg-zinc-300 selection:text-black">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" /> [/back_to_core]
          </Link>
          <div className="flex items-center gap-2 text-xs uppercase text-zinc-500">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>NODE_INSPECTOR // {dataset.node_id}</span>
          </div>
        </div>

        <div className="border-2 border-zinc-800 bg-zinc-950 p-8 shadow-[8px_8px_0px_#27272a]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-dashed border-zinc-800 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold bg-white text-black px-2.5 py-0.5 uppercase">
                  {dataset.format || ".CSV"}
                </span>
                <span className="text-xs text-zinc-500 font-bold uppercase">
                  ID: {dataset.node_id}
                </span>
                <span className="text-xs text-emerald-400 font-bold uppercase flex items-center gap-1 border border-emerald-900/60 bg-emerald-950/40 px-2 py-0.5">
                  <Eye className="w-3.5 h-3.5" /> {dataset.views || 0} VIEWS
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white uppercase tracking-tight">
                {dataset.title}
              </h1>
            </div>

            {/* HEADER ACTIONS: DOWNLOAD, PREVIEW, PURGE */}
            <div className="flex items-center gap-3">
              {dataset.file_url && (
                <a 
                  href={dataset.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white text-black font-bold text-xs uppercase px-4 py-3 border-2 border-white hover:bg-zinc-200 transition shadow-[4px_4px_0px_#27272a]"
                >
                  <Download className="w-4 h-4" /> Download_Raw
                </a>
              )}

              <button 
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-1.5 font-bold text-xs uppercase px-4 py-3 border-2 border-emerald-500/80 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-500 hover:text-black transition shadow-[4px_4px_0px_#27272a]"
              >
                <Code className="w-4 h-4" /> Preview
              </button>

              {showDeletePrompt ? (
                <div className="flex items-center gap-2 border-2 border-red-900 bg-red-950/30 p-1 shadow-[4px_4px_0px_#27272a]">
                  <input 
                    type="password" 
                    placeholder="ENTER PIN..."
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="bg-transparent text-red-400 px-2 py-1 text-xs focus:outline-none placeholder-red-900/70 font-bold uppercase w-28"
                  />
                  <button 
                    onClick={executeDelete}
                    disabled={isDeleting}
                    className="text-xs font-bold uppercase text-white bg-red-600 px-3 py-1.5 hover:bg-red-500 transition disabled:opacity-50"
                  >
                    {isDeleting ? "..." : "CONFIRM"}
                  </button>
                  <button 
                    onClick={() => { setShowDeletePrompt(false); setPasscode(""); }}
                    className="text-xs font-bold uppercase text-zinc-500 px-2 py-1.5 hover:text-white transition"
                  >
                    X
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowDeletePrompt(true)}
                  className="flex items-center gap-1.5 text-xs font-bold uppercase text-red-400 border-2 border-red-900/60 bg-red-950/30 px-4 py-3 hover:bg-red-600 hover:text-white transition shadow-[4px_4px_0px_#27272a]"
                  title="Publisher Deletion Protocol"
                >
                  <Trash2 className="w-4 h-4" /> [Purge_Node]
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-xs">
            <div className="border border-zinc-800 p-4 bg-black">
              <span className="text-zinc-600 block uppercase mb-1 font-bold">Author / Institution</span>
              <span className="text-white font-bold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-500" /> {dataset.author}
              </span>
            </div>
            <div className="border border-zinc-800 p-4 bg-black">
              <span className="text-zinc-600 block uppercase mb-1 font-bold">Timestamp Ingested</span>
              <span className="text-white font-bold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" /> {new Date(dataset.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="border border-zinc-800 p-4 bg-black">
              <span className="text-zinc-600 block uppercase mb-1 font-bold">Total Unique Accesses</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-500" /> {dataset.views || 0} Verified Hits
              </span>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <h2 className="text-xs font-bold uppercase text-zinc-500">Methodology & Abstract</h2>
            <p className="text-sm text-zinc-300 leading-relaxed bg-black border border-zinc-800 p-4">
              {dataset.description}
            </p>
          </div>

          {dataset.tags && dataset.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold uppercase text-zinc-500 mr-2">Tags:</span>
              {dataset.tags.map((tag: string, i: number) => (
                <span key={i} className="text-[11px] border border-zinc-800 bg-black text-zinc-400 px-2.5 py-1 uppercase font-bold">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* FULL-SCREEN OVERLAY DATASET INSPECTOR TERMINAL */}
        {showPreview && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md overflow-y-auto p-6 md:p-12 flex flex-col font-mono text-zinc-300 animate-in fade-in duration-150">
            <div className="max-w-7xl w-full mx-auto space-y-6 flex-1 flex flex-col">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-4 bg-zinc-950 p-4">
                <div className="flex items-center gap-3">
                  <Database className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h2 className="text-lg md:text-xl font-extrabold text-white uppercase tracking-tight">DATASET_INSPECTOR_TERMINAL // {dataset.node_id}</h2>
                    <p className="text-xs text-zinc-500 uppercase">{dataset.title}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-xs text-zinc-400 uppercase hidden md:inline-block font-bold">
                    {loadingFile ? "Parsing payload..." : fileContent ? `${fileContent.length - 1} Rows` : "Ready"}
                  </span>
                  <button 
                    onClick={() => setShowPreview(false)}
                    className="text-xs font-bold uppercase bg-white text-black border-2 border-white px-5 py-2.5 hover:bg-black hover:text-white transition shadow-[4px_4px_0px_#27272a]"
                  >
                    [CLOSE_INSPECTOR]
                  </button>
                </div>
              </div>

              {/* Table / Content Viewer Container */}
              <div className="flex-1 border-2 border-zinc-800 bg-zinc-950 p-6 flex flex-col shadow-[8px_8px_0px_#27272a]">
                {loadingFile ? (
                  <div className="text-center py-32 text-xs font-bold text-zinc-500 uppercase animate-pulse">
                    [FETCHING_AND_PARSING_DATASTREAM...]
                  </div>
                ) : fileContent && fileContent.length > 0 ? (
                  <div className="overflow-x-auto overflow-y-auto border border-zinc-800 flex-1 max-h-[75vh]">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 sticky top-0 z-10">
                          <th className="p-4 font-bold uppercase tracking-wider border-r border-zinc-800 w-16 text-center text-zinc-600">
                            #
                          </th>
                          {fileContent[0].map((header, idx) => (
                            <th key={idx} className="p-4 font-bold uppercase tracking-wider border-r border-zinc-800 last:border-none">
                              {header || `COL_${idx + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {fileContent.slice(1).map((row, rowIndex) => {
                          if (row.length === 1 && row[0].trim() === '') return null;
                          return (
                            <tr key={rowIndex} className="border-b border-zinc-900 hover:bg-zinc-900/80 transition">
                              <td className="p-4 text-zinc-600 border-r border-zinc-900 text-center font-bold align-top">
                                {rowIndex + 1}
                              </td>
                              {fileContent[0].map((_, cellIndex) => {
                                const cell = row[cellIndex];
                                const hasContent = cell && cell.trim() !== '';
                                return (
                                  <td key={cellIndex} className="p-4 text-zinc-300 border-r border-zinc-900 last:border-none min-w-[250px] leading-relaxed align-top">
                                    {hasContent ? (
                                      <span className="whitespace-pre-wrap">{cell}</span>
                                    ) : (
                                      <span className="text-zinc-700 italic font-bold">NONE</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : rawText ? (
                  <pre className="p-6 bg-black border border-zinc-800 text-xs text-emerald-400 overflow-x-auto max-h-[75vh] leading-relaxed">
                    {rawText}
                  </pre>
                ) : (
                  <div className="text-center py-24 text-zinc-600 text-xs uppercase">
                    [NO_FILE_CONTENT_AVAILABLE_OR_UNSUPPORTED_FORMAT]
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}