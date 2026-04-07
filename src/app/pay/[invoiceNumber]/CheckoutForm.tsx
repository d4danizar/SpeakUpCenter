"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import imageCompression from "browser-image-compression";
import { supabaseBrowser } from "../../../lib/supabase-browser";
import { submitPaymentProof } from "../../../lib/actions/invoice-actions";

// ── Zod Schema ────────────────────────────────────────────────────────────────

const formSchema = z
  .object({
    fullName: z.string().min(3, "Nama lengkap minimal 3 karakter."),
    gender: z.enum(["Laki-laki", "Perempuan"], {
      message: "Silakan pilih jenis kelamin."
    }),
    birthPlace: z.string().min(2, "Tempat lahir wajib diisi."),
    birthDate: z.string().min(1, "Tanggal lahir wajib diisi."),
    startDate: z.string().min(1, "Rencana tanggal mulai wajib diisi."),
    phone: z
      .string()
      .min(9, "Nomor WA minimal 9 digit.")
      .regex(/^[0-9+\-\s]+$/, "Nomor WA hanya boleh berisi angka."),
    email: z.string().email("Masukkan alamat email yang valid."),
    occupation: z.enum(
      ["Sekolah", "Kuliah", "Bekerja", "Mencari Pekerjaan", "Lainnya"],
      { message: "Silakan pilih status kesibukan." }
    ),
    scheduleId: z.string().min(1, "Silakan pilih Jadwal/Batch."),
    discoverySource: z.enum(
      ["Instagram", "TikTok", "Google Maps", "Website", "Teman/Keluarga"],
      { message: "Silakan pilih dari mana Anda mengetahui kami." }
    ),
  });

type FormValues = z.infer<typeof formSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────
const inputCls =
  "w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 transition-colors";
const labelCls = "text-xs font-bold text-slate-600 uppercase tracking-widest";
const errorCls = "text-xs text-red-500 mt-1";

