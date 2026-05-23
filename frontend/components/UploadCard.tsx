"use client";

import { useRef } from "react";

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
  return (
    <div
      className={`upload${file ? " filled" : ""}`}
      onClick={() => ref.current?.click()}
    >
      <h3>{title}</h3>
      <p>{file ? `Selected: ${file.name}` : hint}</p>
      <input
        ref={ref}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
