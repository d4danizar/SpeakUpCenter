"use server"

import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { getBranchFilter } from "@/lib/actions/branch-actions";

export async function getExportStudentsData() {
  try {
    const session = await getServerSession(authOptions);
    const ALLOWED = ["SUPER_ADMIN", "CS", "MARKETING", "MANAGER"];
    if (!session?.user || !ALLOWED.includes(session.user.role as string)) {
      return { error: "Akses ditolak." };
    }

    const branchFilter = await getBranchFilter();

    // Ambil invoice dengan status PAID atau DP_PAID
    const invoices = await prisma.invoice.findMany({
      where: {
        status: { in: ["PAID", "DP_PAID"] },
        ...branchFilter,
      },
      include: {
        program: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
    });

    const exportData = invoices.map((inv) => {
      // Data diri siswa ada dalam JSON studentData yang didapat saat signup form
      // Tapi karena mungkin ini bisa diakses juga untuk DP_PAID yang belum mengisi form secara lengkap
      // kita harus hati-hati dalam parsing
      const sd = (inv as any).studentData || {};
      
      const tl = [sd.birthPlace, sd.birthDate].filter(Boolean).join(", ");
      
      return {
        "Nomor Invoice": inv.invoiceNumber,
        "Status Pembayaran": inv.status,
        "Nama Lengkap": sd.fullName || sd.name || "-",
        "Email": sd.email || "-",
        "No. WA": sd.phone || sd.whatsapp || "-",
        "Jenis Kelamin": sd.gender || "-",
        "TTL": tl || "-",
        "Aktivitas": sd.occupation || "-",
        "Tahu dari Mana": sd.discoverySource || "-",
        "Program": sd.program || inv.program?.name || "-",
        "Detail Kelas (Jadwal)": sd.programDetail || "-",
        "Jenis Pembayaran": sd.paymentType || "-",
        "Total Harga": (inv as any).totalAmount || 0,
        "Nominal Dibayar": (inv as any).paidAmount || 0,
        "Tanggal": inv.createdAt.toISOString().split("T")[0],
      };
    });

    return { success: true, data: exportData };
  } catch (error) {
    console.error("[getExportStudentsData]", error);
    return { error: "Terjadi kesalahan saat memproses data export." };
  }
}
