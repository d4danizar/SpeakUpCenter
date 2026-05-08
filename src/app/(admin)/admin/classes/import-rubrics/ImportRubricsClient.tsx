"use client";

import { useState, useRef, useTransition } from "react";
import { UploadCloud, FileSpreadsheet, Loader2, AlertCircle, CheckCircle, ArrowLeft, Download } from "lucide-react";
import * as XLSX from "xlsx";
import Link from "next/link";
import { importRubricsBulk } from "../import-rubrics-actions";

export default function ImportRubricsClient() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<any[]>([]);
  
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [errorList, setErrorList] = useState<string[]>([]);
  
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setFile(file);
    setStatus("idle");
    setErrorList([]);
    setMessage("");

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON array
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        setRawRows(json);
      } catch (err) {
        setStatus("error");
        setMessage("Gagal membaca file. Pastikan format Excel (.xlsx / .csv) valid.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = () => {
    if (rawRows.length === 0) {
      setStatus("error");
      setMessage("Data kosong atau belum ada file yang dipilih.");
      return;
    }

    startTransition(async () => {
      setStatus("idle");
      
      // Sanitasi data: Buang non-plain objects (Date, prototypes)
      const sanitizedRows = JSON.parse(JSON.stringify(rawRows));

      const res = await importRubricsBulk(sanitizedRows);
      
      if (res.success) {
        setStatus("success");
        setMessage(res.message);
        setErrorList(res.errors || []);
      } else {
        setStatus("error");
        setMessage(res.message);
        setErrorList(res.errors || []);
      }
    });
  };

  const downloadTemplate = () => {
    // Buat data template dengan baris contoh
    const templateData = [
      // Baris 1: Aspek pertama — isi Nama Modul & Deskripsi di sini
      {
        "Program":             "Kiddos Speak (6-12 Tahun)",
        "Modul":              "1",
        "Pertemuan":          "1",
        "Nama Modul":         "Modul 1: Menjadi Pembicara Percaya Diri",
        "Deskripsi Modul":    "Murid belajar dasar-dasar keberanian tampil di depan umum.",
        "Deskripsi Pertemuan": "Perkenalan & latihan tampil perdana di depan kelas.",
        "Aspek":              "Keberanian Tampil",
        "Desc A": "Sangat berani",   "Saran A": "Pertahankan",
        "Desc B": "Berani",          "Saran B": "Tingkatkan volume",
        "Desc C": "Cukup berani",   "Saran C": "Latih gerakan tangan",
        "Desc D": "Kurang berani",  "Saran D": "Perlu dorongan",
        "Desc E": "Tidak berani",   "Saran E": "Banyak latihan",
      },
      // Baris 2: Aspek kedua untuk pertemuan yang sama — kolom metadata kosong
      {
        "Program":             "Kiddos Speak (6-12 Tahun)",
        "Modul":              "1",
        "Pertemuan":          "1",
        "Nama Modul":         "",
        "Deskripsi Modul":    "",
        "Deskripsi Pertemuan": "",
        "Aspek":              "Pemahaman Tema",
        "Desc A": "Paham sangat baik", "Saran A": "Bagus",
        "Desc B": "", "Saran B": "",
        "Desc C": "", "Saran C": "",
        "Desc D": "", "Saran D": "",
        "Desc E": "", "Saran E": "",
      },
      // Baris 3: Pertemuan tanpa aspek (cth: Pertemuan 4 / Performance) — Aspek KOSONG
      {
        "Program":             "Kiddos Speak (6-12 Tahun)",
        "Modul":              "1",
        "Pertemuan":          "4",
        "Nama Modul":         "",
        "Deskripsi Modul":    "",
        "Deskripsi Pertemuan": "Perform di depan orang tua dan penonton.",
        "Aspek":              "",
        "Desc A": "", "Saran A": "",
        "Desc B": "", "Saran B": "",
        "Desc C": "", "Saran C": "",
        "Desc D": "", "Saran D": "",
        "Desc E": "", "Saran E": "",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Rubrik");
    XLSX.writeFile(wb, "Template_Import_Rubrik.xlsx");
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/classes" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bulk Import Rubrik</h1>
          <p className="text-sm text-slate-500">Unggah file Excel untuk mengisi deskripsi predikat (A-E) secara masal.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Upload */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all duration-200
              ${isDragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300"}
              ${file ? "border-emerald-500 bg-emerald-50" : ""}
            `}
          >
            {file ? (
              <>
                <FileSpreadsheet className="w-12 h-12 text-emerald-500 mb-3" />
                <h3 className="text-lg font-bold text-slate-800">{file.name}</h3>
                <p className="text-sm text-emerald-600 font-medium mt-1">
                  {rawRows.length} baris data ditemukan
                </p>
                <button 
                  onClick={() => { setFile(null); setRawRows([]); setStatus("idle"); }}
                  className="mt-4 text-xs font-bold text-slate-500 hover:text-red-600 underline"
                >
                  Ganti File
                </button>
              </>
            ) : (
              <>
                <UploadCloud className={`w-12 h-12 mb-3 ${isDragging ? "text-indigo-500" : "text-slate-400"}`} />
                <h3 className="text-lg font-bold text-slate-800">Tarik & Lepas File Excel</h3>
                <p className="text-sm text-slate-500 mt-1 mb-4">Mendukung format .xlsx atau .csv</p>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls, .csv" 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl text-sm shadow-sm hover:bg-slate-50 transition-colors"
                >
                  Pilih File Manual
                </button>
              </>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleImport}
              disabled={!file || isPending || rawRows.length === 0}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              {isPending ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</>
              ) : (
                <><UploadCloud className="w-5 h-5" /> Import Sekarang</>
              )}
            </button>
          </div>

          {/* Feedback Status */}
          {status === "success" && (
            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <CheckCircle className="w-5 h-5" />
                {message}
              </div>
              {errorList.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-bold text-amber-700 mb-1">Catatan Gagal ({errorList.length}):</p>
                  <ul className="text-xs text-amber-700 space-y-1 list-disc pl-4 bg-amber-50 p-3 rounded-lg border border-amber-100 max-h-40 overflow-y-auto">
                    {errorList.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {status === "error" && (
            <div className="bg-red-50 border border-red-200 p-5 rounded-xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-red-700 font-bold">
                <AlertCircle className="w-5 h-5" />
                {message}
              </div>
            </div>
          )}

        </div>

        {/* Kolom Info Template */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 h-fit shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Aturan Format Excel
          </h3>
          
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Pastikan file Excel Anda menggunakan header persis seperti di bawah ini (Case Insensitive).
          </p>

          <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto text-xs text-emerald-400 font-mono mb-4 border border-slate-800">
            <div className="whitespace-nowrap pb-2 border-b border-slate-700 mb-2 font-bold text-white">
              Program | Modul | Pertemuan | Nama Modul | Deskripsi Modul | Deskripsi Pertemuan | Aspek | Desc A | Saran A | ... | Desc E | Saran E
            </div>
            <div className="whitespace-nowrap text-slate-400 space-y-0.5">
              <div>Kiddos | 1 | 1 | Modul 1: Judul | Deskripsi modul | Deskripsi pertemuan | Keberanian | ...</div>
              <div>Kiddos | 1 | 1 | <span className="opacity-50">(kosong)</span> | <span className="opacity-50">(kosong)</span> | <span className="opacity-50">(kosong)</span> | Pemahaman | ...</div>
              <div className="text-amber-400">Kiddos | 1 | 4 | <span className="opacity-50">(kosong)</span> | <span className="opacity-50">(kosong)</span> | Perform di depan orang tua | <span className="text-slate-500">(Aspek kosong = tidak apa-apa)</span></div>
            </div>
          </div>

          <ul className="text-xs text-slate-600 space-y-2 mb-4 list-disc pl-4">
            <li><strong className="text-slate-800">Program:</strong> Wajib. Sesuai nama program di sistem.</li>
            <li><strong className="text-slate-800">Modul / Pertemuan:</strong> Wajib diisi (angka atau "Modul 1" / "Pertemuan 4").</li>
            <li><strong className="text-slate-800">Nama Modul:</strong> Opsional. Judul modul (cth: <em>Modul 1: Menjadi Pembicara</em>). Cukup isi di baris pertama modul.</li>
            <li><strong className="text-slate-800">Deskripsi Modul:</strong> Opsional. Penjelasan singkat konten modul.</li>
            <li><strong className="text-slate-800">Deskripsi Pertemuan:</strong> Opsional. Akan disimpan sebagai materi pertemuan.</li>
            <li><strong className="text-slate-800">Aspek:</strong> Nama aspek penilaian. <em>Boleh kosong</em> — pertemuan tetap dibuat.</li>
            <li><strong className="text-slate-800">Desc & Saran (A-E):</strong> Deskripsi kriteria & saran perbaikan per predikat.</li>
          </ul>
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
            <strong>⚠️ Tip penting:</strong> Untuk Pertemuan tanpa rubrik (cth: Pertemuan 4 / Performance), cukup buat 1 baris dengan kolom <code>Aspek</code> dikosongkan. Pertemuan tetap akan dibuat di database.
          </div>

          <button 
            onClick={downloadTemplate}
            className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-xl transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Download Template
          </button>
        </div>

      </div>
    </div>
  );
}
