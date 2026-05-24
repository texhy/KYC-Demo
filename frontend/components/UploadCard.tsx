"use client";

import { useRef, useState } from "react";

export default function UploadCard({
  title,
  hint,
  accept,
  file,
  onSelect,
}: {
  title: string;
  hint: string;
  accept: string;
  file: File | null;
  onSelect: (f: File | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onSelect(f);
  }

  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
        file
          ? "border-emerald-300 bg-emerald-50"
          : dragging
            ? "border-brand-teal bg-brand-teal/10"
            : "border-slate-200 bg-slate-50 hover:border-brand-teal hover:bg-white"
      }`}
    >
      <span
        className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${
          file ? "bg-emerald-100 text-emerald-600" : "bg-white text-brand-teal ring-1 ring-slate-200"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 16V4m0 0 4 4m-4-4L8 8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
        </svg>
      </span>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-[16rem] break-words text-xs text-slate-400">
        {file ? `Selected: ${file.name}` : hint}
      </p>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
