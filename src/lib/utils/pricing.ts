/**
 * Pricing Engine module for Kampung Inggris.
 *
 * calculates base price for a given program and duration,
 * and adds the mandatory registration fee (Rp100.000).
 */

const REGISTRATION_FEE = 100000;

export function calculateInvoiceAmount(
  program: string,
  duration?: string
): number {
  let basePrice = 0;

  switch (program) {
    case "Regular":
    case "English on Saturday":
      basePrice = 600000;
      break;
    case "Kelas Private":
      basePrice = 1500000;
      break;
    case "TOEFL Prep":
      basePrice = 750000;
      break;
    case "EFK":
    case "EFT":
      basePrice = 1700000;
      break;
    case "Fullday":
      if (duration === "1 Minggu") basePrice = 650000;
      else if (duration === "2 Minggu") basePrice = 1300000;
      else if (duration === "3 Minggu") basePrice = 1950000;
      else if (duration === "1 Bulan") basePrice = 1900000;
      else if (duration === "2 Bulan") basePrice = 3500000;
      break;
    case "Asrama":
      if (duration === "1 Bulan") basePrice = 2200000;
      else if (duration === "2 Bulan") basePrice = 3700000;
      else basePrice = 0; // Temporary fallback for 1-3 weeks Asrama
      break;
    default:
      basePrice = 0;
  }

  // Base price + rp 100k
  return basePrice + REGISTRATION_FEE;
}
