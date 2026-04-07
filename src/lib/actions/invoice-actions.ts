"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { calculateInvoiceAmount } from "../utils/pricing";
import { nextMonday, addWeeks, addMonths } from "date-fns";
import { getBranchFilter } from "@/lib/actions/branch-actions";

const STAFF_ALLOWED = ["SUPER_ADMIN", "CS"];

// ── 1. Create Invoice (CS / SUPER_ADMIN) ─────────────────────────────────────
export async function createInvoice(
  leadId: string,
  programId: string,
  paymentType: "DP" | "FULL" = "DP",
  dpAmount: number = 0
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { error: "Sesi tidak valid." };
    if (!STAFF_ALLOWED.includes(session.user.role as string)) {
      return { error: "Tidak memiliki hak akses." };
    }

    const program = await prisma.programClass.findUnique({ where: { id: programId } });
    if (!program) return { error: "Program tidak ditemukan." };

    // Auto-generate invoice number: INV-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const rnd = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dateStr}-${rnd}`;

    const totalAmount = program.basePrice;
    const paidAmount = paymentType === "FULL" ? totalAmount : dpAmount;
    const newAmountDue = totalAmount - paidAmount;

    const branchFilter = await getBranchFilter();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        leadId,
        programId: program.id,
        amountDue: newAmountDue,
        totalAmount,
        paidAmount,
        status: "PENDING",
        paymentMethod: paymentType,
        branch: branchFilter.branch,
      },
    });

    revalidatePath("/admin/crm");
    return { success: true, invoiceNumber: invoice.invoiceNumber };
  } catch (err) {
    console.error("[createInvoice]", err);
    return { error: "Terjadi kesalahan saat membuat invoice. Silakan coba lagi." };
  }
}

// ── 2. Submit Payment Proof (public — by prospective student) ─────────────────
export async function submitPaymentProof(
  invoiceId: string,
  studentData: {
    name: string;
    email: string;
    whatsapp: string;
    school: string;
    program: string;
  },
  proofString: string
) {
  try {
    if (!invoiceId || !studentData.email || !studentData.whatsapp || !proofString) {
      return { error: "Data tidak lengkap. Pastikan semua field wajib diisi." };
    }

    // Update invoice: save student data + proof, change status
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "WAITING_CONFIRMATION",
        studentData: studentData as any,
        paymentProof: proofString,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error("=== SUBMIT ERROR ===", err);
    return { error: err.message || "Gagal menyimpan data. Silakan coba lagi." };
  }
}

