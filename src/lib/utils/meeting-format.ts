/**
 * Format nama tampilan pertemuan berdasarkan kategori program.
 *
 * - ADULT (ADULT_REGULAR, PRIVATE_ACADEMIC, PRIVATE_EXECUTIVE):
 *   Tampilkan nama materi langsung, karena sistem rotasi tidak memiliki
 *   "Pertemuan ke-X" yang bermakna. Contoh: "Public Speaking Fundamentals"
 *
 * - KIDDOS:
 *   Gunakan format "Pertemuan X" standar. Contoh: "Pertemuan 1"
 *
 * - Performance / isPerformance:
 *   Selalu "Performance" untuk semua kategori.
 */

export function isAdultProgram(category: string | null | undefined): boolean {
  return (
    category === "ADULT_REGULAR" ||
    category === "PRIVATE_ACADEMIC" ||
    category === "PRIVATE_EXECUTIVE"
  );
}

/**
 * Format label pertemuan untuk tampilan UI (judul kartu, header, dll).
 *
 * @param category     - ProgramCategory (e.g. "KIDDOS", "ADULT_REGULAR")
 * @param meetingNumber - Nomor urut pertemuan (1, 2, 3, ...)
 * @param material     - Nama materi / deskripsi (dari database)
 * @param isPerformance - Apakah ini sesi Performance
 */
export function formatMeetingLabel(
  category: string | null | undefined,
  meetingNumber: number,
  material: string,
  isPerformance?: boolean
): string {
  if (isPerformance) return "Performance";
  if (isAdultProgram(category)) {
    // Adult: tampilkan nama materi langsung, fallback ke "Materi X"
    return material?.trim() || `Materi ${meetingNumber}`;
  }
  // Kiddos: gunakan format pertemuan standar
  return `Pertemuan ${meetingNumber}`;
}

/**
 * Format label pendek untuk dropdown/option (lebih ringkas).
 * Adult: "<material>" saja
 * Kiddos: "Pertemuan X — <material>"
 */
export function formatMeetingOption(
  category: string | null | undefined,
  meetingNumber: number,
  material: string,
  isPerformance?: boolean
): string {
  if (isPerformance) return "★ Performance";
  if (isAdultProgram(category)) {
    return material?.trim() || `Materi ${meetingNumber}`;
  }
  return `Pertemuan ${meetingNumber} — ${material}`;
}

/**
 * Format label pertemuan + modul untuk breadcrumb / subtitle.
 * Adult: "<moduleTitle> — <material>"
 * Kiddos: "<moduleTitle> — Pertemuan X"
 */
export function formatMeetingWithModule(
  category: string | null | undefined,
  moduleTitle: string,
  meetingNumber: number,
  material: string,
  isPerformance?: boolean
): string {
  const meetLabel = formatMeetingLabel(category, meetingNumber, material, isPerformance);
  return `${moduleTitle} — ${meetLabel}`;
}
