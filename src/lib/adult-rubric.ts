// ── Adult Speak Rubric Constants ─────────────────────────────────────────────
// 8 Aspek baku yang dinilai di setiap pertemuan program Adult Speak.
// Masing-masing aspek dinilai A–E secara independen.

export const ADULT_ASPECTS = [
  "Confidence",
  "Eye Contact",
  "Gesture",
  "Artikulasi",
  "Intonasi",
  "Logos",
  "Pathos",
  "Ethos",
] as const;

export type AdultAspect = (typeof ADULT_ASPECTS)[number];

// Deskripsi singkat masing-masing aspek untuk tooltip/label UI
export const ADULT_ASPECT_DESCRIPTIONS: Record<AdultAspect, string> = {
  Confidence: "Kepercayaan diri dan keberanian tampil di depan audiens",
  "Eye Contact": "Kontak mata yang tepat dan merata ke seluruh audiens",
  Gesture: "Gestur tangan dan bahasa tubuh yang mendukung pesan",
  Artikulasi: "Kejelasan pengucapan kata dan diksi",
  Intonasi: "Variasi nada, penekanan, dan ritme bicara",
  Logos: "Logika argumen, struktur, dan data yang disampaikan",
  Pathos: "Kemampuan membangun emosi dan koneksi dengan audiens",
  Ethos: "Kredibilitas, otoritas, dan kepercayaan yang dibangun",
};

// Predikat yang tersedia (sama untuk semua program)
export const PREDICATES = [
  { value: "A", label: "A — Sangat Baik", short: "A" },
  { value: "B", label: "B — Baik", short: "B" },
  { value: "C", label: "C — Cukup", short: "C" },
  { value: "D", label: "D — Perlu Bimbingan", short: "D" },
  { value: "E", label: "E — Belum Tampil / NA", short: "E" },
] as const;

export type PredicateValue = "A" | "B" | "C" | "D" | "E";
