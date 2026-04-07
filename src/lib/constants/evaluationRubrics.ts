export type EvaluationGrade = "A" | "B" | "C" | "D" | "E";

// Bentuk kamus: { KEY: { ModulName: { SessionName: [Array of Metrics] } } }
export const EVALUATION_RUBRICS: Record<
  string, // "KIDS" atau "TEENS"
  Record<
    string, // "Modul 1", "Modul 2", dst.
    Record<
      string, // "Pertemuan 1", "Pertemuan 2", "Pertemuan 3", "Performance"
      string[] // Array metrik
    >
  >
> = {
  KIDS: {
    "Modul 1": {
      "Pertemuan 1": ["Keberanian Tampil", "Pemahaman Tema", "Kelancaran Awal Bercerita", "Sikap & Antusiasme"],
      "Pertemuan 2": ["Metrik Dummy Kids M1 P2 - 1", "Metrik Dummy Kids M1 P2 - 2"],
      "Pertemuan 3": ["Metrik Dummy Kids M1 P3 - 1", "Metrik Dummy Kids M1 P3 - 2"],
      "Performance": ["Metrik Dummy Kids M1 Perf - 1", "Metrik Dummy Kids M1 Perf - 2"]
    },
    "Modul 2": {
      "Pertemuan 1": ["Metrik Dummy"], "Pertemuan 2": ["Metrik Dummy"], "Pertemuan 3": ["Metrik Dummy"], "Performance": ["Metrik Dummy"]
    },
    "Modul 3": {
      "Pertemuan 1": ["Metrik Dummy"], "Pertemuan 2": ["Metrik Dummy"], "Pertemuan 3": ["Metrik Dummy"], "Performance": ["Metrik Dummy"]
    },
    "Modul 4": {
      "Pertemuan 1": ["Metrik Dummy"], "Pertemuan 2": ["Metrik Dummy"], "Pertemuan 3": ["Metrik Dummy"], "Performance": ["Metrik Dummy"]
    },
    "Modul 5": {
      "Pertemuan 1": ["Metrik Dummy"], "Pertemuan 2": ["Metrik Dummy"], "Pertemuan 3": ["Metrik Dummy"], "Performance": ["Metrik Dummy"]
    },
    "Modul 6": {
      "Pertemuan 1": ["Metrik Dummy"], "Pertemuan 2": ["Metrik Dummy"], "Pertemuan 3": ["Metrik Dummy"], "Performance": ["Metrik Dummy"]
    }
  },
  TEENS: {
    "Modul 1": {
      "Pertemuan 1": ["Penguasaan Materi Dasar", "Gaya Tubuh & Gesture", "Intonasi Dasar"],
      "Pertemuan 2": ["Metrik Dummy Teens M1 P2 - 1", "Metrik Dummy Teens M1 P2 - 2"],
      "Pertemuan 3": ["Metrik Dummy Teens M1 P3 - 1", "Metrik Dummy Teens M1 P3 - 2"],
      "Performance": ["Metrik Dummy Teens M1 Perf - 1", "Metrik Dummy Teens M1 Perf - 2"]
    },
    "Modul 2": {
      "Pertemuan 1": ["Metrik Dummy"], "Pertemuan 2": ["Metrik Dummy"], "Pertemuan 3": ["Metrik Dummy"], "Performance": ["Metrik Dummy"]
    },
    "Modul 3": {
      "Pertemuan 1": ["Metrik Dummy"], "Pertemuan 2": ["Metrik Dummy"], "Pertemuan 3": ["Metrik Dummy"], "Performance": ["Metrik Dummy"]
    },
    "Modul 4": {
      "Pertemuan 1": ["Metrik Dummy"], "Pertemuan 2": ["Metrik Dummy"], "Pertemuan 3": ["Metrik Dummy"], "Performance": ["Metrik Dummy"]
    },
    "Modul 5": {
      "Pertemuan 1": ["Metrik Dummy"], "Pertemuan 2": ["Metrik Dummy"], "Pertemuan 3": ["Metrik Dummy"], "Performance": ["Metrik Dummy"]
    },
    "Modul 6": {
      "Pertemuan 1": ["Metrik Dummy"], "Pertemuan 2": ["Metrik Dummy"], "Pertemuan 3": ["Metrik Dummy"], "Performance": ["Metrik Dummy"]
    }
  },
  ADULTS: {
    "Program Regular Dewasa": {
      "Pertemuan 1": ["Confidence", "Eye Contact", "Gesture", "Artikulasi", "Intonasi", "Logos", "Pathos", "Ethos"],
      "Pertemuan 2": ["Confidence", "Eye Contact", "Gesture", "Artikulasi", "Intonasi", "Logos", "Pathos", "Ethos"],
      "Pertemuan 3": ["Confidence", "Eye Contact", "Gesture", "Artikulasi", "Intonasi", "Logos", "Pathos", "Ethos"],
      "Pertemuan 4": ["Confidence", "Eye Contact", "Gesture", "Artikulasi", "Intonasi", "Logos", "Pathos", "Ethos"],
      "Pertemuan 5": ["Confidence", "Eye Contact", "Gesture", "Artikulasi", "Intonasi", "Logos", "Pathos", "Ethos"],
      "Pertemuan 6": ["Confidence", "Eye Contact", "Gesture", "Artikulasi", "Intonasi", "Logos", "Pathos", "Ethos"],
      "Pertemuan 7": ["Confidence", "Eye Contact", "Gesture", "Artikulasi", "Intonasi", "Logos", "Pathos", "Ethos"],
      "Pertemuan 8": ["Confidence", "Eye Contact", "Gesture", "Artikulasi", "Intonasi", "Logos", "Pathos", "Ethos"],
      "Pertemuan 9": ["Confidence", "Eye Contact", "Gesture", "Artikulasi", "Intonasi", "Logos", "Pathos", "Ethos"]
    }
  }
};
