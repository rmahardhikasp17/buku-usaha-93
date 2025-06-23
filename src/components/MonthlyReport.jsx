import { useState } from 'react';
import { toast } from 'sonner';

export function useMonthlyReport(businessData) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportData, setReportData] = useState(null);
  const [showExport, setShowExport] = useState(false);

  const getEmployeeRole = (employeeId) => {
    const employee = businessData.employees?.find(emp => emp.id === employeeId);
    return employee?.role || 'Unknown';
  };

  const getEmployeeName = (employeeId) => {
    const employee = businessData.employees?.find(emp => emp.id === employeeId);
    return employee?.name || 'Unknown';
  };

  const calculatePerEmployeeSalaries = (monthlyRecords) => {
    const employeeSalaries = {};
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
      employeeSalaries[employeeId].gaji += (record.gajiDiterima || 0);
      employeeSalaries[employeeId].bonus += (record.bonusTotal || 0);
      employeeSalaries[employeeId].potongan += (record.potongan || 0);
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

    const totalGajiKaryawan = monthlyRecords
      .filter(r => getEmployeeRole(r.employeeId) === 'Karyawan')
      .reduce((sum, r) => sum + (r.gajiDiterima || 0), 0);

    const totalGajiOwner = monthlyRecords
      .filter(r => getEmployeeRole(r.employeeId) === 'Owner')
      .reduce((sum, r) => sum + (r.gajiDiterima || 0), 0);

    const totalBonus = monthlyRecords.reduce((sum, r) => sum + (r.bonusTotal || 0), 0);

    // Tabungan owner hanya dari potongan milik Owner
    const ownerRecords = monthlyRecords.filter(r => getEmployeeRole(r.employeeId) === 'Owner');
    const employeeRecords = monthlyRecords.filter(r => getEmployeeRole(r.employeeId) === 'Karyawan');
    const totalTabunganOwner = ownerRecords.reduce((sum, r) => sum + (r.potongan || 0), 0);

    // Owner Service Revenue
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

    // Owner Bonus
    const ownerBonus = ownerRecords.reduce((sum, r) => sum + (r.bonusTotal || 0), 0);

    // Employee Revenue
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

    // 50% dari employee revenue
    const ownerShareFromKaryawan = employeeRevenue * 0.5;

    // Uang hadir karyawan (potongan per hari kerja karyawan)
    const totalEmployeeWorkingDays = employeeRecords.length;
    const uangHadirKaryawan = totalEmployeeWorkingDays * 10000;

    // Tabungan harian (potongan harian, biasanya untuk owner)
    const activeDays = new Set(monthlyRecords.map(record => record.date)).size;
    const tabunganHarian = activeDays * 40000;

    // Owner salary sesuai rumus
    const finalOwnerSalary = ownerServiceRevenue + ownerBonus + ownerShareFromKaryawan - uangHadirKaryawan - tabunganHarian;

    // Owner breakdown
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

    const income = monthlyTransactions
      .filter(t => t.type === 'Pemasukan')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = monthlyTransactions
      .filter(t => t.type === 'Pengeluaran')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalProductRevenue = monthlyProductSales.reduce((sum, sale) => sum + sale.total, 0);

    const activeEmployees = new Set(monthlyRecords.map(record => record.employeeId)).size;

    // Net profit = Total revenue + Income + Product revenue - Employee salaries - Owner salary - Expenses - Tabungan Owner
    const netProfit = totalRevenue + income + totalProductRevenue - totalGajiKaryawan - finalOwnerSalary - expenses - totalTabunganOwner;

    const perEmployeeSalaries = calculatePerEmployeeSalaries(monthlyRecords);

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
      toast.error('No data to export');
      return;
    }
    try {
      const XLSX = (await import('xlsx')).default;
      const workbook = XLSX.utils.book_new();

      // Ringkasan
      const summaryData = [
        ['LAPORAN BULANAN', selectedMonth],
        [''],
        ['RINGKASAN'],
        ['Total Pendapatan', reportData.totalRevenue],
        ['Total Pengeluaran', reportData.totalExpenses],
        ['Total Gaji Karyawan', reportData.totalEmployeeSalaries],
        ['Total Gaji Owner', reportData.ownerSalary],
        ['Total Tabungan Owner', reportData.ownerSavings],
        ['Total Product Revenue', reportData.totalProductRevenue],
        ['Laba Bersih', reportData.netProfit],
        [''],
        ['AKTIVITAS'],
        ['Hari Aktif', reportData.activeDays],
        ['Karyawan Aktif', reportData.activeEmployees]
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan Bulanan');

      // Data Harian
      if (reportData.monthlyRecords.length > 0) {
        const dailyData = [
          ['Tanggal', 'Karyawan', 'Role', 'Gaji Diterima', 'Bonus', 'Potongan'],
          ...reportData.monthlyRecords.map((record) => {
            const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
            return [
              record.date,
              employee?.name || 'Unknown',
              employee?.role || 'Unknown',
              record.gajiDiterima || 0,
              record.bonusTotal || 0,
              record.potongan || 0
            ];
          })
        ];
        const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
        XLSX.utils.book_append_sheet(workbook, dailySheet, 'Data Harian');
      }

      // Gaji per orang
      if (reportData.perEmployeeSalaries.length > 0) {
        const salaryData = [
          ['Nama', 'Role', 'Total Gaji', 'Bonus', 'Potongan', 'Keterangan'],
          ...reportData.perEmployeeSalaries.map((emp) => [
            emp.name,
            emp.role,
            emp.role === 'Owner' ? reportData.ownerSalary : emp.gaji,
            emp.bonus,
            emp.potongan,
            emp.role === 'Owner' ? 'Owner' : (emp.gaji >= 2000000 ? 'Sesuai UMR' : 'Belum UMR')
          ])
        ];
        const salarySheet = XLSX.utils.aoa_to_sheet(salaryData);
        XLSX.utils.book_append_sheet(workbook, salarySheet, 'GajiPerOrang');
      }

      // Transaksi
      if (reportData.monthlyTransactions && reportData.monthlyTransactions.length > 0) {
        const transactionData = [
          ['Tanggal', 'Jenis', 'Deskripsi', 'Nominal'],
          ...reportData.monthlyTransactions.map((transaction) => [
            transaction.date,
            transaction.type,
            transaction.description,
            transaction.amount
          ])
        ];
        const transactionSheet = XLSX.utils.aoa_to_sheet(transactionData);
        XLSX.utils.book_append_sheet(workbook, transactionSheet, 'Transaksi');
      }

      XLSX.writeFile(workbook, `Laporan_Bulanan_${selectedMonth}.xlsx`);
      toast.success('Monthly report exported successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export to Excel');
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