"use client";

import { Terminal, ArrowLeft, UploadCloud, CheckCircle, Loader2, Key } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '../utils/supabase';

export default function UploadNode() {
  const [submitted, setSubmitted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [deleteKey, setDeleteKey] = useState(""); // Publisher PIN

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("ERR_SYS: NO_FILE_DETECTED. Please attach a dataset.");
      return;
    }

    if (!deleteKey.trim()) {
      alert("ERR_SYS: PASSCODE_REQUIRED. Set a secret PIN to manage this node later.");
      return;
    }

    setIsUploading(true);

    try {
      const nodeId = `SYS-${Math.floor(Math.random() * 900) + 100}`;
      const fileExt = file.name.split('.').pop()?.toUpperCase() || "BIN";
      const format = `.${fileExt}`;
      
      // Sanitize filename to prevent URL/Storage encoding bugs
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${nodeId}-${sanitizedFileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('dataset_files')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('dataset_files')
        .getPublicUrl(filePath);

      // Clean tags
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim().toUpperCase().replace(/\s+/g, '_'))
        .filter(tag => tag.length > 0);

      // Save to DB with secret delete_key
      const { error: dbError } = await supabase
        .from('datasets')
        .insert([
          {
            node_id: nodeId,
            title: title.trim(),
            author: author.trim(),
            description: description.trim(),
            tags: tagsArray,
            format,
            file_url: publicUrl,
            delete_key: deleteKey.trim(),
            views: 0
          }
        ]);

      if (dbError) throw dbError;

      setSubmitted(true);
    } catch (error: any) {
      console.error(error);
      alert(`ERR_SYS: UPLOAD_FAILED. ${error?.message || "Check console for details."}`);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setFile(null);
    setTitle("");
    setAuthor("");
    setTags("");
    setDescription("");
    setDeleteKey("");
  };

  // Human readable file size display
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-mono flex flex-col items-center pt-16 px-6 pb-24 selection:bg-zinc-300 selection:text-black">
      
      {/* HEADER NAV */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-12">
        <Link href="/" className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /> [/back_to_core]
        </Link>
        <div className="flex items-center gap-2 text-xs uppercase text-zinc-500">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>UPLOAD_PROTOCOL_V1.1</span>
        </div>
      </div>

      {/* FORM CARD */}
      <div className="w-full max-w-3xl bg-black border-2 border-zinc-800 p-8 shadow-[8px_8px_0px_#27272a]">
        <h1 className="text-3xl font-extrabold text-white mb-2 uppercase tracking-tight">
          [+] Ingest_New_Dataset
        </h1>
        <p className="text-zinc-500 text-sm mb-8">
          Upload verified survey data or raw academic responses to the public repository.
        </p>

        {submitted ? (
          <div className="text-center py-16 border-2 border-dashed border-emerald-500/50 bg-emerald-950/20 p-6">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">DATASET_INGESTED_SUCCESSFULLY</h2>
            <p className="text-zinc-400 text-xs mb-6 max-w-md mx-auto leading-relaxed">
              Node created and broadcast to database. Save your secret PIN to execute purge operations in the future.
            </p>
            <div className="flex justify-center gap-4">
              <Link 
                href="/" 
                className="text-xs font-bold border-2 border-zinc-700 text-zinc-300 px-4 py-2 hover:border-white hover:text-white uppercase transition"
              >
                View_In_Grid
              </Link>
              <button 
                onClick={resetForm}
                className="text-xs font-bold bg-white text-black border-2 border-white px-4 py-2 hover:bg-black hover:text-white uppercase transition"
              >
                Upload_Another_Node
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* FILE DROPZONE */}
            <div className={`relative border-2 border-dashed p-10 text-center hover:border-white transition-colors cursor-pointer bg-zinc-950 group ${file ? "border-emerald-500/70" : "border-zinc-700"}`}>
              <input 
                type="file" 
                required
                onChange={handleFileChange}
                accept=".csv,.json,.xlsx"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <UploadCloud className={`w-10 h-10 mx-auto mb-3 transition-colors ${file ? "text-emerald-400" : "text-zinc-500 group-hover:text-white"}`} />
              <p className="text-sm font-bold text-white uppercase mb-1">
                {file ? `[FILE_READY: ${file.name}]` : "Drop Dataset File Here"}
              </p>
              <p className="text-xs text-zinc-500 font-mono">
                {file 
                  ? `SIZE: ${formatFileSize(file.size)} // FORMAT: .${file.name.split('.').pop()?.toUpperCase()}`
                  : "Supported formats: .CSV, .JSON, .XLSX (Max: 250MB)"}
              </p>
            </div>

            {/* DATASET TITLE */}
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Dataset_Title *</label>
              <input 
                required
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., AGI Safety Perception Matrix 2026"
                className="w-full bg-zinc-950 border-2 border-zinc-800 p-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-white transition"
              />
            </div>

            {/* AUTHOR / INSTITUTION */}
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Author_or_Institution *</label>
              <input 
                required
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g., Stanford AI Safety Initiative"
                className="w-full bg-zinc-950 border-2 border-zinc-800 p-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-white transition"
              />
            </div>

            {/* PUBLISHER PASSCODE (FOR DELETION) */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase text-emerald-400 mb-2">
                <Key className="w-3.5 h-3.5" /> Publisher_Secret_Passcode * (PIN required to delete node later)
              </label>
              <input 
                required
                type="password"
                value={deleteKey}
                onChange={(e) => setDeleteKey(e.target.value)}
                placeholder="Create a secret PIN (e.g. 1234 or keyphrase)"
                className="w-full bg-zinc-950 border-2 border-emerald-900/50 p-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-400 transition"
              />
            </div>

            {/* TAGS */}
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Metadata_Tags (Comma Separated)</label>
              <input 
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="AI_SAFETY, COGNITION, ETHICS"
                className="w-full bg-zinc-950 border-2 border-zinc-800 p-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-white transition"
              />
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Methodology_Abstract *</label>
              <textarea 
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail sample size, collection period, and survey parameters..."
                className="w-full bg-zinc-950 border-2 border-zinc-800 p-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-white transition"
              />
            </div>

            {/* SUBMIT BUTTON */}
            <button 
              type="submit" 
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold uppercase text-sm py-4 border-2 border-white hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_#27272a] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Transmitting_To_Core...</>
              ) : (
                "[+] Broadcast_To_Database"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}