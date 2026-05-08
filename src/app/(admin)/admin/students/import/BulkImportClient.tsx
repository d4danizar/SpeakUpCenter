"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Upload, FileSpreadsheet, CheckCircle, AlertTriangle,
  Loader2, Eye, Play, RefreshCcw, X, Info,
  Phone, User, Calendar, Tag, BookOpen, ChevronDown,
} from "lucide-react";
import {
  importStudentsBulk,
  getAvailablePrograms,
  type ImportResult,
  type ProgramOption,
} from "../import-actions";
import { parseIndonesianDate, formatDateId } from "@/lib/date-parser";

// ─── Sanitasi phone (mirror dari server, untuk preview client) ────────────────
function sanitizePhoneClient(raw: string | number | null | undefined): string {
  if (!raw) return "";
  let str = String(raw).trim();
  if (str.includes("/")) str = str.split("/")[0].trim();
  if (str.includes(",")) str = str.split(",")[0].trim();
  let digits = str.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  else if (digits.startsWith("8")) digits = "62" + digits;
  if (digits.length < 9 || digits.length > 15) return "";
  return digits;
}

// ─── Badge kategori program ───────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  KIDDOS:  "bg-pink-100 text-pink-700",
  ADULT:   "bg-purple-100 text-purple-700",
  TEENS:   "bg-blue-100 text-blue-700",
};

type PreviewRow = {
  rowNum: number;
  name: string;
  rawPhone: string;
  cleanPhone: string;
  startDate: Date | null;
  scheduleChoice: string;
  status: string;
  valid: boolean;
  issues: string[];
};

