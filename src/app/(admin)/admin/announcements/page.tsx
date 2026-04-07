import { prisma } from "../../../../lib/prisma";
import { AnnouncementsClientView } from "./AnnouncementsClientView";

export default async function AdminAnnouncementsPage() {
  const rawAnnouncements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: { name: true }
      }
    }
  });

  const announcements = rawAnnouncements.map(a => ({
    id: a.id,
    title: a.title,
    message: a.message,
    targetRole: a.targetRole,
    isActive: a.isActive,
    expiresAt: a.expiresAt.toISOString(),
    createdAt: a.createdAt.toISOString(),
    authorName: a.author.name
  }));

  return <AnnouncementsClientView initialAnnouncements={announcements} />;
}