function FieldWrap({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelCls}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className={errorCls}>{error}</p>}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function CheckoutForm({
  invoiceId,
  program,
  leadName,
  leadWa,
}: {
  invoiceId: string;
  program: any;
  leadName: string;
  leadWa: string;
}) {
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "compressing" | "uploading" | "done" | "error"
  >("idle");
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: leadName,
      phone: leadWa,
      scheduleId: "",
    },
  });



  // ── Upload ────────────────────────────────────────────────────────────────
  const uploadProof = async (file: File): Promise<string> => {
    setUploadStatus("compressing");
    const compressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    });

    setUploadStatus("uploading");
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `proofs/${invoiceId}-${Date.now()}.${ext}`;

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

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (values: FormValues) => {
    setServerError(null);

    const fileInput = document.getElementById("paymentProof") as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) {
      setServerError("Bukti transfer wajib diunggah.");
      return;
    }

    let proofUrl: string;
    try {
      proofUrl = await uploadProof(file);
    } catch (err: any) {
      setUploadStatus("error");
      setServerError(err.message ?? "Gagal mengupload bukti transfer.");
      return;
    }

    const studentData: Record<string, string | undefined> = {
      name: values.fullName,
      email: values.email,
      whatsapp: values.phone,
      school: values.occupation,
      program: program.name,
      scheduleId: values.scheduleId,
      // Admin Sync Fields
      activeProgram: program.name,
      startDate: values.startDate,
      // Default Info
      gender: values.gender,
      birthPlace: values.birthPlace,
      birthDate: values.birthDate,
      occupation: values.occupation,
      discoverySource: values.discoverySource,
    };

    const res = await submitPaymentProof(invoiceId, studentData as any, proofUrl);
    if (res?.success) {
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setServerError(res?.error ?? "Gagal mengirim data. Silakan coba lagi.");
    }
  };

  // ── Success ───────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-10 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-emerald-700 mb-2">Pendaftaran Terkirim!</h2>
        <p className="text-slate-600 leading-relaxed">
          Terima kasih! Pembayaran Anda sedang kami verifikasi. Info akun login akan dikirimkan ke{" "}
          <strong>WhatsApp</strong> Anda setelah dikonfirmasi oleh tim kami.
        </p>
        <p className="mt-4 text-xs text-slate-400">
          Proses konfirmasi biasanya selesai dalam 1×24 jam kerja.
        </p>
      </div>
    );
  }

  const isBusy =
    isSubmitting || uploadStatus === "compressing" || uploadStatus === "uploading";

  const submitLabel =
    uploadStatus === "compressing"
      ? "Mengkompres gambar..."
      : uploadStatus === "uploading"
        ? "Mengupload bukti transfer..."
        : isSubmitting
          ? "Mengirim data..."
          : "✅ Kirim Formulir Pendaftaran";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-8"
    >
      {/* ── 1. Data Diri ────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
          1. Data Diri
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldWrap label="Nama Lengkap" required error={errors.fullName?.message}>
            <input type="text" {...register("fullName")} placeholder="Sesuai KTP / ijazah" className={inputCls} />
          </FieldWrap>

          <FieldWrap label="Jenis Kelamin" required error={errors.gender?.message}>
            <select {...register("gender")} className={inputCls}>
              <option value="">-- Pilih --</option>
              <option>Laki-laki</option>
              <option>Perempuan</option>
            </select>
          </FieldWrap>

          <FieldWrap label="Tempat Lahir" required error={errors.birthPlace?.message}>
            <input type="text" {...register("birthPlace")} placeholder="Contoh: Surabaya" className={inputCls} />
          </FieldWrap>

          <FieldWrap label="Tanggal Lahir" required error={errors.birthDate?.message}>
            <input type="date" {...register("birthDate")} className={inputCls} />
          </FieldWrap>

          <FieldWrap
            label="Nomor WhatsApp"
            required
            error={errors.phone?.message}
            hint="Nomor ini akan menjadi password awal login Anda."
          >
            <input type="text" {...register("phone")} placeholder="08xxxxxxxxxx" className={inputCls} />
          </FieldWrap>

          <FieldWrap
            label="Email Aktif"
            required
            error={errors.email?.message}
            hint="Email ini akan menjadi username login portal Anda."
          >
            <input type="email" {...register("email")} placeholder="nama@gmail.com" className={inputCls} />
          </FieldWrap>

          <FieldWrap label="Status Kesibukan" required error={errors.occupation?.message}>
            <select {...register("occupation")} className={inputCls}>
              <option value="">-- Pilih --</option>
              {["Sekolah", "Kuliah", "Bekerja", "Mencari Pekerjaan", "Lainnya"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </FieldWrap>

          <FieldWrap
            label="Dari mana Anda mengetahui kami?"
            required
            error={errors.discoverySource?.message}
          >
            <select {...register("discoverySource")} className={inputCls}>
              <option value="">-- Pilih --</option>
              {["Instagram", "TikTok", "Google Maps", "Website", "Teman/Keluarga"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </FieldWrap>
        </div>
      </section>

      {/* ── 2. Pilihan Program ──────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
          2. Pilihan Program
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldWrap label="Program" required>
            <input 
              type="text" 
              value={program.name} 
              disabled 
              className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed font-semibold" 
            />
          </FieldWrap>

          <FieldWrap label="Pilih Jadwal / Batch" required error={errors.scheduleId?.message}>
            {program.format === "PRIVATE" || program.schedules?.length === 0 ? (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-sm text-indigo-700 font-medium">
                Jadwal akan dikonfirmasi secara personal oleh Tutor.
                <input type="hidden" {...register("scheduleId")} value="PRIVATE_MANUAL" />
              </div>
            ) : (
              <select {...register("scheduleId")} className={inputCls}>
                <option value="">-- Tersedia {program.schedules?.length} Jadwal --</option>
                {program.schedules?.map((sch: any) => (
                  <option key={sch.id} value={sch.id}>
                    {sch.title} ({sch.dayOfWeek}, {sch.startTime} - {sch.endTime})
                  </option>
                ))}
              </select>
            )}
          </FieldWrap>

          <FieldWrap label="Rencana Tanggal Mulai" required error={errors.startDate?.message} hint="Pilih tanggal Anda akan memulai program.">
            <input type="date" {...register("startDate")} className={inputCls} />
          </FieldWrap>
        </div>
      </section>

      {/* ── 3. Bukti Transfer ──────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
          3. Bukti Transfer
        </h2>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>
            Upload Foto Bukti Transfer <span className="text-red-500">*</span>
          </label>
          <input
            id="paymentProof"
            type="file"
            accept="image/*"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-100 file:text-indigo-700 file:font-semibold file:text-xs hover:file:bg-indigo-200 transition-colors"
          />
          <p className="text-xs text-slate-400">
            Gambar dikompres otomatis (maks. 1 MB). Format: JPG, PNG, HEIC.
          </p>
          {uploadStatus === "error" && (
            <p className="text-xs text-red-500">Gagal mengupload. Periksa koneksi dan coba lagi.</p>
          )}
        </div>
      </section>

      {/* Error */}
      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex gap-2 items-start">
          <span className="shrink-0">⚠️</span>
          <span>{serverError}</span>
        </div>
      )}

      {/* Submit */}
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
        ) : submitLabel}
      </button>

      <p className="text-xs text-center text-slate-400">
        Dengan mengirimkan form ini, Anda menyetujui syarat dan ketentuan program SpeakUp Center.
      </p>
    </form>
  );
}
