"use client";

import { Download } from "lucide-react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type PdfMatch = {
  id: string;
  babak: string;
  status: string;
  skor1?: number | null;
  skor2?: number | null;
  atlet1?: { nama: string; perguruan?: { nama: string } | null } | null;
  atlet2?: { nama: string; perguruan?: { nama: string } | null } | null;
  pemenang?: { nama: string; perguruan?: { nama: string } | null } | null;
  kategori?: { nama: string } | null;
  jadwalNama: string;
};

type PublikHasilExportPdfButtonProps = {
  matches: PdfMatch[];
};

const ROUND_ORDER = ["ROUND_OF_32", "ROUND_OF_16", "QUARTERFINAL", "SEMIFINAL", "FINAL"];

const formatRoundLabel = (round: string) => round.replace(/_/g, " ");

const getTeamLabel = (peserta?: { nama: string; perguruan?: { nama: string } | null } | null) => (
  peserta?.perguruan?.nama ?? peserta?.nama ?? "BYE"
);

export function PublikHasilExportPdfButton({ matches }: PublikHasilExportPdfButtonProps) {
  const exportHasilPdf = () => {
    if (matches.length === 0) {
      toast.error("Belum ada hasil pertandingan untuk diunduh");
      return;
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 14;
    const maxWidth = pageWidth - marginX * 2;
    const rowPaddingX = 1.5;
    const rowPaddingY = 1.5;
    const lineHeight = 4;

    const columns = [
      { key: "jadwal", title: "Jadwal", width: 34 },
      { key: "babak", title: "Babak", width: 22 },
      { key: "tim", title: "Pertandingan", width: 48 },
      { key: "kategori", title: "Kategori", width: 28 },
      { key: "skor", title: "Skor", width: 16 },
      { key: "pemenang", title: "Pemenang", width: 36 },
      { key: "status", title: "Status", width: 16 },
    ] as const;

    let y = 16;

    const drawPageHeader = (isContinued = false) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("LAPORAN HASIL PERTANDINGAN", marginX, y);

      if (isContinued) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("(lanjutan)", pageWidth - marginX, y, { align: "right" });
      }

      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Total hasil: ${matches.length}`, marginX, y);
      y += 5;
      doc.text(`Dicetak: ${new Date().toLocaleString("id-ID")}`, marginX, y);
      y += 6;
    };

    const drawTableHeader = () => {
      const headerHeight = 8;
      let x = marginX;

      doc.setFillColor(241, 245, 249);
      doc.rect(marginX, y, maxWidth, headerHeight, "F");
      doc.setDrawColor(203, 213, 225);
      doc.rect(marginX, y, maxWidth, headerHeight);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);

      columns.forEach((column) => {
        doc.rect(x, y, column.width, headerHeight);
        doc.text(column.title, x + rowPaddingX, y + 5);
        x += column.width;
      });

      y += headerHeight;
    };

    const ensurePageFor = (neededHeight: number) => {
      if (y + neededHeight <= pageHeight - 14) return;
      doc.addPage();
      y = 16;
      drawPageHeader(true);
      drawTableHeader();
    };

    const drawRow = (cells: string[]) => {
      const wrappedByCell = cells.map((cell, index) => {
        const availableWidth = columns[index].width - rowPaddingX * 2;
        const wrapped = doc.splitTextToSize(cell, availableWidth) as string[];
        return wrapped.length > 0 ? wrapped : [""];
      });

      const maxLines = wrappedByCell.reduce((max, wrapped) => Math.max(max, wrapped.length), 1);
      const rowHeight = maxLines * lineHeight + rowPaddingY * 2;

      ensurePageFor(rowHeight);

      let x = marginX;
      doc.setDrawColor(226, 232, 240);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);

      columns.forEach((column, index) => {
        doc.rect(x, y, column.width, rowHeight);
        doc.text(wrappedByCell[index], x + rowPaddingX, y + rowPaddingY + 3);
        x += column.width;
      });

      y += rowHeight;
    };

    const statusLabel = (status: string) => (status === "SELESAI" ? "Selesai" : "Berlangsung");

    const sortedMatches = [...matches].sort((a, b) => {
      const jadwalDiff = a.jadwalNama.localeCompare(b.jadwalNama, "id-ID");
      if (jadwalDiff !== 0) return jadwalDiff;
      const roundDiff = ROUND_ORDER.indexOf(a.babak) - ROUND_ORDER.indexOf(b.babak);
      if (roundDiff !== 0) return roundDiff;
      return a.id.localeCompare(b.id);
    });

    drawPageHeader();
    drawTableHeader();

    sortedMatches.forEach((match) => {
      drawRow([
        match.jadwalNama,
        formatRoundLabel(match.babak),
        `${getTeamLabel(match.atlet1)} vs ${getTeamLabel(match.atlet2)}`,
        match.kategori?.nama ?? "-",
        `${match.skor1 ?? 0} - ${match.skor2 ?? 0}`,
        match.pemenang ? getTeamLabel(match.pemenang) : "-",
        statusLabel(match.status),
      ]);
    });

    const totalSelesai = matches.filter((item) => item.status === "SELESAI").length;
    const totalBerlangsung = matches.length - totalSelesai;
    const summaryHeight = 18;
    ensurePageFor(summaryHeight);

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Ringkasan", marginX, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.text(`Selesai: ${totalSelesai} | Berlangsung: ${totalBerlangsung}`, marginX, y);

    const fileName = `hasil-pertandingan-publik-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
    toast.success("PDF hasil pertandingan berhasil diunduh");
  };

  return (
    <Button
      type="button"
      className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
      onClick={exportHasilPdf}
      disabled={matches.length === 0}
    >
      <Download size={14} /> Unduh Laporan (PDF)
    </Button>
  );
}
