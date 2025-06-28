import { useState } from 'react';
import {
  calculateEmployeeSalary,
  calculateOwnerSalary,
  exportMonthlyReportToExcel
} from '../utils/dataManager';

export interface MonthlyRecap {
  bulan: number;
  tahun: number;
  totalPendapatanService: number;
  totalPendapatanProduct: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  totalGajiKaryawan: number;
  totalGajiOwner: number;
  totalTabunganOwner: number;
  labaBersih: number;
  hariAktif: number;
  totalEmployeeSalaries: number;
  ownerSalary: number;
  totalRevenue: number;
  totalExpenses: number;
  ownerSavings: number;
  totalProductRevenue: number;
  netProfit: number;
  activeDays: number;
  activeEmployees: number;
  ownerBreakdown?: {
    ownerServiceRevenue: number;
    ownerBonus: number;
    ownerShareFromKaryawan: number;
    uangHadirKaryawan: number;
    tabunganHarian: number;
  };
  perEmployeeSalaries?: {
    employeeId: string;
    name: string;
    role: string;
    gaji: number;
    bonus: number;
    potongan: number;
  }[];
}

export const generateMonthlyRecap = (businessData: any, month: number, year: number): MonthlyRecap => {
  const allRecords = Object.values(businessData.dailyRecords || {}) as any[];
  const filteredRecords = allRecords.filter((record) => {
    const dateObj = new Date(record.date);
    return dateObj.getMonth() === month && dateObj.getFullYear() === year;
  });

  const groupedByDate: Record<string, any[]> = {};
  filteredRecords.forEach(record => {
    if (!groupedByDate[record.date]) groupedByDate[record.date] = [];
    groupedByDate[record.date].push(record);
  });

  let totalPendapatanService = 0;
  let totalPendapatanProduct = 0;
  let totalGajiKaryawan = 0;
  let totalGajiOwner = 0;
  let totalTabunganOwner = 0;
  let hariAktif = 0;

  const tabunganPerHari = businessData?.tabunganPerHari || 0;
  const perEmployeeSalaries: MonthlyRecap['perEmployeeSalaries'] = [];

  let ownerBreakdown: MonthlyRecap['ownerBreakdown'] = {
    ownerServiceRevenue: 0,
    ownerBonus: 0,
    ownerShareFromKaryawan: 0,
    uangHadirKaryawan: 0,
    tabunganHarian: tabunganPerHari
  };

  for (const [_, records] of Object.entries(groupedByDate)) {
    hariAktif += 1;

    for (const record of records) {
      const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
      const name = employee?.name || 'Tidak diketahui';
      const role = employee?.isOwner ? 'Owner' : 'Karyawan';

      const result = employee?.isOwner
        ? calculateOwnerSalary(records, businessData)
        : calculateEmployeeSalary(record, businessData);

      const gaji = result?.gajiDiterima || 0;
      const bonus = result?.bonusTotal || result?.bonus || 0;
      const potongan = result?.hadir || 0;

      if (employee?.isOwner) {
        totalGajiOwner += gaji;
        ownerBreakdown.ownerServiceRevenue += result?.layananOwner || 0;
        ownerBreakdown.ownerBonus += result?.bonusOwner || 0;
        ownerBreakdown.ownerShareFromKaryawan += result?.layananKaryawan * 0.5 || 0;
        ownerBreakdown.uangHadirKaryawan += result?.uangHadir || 0;
      } else {
        totalGajiKaryawan += gaji;
        perEmployeeSalaries.push({ employeeId: record.employeeId, name, role, gaji, bonus, potongan });
        totalPendapatanService += result?.layananTotal || 0;
      }

      const productSales = Object.entries(record.products || {}).reduce((sum, [productId, qty]) => {
        const product = businessData.products?.find(p => p.id === productId);
        return sum + ((product?.price || 0) * Number(qty));
      }, 0);
      totalPendapatanProduct += productSales;
    }

    totalTabunganOwner += tabunganPerHari;
  }

  const allIncomes = businessData.incomes || [];
  const allExpenses = businessData.expenses || [];

  const incomeThisMonth = allIncomes.filter((entry: any) => {
    const d = new Date(entry.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  const expenseThisMonth = allExpenses.filter((entry: any) => {
    const d = new Date(entry.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const totalPemasukan = incomeThisMonth.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalPengeluaran = expenseThisMonth.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const labaBersih = totalPemasukan;

  return {
    bulan: month,
    tahun: year,
    totalPendapatanService,
    totalPendapatanProduct,
    totalPemasukan,
    totalPengeluaran,
    totalGajiKaryawan,
    totalGajiOwner,
    totalTabunganOwner,
    labaBersih,
    hariAktif,
    totalEmployeeSalaries: totalGajiKaryawan,
    ownerSalary: totalGajiOwner,
    totalRevenue: totalPendapatanService,
    totalExpenses: totalPengeluaran,
    ownerSavings: totalTabunganOwner,
    totalProductRevenue: totalPendapatanProduct,
    netProfit: labaBersih,
    activeDays: hariAktif,
    activeEmployees: businessData.employees?.filter((e: any) => !e.isOwner)?.length || 0,
    ownerBreakdown,
    perEmployeeSalaries
  };
};

export const useMonthlyReport = (businessData: any) => {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  const [reportData, setReportData] = useState<MonthlyRecap | null>(null);
  const [showExport, setShowExport] = useState(false);

  const calculateMonthlyReport = () => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const month = Number(monthStr) - 1;
    const year = Number(yearStr);

    const result = generateMonthlyRecap(businessData, month, year);
    setReportData(result);
    setShowExport(true);
  };

  const handleExport = () => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    exportMonthlyReportToExcel(businessData, Number(monthStr) - 1, Number(yearStr));
  };

  return {
    selectedMonth,
    setSelectedMonth,
    reportData,
    calculateMonthlyReport,
    handleExport,
    showExport
  };
};