// ── 3. Approve Payment (CS/SUPER_ADMIN) ──────────────────────────────────────
//    Transaction: Invoice → PAID + create Student User + Lead → CLOSED_WON
// ── 3. Approve Payment (CS/SUPER_ADMIN) ──────────────────────────────────────
//    Transaction: Invoice → PAID/DP_PAID + create Student User + Lead → CLOSED_WON
export async function approvePayment(invoiceId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { error: "Sesi tidak valid." };
    if (!STAFF_ALLOWED.includes(session.user.role as string)) {
      return { error: "Tidak memiliki hak akses." };
    }

    const invoice = await prisma.invoice.findUnique({ 
      where: { id: invoiceId },
      include: { lead: true, program: true } 
    });
    if (!invoice) return { error: "Invoice tidak ditemukan." };

    if (invoice.status !== "WAITING_CONFIRMATION") {
      return { error: `Invoice berstatus "${invoice.status}" — hanya WAITING_CONFIRMATION yang bisa diverifikasi.` };
    }

    const data = invoice.studentData as any;

    if (!data?.whatsapp) {
      return { error: "Data siswa (WhatsApp) tidak ditemukan di invoice ini. Pastikan siswa sudah mengisi form." };
    }

    const { name: parsedName = "Siswa Baru", email, whatsapp } = data;
    const studentName = invoice.lead?.name || (invoice as any).user?.name || parsedName || "Siswa";
    const passwordHash = await bcrypt.hash(whatsapp.trim(), 10);
    
    // Terapkan Fallback Dummy Email jika dari form tidak terisi
    const safeEmail = email && String(email).trim() !== "" 
      ? String(email).trim() 
      : `user_${whatsapp.replace(/\D/g, '')}@speakup.dummy`;

    const cashflowCount = await prisma.cashflow.count({ where: { invoiceId: invoice.id } });
    const isPelunasanVerify = cashflowCount > 0 && invoice.paidAmount < invoice.totalAmount;

    let newStatus = invoice.paymentMethod === "DP" ? "DP_PAID" : "PAID";
    let amountToLog = invoice.paidAmount;
    let finalPaidAmount = invoice.paidAmount;
    let paymentLabel = invoice.paymentMethod === "DP" ? "Pembayaran DP" : "Pelunasan";

    if (isPelunasanVerify) {
      newStatus = "PAID";
      amountToLog = invoice.totalAmount - invoice.paidAmount;
      finalPaidAmount = invoice.totalAmount;
      paymentLabel = "Pelunasan";
    }

    // Tentukan kategori cashflow secara dinamis
    let cashflowCategory = invoice.paymentMethod === "DP" ? "DP" : "PELUNASAN";
    if (isPelunasanVerify) {
      cashflowCategory = "PELUNASAN";
    }

    // VALIDASI PRE-TRANSACTION (Mencegah FK Error)
    const checkProgram = await prisma.programClass.findUnique({
      where: { id: invoice.programId }
    });
    if (!checkProgram) {
      return { error: "Program kelas untuk Lead ini sudah tidak valid/dihapus. Silakan update program di data Lead terlebih dahulu." };
    }

    // Atomic transaction: 4 operations
    await prisma.$transaction(async (tx) => {
      console.log("=== TRANSAKSI STEP 1 MULA ===");
      // 1. Mark invoice as PAID / DP_PAID
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: newStatus as any,
          paidAmount: finalPaidAmount,
          paymentMethod: invoice.paymentMethod ?? "MANUAL_TRANSFER",
        },
      });
      console.log("=== TRANSAKSI STEP 1 LULUS ===");

      console.log("=== TRANSAKSI STEP 2 MULA ===");
      // 1b. Insert Cashflow log for this income (tanpa try-catch pembungkus agar rollback otomatis saat gagal)
      await tx.cashflow.create({
          data: {
            type: "INCOME",
            category: cashflowCategory as any,
            amount: amountToLog,
            description: `${paymentLabel} - ${studentName}`,
            invoiceId: invoice.id,
            recordedById: (session.user as any)?.id || null,
            branch: invoice.branch,
          } as any
        });
      console.log("=== TRANSAKSI STEP 2 LULUS ===");

      console.log("=== TRANSAKSI STEP 3 MULA (EKSTRAKSI AKADEMIK) ===");
      // ==========================================================
      // 2. EKSTRAKSI DATA AKADEMIK (DIJALANKAN UNTUK SEMUA APPROVAL)
      // ==========================================================
      const dataPayload = (invoice.studentData as any) || {};

      // A. Ambil string paling mentah dari segala sumber
      const rawProgram = String(dataPayload.activeProgram || dataPayload.program || (invoice as any).program?.name || "").toLowerCase();

      let finalActiveProgram = "Unknown";
      let finalBatch = dataPayload.programBatch || dataPayload.session || null;

      // B. JARING PROGRAM (Keyword Matching Mutlak)
      if (rawProgram.includes("regular")) finalActiveProgram = "Regular";
      else if (rawProgram.includes("fullday")) finalActiveProgram = "Fullday";
      else if (rawProgram.includes("asrama")) finalActiveProgram = "Asrama";
      else if (rawProgram.includes("english on saturday") || rawProgram.includes("eos")) finalActiveProgram = "English on Saturday";
      else if (rawProgram.includes("efk")) finalActiveProgram = "EFK";
      else if (rawProgram.includes("eft")) finalActiveProgram = "EFT";
      else if (rawProgram.includes("toefl")) finalActiveProgram = "TOEFL";
      else if (rawProgram.includes("private")) finalActiveProgram = "Private";

      // C. JARING SESI / JAM (Regex)
      const timeRegex = /(\d{2}:\d{2}\s*[-—–]\s*\d{2}:\d{2})/;
      const match = String(dataPayload.program || (invoice as any).program?.name || "").match(timeRegex);
      if (match) {
        finalBatch = match[0].replace(/\s*[-—–]\s*/, ' - ');
      }
      
      if (!finalBatch) {
        if (finalActiveProgram === "Regular") {
          finalBatch = dataPayload.session || "Unspecified";
        } else {
          // Untuk Non-Regular, gunakan duration sebagai batch agar tidak kosong di data admin
          finalBatch = dataPayload.durationOption || dataPayload.duration || dataPayload.session || "Unspecified";
        }
      }

      // D. Kalkulasi Durasi & End Date
      const durationOption = dataPayload.durationOption || dataPayload.duration || null;
      const batchSchedule = dataPayload.batchSchedule || dataPayload.batch || null;
      const rawStartDate = dataPayload.startDate;
      const calculatedStartDate = rawStartDate ? new Date(rawStartDate) : new Date();

      let finalDurationOption = durationOption || "1_MONTH"; // default fallback

      if (finalActiveProgram === "Regular") {
        finalDurationOption = "1_MONTH";
      } else if (finalActiveProgram === "English on Saturday") {
        finalDurationOption = "2_MONTHS";
      } else if (finalActiveProgram === "EFK" || finalActiveProgram === "EFT") {
        finalDurationOption = "6_MONTHS";
      } else if (finalActiveProgram === "Fullday" || finalActiveProgram === "Asrama") {
        finalDurationOption = durationOption || "1_MONTH"; // Fallback aman
      }

      function calculateActiveEndDate(startDate: Date, durationLabel: string) {
        let totalMeetings = 20; // Default 1 Bulan

        const fLabel = durationLabel.toLowerCase();
        if (fLabel.includes("1 bulan") || fLabel.includes("1 month") || fLabel.includes("1_month")) totalMeetings = 20;
        else if (fLabel.includes("2 bulan") || fLabel.includes("2 month") || fLabel.includes("2_month")) totalMeetings = 40;
        else if (fLabel.includes("6 bulan") || fLabel.includes("6 month") || fLabel.includes("6_month")) totalMeetings = 120;
        else if (fLabel.includes("3 minggu") || fLabel.includes("3 week") || fLabel.includes("3_week")) totalMeetings = 15;
        else if (fLabel.includes("2 minggu") || fLabel.includes("2 week") || fLabel.includes("2_week")) totalMeetings = 10;
        else if (fLabel.includes("1 minggu") || fLabel.includes("1 week") || fLabel.includes("1_week")) totalMeetings = 5;

        let resultDate = new Date(startDate);
        let daysAdded = 0;
        
        // Kurangi 1 karena hari mulai dihitung sebagai pertemuan pertama
        const targetDays = totalMeetings > 0 ? totalMeetings - 1 : 0; 

        while (daysAdded < targetDays) {
          resultDate.setDate(resultDate.getDate() + 1);
          const dayOfWeek = resultDate.getDay();
          // 0 = Minggu, 6 = Sabtu. Hanya hitung jika bukan weekend.
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            daysAdded++;
          }
        }
        return resultDate;
      }

      const calculatedEndDate = calculateActiveEndDate(calculatedStartDate, finalDurationOption);

      // E. Kalkulasi Jatah Izin (Leave Quota)
      let calculatedLeaveQuota = 0;
      
      if (finalDurationOption === "1_WEEK") calculatedLeaveQuota = 1;
      else if (finalDurationOption === "2_WEEKS") calculatedLeaveQuota = 2;
      else if (finalDurationOption === "3_WEEKS") calculatedLeaveQuota = 3;
      else if (finalDurationOption === "1_MONTH") calculatedLeaveQuota = 3; // Regular/Fullday 1 Bulan
      else if (finalDurationOption === "2_MONTHS") calculatedLeaveQuota = 5; // English on Saturday / Fullday 2 Bulan
      else if (finalDurationOption === "6_MONTHS") calculatedLeaveQuota = 12; // EFK / EFT
      else if (finalActiveProgram === "Regular") calculatedLeaveQuota = 3; // Fallback untuk Regular

      // F. Tautan Relasi Program (Schedule & Enrollment)
      let finalScheduleId = dataPayload.scheduleId;
      if (finalScheduleId === "PRIVATE_MANUAL") {
        finalScheduleId = null; // Tidak ditautkan saat ini secara sistem (ditangani tutor private)
      }

      console.log("=== TRANSAKSI STEP 4 MULA (UPSERT USER) ===");
      // 3. UPSERT USER DATABASE
      const savedUser = await tx.user.upsert({
        where: { email: safeEmail },
        update: {
          name: studentName,
          role: "STUDENT",
        },
        create: {
          name: studentName,
          email: safeEmail,
          passwordHash,
          phoneNumber: whatsapp,
          role: "STUDENT",
          branch: "CENTER_POINT", // Field wajib
        } as any,
      });
      console.log("=== TRANSAKSI STEP 4 LULUS ===");

      console.log("=== TRANSAKSI STEP 5 MULA (ENROLLMENT) ===");
      // 4. Enroll Student to Schedule
      if (finalScheduleId) {
        // Cek jika siswa belum enroll jadwal ini (Mencegah ganda)
        const checkEnroll = await tx.enrollment.findFirst({
          where: { studentId: savedUser.id, scheduleId: finalScheduleId }
        });
        
        if (!checkEnroll) {
          await tx.enrollment.create({
            data: {
              studentId: savedUser.id,
              scheduleId: finalScheduleId,
              startDate: calculatedStartDate,
              frozenPrice: (invoice as any).totalAmount || 0,
            }
          });
        }
      }
      console.log("=== TRANSAKSI STEP 5 LULUS ===");

      console.log("=== TRANSAKSI STEP 6 MULA (UPDATE LEAD) ===");
      // 5. Mark the related Lead as CLOSED_WON
      await tx.lead.update({
        where: { id: invoice.leadId },
        data: { status: "CLOSED_WON" },
      });
      console.log("=== TRANSAKSI STEP 6 LULUS ===");
    });

    // Revalidate routes so UI updates immediately
    const { revalidatePath } = require("next/cache");
    revalidatePath("/admin/crm");
    revalidatePath("/admin/users");

    const loginUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/login`
      : "https://speakupcenter.com/login";

    return {
      success: true,
      message:
        `Halo ${studentName}! 🎉 Pembayaran DP/Pelunasan untuk program *"${(invoice as any).program?.name}"* sudah kami konfirmasi.\n\n` +
        `Berikut akun login portal siswa Anda:\n` +
        `🔗 *Portal*: ${loginUrl}\n` +
        `📧 *Email*: ${safeEmail}\n` +
        `🔑 *Password*: ${whatsapp}\n\n` +
        `Mohon segera login dan ganti password Anda. Selamat belajar! 🙌`,
    };
  } catch (err: any) {
    console.error("=== APPROVE PAYMENT ERROR TRANSAKSI GAGAL ===", err);
    return { error: err.message || "Terjadi kesalahan saat memverifikasi pembayaran. Silakan coba lagi." };
  }
}

// ── 4. Settle Payment On-Site (CS) ───────────────────────────────────────────
export async function settlePaymentOnSite(invoiceId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { error: "Sesi tidak valid." };
    if (!STAFF_ALLOWED.includes(session.user.role as string)) {
      return { error: "Tidak memiliki hak akses." };
    }

    const invoice = await prisma.invoice.findUnique({ 
      where: { id: invoiceId },
      include: { lead: true } 
    });
    if (!invoice) return { error: "Invoice tidak ditemukan." };

    if (invoice.status !== "DP_PAID") {
      return { error: `Invoice berstatus "${invoice.status}", bukan DP_PAID.` };
    }

    const pelunasanAmount = invoice.totalAmount - invoice.paidAmount;

    const dataPayload = (invoice.studentData as any) || {};
    const { name: parsedName = "Siswa Baru" } = dataPayload;
    const studentName = invoice.lead?.name || (invoice as any).user?.name || parsedName || "Siswa";

    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "PAID",
          paymentMethod: "CASH_ON_SITE",
          paidAmount: invoice.totalAmount, // Fully paid
        },
      });

      await tx.cashflow.create({
        data: {
          type: "INCOME",
          category: "PELUNASAN",
          amount: pelunasanAmount,
          description: `Pelunasan - ${studentName}`,
          invoiceId: invoice.id,
          recordedById: (session.user as any)?.id || null,
          branch: invoice.branch,
        } as any
      });
    });

    revalidatePath("/admin/crm");
    return { success: true };
  } catch (err) {
    console.error("[settlePaymentOnSite]", err);
    return { error: "Terjadi kesalahan." };
  }
}

// ── 5. Submit Pelunasan Proof (Public) ───────────────────────────────────────
export async function submitPelunasanProof(invoiceId: string, proofUrl: string) {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return { error: "Invoice tidak ditemukan." };

    // Set to WAITING_CONFIRMATION so CS can verify the pelunasan transfer
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "WAITING_CONFIRMATION",
        paymentProof: proofUrl,
      },
    });

    revalidatePath(`/pay/pelunasan/${invoice.invoiceNumber}`);
    return { success: true };
  } catch (err) {
    console.error("[submitPelunasanProof]", err);
    return { error: "Terjadi kesalahan." };
  }
}
