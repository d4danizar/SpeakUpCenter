import ImportRubricsClient from "./ImportRubricsClient";

export const metadata = {
  title: "Import Rubrik | SpeakUp Center",
};

export default function ImportRubricsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      <ImportRubricsClient />
    </div>
  );
}
