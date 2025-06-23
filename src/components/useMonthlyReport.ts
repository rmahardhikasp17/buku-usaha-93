import { useState } from 'react';
import { toast } from 'sonner';
import { exportMonthlyReportToExcel } from '../utils/dataManager';

export interface Service {
  id: string;
  name: string;
  price: number;
}

export interface Employee {
  id: string;
  name: string;
  role: 'Owner' | 'Karyawan';
}

export interface DailyRecord {
  date: string;
  employeeId: string;
  gajiDiterima?: number;
  bonusTotal?: number;
  potongan?: number;
  services?: Record<string, number>;
}

export interface Transaction {
  date: string;
  type: 'Pemasukan' | 'Pengeluaran';
  amount: number;
  description: string;
}

export interface ProductSale {
  date: string;
  total: number;
}

export interface BusinessData {
  services: Service[];
  employees: Employee[];
  dailyRecords: Record<string, DailyRecord>;
  transactions: Record<string, Transaction>;
  productSales?: Record<string, ProductSale>;
}

export function useMonthlyReport(businessData: BusinessData) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportData, setReportData] = useState<any>(null);
  const [showExport, setShowExport] = useState(false);

  const getEmployeeRole = (employeeId: string): string => {
    const employee = businessData.employees?.find(emp => emp.id === employeeId);
    return employee?.role || 'Unknown';
  };

  const calculatePerEmployeeSalaries = (monthlyRecords: DailyRecord[]) => {
    const employeeSalaries: Record<string, any> = {};
    monthlyRecords.forEach(record => {
      const employeeId = record.employeeId;
      const employee = businessData.employees?.find(emp => emp.id === employeeId);
      if (!employeeSalaries[employeeId]) {
        employeeSalaries[employeeId] = {
          employeeId,
          name: employee?.name || 'Unknown',
          role: employee?.role || 'Unknown',
          gaji: 0,
          bonus: 0,
          potongan: 0
        };
      }
      employeeSalaries[employeeId].gaji += record.gajiDiterima || 0;
      employeeSalaries[employeeId].bonus += record.bonusTotal || 0;
      employeeSalaries[employeeId].potongan += record.potongan || 0;
    });
    return Object.values(employeeSalaries);
  };

  const calculateMonthlyReport = () => {
    const [year, month] = selectedMonth.split('-');
    const monthStart = `${year}-${month}-01`;
    const monthEnd = `${year}-${month}-31`;

    const monthlyRecords = Object.values(businessData.dailyRecords || {})
      .filter(record => record.date >= monthStart && record.date <= monthEnd);

    const monthlyTransactions = Object.values(businessData.transactions || {})
      .filter(transaction => transaction.date >= monthStart && transaction.date <= monthEnd);

    const monthlyProductSales = Object.values(businessData.productSales || {})
      .filter(sale => sale.date >= monthStart && sale.date <= monthEnd);

    const employeeRecords = monthlyRecords.filter(r => getEmployeeRole(r.employeeId) === 'Karyawan');
    const ownerRecords = monthlyRecords.filter(r => getEmployeeRole(r.employeeId) === 'Owner');

    const totalGajiKaryawan = employeeRecords.reduce((sum, r) => sum + (r.gajiDiterima || 0), 0);
    const totalBonus = monthlyRecords.reduce((sum, r) => sum + (r.bonusTotal || 0), 0);
    const totalTabunganOwner = ownerRecords.reduce((sum, r) => sum + (r.potongan || 0), 0);

    const ownerServiceRevenue = ownerRecords.reduce((sum, record) => {
      const recordTotal = Object.entries(record.services || {})
        .filter(([_, quantity]) => Number(quantity) > 0)
        .reduce((recordSum, [serviceId, quantity]) => {
          const service = businessData.services?.find(s => s.id === serviceId);
          const servicePrice = Number(service?.price) || 0;
          const serviceQuantity = Number(quantity) || 0;
          return recordSum + (servicePrice * serviceQuantity);
        }, 0);
      return sum + recordTotal;
    }, 0);

    const ownerBonus = ownerRecords.reduce((sum, r) => sum + (r.bonusTotal || 0), 0);

    const employeeRevenue = employeeRecords.reduce((sum, record) => {
      const recordTotal = Object.entries(record.services || {})
        .filter(([_, quantity]) => Number(quantity) > 0)
        .reduce((recordSum, [serviceId, quantity]) => {
          const service = businessData.services?.find(s => s.id === serviceId);
          const servicePrice = Number(service?.price) || 0;
          const serviceQuantity = Number(quantity) || 0;
          return recordSum + (servicePrice * serviceQuantity);
        }, 0);
      return sum + recordTotal;
    }, 0);

    const ownerShareFromKaryawan = employeeRevenue * 0.5;
    const uangHadirKaryawan = employeeRecords.length * 10000;
    const activeDays = new Set(monthlyRecords.map(record => record.date)).size;
    const tabunganHarian = activeDays * 40000;

    const finalOwnerSalary = ownerServiceRevenue + ownerBonus + ownerShareFromKaryawan - uangHadirKaryawan - tabunganHarian;

    const ownerBreakdown = {
      ownerServiceRevenue,
      ownerBonus,
      ownerShareFromKaryawan,
      uangHadirKaryawan,
      tabunganHarian,
      finalOwnerSalary
    };

    const totalRevenue = monthlyRecords.reduce((sum, record) => {
      const recordTotal = Object.entries(record.services || {})
        .filter(([_, quantity]) => Number(quantity) > 0)
        .reduce((recordSum, [serviceId, quantity]) => {
          const service = businessData.services?.find(s => s.id === serviceId);
          const servicePrice = Number(service?.price) || 0;
          const serviceQuantity = Number(quantity) || 0;
          return recordSum + (servicePrice * serviceQuantity);
        }, 0);
      return sum + recordTotal;
    }, 0);

    const income = monthlyTransactions.filter(t => t.type === 'Pemasukan').reduce((sum, t) => sum + t.amount, 0);
    const expenses = monthlyTransactions.filter(t => t.type === 'Pengeluaran').reduce((sum, t) => sum + t.amount, 0);
    const totalProductRevenue = monthlyProductSales.reduce((sum, sale) => sum + sale.total, 0);
    const activeEmployees = new Set(monthlyRecords.map(record => record.employeeId)).size;

    const netProfit = totalRevenue + income + totalProductRevenue - totalGajiKaryawan - finalOwnerSalary - expenses - totalTabunganOwner;

    const perEmployeeSalaries = calculatePerEmployeeSalaries(monthlyRecords);
    perEmployeeSalaries.forEach(emp => {
      if (emp.role === 'Owner') {
        emp.gaji = finalOwnerSalary;
      }
    });

    const data = {
      totalRevenue,
      totalExpenses: expenses,
      totalEmployeeSalaries: totalGajiKaryawan,
      ownerSavings: totalTabunganOwner,
      totalBonuses: totalBonus,
      totalProductRevenue,
      netProfit,
      activeDays,
      activeEmployees,
      ownerSalary: finalOwnerSalary,
      income,
      monthlyRecords,
      monthlyProductSales,
      monthlyTransactions,
      perEmployeeSalaries,
      ownerBreakdown
    };

    setReportData(data);
    setShowExport(true);
  };

  const handleExport = async () => {
    if (!reportData) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    try {
      await exportMonthlyReportToExcel(reportData, businessData, selectedMonth);
      toast.success('Berhasil ekspor laporan bulanan ke Excel');
    } catch (error) {
      console.error('Gagal ekspor:', error);
      toast.error('Gagal ekspor ke Excel');
    }
  };

  return {
    selectedMonth,
    setSelectedMonth,
    reportData,
    calculateMonthlyReport,
    handleExport,
    showExport
  };
}
