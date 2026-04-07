"use client";

import { useState, useTransition } from "react";
import imageCompression from "browser-image-compression";
import { supabaseBrowser } from "../../../../lib/supabase-browser";
import { submitPelunasanProof } from "../../../../lib/actions/invoice-actions";

export function PelunasanForm({ invoiceId }: { invoiceId: string }) {
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "compressing" | "uploading" | "done" | "error"
  >("idle");
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUpload = async (file: File): Promise<string> => {
    setUploadStatus("compressing");
    const compressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    });

    setUploadStatus("uploading");
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `proofs/${invoiceId}-pelunasan-${Date.now()}.${ext}`;

    const { error } = await supabaseBrowser.storage
      .from("payment-proofs")
      .upload(path, compressed, { contentType: compressed.type, upsert: true });

    if (error) throw new Error("Upload gagal: " + error.message);

    const { data } = supabaseBrowser.storage
      .from("payment-proofs")
      .getPublicUrl(path);

    setUploadStatus("done");
    return data.publicUrl;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const fileInput = document.getElementById("pelunasanProof") as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) {
      setServerError("Bukti transfer wajib diunggah.");
      return;
    }

    let proofUrl: string;
    try {
      proofUrl = await handleUpload(file);
    } catch (err: any) {
      setUploadStatus("error");
      setServerError(err.message ?? "Gagal mengupload bukti transfer.");
      return;
    }

    startTransition(async () => {
      const res = await submitPelunasanProof(invoiceId, proofUrl);
      if (res?.success) {
        setSubmitted(true);
      } else {
        setServerError(res?.error ?? "Gagal mengirim data.");
      }
    });
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-10 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-emerald-700 mb-2">
          Bukti Pelunasan Terkirim!
        </h2>
        <p className="text-slate-600 leading-relaxed">
          Terima kasih! Bukti pelunasan Anda sedang kami verifikasi. Status
          tagihan Anda akan diperbarui setelah dikonfirmasi oleh tim kami.
        </p>
      </div>
    );
  }

  const isBusy =
    isPending || uploadStatus === "compressing" || uploadStatus === "uploading";

  const submitLabel =
    uploadStatus === "compressing"
      ? "Mengkompres gambar..."
      : uploadStatus === "uploading"
      ? "Mengupload bukti..."
      : isPending
      ? "Memproses data..."
      : "✅ Kirim Bukti Pelunasan";

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-6"
    >
      <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
        Upload Bukti Transfer
      </h2>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">
          Foto Bukti Transfer <span className="text-red-500">*</span>
        </label>
        <input
          id="pelunasanProof"
          type="file"
          accept="image/*"
          required
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-100 file:text-indigo-700 file:font-semibold file:text-xs hover:file:bg-indigo-200 transition-colors"
        />
        <p className="text-xs text-slate-400">
          Gambar akan dikompres otomatis (maks. 1 MB). Format: JPG, PNG, HEIC.
        </p>
        {uploadStatus === "error" && (
          <p className="text-xs text-red-500">
            Gagal mengupload gambar. Periksa koneksi dan coba lagi.
          </p>
        )}
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex gap-2 items-start">
          <span className="shrink-0">⚠️</span>
          <span>{serverError}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isBusy}
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
      >
        {isBusy ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            {submitLabel}
          </span>
        ) : (
          submitLabel
        )}
      </button>

      <p className="text-xs text-center text-slate-400">
        Pastikan transfer sesuai dengan nominal sisa tagihan.
      </p>
    </form>
  );
}