export default function BulkImportClient() {
  const fileRef = useRef<HTMLInputElement>(null);

  // ── State: file & preview ──
  const [fileName, setFileName]   = useState<string | null>(null);
  const [rawRows, setRawRows]     = useState<any[]>([]);
  const [preview, setPreview]     = useState<PreviewRow[]>([]);
  const [result, setResult]       = useState<ImportResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [step, setStep]           = useState<"idle" | "preview" | "done">("idle");

  // ── State: program selector ──
  const [programs, setPrograms]               = useState<ProgramOption[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");

  // ── Fetch programs on mount ──
  useEffect(() => {
    getAvailablePrograms()
      .then(setPrograms)
      .finally(() => setLoadingPrograms(false));
  }, []);

  const selectedProgram = programs.find((p) => p.id === selectedProgramId);

  // ── Parse Excel ──
  const handleFile = (file: File) => {
    setFileName(file.name);
    setResult(null);
    setStep("idle");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb   = XLSX.read(data, { type: "array", cellDates: false });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
        setRawRows(rows);
        buildPreview(rows);
        setStep("preview");
      } catch {
        alert("Gagal membaca file Excel. Pastikan format .xlsx atau .xls.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const buildPreview = (rows: any[]) => {
    const parsed: PreviewRow[] = rows.map((row, i) => {
      const name       = String(row["Nama"] ?? row["nama"] ?? "").trim();
      const rawPhone   = String(row["Nomor WhatsApp"] ?? row["No. WhatsApp"] ?? row["Phone"] ?? row["Telepon"] ?? "").trim();
      const cleanPhone = sanitizePhoneClient(rawPhone);
      const startDate  = parseIndonesianDate(row["Tanggal Mulai"] ?? row["Mulai"] ?? "");
      const schedule   = String(row["Pilihan Jadwal"] ?? row["Jadwal"] ?? "").trim();
      const status     = String(row["Status"] ?? "Aktif").trim();

      const issues: string[] = [];
      if (!name) issues.push("Nama kosong");
      if (!cleanPhone) issues.push(`Nomor tidak valid: "${rawPhone}"`);

      return { rowNum: i + 2, name, rawPhone, cleanPhone, startDate, scheduleChoice: schedule, status, valid: issues.length === 0, issues };
    });
    setPreview(parsed);
  };

  // ── Eksekusi Import ──
  const handleImport = () => {
    startTransition(async () => {
      // Serialize ke plain JSON murni — buang semua prototype/Date bawaan SheetJS
      // agar tidak trigger "Only plain objects can be passed to Server Functions"
      const sanitizedRows = JSON.parse(JSON.stringify(rawRows));

      const res = await importStudentsBulk(
        sanitizedRows,
        selectedProgramId || undefined
      );
      setResult(res);
      setStep("done");
    });
  };

  const reset = () => {
    setFileName(null);
    setRawRows([]);
    setPreview([]);
    setResult(null);
    setStep("idle");
    if (fileRef.current) fileRef.current.value = "";
  };

  const validCount   = preview.filter((r) => r.valid).length;
  const invalidCount = preview.filter((r) => !r.valid).length;

  return (
    <div className="space-y-5">

      {/* ── Dropdown Pilih Program ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
          Pilih Program / Kelas Tujuan
          <span className="font-normal text-slate-400 normal-case tracking-normal ml-1">(Opsional)</span>
        </label>

        <div className="relative">
          <select
            value={selectedProgramId}
            onChange={(e) => setSelectedProgramId(e.target.value)}
            disabled={loadingPrograms}
            className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10 disabled:opacity-60"
          >
            <option value="">-- Tidak diassign ke program manapun --</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category}) · {p.scheduleCount} jadwal
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Info banner program terpilih */}
        {selectedProgram && (
          <div className="mt-3 flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
            <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-indigo-800 truncate">{selectedProgram.name}</p>
              <p className="text-xs text-indigo-600 mt-0.5">
                {selectedProgram.scheduleCount > 0
                  ? `${selectedProgram.scheduleCount} jadwal tersedia — murid akan di-enroll ke jadwal pertama`
                  : "⚠ Program ini belum memiliki jadwal — murid akan di-import tanpa enrollment"}
              </p>
            </div>
            <span className={`text-[10px] font-black px-2 py-1 rounded-full shrink-0 ${CATEGORY_COLORS[selectedProgram.category] || "bg-slate-100 text-slate-600"}`}>
              {selectedProgram.category}
            </span>
          </div>
        )}

        {!selectedProgramId && (
          <p className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-3 h-3" />
            Murid akan dibuat tanpa enrollment. Bisa di-assign ke kelas nanti secara manual.
          </p>
        )}
      </div>

      {/* ── Drop Zone (hanya tampil di step idle) ── */}
      {step === "idle" && (
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 rounded-2xl py-14 px-8 text-center cursor-pointer bg-indigo-50/40 hover:bg-indigo-50 hover:border-indigo-400 transition-all group"
        >
          <FileSpreadsheet className="w-12 h-12 text-indigo-400 group-hover:text-indigo-600 mb-4 transition" />
          <p className="text-sm font-bold text-slate-700">Klik atau drag &amp; drop file Excel</p>
          <p className="text-xs text-slate-500 mt-1">Format: .xlsx / .xls</p>
          <div className="mt-4 flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm text-xs text-slate-500">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            Header wajib: <strong className="text-slate-700 mx-1">Nama</strong> dan <strong className="text-slate-700 mx-1">Nomor WhatsApp</strong>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {/* ── Preview Tabel ── */}
      {step === "preview" && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-bold text-slate-700">{fileName}</span>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-bold text-emerald-700">{validCount} siap import</span>
            </div>
            {invalidCount > 0 && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-bold text-red-700">{invalidCount} akan dilewati</span>
              </div>
            )}
            {selectedProgram && (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2.5">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-bold text-indigo-700">→ {selectedProgram.name}</span>
              </div>
            )}
            <button onClick={reset} className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition">
              <RefreshCcw className="w-3.5 h-3.5" /> Ganti File
            </button>
          </div>

          {/* Tabel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-bold text-slate-700">Pratinjau Data ({preview.length} baris)</span>
            </div>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-8">#</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <User className="w-3 h-3 inline mr-1" />Nama
                    </th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <Phone className="w-3 h-3 inline mr-1" />WhatsApp (Terbaca)
                    </th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <Calendar className="w-3 h-3 inline mr-1" />Tanggal Mulai
                    </th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <Tag className="w-3 h-3 inline mr-1" />Status
                    </th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {preview.map((row) => (
                    <tr key={row.rowNum} className={`transition ${!row.valid ? "bg-red-50/50" : "hover:bg-slate-50/50"}`}>
                      <td className="px-3 py-2.5 text-[11px] text-slate-400 font-mono">{row.rowNum}</td>
                      <td className="px-3 py-2.5">
                        <span className="font-semibold text-slate-800">{row.name || <em className="text-slate-400">-</em>}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        {row.cleanPhone ? (
                          <div>
                            <span className="font-mono text-emerald-700 text-xs font-bold">{row.cleanPhone}</span>
                            {row.rawPhone !== row.cleanPhone && (
                              <p className="text-[10px] text-slate-400 truncate max-w-[160px]">Asli: {row.rawPhone}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-red-500 text-xs font-bold">⚠ {row.rawPhone || "(kosong)"}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600">{formatDateId(row.startDate)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          row.status.toLowerCase().includes("aktif")
                            ? "bg-emerald-100 text-emerald-700"
                            : row.status.toLowerCase().includes("alumni")
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {row.status || "Aktif"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {row.valid ? (
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Siap
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            {row.issues.map((iss, j) => (
                              <p key={j} className="text-[10px] text-red-600 font-semibold flex items-center gap-1">
                                <X className="w-3 h-3 shrink-0" /> {iss}
                              </p>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button onClick={reset} disabled={isPending} className="px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition">
              Batal
            </button>
            <button
              onClick={handleImport}
              disabled={isPending || validCount === 0}
              className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-sm disabled:opacity-60"
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Mengimport...</>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Eksekusi Import ({validCount} murid
                  {selectedProgram ? ` → ${selectedProgram.name}` : ""})
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Hasil Import ── */}
      {step === "done" && result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total Baris",     value: result.total,    color: "bg-slate-50 border-slate-200 text-slate-800" },
              { label: "Berhasil Import", value: result.imported, color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
              { label: "Di-enroll",       value: result.enrolled, color: "bg-indigo-50 border-indigo-200 text-indigo-800" },
              { label: "Dilewati",        value: result.skipped,  color: "bg-amber-50 border-amber-200 text-amber-800" },
              { label: "Error",           value: Math.max(0, result.errors.length - result.skipped), color: "bg-red-50 border-red-200 text-red-800" },
            ].map((card) => (
              <div key={card.label} className={`border rounded-xl p-4 text-center ${card.color}`}>
                <p className="text-3xl font-black">{card.value}</p>
                <p className="text-xs font-bold mt-0.5 opacity-70">{card.label}</p>
              </div>
            ))}
          </div>

          {result.errors.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-bold text-amber-800">Log ({result.errors.length} pesan)</span>
              </div>
              <ul className="divide-y divide-slate-50 max-h-48 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <li key={i} className="px-4 py-2 text-xs text-slate-600 font-mono">{e}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={reset} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl transition">
              <Upload className="w-4 h-4" /> Import File Baru
            </button>
            <a href="/admin/users" className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition">
              Lihat Daftar Murid →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
