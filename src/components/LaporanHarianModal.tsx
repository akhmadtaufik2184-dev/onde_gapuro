import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  WeeklyReport,
  DailyReportDayItem,
  RombongId,
  UserRole,
  AppPreferences,
  ROMBONG_NAMES,
  DEFAULT_ROMBONG_SETTINGS,
} from '../types';
import {
  formatRupiah,
  parseNumber,
  formatIndoDate,
  formatShortDateDisplay,
  toInputDateFormat,
  parseDateFromRaw,
  getFridayPeriodDates,
  calculateDailyReport,
  calculateWeeklyTotals,
  createInitialWeeklyDays,
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
  Eye,
  Trash2,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  FolderArchive,
  ArrowRight,
  UserCheck,
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
  weeklyReports: WeeklyReport[];
  onSaveWeeklyReport: (report: WeeklyReport) => Promise<void>;
  onDeleteWeeklyReport?: (reportId: string) => Promise<void>;
}

export const LaporanHarianModal: React.FC<LaporanHarianModalProps> = ({
  isOpen,
  onClose,
  userRole,
  currentRombongId,
  referenceDate,
  preferences,
  weeklyReports,
  onSaveWeeklyReport,
  onDeleteWeeklyReport,
}) => {
  const isAdmin = userRole === 'admin';
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Tab: 'preview' (tabel 7 hari & cetak/download), 'input_day' (form input hari tertentu), 'history' (arsip periode lama)
  const [activeTab, setActiveTab] = useState<'preview' | 'input_day' | 'history'>('preview');
  const [selectedRombong, setSelectedRombong] = useState<RombongId>(currentRombongId);
  const [selectedFridayDate, setSelectedFridayDate] = useState<Date>(() => {
    return getFridayPeriodDates(referenceDate).startDate;
  });

  // Hari yang sedang diedit di form input (index 0..6: 0=Jumat, 1=Sabtu, ..., 6=Kamis)
  const [activeDayIndex, setActiveDayIndex] = useState<number>(0);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state on open
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
      const periodInfo = getFridayPeriodDates(referenceDate);
      setSelectedFridayDate(periodInfo.startDate);

      // Default active day index: cocokkan dengan hari ini dalam siklus Jumat s/d Kamis
      const todayRaw = toInputDateFormat(referenceDate);
      const matchedIdx = periodInfo.days.findIndex((d) => d.tanggalRaw === todayRaw);
      setActiveDayIndex(matchedIdx >= 0 ? matchedIdx : 0);
    }
  }, [isOpen, currentRombongId, userRole, isAdmin, referenceDate]);

  // Ambil rombong settings dari preferences
  const rombongConfig =
    (preferences.rombongSettings && preferences.rombongSettings[selectedRombong]) ||
    DEFAULT_ROMBONG_SETTINGS[selectedRombong];
  const currentHarga = rombongConfig.harga || 2500;
  const currentTarget = rombongConfig.target || (selectedRombong === 'rmb1' ? 140 : 70);

  // Hitung info periode aktif (Jumat s/d Kamis)
  const periodInfo = useMemo(() => {
    return getFridayPeriodDates(selectedFridayDate);
  }, [selectedFridayDate]);

  const currentReportId = `${selectedRombong}_${periodInfo.startDateRaw}_sd_${periodInfo.endDateRaw}`;

  // Cari apakah sudah ada data weeklyReport yang tersimpan di Firestore / lokal
  const existingReport = useMemo(() => {
    return weeklyReports.find((r) => r.id === currentReportId);
  }, [weeklyReports, currentReportId]);

  // Working days array for current period
  const [workingDays, setWorkingDays] = useState<DailyReportDayItem[]>(() => {
    return createInitialWeeklyDays(periodInfo.startDate, currentHarga, currentTarget);
  });

  // Saat periodInfo atau existingReport berganti, sinkronkan workingDays
  useEffect(() => {
    if (existingReport && existingReport.days && existingReport.days.length === 7) {
      setWorkingDays(existingReport.days);
    } else {
      setWorkingDays(createInitialWeeklyDays(periodInfo.startDate, currentHarga, currentTarget));
    }
  }, [existingReport, periodInfo, currentHarga, currentTarget]);

  // Form states untuk hari yang sedang dipilih (activeDayIndex)
  const currentDayItem = workingDays[activeDayIndex] || workingDays[0];
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

  // Saat activeDayIndex berganti atau workingDays terisi, load ke form input
  useEffect(() => {
    if (currentDayItem) {
      setStokMasuk(currentDayItem.isFilled ? String(currentDayItem.stokMasuk || 0) : '');
      const u = currentDayItem.uraianTerjual || [0, 0, 0, 0];
      setUraian1(currentDayItem.isFilled && u[0] ? String(u[0]) : '');
      setUraian2(currentDayItem.isFilled && u[1] ? String(u[1]) : '');
      setUraian3(currentDayItem.isFilled && u[2] ? String(u[2]) : '');
      setUraian4(currentDayItem.isFilled && u[3] ? String(u[3]) : '');
      setCash(currentDayItem.isFilled && currentDayItem.cash ? String(currentDayItem.cash) : '');
      setTransfer(currentDayItem.isFilled && currentDayItem.transfer ? String(currentDayItem.transfer) : '');
      setQris(currentDayItem.isFilled && currentDayItem.qris ? String(currentDayItem.qris) : '');
      setKeterangan(currentDayItem.keterangan || '');
      setLembur(currentDayItem.isFilled && currentDayItem.lembur ? String(currentDayItem.lembur) : '');
    }
  }, [activeDayIndex, currentDayItem]);

  if (!isOpen) return null;

  const rombongNumber = selectedRombong.replace('rmb', '');

  // Real-time calculation untuk hari yang sedang diedit di form
  const parsedUraian = [
    parseNumber(uraian1),
    parseNumber(uraian2),
    parseNumber(uraian3),
    parseNumber(uraian4),
  ];

  const calcActiveDay = calculateDailyReport(
    parseNumber(stokMasuk),
    parsedUraian,
    currentHarga,
    parseNumber(cash),
    parseNumber(transfer),
    parseNumber(qris),
    currentTarget,
    parseNumber(lembur)
  );

  // Hitung total 1 minggu berdasarkan workingDays
  const weeklyTotals = calculateWeeklyTotals(workingDays);

  // Simpan data hari yang sedang diedit ke workingDays dan simpan ke Firestore
  const handleSaveDay = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setIsSaving(true);
      const updatedDay: DailyReportDayItem = {
        ...currentDayItem,
        stokMasuk: parseNumber(stokMasuk),
        uraianTerjual: parsedUraian,
        terjual: calcActiveDay.terjual,
        sisa: calcActiveDay.sisa,
        harga: currentHarga,
        cash: parseNumber(cash),
        transfer: parseNumber(transfer),
        qris: parseNumber(qris),
        jumlah: calcActiveDay.jumlah,
        totalBayarDiterima: calcActiveDay.totalBayarDiterima,
        isSelisih: calcActiveDay.isSelisih,
        keterangan: keterangan.trim(),
        target: currentTarget,
        gaji: calcActiveDay.gaji,
        bonus: calcActiveDay.bonus,
        total: calcActiveDay.total,
        lembur: parseNumber(lembur),
        grandTotalGaji: calcActiveDay.grandTotalGaji,
        isFilled: true,
      };

      const newDays = [...workingDays];
      newDays[activeDayIndex] = updatedDay;
      setWorkingDays(newDays);

      const newTotals = calculateWeeklyTotals(newDays);

      const reportToSave: WeeklyReport = {
        id: currentReportId,
        rombong: selectedRombong,
        startDateRaw: periodInfo.startDateRaw,
        endDateRaw: periodInfo.endDateRaw,
        periodLabel: periodInfo.periodLabel,
        status: existingReport?.status || 'aktif',
        days: newDays,
        totalMasuk: newTotals.totalMasuk,
        totalTerjual: newTotals.totalTerjual,
        totalSisa: newTotals.totalSisa,
        totalCash: newTotals.totalCash,
        totalTransfer: newTotals.totalTransfer,
        totalQris: newTotals.totalQris,
        totalJumlah: newTotals.totalJumlah,
        totalSetoran: newTotals.totalSetoran,
        totalGaji: newTotals.totalGaji,
        totalBonus: newTotals.totalBonus,
        totalGajiPlusBonus: newTotals.totalGajiPlusBonus,
        totalLembur: newTotals.totalLembur,
        grandTotalHonor: newTotals.grandTotalHonor,
        createdAt: existingReport?.createdAt || Date.now(),
        updatedAt: Date.now(),
        updatedBy: isAdmin ? 'Admin' : `Rombong ${rombongNumber}`,
      };

      await onSaveWeeklyReport(reportToSave);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveTab('preview');
      }, 700);
    } catch (err) {
      console.error('Failed to save weekly day report:', err);
      alert('Gagal menyimpan laporan hari ini');
    } finally {
      setIsSaving(false);
    }
  };

  // Tutup Buku Minggu Ini (Status Selesai pada hari Kamis)
  const handleCloseWeek = async () => {
    if (
      window.confirm(
        `Tutup buku laporan periode ${periodInfo.periodLabel}?\nTotal honor karyawan yang dibayarkan di hari Kamis adalah Rp ${formatRupiah(weeklyTotals.grandTotalHonor)}.`
      )
    ) {
      try {
        setIsSaving(true);
        const reportToSave: WeeklyReport = {
          id: currentReportId,
          rombong: selectedRombong,
          startDateRaw: periodInfo.startDateRaw,
          endDateRaw: periodInfo.endDateRaw,
          periodLabel: periodInfo.periodLabel,
          status: 'selesai',
          days: workingDays,
          ...weeklyTotals,
          createdAt: existingReport?.createdAt || Date.now(),
          updatedAt: Date.now(),
          updatedBy: isAdmin ? 'Admin' : `Rombong ${rombongNumber}`,
        };
        await onSaveWeeklyReport(reportToSave);
        alert('Periode minggu ini telah ditutup & tersimpan di arsip.');
      } catch (err) {
        console.error('Failed to close week:', err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Mulai / Buka Periode Minggu Baru (Maju 7 hari ke Jumat berikutnya)
  const handleOpenNextWeek = () => {
    const nextFri = new Date(periodInfo.startDate);
    nextFri.setDate(nextFri.getDate() + 7);
    setSelectedFridayDate(nextFri);
    setActiveDayIndex(0);
    setActiveTab('preview');
  };

  // Kembali ke Periode Minggu Sebelumnya (Mundur 7 hari)
  const handleOpenPrevWeek = () => {
    const prevFri = new Date(periodInfo.startDate);
    prevFri.setDate(prevFri.getDate() - 7);
    setSelectedFridayDate(prevFri);
    setActiveDayIndex(0);
    setActiveTab('preview');
  };

  // Kembali ke Periode Minggu Berjalan (Hari Ini)
  const handleOpenCurrentWeek = () => {
    const todayPeriod = getFridayPeriodDates(referenceDate);
    setSelectedFridayDate(todayPeriod.startDate);
    setActiveDayIndex(0);
    setActiveTab('preview');
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
      const margin = 8;
      const targetWidth = pageWidth - margin * 2;
      const targetHeight = (canvas.height * targetWidth) / canvas.width;

      pdf.addImage(
        imgData,
        'PNG',
        margin,
        margin,
        targetWidth,
        Math.min(targetHeight, pageHeight - margin * 2)
      );
      pdf.save(
        `Laporan_Penjualan_Mingguan_Rombong_${rombongNumber}_${periodInfo.startDateRaw}_sd_${periodInfo.endDateRaw}.pdf`
      );
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

  // Arsip laporan mingguan khusus rombong ini
  const rombongArchivedReports = weeklyReports
    .filter((r) => r.rombong === selectedRombong)
    .sort((a, b) => b.startDateRaw.localeCompare(a.startDateRaw));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-1 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-300 w-full max-w-5xl overflow-hidden max-h-[96vh] flex flex-col text-stone-900">
        
        {/* HEADER MODAL */}
        <div className="bg-gradient-to-r from-[#236d4e] to-[#174e37] px-4 py-3 text-white flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold leading-tight flex items-center gap-2">
                <span>Laporan Penjualan Mingguan (Jumat - Kamis)</span>
                <span className="text-xs bg-amber-400 text-stone-950 font-black px-2 py-0.5 rounded-full shadow-2xs">
                  Rombong {rombongNumber}
                </span>
              </h3>
              <p className="text-[11px] text-emerald-200">
                Siklus 1 Minggu: Dimulai Hari Jumat • Ditutup & Penghonoran Hari Kamis
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

        {/* SUB-BAR KONTROL PERIODE MINGGUAN & KIOS */}
        <div className="bg-stone-100 border-b border-stone-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 no-print">
          {/* Admin Kios Switcher */}
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

          {/* PERIODE KONTROL (JUMAT s/d KAMIS) */}
          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-stone-300 shadow-2xs">
            <button
              onClick={handleOpenPrevWeek}
              title="Minggu Sebelumnya"
              className="px-1.5 py-0.5 rounded hover:bg-stone-200 text-stone-600 font-bold text-xs cursor-pointer"
            >
              ◀
            </button>

            <div className="px-1.5 text-center">
              <span className="font-bold text-stone-900 block text-xs">
                {periodInfo.periodLabel}
              </span>
              <span className="text-[10px] text-emerald-800 font-semibold block">
                {existingReport?.status === 'selesai' ? '✅ Tutup Buku' : '🟢 Periode Berjalan'}
              </span>
            </div>

            <button
              onClick={handleOpenNextWeek}
              title="Minggu Berikutnya"
              className="px-1.5 py-0.5 rounded hover:bg-stone-200 text-stone-600 font-bold text-xs cursor-pointer"
            >
              ▶
            </button>

            <button
              onClick={handleOpenCurrentWeek}
              className="ml-1 text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.5 rounded cursor-pointer"
            >
              Minggu Ini
            </button>
          </div>

          {/* TABS UTAMA */}
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
              <span>Tabel 1 Minggu & PDF</span>
            </button>

            <button
              onClick={() => setActiveTab('input_day')}
              className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'input_day'
                  ? 'bg-white text-[#236d4e] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Input Penjualan Harian</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'history'
                  ? 'bg-white text-[#236d4e] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Arsip ({rombongArchivedReports.length})</span>
            </button>
          </div>
        </div>

        {/* BODY CONTAINER */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1">
          
          {/* TAB 1: PREVIEW TABEL 1 MINGGU PENUH & DOWNLOAD PDF (SESUAI GAMBAR 6c039e95) */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              
              {/* TOP ACTION BAR */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl no-print">
                <div className="text-xs">
                  <div className="font-bold text-emerald-950 flex items-center gap-2">
                    <span>Rekap 1 Minggu (Jumat s/d Kamis)</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 font-extrabold px-2 py-0.5 rounded">
                      Target: {currentTarget} butir • Rp {formatRupiah(currentHarga)}/butir
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">
                    Total Honor Karyawan yang Dibayarkan Hari Kamis: <strong>Rp {formatRupiah(weeklyTotals.grandTotalHonor)}</strong>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveTab('input_day')}
                    className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5 text-stone-600" />
                    <span>+ Input / Edit Hari</span>
                  </button>

                  <button
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                    className="px-3.5 py-1.5 bg-[#236d4e] hover:bg-[#1b553d] active:bg-[#15422f] text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
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

                  {/* Tombol Tutup Buku Kamis / Buka Minggu Baru */}
                  {existingReport?.status !== 'selesai' ? (
                    <button
                      onClick={handleCloseWeek}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                      title="Tutup buku mingguan dan bayarkan honor karyawan di hari Kamis"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Tutup Buku Kamis</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleOpenNextWeek}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <span>Buka Minggu Baru ▶</span>
                    </button>
                  )}
                </div>
              </div>

              {/* SPREADSHEET TABLE CANVAS (PERSIS DENGAN FORMAT GAMBAR 6c039e95 DENGAN 7 BARIS JUMAT s/d KAMIS) */}
              <div className="overflow-x-auto pb-4">
                <div
                  ref={printAreaRef}
                  id="laporan-penjualan-table"
                  className="bg-white p-6 rounded-xl border border-stone-300 min-w-[1020px] text-stone-900 font-sans shadow-sm"
                >
                  {/* TITLE HEADER */}
                  <div className="flex items-center justify-between mb-3 pb-1.5 border-b-2 border-stone-900">
                    <div className="flex items-center gap-8">
                      <h2 className="text-base font-black tracking-wide uppercase text-stone-950">
                        LAPORAN PENJUALAN
                      </h2>
                      <div className="text-base font-black tracking-wide text-stone-950">
                        Rombong : {rombongNumber}
                      </div>
                    </div>

                    <div className="text-xs font-bold text-stone-800">
                      Periode: {periodInfo.periodLabel}
                    </div>
                  </div>

                  {/* TABLE GRID */}
                  <table className="w-full border-collapse border-2 border-stone-900 text-center text-[11px] leading-tight select-none">
                    <thead>
                      {/* HEADER ROW 1 */}
                      <tr className="bg-stone-200 border-b-2 border-stone-900 font-bold">
                        <th className="border-r-2 border-stone-900 px-2 py-1.5 w-24">
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
                          className="border-r-2 border-stone-900 px-2 py-1.5 bg-stone-300/80 w-32"
                        >
                          KETERANGAN
                        </th>
                        <th
                          colSpan={5}
                          className="px-2 py-1.5 bg-stone-200"
                        >
                          PENDAPATAN (PENGHONORAN)
                        </th>
                      </tr>

                      {/* HEADER ROW 2 SUB-HEADERS */}
                      <tr className="bg-stone-100 border-b-2 border-stone-900 font-bold text-[10px]">
                        <th className="border-r-2 border-stone-900 px-1 py-1 w-24">
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
                      {/* 7 ROWS: JUMAT s/d KAMIS */}
                      {workingDays.map((d, idx) => {
                        const isThursday = d.hari === 'KAMIS';
                        const u = d.uraianTerjual || [0, 0, 0, 0];

                        return (
                          <tr
                            key={d.tanggalRaw}
                            onClick={() => {
                              setActiveDayIndex(idx);
                              setActiveTab('input_day');
                            }}
                            title="Klik untuk input/edit hari ini"
                            className={`border-b border-stone-700 font-semibold text-xs h-9 transition-colors cursor-pointer ${
                              isThursday ? 'bg-amber-50/40 hover:bg-amber-100/60' : 'hover:bg-emerald-50/50'
                            }`}
                          >
                            {/* HARI & TANGGAL */}
                            <td className="border-r-2 border-stone-900 px-1.5 py-1 text-center bg-stone-50">
                              <div className="font-bold flex items-center justify-center gap-1">
                                <span>{d.hari}</span>
                                {isThursday && (
                                  <span className="text-[9px] bg-amber-400 text-stone-950 px-1 rounded font-black">
                                    Gajian
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-stone-600 font-medium">
                                {d.tanggalDisplay}
                              </div>
                            </td>

                            {/* STOK: MASUK */}
                            <td className="border-r border-stone-900 px-1 py-1 text-center font-bold">
                              {d.isFilled && d.stokMasuk > 0 ? d.stokMasuk : '-'}
                            </td>

                            {/* URAIAN TERJUAL (4 columns) */}
                            <td className="border-r border-stone-900 px-1 py-1 w-9 text-center font-medium">
                              {d.isFilled && u[0] ? u[0] : '-'}
                            </td>
                            <td className="border-r border-stone-900 px-1 py-1 w-9 text-center font-medium">
                              {d.isFilled && u[1] ? u[1] : '-'}
                            </td>
                            <td className="border-r border-stone-900 px-1 py-1 w-9 text-center font-medium">
                              {d.isFilled && u[2] ? u[2] : '-'}
                            </td>
                            <td className="border-r border-stone-900 px-1 py-1 w-9 text-center font-medium">
                              {d.isFilled && u[3] ? u[3] : '-'}
                            </td>

                            {/* TERJUAL */}
                            <td className="border-r border-stone-900 px-1 py-1 text-center font-bold bg-emerald-50 text-emerald-950">
                              {d.isFilled ? d.terjual : '-'}
                            </td>

                            {/* SISA */}
                            <td className="border-r-2 border-stone-900 px-1 py-1 text-center font-bold bg-amber-50 text-amber-950">
                              {d.isFilled ? d.sisa : '-'}
                            </td>

                            {/* HARGA */}
                            <td className="border-r border-stone-900 px-1 py-1 text-center font-medium">
                              {formatRupiah(currentHarga)}
                            </td>

                            {/* CASH */}
                            <td className="border-r border-stone-900 px-1 py-1 text-right pr-2 font-medium">
                              {d.isFilled && d.cash > 0 ? formatRupiah(d.cash) : '-'}
                            </td>

                            {/* TRANSFER */}
                            <td className="border-r border-stone-900 px-1 py-1 text-right pr-2 font-medium">
                              {d.isFilled && d.transfer > 0 ? formatRupiah(d.transfer) : '-'}
                            </td>

                            {/* QRIS */}
                            <td className="border-r border-stone-900 px-1 py-1 text-right pr-2 font-medium">
                              {d.isFilled && d.qris > 0 ? formatRupiah(d.qris) : '-'}
                            </td>

                            {/* JUMLAH (MERAH JIKA SELISIH) */}
                            <td
                              className={`border-r-2 border-stone-900 px-1 py-1 text-right pr-2 font-bold ${
                                d.isFilled && d.isSelisih
                                  ? 'bg-red-50 text-red-600 font-extrabold underline decoration-red-500'
                                  : 'bg-stone-100 text-stone-900'
                              }`}
                            >
                              {d.isFilled ? formatRupiah(d.jumlah) : '-'}
                            </td>

                            {/* KETERANGAN */}
                            <td className="border-r-2 border-stone-900 px-2 py-1 text-left text-[10px] leading-tight font-medium bg-stone-50 truncate max-w-[120px]">
                              {d.keterangan || '-'}
                            </td>

                            {/* TARGET */}
                            <td className="border-r border-stone-900 px-1 py-1 text-center font-medium">
                              {currentTarget}
                            </td>

                            {/* GAJI */}
                            <td className="border-r border-stone-900 px-1 py-1 text-right pr-2 font-medium">
                              {d.isFilled ? formatRupiah(d.gaji) : '-'}
                            </td>

                            {/* BONUS */}
                            <td className="border-r border-stone-900 px-1 py-1 text-right pr-2 font-medium">
                              {d.isFilled && d.bonus > 0 ? formatRupiah(d.bonus) : d.isFilled ? '0' : '-'}
                            </td>

                            {/* TOTAL */}
                            <td className="border-r border-stone-900 px-1 py-1 text-right pr-2 font-bold bg-emerald-50 text-emerald-950">
                              {d.isFilled ? formatRupiah(d.total) : '-'}
                            </td>

                            {/* LEMBUR */}
                            <td className="px-1 py-1 text-right pr-2 font-medium">
                              {d.isFilled && d.lembur > 0 ? formatRupiah(d.lembur) : d.isFilled ? '0' : '-'}
                            </td>
                          </tr>
                        );
                      })}

                      {/* SUMMARY ROW: TOTAL 1 MINGGU (PENGHONORAN DI HARI KAMIS) */}
                      <tr className="bg-stone-200 border-t-2 border-b-2 border-stone-900 font-extrabold text-xs h-10">
                        <td className="border-r-2 border-stone-900 px-1.5 py-1 text-center font-black">
                          TOTAL 1 MINGGU
                        </td>

                        {/* Total Masuk */}
                        <td className="border-r border-stone-900 px-1 py-1 text-center font-black">
                          {weeklyTotals.totalMasuk}
                        </td>

                        {/* Uraian Span */}
                        <td colSpan={4} className="border-r border-stone-900 px-1 py-1 text-center text-[10px] text-stone-600 font-bold">
                          Total Terjual:
                        </td>

                        {/* Total Terjual */}
                        <td className="border-r border-stone-900 px-1 py-1 text-center font-black bg-emerald-100 text-emerald-950">
                          {weeklyTotals.totalTerjual}
                        </td>

                        {/* Total Sisa */}
                        <td className="border-r-2 border-stone-900 px-1 py-1 text-center font-black bg-amber-100 text-amber-950">
                          {weeklyTotals.totalSisa}
                        </td>

                        {/* Harga */}
                        <td className="border-r border-stone-900 px-1 py-1 text-center font-medium text-stone-500">
                          -
                        </td>

                        {/* Total Cash */}
                        <td className="border-r border-stone-900 px-1 py-1 text-right pr-2 font-bold">
                          {formatRupiah(weeklyTotals.totalCash)}
                        </td>

                        {/* Total Transfer */}
                        <td className="border-r border-stone-900 px-1 py-1 text-right pr-2 font-bold">
                          {formatRupiah(weeklyTotals.totalTransfer)}
                        </td>

                        {/* Total QRIS */}
                        <td className="border-r border-stone-900 px-1 py-1 text-right pr-2 font-bold">
                          {formatRupiah(weeklyTotals.totalQris)}
                        </td>

                        {/* Total Omset (Jumlah) */}
                        <td className="border-r-2 border-stone-900 px-1 py-1 text-right pr-2 font-black bg-stone-300 text-stone-950">
                          {formatRupiah(weeklyTotals.totalJumlah)}
                        </td>

                        {/* Keterangan */}
                        <td className="border-r-2 border-stone-900 px-1 py-1 text-center text-[10px] font-bold text-stone-700">
                          Honor Kamis
                        </td>

                        {/* Target */}
                        <td className="border-r border-stone-900 px-1 py-1 text-center font-bold">
                          {currentTarget * 7}
                        </td>

                        {/* Total Gaji */}
                        <td className="border-r border-stone-900 px-1 py-1 text-right pr-2 font-bold">
                          {formatRupiah(weeklyTotals.totalGaji)}
                        </td>

                        {/* Total Bonus */}
                        <td className="border-r border-stone-900 px-1 py-1 text-right pr-2 font-bold">
                          {formatRupiah(weeklyTotals.totalBonus)}
                        </td>

                        {/* Total (Gaji + Bonus) */}
                        <td className="border-r border-stone-900 px-1 py-1 text-right pr-2 font-black bg-emerald-100 text-emerald-950">
                          {formatRupiah(weeklyTotals.totalGajiPlusBonus)}
                        </td>

                        {/* Total Lembur */}
                        <td className="px-1 py-1 text-right pr-2 font-bold">
                          {formatRupiah(weeklyTotals.totalLembur)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* CALLOUT YELLOW NOTE & TOTAL REKAP PENGHONORAN KAMIS */}
                  <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                    <div className="bg-yellow-200 border-2 border-stone-800 p-3 rounded text-[11px] font-bold text-stone-950 max-w-md shadow-xs leading-relaxed">
                      NB : JUMLAH AKAN BERWARNA Merah JIKA JUMLAH tidak sama dengan CASH+TRANSFER+QRIS
                      <div className="mt-1 font-medium text-stone-800">
                        • Siklus mingguan: <strong>Jumat s/d Kamis</strong>
                        <br />• Penghonoran karyawan dibayarkan setiap hari <strong>Kamis</strong>
                      </div>
                    </div>

                    {/* HIGHLIGHT BOX PENGHONORAN KAMIS */}
                    <div className="p-3.5 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white rounded-xl shadow-xs border border-emerald-700 min-w-[280px]">
                      <span className="text-[11px] text-emerald-200 uppercase font-bold tracking-wider block">
                        Total Honor Karyawan 1 Minggu (Hari Kamis):
                      </span>
                      <div className="text-xl font-black text-amber-300 mt-0.5">
                        Rp {formatRupiah(weeklyTotals.grandTotalHonor)}
                      </div>
                      <div className="text-[10px] text-emerald-200 mt-1 border-t border-emerald-700/60 pt-1 flex justify-between">
                        <span>Gaji+Bonus: Rp {formatRupiah(weeklyTotals.totalGajiPlusBonus)}</span>
                        <span>Lembur: Rp {formatRupiah(weeklyTotals.totalLembur)}</span>
                      </div>
                    </div>
                  </div>

                  {/* SIGNATURE SECTION */}
                  <div className="mt-8 pt-4 border-t border-stone-200 grid grid-cols-2 text-center text-xs text-stone-800">
                    <div>
                      <p className="font-semibold text-stone-600">
                        Karyawan / Petugas Kios Rombong {rombongNumber}
                      </p>
                      <div className="h-14"></div>
                      <p className="font-bold underline text-stone-900">( ........................................ )</p>
                      <p className="text-[10px] text-stone-500">Menerima honor pada hari Kamis</p>
                    </div>

                    <div>
                      <p className="font-semibold text-stone-600">
                        Pengelola / Owner Onde-onde Gapuro
                      </p>
                      <div className="h-14"></div>
                      <p className="font-bold underline text-stone-900">( ........................................ )</p>
                      <p className="text-[10px] text-stone-500">Menyerahkan honor & arsip laporan</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INPUT / EDIT HARI TERTENTU (JUMAT S/D KAMIS) */}
          {activeTab === 'input_day' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              
              {/* SELECTOR 7 HARI DALAM MINGGU INI */}
              <div className="bg-stone-50 border border-stone-300 p-2.5 rounded-xl space-y-1.5">
                <span className="text-xs font-bold text-stone-800 block">
                  Pilih Hari yang Ingin Diisi / Diperbarui:
                </span>
                <div className="grid grid-cols-7 gap-1">
                  {workingDays.map((d, idx) => (
                    <button
                      key={d.tanggalRaw}
                      type="button"
                      onClick={() => setActiveDayIndex(idx)}
                      className={`p-2 rounded-lg text-center transition-all cursor-pointer border ${
                        activeDayIndex === idx
                          ? 'bg-[#236d4e] text-white border-emerald-700 font-bold shadow-xs'
                          : d.isFilled
                          ? 'bg-emerald-50 text-emerald-950 border-emerald-300 font-semibold'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <div className="text-[11px] leading-tight">{d.hari}</div>
                      <div className="text-[9px] opacity-80 mt-0.5">{d.tanggalDisplay}</div>
                      {d.isFilled && (
                        <div className="text-[8px] bg-emerald-600 text-white rounded mt-1 px-1 py-0.2">
                          Terisi
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* FORM INPUT HARI INI */}
              <form onSubmit={handleSaveDay} className="space-y-3.5">
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-amber-950 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm">
                      Form Input: {currentDayItem?.hari}, {currentDayItem?.tanggalDisplay}
                    </span>
                    <p className="text-[11px] text-amber-900 mt-0.5">
                      Kios {ROMBONG_NAMES[selectedRombong]?.toUpperCase()} • Periode {periodInfo.periodLabel}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-stone-500 block">Target Harian:</span>
                    <span className="font-bold text-emerald-800 text-xs">{currentTarget} butir</span>
                  </div>
                </div>

                {/* 1. SEKSI STOK */}
                <div className="bg-white border-2 border-stone-300 rounded-xl p-3.5 space-y-3 shadow-xs">
                  <div className="font-bold text-xs text-stone-900 flex items-center gap-1.5 border-b pb-1.5 border-stone-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <span>1. STOK ONDE-ONDE ({currentDayItem?.hari})</span>
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
                        URAIAN TERJUAL (4 Sesi / Gelombang):
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
                      <span className="text-base font-bold text-emerald-950">{calcActiveDay.terjual} butir</span>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
                      <span className="text-[10px] text-amber-800 font-semibold block">Sisa Stok (Otomatis):</span>
                      <span className="text-base font-bold text-amber-950">{calcActiveDay.sisa} butir</span>
                    </div>
                  </div>
                </div>

                {/* 2. SEKSI PEMBAYARAN */}
                <div className="bg-white border-2 border-stone-300 rounded-xl p-3.5 space-y-3 shadow-xs">
                  <div className="font-bold text-xs text-stone-900 flex items-center justify-between border-b pb-1.5 border-stone-200">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                      <span>2. PEMBAYARAN KASIR ({currentDayItem?.hari})</span>
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

                  {/* Validation & Omset Result */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-stone-200">
                    <div className="p-2.5 bg-stone-100 rounded-lg border border-stone-300">
                      <span className="text-[10px] text-stone-600 block">Jumlah Seharusnya (Terjual × Harga):</span>
                      <span className={`text-base font-bold ${calcActiveDay.isSelisih && (cash !== '' || transfer !== '' || qris !== '') ? 'text-red-600' : 'text-stone-900'}`}>
                        Rp {formatRupiah(calcActiveDay.jumlah)}
                      </span>
                    </div>

                    <div className={`p-2.5 rounded-lg border ${calcActiveDay.isSelisih && (cash !== '' || transfer !== '' || qris !== '') ? 'bg-red-50 border-red-300 text-red-950' : 'bg-emerald-50 border-emerald-300 text-emerald-950'}`}>
                      <span className="text-[10px] block font-semibold">Total Setoran Kasir (Cash+Transfer+QRIS):</span>
                      <span className="text-base font-bold">
                        Rp {formatRupiah(calcActiveDay.totalBayarDiterima)}
                      </span>
                      {calcActiveDay.isSelisih && (cash !== '' || transfer !== '' || qris !== '') && (
                        <span className="block text-[10px] text-red-700 font-bold mt-0.5">
                          ⚠️ Selisih: Rp {formatRupiah(calcActiveDay.selisih)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. KETERANGAN */}
                <div className="bg-white border-2 border-stone-300 rounded-xl p-3.5 space-y-2 shadow-xs">
                  <label className="block text-xs font-bold text-stone-800">
                    3. KETERANGAN / CATATAN ({currentDayItem?.hari}):
                  </label>
                  <textarea
                    rows={2}
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Catatan jika ada onde-onde afkir, pesanan khusus, dsb."
                    className="w-full text-xs p-2.5 border border-stone-400 rounded-lg bg-stone-50 focus:bg-white focus:outline-emerald-600"
                  />
                </div>

                {/* 4. PENDAPATAN HARIAN */}
                <div className="bg-white border-2 border-stone-300 rounded-xl p-3.5 space-y-3 shadow-xs">
                  <div className="font-bold text-xs text-stone-900 flex items-center justify-between border-b pb-1.5 border-stone-200">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                      <span>4. PENDAPATAN HARI {currentDayItem?.hari}</span>
                    </span>
                    <span className="text-[10px] text-stone-500 font-medium">
                      Target: {currentTarget} butir
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 bg-stone-50 rounded border border-stone-200">
                      <span className="text-[10px] text-stone-600 block">Gaji Pokok:</span>
                      <span className="font-bold text-stone-900">Rp {formatRupiah(calcActiveDay.gaji)}</span>
                    </div>

                    <div className="p-2 bg-stone-50 rounded border border-stone-200">
                      <span className="text-[10px] text-stone-600 block">Bonus Target:</span>
                      <span className="font-bold text-emerald-700">Rp {formatRupiah(calcActiveDay.bonus)}</span>
                    </div>

                    <div className="p-2 bg-emerald-50 rounded border border-emerald-300">
                      <span className="text-[10px] text-emerald-800 block">Total Hari Ini:</span>
                      <span className="font-bold text-emerald-950">Rp {formatRupiah(calcActiveDay.total)}</span>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-stone-700 block mb-0.5">
                        Lembur (Rp):
                      </label>
                      <input
                        type="text"
                        value={lembur ? formatRupiah(parseNumber(lembur)) : ''}
                        onChange={(e) => setLembur(e.target.value)}
                        placeholder="0"
                        className="w-full text-right text-xs font-bold font-mono px-2 py-1 border border-stone-400 rounded bg-white"
                      />
                    </div>
                  </div>
                </div>

                {saveSuccess && (
                  <div className="p-3 bg-emerald-100 border border-emerald-400 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5 animate-fade-in shadow-xs">
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>Data {currentDayItem?.hari} berhasil disimpan ke laporan mingguan!</span>
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
                    <span>{isSaving ? 'Menyimpan...' : `Simpan Data Hari ${currentDayItem?.hari}`}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: ARSIP PERIODE MINGGUAN LAMA ("YANG LAMA TERSIMPAN") */}
          {activeTab === 'history' && (
            <div className="space-y-3 max-w-3xl mx-auto">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h4 className="text-xs font-bold text-stone-900">
                    Arsip Laporan Mingguan: Kios {ROMBONG_NAMES[selectedRombong]?.toUpperCase()}
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Setiap periode 1 minggu (Jumat s/d Kamis) tersimpan permanen dan dapat dilihat/diunduh kapan saja.
                  </p>
                </div>

                <button
                  onClick={handleOpenNextWeek}
                  className="px-3 py-1.5 bg-[#236d4e] text-white hover:bg-[#1b553d] rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Buka Periode Baru</span>
                </button>
              </div>

              {rombongArchivedReports.length === 0 ? (
                <div className="p-8 text-center text-stone-400 text-xs bg-stone-50 rounded-xl border border-dashed border-stone-300">
                  Belum ada arsip mingguan yang tersimpan untuk kios ini. Mulai dengan mengisi data pada periode berjalan!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {rombongArchivedReports.map((rep) => {
                    const isClosed = rep.status === 'selesai';
                    const isCurrent = rep.startDateRaw === periodInfo.startDateRaw;

                    return (
                      <div
                        key={rep.id}
                        className={`p-3.5 bg-white border rounded-xl transition-all shadow-2xs flex flex-wrap items-center justify-between gap-3 ${
                          isCurrent
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                            : 'border-stone-200 hover:border-emerald-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-stone-900">
                              {rep.periodLabel}
                            </span>
                            {isClosed ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Selesai (Tutup Buku)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                Sedang Berjalan
                              </span>
                            )}
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                                Aktif Saat Ini
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-stone-600 mt-1 flex flex-wrap items-center gap-3">
                            <span>
                              Terjual: <strong>{rep.totalTerjual} butir</strong>
                            </span>
                            <span>
                              Omset: <strong>Rp {formatRupiah(rep.totalJumlah)}</strong>
                            </span>
                            <span className="text-emerald-800 font-bold">
                              Honor Kamis: Rp {formatRupiah(rep.grandTotalHonor || rep.totalGajiPlusBonus)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFridayDate(parseDateFromRaw(rep.startDateRaw));
                              setActiveTab('preview');
                            }}
                            className="px-3 py-1.5 text-xs font-bold bg-[#236d4e] hover:bg-[#1b553d] text-white rounded-lg cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Buka Tabel & PDF</span>
                          </button>

                          {isAdmin && onDeleteWeeklyReport && (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Hapus arsip laporan periode ${rep.periodLabel}?`
                                  )
                                ) {
                                  onDeleteWeeklyReport(rep.id);
                                }
                              }}
                              className="p-1.5 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Hapus arsip periode ini"
                            >
                              <Trash2 className="w-4 h-4" />
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
