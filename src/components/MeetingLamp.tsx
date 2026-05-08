"use client";

import { Trophy } from "lucide-react";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "SICK" | "EXCUSED" | null;
export type Predicate = "A" | "B" | "C" | "D" | "E" | null;

export type MeetingLampData = {
  meetingId: string;
  meetingNumber: number;
  isPerformance: boolean;
  attendance: AttendanceStatus;
  predicate: Predicate;
  hasScore: boolean; // true jika sudah ada nilai (predicate/aspectScores terisi)
  material: string;
};

// ─── Color config ─────────────────────────────────────────────────────────────
const LAMP_CONFIG: Record<
  string,
  { dot: string; box: string; label: string }
> = {
  PRESENT: {
    dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]",
    box: "bg-emerald-50 border-emerald-300 hover:bg-emerald-100",
    label: "Hadir",
  },
  ABSENT: {
    dot: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]",
    box: "bg-red-50 border-red-300 hover:bg-red-100",
    label: "Alpa",
  },
  SICK: {
    dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]",
    box: "bg-amber-50 border-amber-300 hover:bg-amber-100",
    label: "Sakit",
  },
  EXCUSED: {
    dot: "bg-yellow-300 shadow-[0_0_8px_rgba(253,224,71,0.7)]",
    box: "bg-yellow-50 border-yellow-300 hover:bg-yellow-100",
    label: "Izin",
  },
  null: {
    dot: "bg-slate-300",
    box: "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300",
    label: "Belum Dinilai",
  },
};

const PREDICATE_COLORS: Record<string, string> = {
  A: "bg-emerald-500",
  B: "bg-blue-500",
  C: "bg-yellow-400",
  D: "bg-orange-500",
  E: "bg-slate-400",
};

type Props = {
  data: MeetingLampData;
  onClick: (data: MeetingLampData) => void;
  moduleNumber: number;
};

export default function MeetingLamp({ data, onClick, moduleNumber }: Props) {
  const configKey = data.attendance ?? "null";
  const cfg = LAMP_CONFIG[configKey] ?? LAMP_CONFIG["null"];

  // PRESENT tapi nilai belum diisi → status "tertunda"
  const isPendingScore =
    data.attendance === "PRESENT" && !data.hasScore;

  const tooltipStatus = isPendingScore
    ? `${cfg.label} — ⏳ Nilai Tertunda`
    : `${cfg.label}${data.predicate ? ` | Predikat ${data.predicate}` : ""}`;

  return (
    <button
      onClick={() => onClick(data)}
      title={`Modul ${moduleNumber} - Pertemuan ${data.meetingNumber}\n${tooltipStatus}\n${data.material}`}
      className={`relative flex flex-col items-center justify-between p-2.5 rounded-xl border-2 transition-all duration-200 w-full aspect-square min-h-[72px] ${cfg.box} group`}
    >
      {/* Lampu utama (pojok kanan atas) */}
      <div className="absolute top-1.5 right-1.5">
        <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
      </div>

      {/* Dot oranye berdenyut — hanya saat PRESENT + nilai belum terisi */}
      {isPendingScore && (
        <div className="absolute top-1 left-1">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
          </span>
        </div>
      )}

      {/* Nomor pertemuan / ikon performance */}
      <div className="flex-1 flex items-center justify-center">
        {data.isPerformance ? (
          <Trophy className="w-5 h-5 text-amber-500" />
        ) : (
          <span className="text-base font-black text-slate-600 group-hover:text-slate-800 transition">
            {data.meetingNumber}
          </span>
        )}
      </div>

      {/* Badge bawah */}
      {data.attendance === "PRESENT" && data.hasScore && data.predicate ? (
        // Nilai sudah lengkap → tampilkan predikat
        <div
          className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-black text-white ${PREDICATE_COLORS[data.predicate] ?? "bg-slate-400"}`}
        >
          {data.predicate}
        </div>
      ) : data.attendance === "PRESENT" && !data.hasScore ? (
        // Hadir tapi nilai tertunda
        <div className="text-[9px] font-bold text-orange-500 uppercase tracking-wide">
          Pending
        </div>
      ) : data.attendance && data.attendance !== "PRESENT" ? (
        // Absen / sakit / izin
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
          {cfg.label}
        </div>
      ) : (
        // Belum ada data sama sekali
        <div className="w-6 h-2 rounded bg-slate-100" />
      )}
    </button>
  );
}

// ─── Grid Dinamis (jumlah kotak = jumlah meetings aktual per modul) ───────────
type GridProps = {
  modules: {
    id: string;
    moduleNumber: number;
    title: string;
    meetings: {
      id: string;
      meetingNumber: number;
      isPerformance: boolean;
      material: string;
      meetingEvaluations: {
        studentId: string;
        attendance: string;
        predicate: string | null;
        aspectScores: Record<string, string> | null;
      }[];
    }[];
  }[];
  studentId: string;
  onCellClick: (data: MeetingLampData) => void;
};

export function MeetingLampGrid({ modules, studentId, onCellClick }: GridProps) {
  if (modules.length === 0) {
    return (
      <p className="text-xs text-slate-400 italic text-center py-4">
        Kurikulum belum dibuat untuk program ini.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {modules.map((mod) => {
        const count = mod.meetings.length;
        const gridCols =
          count <= 4 ? "grid-cols-4"
          : count <= 5 ? "grid-cols-5"
          : count <= 6 ? "grid-cols-6"
          : count <= 9 ? "grid-cols-3 sm:grid-cols-9"
          : "grid-cols-4";

        return (
          <div key={mod.id}>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Modul {mod.moduleNumber} — {mod.title}
              <span className="ml-1 text-slate-400 font-medium">({count} pertemuan)</span>
            </p>
            <div className={`grid ${gridCols} gap-1.5`}>
              {mod.meetings.map((meeting) => {
                const eval_ = meeting.meetingEvaluations.find(
                  (e) => e.studentId === studentId
                );

                // hasScore: true jika nilai sudah benar-benar terisi
                // Kiddos → predicate terisi | Adult Speak → aspectScores ada entry
                const hasScore = !!(
                  eval_?.predicate ||
                  (eval_?.aspectScores &&
                    Object.keys(eval_.aspectScores).length > 0)
                );

                return (
                  <MeetingLamp
                    key={meeting.id}
                    moduleNumber={mod.moduleNumber}
                    data={{
                      meetingId: meeting.id,
                      meetingNumber: meeting.meetingNumber,
                      isPerformance: meeting.isPerformance,
                      material: meeting.material,
                      attendance: (eval_?.attendance ?? null) as AttendanceStatus,
                      predicate: (eval_?.predicate ?? null) as Predicate,
                      hasScore,
                    }}
                    onClick={onCellClick}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
