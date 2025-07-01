
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
  hariAktif: number;
  totalEmployeeSalaries: number;
  ownerSalary: number;
  totalRevenue: number;
  totalExpenses: number;
  ownerSavings: number;
  totalProductRevenue: number;
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
  let ownerAttendanceDays = 0;

  const perEmployeeSalaries: MonthlyRecap['perEmployeeSalaries'] = [];
  const employeeSalariesByEmployee: Record<string, { gaji: number; bonus: number; potongan: number }> = {};

  let ownerBreakdown: MonthlyRecap['ownerBreakdown'] = {
    ownerServiceRevenue: 0,
    ownerBonus: 0,
    ownerShareFromKaryawan: 0,
    uangHadirKaryawan: 0,
    tabunganHarian: 0
  };

  // Calculate service revenue and salaries per day
  for (const [_, records] of Object.entries(groupedByDate)) {
    hariAktif += 1;

    // Check if owner is present this day
    const owner = businessData.employees?.find(emp => emp.isOwner);
    const ownerRecord = records.find(r => r.employeeId === owner?.id);
    if (ownerRecord) {
      ownerAttendanceDays += 1;
    }

    for (const record of records) {
      const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
      const name = employee?.name || 'Tidak diketahui';
      const role = employee?.isOwner ? 'Owner' : 'Karyawan';

      if (employee?.isOwner) {
        const result = calculateOwnerSalary(records, businessData);
        if (result) {
          totalGajiOwner += result.gajiDiterima;
          ownerBreakdown.ownerServiceRevenue += result.layananOwner || 0;
          ownerBreakdown.ownerBonus += result.bonusOwner || 0;
          ownerBreakdown.ownerShareFromKaryawan += (result.layananKaryawan || 0) * 0.5;
          ownerBreakdown.uangHadirKaryawan += result.uangHadir || 0;
        }
      } else {
        // Use calculateEmployeeSalary for accurate calculation
        const result = calculateEmployeeSalary(record, businessData);
        
        if (!employeeSalariesByEmployee[record.employeeId]) {
          employeeSalariesByEmployee[record.employeeId] = { gaji: 0, bonus: 0, potongan: 0 };
        }
        
        employeeSalariesByEmployee[record.employeeId].gaji += result.gajiDiterima;
        employeeSalariesByEmployee[record.employeeId].bonus += result.bonusTotal || 0;
        employeeSalariesByEmployee[record.employeeId].potongan += result.hadir || 0;
        
        totalGajiKaryawan += result.gajiDiterima;
        totalPendapatanService += result.layananTotal || 0;
      }

      // Calculate product sales
      const productSales = Object.entries(record.products || {}).reduce((sum, [productId, qty]) => {
        const product = businessData.products?.find(p => p.id === productId);
        return sum + ((product?.price || 0) * Number(qty));
      }, 0);
      totalPendapatanProduct += productSales;
    }
  }

  // Build per employee salary summary
  Object.entries(employeeSalariesByEmployee).forEach(([employeeId, salaryData]) => {
    const employee = businessData.employees?.find(emp => emp.id === employeeId);
    if (employee && !employee.isOwner) {
      perEmployeeSalaries.push({
        employeeId,
        name: employee.name,
        role: 'Karyawan',
        gaji: salaryData.gaji,
        bonus: salaryData.bonus,
        potongan: salaryData.potongan
      });
    }
  });

  // Calculate Owner Savings: Product Sales + 40,000 x Owner Attendance Days
  totalTabunganOwner = totalPendapatanProduct + (40000 * ownerAttendanceDays);
  ownerBreakdown.tabunganHarian = 40000 * ownerAttendanceDays;

  // Calculate expenses from expenses page
  const allExpenses = businessData.expenses || [];
  const expenseThisMonth = allExpenses.filter((entry: any) => {
    const d = new Date(entry.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  const totalPengeluaran = expenseThisMonth.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // Calculate incomes from incomes page
  const allIncomes = businessData.incomes || [];
  const incomeThisMonth = allIncomes.filter((entry: any) => {
    const d = new Date(entry.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  const totalPemasukan = incomeThisMonth.reduce((sum, e) => sum + Number(e.amount || 0), 0);

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
    hariAktif,
    totalEmployeeSalaries: totalGajiKaryawan,
    ownerSalary: totalGajiOwner,
    totalRevenue: totalPendapatanService,
    totalExpenses: totalPengeluaran,
    ownerSavings: totalTabunganOwner,
    totalProductRevenue: totalPendapatanProduct,
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
    const month = Number(monthStr) - 1;
    const year = Number(yearStr);

    const recap = generateMonthlyRecap(businessData, month, year);
    exportMonthlyReportToExcel(recap);
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
