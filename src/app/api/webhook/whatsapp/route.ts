import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(req: Request) {
  try {
    // 1. Parse JSON dari request body
    const body = await req.json();
    const { senderNumber, senderName, message } = body;

    // 2. Validasi sederhana
    if (!senderNumber) {
      // Membalas dengan 200 OK walaupun gagal validasi agar webhook provider 
      // tidak melakukan retry terus-menerus terhadap bad payload
      console.warn("Webhook WA diterima tanpa senderNumber", body);
      return NextResponse.json({ error: "senderNumber is required" }, { status: 200 });
    }

    // 3. Cek eksistensi ke database
    const existingLead = await prisma.lead.findFirst({
      where: { whatsapp: senderNumber },
    });

    if (!existingLead) {
      // 4. Buat record baru jika belum ada
      await prisma.lead.create({
        data: {
          name: senderName || "Guest",
          whatsapp: senderNumber,
          status: "NEW", // Otomatis diarahkan ke Lajur Kanban 'Baru'
          notes: message ? `[Pesan Awal]: ${message}` : "",
        },
      });
      console.log(`[WA Webhook] Lead baru berhasil dibuat: ${senderNumber}`);
    } else {
      // 5. Jika sudah ada, tambahkan log pesan barunya ke tabel notes
      const appendedNotes = existingLead.notes 
        ? `${existingLead.notes}\n\n[Pesan Baru - ${new Date().toLocaleString('id-ID')}]: ${message || ""}`
        : `[Pesan Baru - ${new Date().toLocaleString('id-ID')}]: ${message || ""}`;

      await prisma.lead.update({
        where: { id: existingLead.id },
        data: { 
          notes: appendedNotes,
          // 'updatedAt' otomatis akan ter-update via @updatedAt di prisma schema
        },
      });
      console.log(`[WA Webhook] Lead lama diperbarui: ${senderNumber}`);
    }

    // 6. Kembalikan response HTTP 200 OK
    return NextResponse.json({ success: true, message: "Webhook processed successfully" }, { status: 200 });

  } catch (error) {
    // 7. Error handling yang aman
    console.error("[WA Webhook] Terjadi kesalahan saat memproses webhook:", error);
    // Tetap kirimkan status 200 OK agar provider tidak nyangkut/retry
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 200 });
  }
}
