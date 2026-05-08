/**
 * Utility parser tanggal untuk format Indonesia dari Excel.
 * Menangani:
 *   - "Juli 2025"           → Date(2025, 6, 1)
 *   - "1 Februari 2025"     → Date(2025, 1, 1)
 *   - "15 Maret 2024"       → Date(2024, 2, 15)
 *   - Excel serial number   → Date standar via XLSX epoch
 *   - ISO string (fallback) → new Date(str)
 */

const BULAN_ID: Record<string, number> = {
  januari: 0, februari: 1, maret: 2, april: 3,
  mei: 4, juni: 5, juli: 6, agustus: 7,
  september: 8, oktober: 9, november: 10, desember: 11,
  // Abbrev
  jan: 0, feb: 1, mar: 2, apr: 3,
  jun: 5, jul: 6, agu: 7, agt: 7,
  sep: 8, okt: 9, nov: 10, des: 11,
};

/**
 * Konversi serial number Excel ke Date.
 * Excel epoch: 1 Jan 1900 = serial 1 (tapi ada bug tahun 1900 di Excel)
 */
function excelSerialToDate(serial: number): Date {
  // Excel bug: menganggap 1900 sebagai leap year, jadi offset +1 jika serial >= 60
  const MS_PER_DAY = 86400000;
  const EXCEL_EPOCH = new Date(Date.UTC(1899, 11, 30)).getTime();
  return new Date(EXCEL_EPOCH + serial * MS_PER_DAY);
}

/**
 * Parse tanggal dari berbagai format input Excel/Indonesia.
 * Return `null` jika tidak bisa di-parse.
 */
export function parseIndonesianDate(raw: string | number | null | undefined): Date | null {
  if (raw === null || raw === undefined || raw === "") return null;

  // ── Angka (Excel serial number) ──────────────────────────────────────────────
  if (typeof raw === "number") {
    if (raw > 0 && raw < 100000) return excelSerialToDate(raw);
    return null;
  }

  const str = String(raw).trim();
  if (!str) return null;

  // ── ISO / format standar (fallback terakhir) ─────────────────────────────────
  // Coba dulu apakah string bisa di-parse langsung
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
  }

  // ── Format Indonesia: "Juli 2025" atau "1 Februari 2025" ────────────────────
  // Normalisasi: lowercase, hapus karakter aneh
  const normalized = str.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
  const parts = normalized.split(/\s+/).filter(Boolean);

  // Cari token yang merupakan nama bulan
  let monthIdx = -1;
  let monthPos = -1;
  for (let i = 0; i < parts.length; i++) {
    const m = BULAN_ID[parts[i]];
    if (m !== undefined) {
      monthIdx = m;
      monthPos = i;
      break;
    }
  }

  if (monthIdx === -1) {
    // Last resort: native Date
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  // Cari tahun (4 digit) di parts
  const yearPart = parts.find((p) => /^\d{4}$/.test(p));
  const year = yearPart ? parseInt(yearPart, 10) : new Date().getFullYear();

  // Cari hari (1-2 digit angka, bukan tahun)
  const dayPart = parts.find((p) => /^\d{1,2}$/.test(p));
  const day = dayPart ? parseInt(dayPart, 10) : 1; // Default hari 1

  const result = new Date(year, monthIdx, day);
  return isNaN(result.getTime()) ? null : result;
}

/**
 * Format Date ke string Indonesia untuk tampilan pratinjau.
 */
export function formatDateId(date: Date | null): string {
  if (!date) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
