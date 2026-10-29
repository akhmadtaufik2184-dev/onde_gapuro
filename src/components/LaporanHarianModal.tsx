import React, { useState, useEffect, useRef } from 'react';
import { DailyReport, RombongId, UserRole, AppPreferences, ROMBONG_NAMES, DEFAULT_ROMBONG_SETTINGS } from '../types';
import {
  formatRupiah,
  parseNumber,
  formatIndoDate,
  formatIndoDayUpper,
  formatShortDateDisplay,
  toInputDateFormat,
  parseDateFromRaw,
  calculateDailyReport,
} from '../utils/format';
import {
  FileText,
  Download,
  Printer,
  Check,
  X,
  AlertTriangle,
  Calendar,
  Save,
  PlusCircle,
  Clock,
  ChevronRight,
  Eye,
  Trash2,
  Sparkles,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface LaporanHarianModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
  currentRombongId: RombongId;
  referenceDate: Date;
  preferences: AppPreferences;
  dailyReports: DailyReport[];
  onSaveReport: (report: DailyReport) => Promise<void>;
  onDeleteReport?: (reportId: string) => Promise<void>;
}

export const LaporanHarianModal: React.FC<LaporanHarianModalProps> = ({
  isOpen,
  onClose,
  userRole,
  currentRombongId,
  referenceDate,
  preferences,
  dailyReports,
  onSaveReport,
  onDeleteReport,
}) => {
  const isAdmin = userRole === 'admin';
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Tab: 'form' (input/edit), 'preview' (tabel & cetak/download), 'history' (riwayat)
  const [activeTab, setActiveTab] = useState<'form' | 'preview' | 'history'>('preview');
  const [selectedRombong, setSelectedRombong] = useState<RombongId>(currentRombongId);
  const [selectedDateRaw, setSelectedDateRaw] = useState<string>(() => toInputDateFormat(referenceDate));
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form Inputs
  const [stokMasuk, setStokMasuk] = useState<string>('');
  const [uraian1, setUraian1] = useState<string>('');
  const [uraian2, setUraian2] = useState<string>('');
  const [uraian3, setUraian3] = useState<string>('');
  const [uraian4, setUraian4] = useState<string>('');
  const [cash, setCash] = useState<string>('');
  const [transfer, setTransfer] = useState<string>('');
  const [qris, setQris] = useState<string>('');
  const [keterangan, setKeterangan] = useState<string>('');
  const [lembur, setLembur] = useState<string>('');

  // Sync selected rombong when opened
  useEffect(() => {
    if (isOpen) {
      if (!isAdmin) {
        if (userRole === 'rombong 1') setSelectedRombong('rmb1');
        else if (userRole === 'rombong 2') setSelectedRombong('rmb2');
        else if (userRole === 'rombong 3') setSelectedRombong('rmb3');
        else if (userRole === 'rombong 4') setSelectedRombong('rmb4');
        else setSelectedRombong(currentRombongId);
      } else {
        setSelectedRombong(currentRombongId);
      }
      setSelectedDateRaw(toInputDateFormat(referenceDate));
    }
  }, [isOpen, currentRombongId, userRole, isAdmin, referenceDate]);

  // Cari apakah sudah ada data laporan untuk selectedRombong dan selectedDateRaw
  const currentReportId = `${selectedRombong}_${selectedDateRaw}`;
  const existingReport = dailyReports.find(
    (r) => r.rombong === selectedRombong && r.tanggalRaw === selectedDateRaw
  );

  // Ambil rombong settings dari preferences
  const rombongConfig =
    (preferences.rombongSettings && preferences.rombongSettings[selectedRombong]) ||
    DEFAULT_ROMBONG_SETTINGS[selectedRombong];

  const currentHarga = rombongConfig.harga || 2500;
  const currentTarget = rombongConfig.target || (selectedRombong === 'rmb1' ? 140 : 70);

  // Load existing report into form fields
  useEffect(() => {
    if (existingReport) {
      setStokMasuk(existingReport.stokMasuk ? String(existingReport.stokMasuk) : '');
      const u = existingReport.uraianTerjual || [];
      setUraian1(u[0] !== undefined && u[0] !== 0 ? String(u[0]) : '');
      setUraian2(u[1] !== undefined && u[1] !== 0 ? String(u[1]) : '');
      setUraian3(u[2] !== undefined && u[2] !== 0 ? String(u[2]) : '');
      setUraian4(u[3] !== undefined && u[3] !== 0 ? String(u[3]) : '');
      setCash(existingReport.cash ? String(existingReport.cash) : '');
      setTransfer(existingReport.transfer ? String(existingReport.transfer) : '');
      setQris(existingReport.qris ? String(existingReport.qris) : '');
      setKeterangan(existingReport.keterangan || '');
      setLembur(existingReport.lembur ? String(existingReport.lembur) : '');
    } else {
      // Kosongkan form jika belum ada laporan
      setStokMasuk('');
      setUraian1('');
      setUraian2('');
      setUraian3('');
      setUraian4('');
      setCash('');
      setTransfer('');
      setQris('');
      setKeterangan('');
      setLembur('');
    }
  }, [existingReport, selectedRombong, selectedDateRaw]);

  if (!isOpen) return null;

  // Real-time calculation based on form or existing report
  const activeDateObj = parseDateFromRaw(selectedDateRaw);
  const activeHari = formatIndoDayUpper(activeDateObj);
  const activeTanggalDisplay = formatShortDateDisplay(activeDateObj);

  const parsedUraian = [
    parseNumber(uraian1),
    parseNumber(uraian2),
    parseNumber(uraian3),
    parseNumber(uraian4),
  ];

  const calc = calculateDailyReport(
    parseNumber(stokMasuk),
    parsedUraian,
    currentHarga,
    parseNumber(cash),
    parseNumber(transfer),
    parseNumber(qris),
    currentTarget,
    parseNumber(lembur)
  );

  const rombongNumber = selectedRombong.replace('rmb', '');

  // Simpan Laporan
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setIsSaving(true);
      const newReport: DailyReport = {
        id: currentReportId,
        rombong: selectedRombong,
        hari: activeHari,
        tanggalRaw: selectedDateRaw,
        tanggalDisplay: activeTanggalDisplay,
        stokMasuk: parseNumber(stokMasuk),
        uraianTerjual: parsedUraian,
        terjual: calc.terjual,
        sisa: calc.sisa,
        harga: currentHarga,
        cash: parseNumber(cash),
        transfer: parseNumber(transfer),
        qris: parseNumber(qris),
        jumlah: calc.jumlah,
        totalBayarDiterima: calc.totalBayarDiterima,
        keterangan: keterangan.trim(),
        target: currentTarget,
        gaji: calc.gaji,
        bonus: calc.bonus,
        total: calc.total,
        lembur: parseNumber(lembur),
        grandTotalGaji: calc.grandTotalGaji,
        createdAt: existingReport?.createdAt || Date.now(),
        updatedAt: Date.now(),
        updatedBy: isAdmin ? 'Admin' : `Rombong ${rombongNumber}`,
      };

      await onSaveReport(newReport);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveTab('preview');
      }, 700);
    } catch (err) {
      console.error('Failed to save daily report:', err);
      alert('Gagal menyimpan laporan');
    } finally {
      setIsSaving(false);
    }
  };

  // Download PDF via jsPDF & html2canvas
  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    try {
      setIsGeneratingPdf(true);
      const element = printAreaRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Fit in landscape A4 with 10mm margins
      const margin = 10;
      const targetWidth = pageWidth - (margin * 2);
      const targetHeight = (canvas.height * targetWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', margin, margin, targetWidth, Math.min(targetHeight, pageHeight - (margin * 2)));
      pdf.save(`Laporan_Penjualan_Rombong_${rombongNumber}_${selectedDateRaw}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Gagal membuat PDF. Anda juga dapat menggunakan tombol Cetak.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Cetak langsung via browser
  const handlePrint = () => {
    window.print();
  };

  // Riwayat laporan khusus rombong yang sedang dipilih
  const rombongHistoryReports = dailyReports
    .filter((r) => r.rombong === selectedRombong)
    .sort((a, b) => b.tanggalRaw.localeCompare(a.tanggalRaw));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-300 w-full max-w-5xl overflow-hidden max-h-[96vh] flex flex-col text-stone-900">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-[#236d4e] to-[#174e37] px-4 py-3 text-white flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold leading-tight flex items-center gap-2">
                <span>Laporan Penjualan Harian</span>
                <span className="text-xs bg-amber-400 text-stone-950 font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                  Rombong {rombongNumber}
                </span>
              </h3>
              <p className="text-[11px] text-emerald-200">
                Rekap Stok, Pembayaran, Target & Pendapatan Pegawai
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NAVIGATION SUB-BAR: Tab switch & Rombong switch (if Admin) */}
        <div className="bg-stone-100 border-b border-stone-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 no-print">
          {/* Admin Rombong Selector */}
          {isAdmin ? (
            <div className="flex items-center gap-1">
              <span className="font-bold text-stone-600 mr-1 text-[11px]">Kios:</span>
              {(['rmb1', 'rmb2', 'rmb3', 'rmb4'] as RombongId[]).map((r, idx) => (
                <button
                  key={r}
                  onClick={() => setSelectedRombong(r)}
                  className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer ${
                    selectedRombong === r
                      ? 'bg-[#236d4e] text-white shadow-xs'
                      : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300'
                  }`}
                >
                  Rombong {idx + 1}
                </button>
              ))}
            </div>
          ) : (
            <div className="font-bold text-stone-700 flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>Kios: {ROMBONG_NAMES[selectedRombong]?.toUpperCase()}</span>
            </div>
          )}

          {/* Date Picker Control */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
            <input
              type="date"
              value={selectedDateRaw}
              onChange={(e) => setSelectedDateRaw(e.target.value)}
              className="text-xs font-bold py-1 px-2 border border-stone-300 rounded bg-white text-stone-800 focus:outline-emerald-600"
            />
            <button
              type="button"
              onClick={() => setSelectedDateRaw(toInputDateFormat(new Date()))}
              className="text-[10px] text-emerald-800 hover:underline font-bold"
            >
              Hari Ini
            </button>
          </div>

          {/* Tabs: Preview/Download vs Form Input vs Riwayat */}
          <div className="flex items-center gap-1 bg-stone-200/80 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'preview'
                  ? 'bg-white text-[#236d4e] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Tabel & PDF</span>
            </button>

            <button
              onClick={() => setActiveTab('form')}
              className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'form'
                  ? 'bg-white text-[#236d4e] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Input / Edit</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'history'
                  ? 'bg-white text-[#236d4e] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Riwayat ({rombongHistoryReports.length})</span>
            </button>
          </div>
        </div>

        {/* BODY CONTAINER */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1">
          {/* TAB 1: PREVIEW & DOWNLOAD PDF (SESUAI GAMBAR 6c039e95) */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {/* Top Quick Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl no-print">
                <div className="text-xs">
                  <span className="font-bold text-emerald-950 block">
                    {existingReport
                      ? `Laporan Tersimpan: ${activeHari}, ${activeTanggalDisplay}`
                      : `Draft / Belum Disimpan untuk ${activeHari}, ${activeTanggalDisplay}`}
                  </span>
                  <span className="text-[11px] text-emerald-800">
                    Target: {currentTarget} butir • Harga: Rp {formatRupiah(currentHarga)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('form')}
                    className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5 text-stone-600" />
                    <span>{existingReport ? 'Edit Data' : '+ Isi Data Laporan'}</span>
                  </button>

                  <button
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                    className="px-4 py-1.5 bg-[#236d4e] hover:bg-[#1b553d] active:bg-[#15422f] text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Download PDF'}</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-black text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak</span>
                  </button>
                </div>
              </div>

              {/* PRINT & PDF CANVAS AREA (DESAIN PERSIS GAMBAR 6c039e95) */}
              <div className="overflow-x-auto pb-4">
                <div
                  ref={printAreaRef}
                  id="laporan-penjualan-table"
                  className="bg-white p-6 rounded-xl border border-stone-300 min-w-[980px] text-stone-900 font-sans shadow-sm"
                >
                  {/* TITLE HEADER SESUAI GAMBAR 6c039e95 */}
                  <div className="flex items-center gap-8 mb-3 pb-1 border-b-2 border-stone-900">
                    <h2 className="text-base font-black tracking-wide uppercase text-stone-950">
                      LAPORAN PENJUALAN
                    </h2>
                    <div className="text-base font-black tracking-wide text-stone-950">
                      Rombong : {rombongNumber}
                    </div>
                  </div>

                  {/* SPREADSHEET TABLE GRID SESUAI GAMBAR 6c039e95 */}
                  <div className="relative">
                    <table className="w-full border-collapse border-2 border-stone-900 text-center text-[11px] leading-tight select-none">
                      <thead>
                        {/* ROW 1 HEADERS */}
                        <tr className="bg-stone-200 border-b-2 border-stone-900 font-bold">
                          <th className="border-r-2 border-stone-900 px-2 py-1.5 w-20">
                            HARI
                          </th>
                          <th
                            colSpan={7}
                            className="border-r-2 border-stone-900 px-2 py-1.5 bg-stone-100"
                          >
                            STOK
                          </th>
                          <th
                            colSpan={5}
                            className="border-r-2 border-stone-900 px-2 py-1.5 bg-stone-200"
                          >
                            PEMBAYARAN
                          </th>
                          <th
                            rowSpan={2}
                            className="border-r-2 border-stone-900 px-2 py-1.5 bg-stone-300/80 w-28"
                          >
                            KETERANGAN
                          </th>
                          <th
                            colSpan={5}
                            className="px-2 py-1.5 bg-stone-200"
                          >
                            PENDAPATAN
                          </th>
                        </tr>

                        {/* ROW 2 SUB-HEADERS */}
                        <tr className="bg-stone-100 border-b-2 border-stone-900 font-bold text-[10px]">
                          <th className="border-r-2 border-stone-900 px-1 py-1 w-20">
                            TANGGAL
                          </th>

                          {/* Under STOK */}
                          <th className="border-r border-stone-900 px-1 py-1 w-12">
                            MASUK
                          </th>
                          <th
                            colSpan={4}
                            className="border-r border-stone-900 px-1 py-1 text-center"
                          >
                            URAIAN TERJUAL
                          </th>
                          <th className="border-r border-stone-900 px-1 py-1 w-14 bg-emerald-50">
                            TERJUAL
                          </th>
                          <th className="border-r-2 border-stone-900 px-1 py-1 w-12 bg-amber-50">
                            SISA
                          </th>

                          {/* Under PEMBAYARAN */}
                          <th className="border-r border-stone-900 px-1 py-1 w-14">
                            HARGA
                          </th>
                          <th className="border-r border-stone-900 px-1 py-1 w-16">
                            CASH
                          </th>
                          <th className="border-r border-stone-900 px-1 py-1 w-16">
                            TRANSFER
                          </th>
                          <th className="border-r border-stone-900 px-1 py-1 w-16">
                            QRIS
                          </th>
                          <th className="border-r-2 border-stone-900 px-1 py-1 w-20 bg-stone-200">
                            JUMLAH
                          </th>

                          {/* Under PENDAPATAN */}
                          <th className="border-r border-stone-900 px-1 py-1 w-14">
                            TARGET
                          </th>
                          <th className="border-r border-stone-900 px-1 py-1 w-16">
                            GAJI
                          </th>
                          <th className="border-r border-stone-900 px-1 py-1 w-14">
                            BONUS
                          </th>
                          <th className="border-r border-stone-900 px-1 py-1 w-16 bg-emerald-50">
                            TOTAL
                          </th>
                          <th className="px-1 py-1 w-14">
                            LEMBUR
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {/* MAIN DATA ROW */}
                        <tr className="border-b-2 border-stone-900 font-semibold text-xs h-12">
                          {/* HARI & TANGGAL */}
                          <td className="border-r-2 border-stone-900 px-1.5 py-1 text-center bg-stone-50">
                            <div className="font-bold">{activeHari}</div>
                            <div className="text-[11px] text-stone-700 font-medium mt-0.5">
                              {activeTanggalDisplay}
                            </div>
                          </td>

                          {/* STOK: MASUK */}
                          <td className="border-r border-stone-900 px-1 py-1 text-center font-bold">
                            {stokMasuk !== '' ? stokMasuk : '-'}
                          </td>

                          {/* STOK: URAIAN TERJUAL (4 columns) */}
                          <td className="border-r border-stone-900 px-1 py-1 w-10 text-center font-medium">
                            {uraian1 !== '' ? uraian1 : '-'}
                          </td>
                          <td className="border-r border-stone-900 px-1 py-1 w-10 text-center font-medium">
                            {uraian2 !== '' ? uraian2 : '-'}
                          </td>
                          <td className="border-r border-stone-900 px-1 py-1 w-10 text-center font-medium">
                            {uraian3 !== '' ? uraian3 : '-'}
                          </td>
                          <td className="border-r border-stone-900 px-1 py-1 w-10 text-center font-medium">
                            {uraian4 !== '' ? uraian4 : '-'}
                          </td>

                          {/* STOK: TERJUAL */}
                          <td className="border-r border-stone-900 px-1 py-1 text-center font-bold bg-emerald-50 text-emerald-950">
                            {calc.terjual > 0 ? calc.terjual : '0'}
                          </td>

                          {/* STOK: SISA */}
                          <td className="border-r-2 border-stone-900 px-1 py-1 text-center font-bold bg-amber-50 text-amber-950">
                            {calc.sisa}
                          </td>

                          {/* PEMBAYARAN: HARGA */}
                          <td className="border-r border-stone-900 px-1 py-1 text-center font-medium">
                            {formatRupiah(currentHarga)}
                          </td>

                          {/* PEMBAYARAN: CASH */}
                          <td className="border-r border-stone-900 px-1 py-1 text-right pr-2 font-medium">
                            {cash !== '' ? formatRupiah(parseNumber(cash)) : '-'}
                          </td>

                          {/* PEMBAYARAN: TRANSFER */}
                          <td className="border-r border-stone-900 px-1 py-1 text-right pr-2 font-medium">
                            {transfer !== '' ? formatRupiah(parseNumber(transfer)) : '-'}
                          </td>

                          {/* PEMBAYARAN: QRIS */}
                          <td className="border-r border-stone-900 px-1 py-1 text-right pr-2 font-medium">
                            {qris !== '' ? formatRupiah(parseNumber(qris)) : '-'}
                          </td>

                          {/* PEMBAYARAN: JUMLAH (MERAH JIKA SELISIH SESUAI GAMBAR 6c039e95) */}
                          <td
                            className={`border-r-2 border-stone-900 px-1 py-1 text-right pr-2 font-bold ${
                              calc.isSelisih && (cash !== '' || transfer !== '' || qris !== '')
                                ? 'bg-red-50 text-red-600 font-extrabold underline decoration-red-500'
                                : 'bg-stone-100 text-stone-900'
                            }`}
                          >
                            {formatRupiah(calc.jumlah)}
                          </td>

                          {/* KETERANGAN */}
                          <td className="border-r-2 border-stone-900 px-2 py-1 text-left text-[11px] leading-tight font-medium bg-stone-50">
                            {keterangan || '-'}
                          </td>

                          {/* PENDAPATAN: TARGET */}
                          <td className="border-r border-stone-900 px-1 py-1 text-center font-medium">
                            {currentTarget}
                          </td>

                          {/* PENDAPATAN: GAJI */}
                          <td className="border-r border-stone-900 px-1 py-1 text-right pr-2 font-medium">
                            {formatRupiah(calc.gaji)}
                          </td>

                          {/* PENDAPATAN: BONUS */}
                          <td className="border-r border-stone-900 px-1 py-1 text-right pr-2 font-medium">
                            {calc.bonus > 0 ? formatRupiah(calc.bonus) : '0'}
                          </td>

                          {/* PENDAPATAN: TOTAL (GAJI + BONUS) */}
                          <td className="border-r border-stone-900 px-1 py-1 text-right pr-2 font-bold bg-emerald-50 text-emerald-950">
                            {formatRupiah(calc.total)}
                          </td>

                          {/* PENDAPATAN: LEMBUR */}
                          <td className="px-1 py-1 text-right pr-2 font-medium">
                            {lembur !== '' ? formatRupiah(parseNumber(lembur)) : '0'}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* CALLOUT YELLOW NOTE SESUAI GAMBAR 6c039e95 */}
                    <div className="mt-3 flex items-start gap-4">
                      <div className="bg-yellow-200 border-2 border-stone-800 p-2.5 rounded text-[11px] font-bold text-stone-950 max-w-md shadow-xs leading-relaxed">
                        NB : JUMLAH AKAN BERWARNA Merah JIKA JUMLAH tidak sama dengan CASH+TRANSFER+QRIS
                        {calc.isSelisih && (cash !== '' || transfer !== '' || qris !== '') && (
                          <div className="mt-1 text-red-700 font-black flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                            <span>
                              Terjadi Selisih: Total Uang Masuk Rp {formatRupiah(calc.totalBayarDiterima)} (Selisih Rp {formatRupiah(calc.selisih)})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* SUMMARY CHIPS */}
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div className="p-2 bg-stone-100 rounded border border-stone-300">
                          <span className="text-[10px] text-stone-600 block">Total Omset:</span>
                          <span className="font-bold text-stone-900 text-sm">
                            Rp {formatRupiah(calc.jumlah)}
                          </span>
                        </div>

                        <div className="p-2 bg-emerald-50 rounded border border-emerald-300">
                          <span className="text-[10px] text-emerald-800 block">
                            Total Gaji Pegawai (+Lembur):
                          </span>
                          <span className="font-bold text-emerald-950 text-sm">
                            Rp {formatRupiah(calc.grandTotalGaji)}
                          </span>
                        </div>

                        <div className="p-2 bg-amber-50 rounded border border-amber-300">
                          <span className="text-[10px] text-amber-800 block">Sisa Onde-onde:</span>
                          <span className="font-bold text-amber-950 text-sm">
                            {calc.sisa} butir
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SIGNATURE SECTION FOR OFFICIAL PRINT/PDF */}
                    <div className="mt-8 pt-4 border-t border-stone-200 grid grid-cols-2 text-center text-xs text-stone-800">
                      <div>
                        <p className="font-semibold text-stone-600">Petugas Kios Rombong {rombongNumber}</p>
                        <div className="h-14"></div>
                        <p className="font-bold underline text-stone-900">( ........................................ )</p>
                      </div>

                      <div>
                        <p className="font-semibold text-stone-600">Pengelola / Admin Gapuro</p>
                        <div className="h-14"></div>
                        <p className="font-bold underline text-stone-900">( ........................................ )</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FORM INPUT / EDIT LAPORAN HARIAN */}
          {activeTab === 'form' && (
            <form onSubmit={handleSave} className="space-y-4 max-w-3xl mx-auto">
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-amber-950 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold">Form Input Laporan Penjualan:</span>
                  <p className="text-[11px] text-amber-900 mt-0.5">
                    Kios {ROMBONG_NAMES[selectedRombong]?.toUpperCase()} • {activeHari}, {activeTanggalDisplay}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-stone-500 block">Target Penjualan:</span>
                  <span className="font-bold text-emerald-800 text-xs">{currentTarget} butir</span>
                </div>
              </div>

              {/* 1. SEKSI STOK */}
              <div className="bg-white border-2 border-stone-300 rounded-xl p-3.5 space-y-3 shadow-xs">
                <div className="font-bold text-xs text-stone-900 flex items-center gap-1.5 border-b pb-1.5 border-stone-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <span>1. STOK ONDE-ONDE</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      MASUK (Butir Onde-onde):
                    </label>
                    <input
                      type="text"
                      value={stokMasuk}
                      onChange={(e) => setStokMasuk(e.target.value)}
                      placeholder="contoh: 200"
                      className="w-full text-xs font-bold px-3 py-2 border-2 border-stone-400 rounded-lg bg-stone-50 focus:bg-white focus:outline-emerald-600"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      URAIAN TERJUAL (4 Sesi / Gelombang Penggilingan):
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      <input
                        type="text"
                        value={uraian1}
                        onChange={(e) => setUraian1(e.target.value)}
                        placeholder="Sesi 1"
                        className="text-center text-xs font-bold py-2 border border-stone-400 rounded-lg bg-stone-50 focus:bg-white focus:outline-emerald-600"
                      />
                      <input
                        type="text"
                        value={uraian2}
                        onChange={(e) => setUraian2(e.target.value)}
                        placeholder="Sesi 2"
                        className="text-center text-xs font-bold py-2 border border-stone-400 rounded-lg bg-stone-50 focus:bg-white focus:outline-emerald-600"
                      />
                      <input
                        type="text"
                        value={uraian3}
                        onChange={(e) => setUraian3(e.target.value)}
                        placeholder="Sesi 3"
                        className="text-center text-xs font-bold py-2 border border-stone-400 rounded-lg bg-stone-50 focus:bg-white focus:outline-emerald-600"
                      />
                      <input
                        type="text"
                        value={uraian4}
                        onChange={(e) => setUraian4(e.target.value)}
                        placeholder="Sesi 4"
                        className="text-center text-xs font-bold py-2 border border-stone-400 rounded-lg bg-stone-50 focus:bg-white focus:outline-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Auto Calculated Stok Result */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center">
                    <span className="text-[10px] text-emerald-800 font-semibold block">Total Terjual (Otomatis):</span>
                    <span className="text-base font-bold text-emerald-950">{calc.terjual} butir</span>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
                    <span className="text-[10px] text-amber-800 font-semibold block">Sisa Stok (Otomatis):</span>
                    <span className="text-base font-bold text-amber-950">{calc.sisa} butir</span>
                  </div>
                </div>
              </div>

              {/* 2. SEKSI PEMBAYARAN */}
              <div className="bg-white border-2 border-stone-300 rounded-xl p-3.5 space-y-3 shadow-xs">
                <div className="font-bold text-xs text-stone-900 flex items-center justify-between border-b pb-1.5 border-stone-200">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <span>2. PEMBAYARAN KASIR</span>
                  </span>
                  <span className="text-[11px] text-stone-600">
                    Harga: Rp {formatRupiah(currentHarga)} / butir
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      CASH (Tunai):
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-stone-400">Rp</span>
                      <input
                        type="text"
                        value={cash ? formatRupiah(parseNumber(cash)) : ''}
                        onChange={(e) => setCash(e.target.value)}
                        placeholder="0"
                        className="w-full text-right text-xs font-bold font-mono px-3 py-2 border border-stone-400 rounded-lg bg-stone-50 focus:bg-white focus:outline-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      TRANSFER BANK:
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-stone-400">Rp</span>
                      <input
                        type="text"
                        value={transfer ? formatRupiah(parseNumber(transfer)) : ''}
                        onChange={(e) => setTransfer(e.target.value)}
                        placeholder="0"
                        className="w-full text-right text-xs font-bold font-mono px-3 py-2 border border-stone-400 rounded-lg bg-stone-50 focus:bg-white focus:outline-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      QRIS:
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-stone-400">Rp</span>
                      <input
                        type="text"
                        value={qris ? formatRupiah(parseNumber(qris)) : ''}
                        onChange={(e) => setQris(e.target.value)}
                        placeholder="0"
                        className="w-full text-right text-xs font-bold font-mono px-3 py-2 border border-stone-400 rounded-lg bg-stone-50 focus:bg-white focus:outline-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Validation and Total Omset */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-stone-200">
                  <div className="p-2.5 bg-stone-100 rounded-lg border border-stone-300">
                    <span className="text-[10px] text-stone-600 block">Jumlah Seharusnya (Terjual × Harga):</span>
                    <span className={`text-base font-bold ${calc.isSelisih && (cash !== '' || transfer !== '' || qris !== '') ? 'text-red-600' : 'text-stone-900'}`}>
                      Rp {formatRupiah(calc.jumlah)}
                    </span>
                  </div>

                  <div className={`p-2.5 rounded-lg border ${calc.isSelisih && (cash !== '' || transfer !== '' || qris !== '') ? 'bg-red-50 border-red-300 text-red-950' : 'bg-emerald-50 border-emerald-300 text-emerald-950'}`}>
                    <span className="text-[10px] block font-semibold">Total Setoran Diterima (Cash+Transfer+QRIS):</span>
                    <span className="text-base font-bold">
                      Rp {formatRupiah(calc.totalBayarDiterima)}
                    </span>
                    {calc.isSelisih && (cash !== '' || transfer !== '' || qris !== '') && (
                      <span className="block text-[10px] text-red-700 font-bold mt-0.5">
                        ⚠️ Selisih: Rp {formatRupiah(calc.selisih)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. KETERANGAN */}
              <div className="bg-white border-2 border-stone-300 rounded-xl p-3.5 space-y-2 shadow-xs">
                <label className="block text-xs font-bold text-stone-800">
                  3. KETERANGAN / CATATAN HARIAN:
                </label>
                <textarea
                  rows={2}
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Tuliskan keterangan jika ada pesanan khusus, kondisi penjualan, dll."
                  className="w-full text-xs p-2.5 border border-stone-400 rounded-lg bg-stone-50 focus:bg-white focus:outline-emerald-600"
                />
              </div>

              {/* 4. SEKSI PENDAPATAN PEGAWAI */}
              <div className="bg-white border-2 border-stone-300 rounded-xl p-3.5 space-y-3 shadow-xs">
                <div className="font-bold text-xs text-stone-900 flex items-center justify-between border-b pb-1.5 border-stone-200">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <span>4. PENDAPATAN PEGAWAI (GAJI & BONUS)</span>
                  </span>
                  <span className="text-[10px] text-stone-500 font-medium">
                    Target: {currentTarget} butir
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 bg-stone-50 rounded border border-stone-200">
                    <span className="text-[10px] text-stone-600 block">Target:</span>
                    <span className="font-bold text-stone-900">{currentTarget} butir</span>
                  </div>

                  <div className="p-2 bg-stone-50 rounded border border-stone-200">
                    <span className="text-[10px] text-stone-600 block">Gaji Pokok:</span>
                    <span className="font-bold text-stone-900">Rp {formatRupiah(calc.gaji)}</span>
                  </div>

                  <div className="p-2 bg-stone-50 rounded border border-stone-200">
                    <span className="text-[10px] text-stone-600 block">Bonus Target:</span>
                    <span className="font-bold text-emerald-700">Rp {formatRupiah(calc.bonus)}</span>
                  </div>

                  <div className="p-2 bg-emerald-50 rounded border border-emerald-300">
                    <span className="text-[10px] text-emerald-800 block">Total (Gaji+Bonus):</span>
                    <span className="font-bold text-emerald-950">Rp {formatRupiah(calc.total)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    LEMBUR (diisi jika ada jam lembur):
                  </label>
                  <div className="flex items-center gap-1 max-w-xs">
                    <span className="text-xs text-stone-400">Rp</span>
                    <input
                      type="text"
                      value={lembur ? formatRupiah(parseNumber(lembur)) : ''}
                      onChange={(e) => setLembur(e.target.value)}
                      placeholder="0"
                      className="w-full text-right text-xs font-bold font-mono px-3 py-2 border border-stone-400 rounded-lg bg-stone-50 focus:bg-white focus:outline-emerald-600"
                    />
                  </div>
                </div>

                <div className="bg-emerald-100/70 border border-emerald-300 rounded-lg p-2.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-950">
                    Grand Total Diterima Pegawai:
                  </span>
                  <span className="text-base font-extrabold text-emerald-900">
                    Rp {formatRupiah(calc.grandTotalGaji)}
                  </span>
                </div>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-emerald-100 border border-emerald-400 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5 animate-fade-in shadow-xs">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>Laporan Penjualan berhasil disimpan! Mengalihkan ke tampilan tabel...</span>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="pt-2 flex items-center justify-between border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="px-4 py-2 border border-stone-300 hover:bg-stone-100 rounded-lg text-xs font-bold text-stone-700 cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-[#236d4e] hover:bg-[#1b553d] active:bg-[#15422f] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Laporan Harian'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: RIWAYAT LAPORAN */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-xs font-bold text-stone-800">
                  Daftar Laporan Penjualan: {ROMBONG_NAMES[selectedRombong]?.toUpperCase()}
                </h4>
                <button
                  onClick={() => setActiveTab('form')}
                  className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Tambah Laporan Baru</span>
                </button>
              </div>

              {rombongHistoryReports.length === 0 ? (
                <div className="p-8 text-center text-stone-400 text-xs bg-stone-50 rounded-xl border border-dashed border-stone-300">
                  Belum ada rekapan laporan harian yang tersimpan untuk kios ini.
                </div>
              ) : (
                <div className="space-y-2">
                  {rombongHistoryReports.map((rep) => {
                    const isDiscrepancy = rep.jumlah !== rep.totalBayarDiterima;
                    return (
                      <div
                        key={rep.id}
                        className="p-3 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl transition-all shadow-2xs flex flex-wrap items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-stone-900">
                              {rep.hari}, {rep.tanggalDisplay || rep.tanggalRaw}
                            </span>
                            {isDiscrepancy ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 text-red-700 border border-red-300">
                                Ada Selisih Kas
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Klop
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            Terjual: <strong>{rep.terjual} butir</strong> • Omset: <strong>Rp {formatRupiah(rep.jumlah)}</strong> • Gaji: <strong>Rp {formatRupiah(rep.grandTotalGaji || rep.total)}</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDateRaw(rep.tanggalRaw);
                              setActiveTab('preview');
                            }}
                            className="px-2.5 py-1 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-300 cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat PDF</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDateRaw(rep.tanggalRaw);
                              setActiveTab('form');
                            }}
                            className="px-2.5 py-1 text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded border border-stone-300 cursor-pointer"
                          >
                            Edit
                          </button>

                          {isAdmin && onDeleteReport && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Hapus laporan tanggal ${rep.tanggalRaw}?`)) {
                                  onDeleteReport(rep.id);
                                }
                              }}
                              className="p-1 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Hapus laporan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
