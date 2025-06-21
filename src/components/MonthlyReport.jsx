
import React, { useState } from 'react';
import { Calendar, DollarSign, TrendingUp, Users, PiggyBank, FileText } from 'lucide-react';
import { formatCurrency } from '../utils/dataManager';
import { toast } from '@/components/ui/sonner';

const MonthlyReport = ({ businessData }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [reportData, setReportData] = useState(null);

  const calculateOwnerMonthlySalary = (monthlyRecords) => {
    let totalOwnerSalary = 0;
    let totalOwnerRevenue = 0;
    let totalEmployeeRevenue = 0;
    
    // Group records by date to calculate daily owner salary
    const recordsByDate = {};
    monthlyRecords.forEach(record => {
      if (!recordsByDate[record.date]) {
        recordsByDate[record.date] = [];
      }
      recordsByDate[record.date].push(record);
    });

    Object.entries(recordsByDate).forEach(([date, dailyRecords]) => {
      let dailyOwnerRevenue = 0;
      let dailyEmployeeRevenue = 0;
      let dailyEmployeeCount = 0;

      dailyRecords.forEach(record => {
        const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
        const recordTotal = Object.entries(record.services || {})
          .filter(([_, quantity]) => Number(quantity) > 0)
          .reduce((sum, [serviceId, quantity]) => {
            const service = businessData.services?.find(s => s.id === serviceId);
            const servicePrice = Number(service?.price) || 0;
            const serviceQuantity = Number(quantity) || 0;
            return sum + (servicePrice * serviceQuantity);
          }, 0);

        if (employee?.role === 'Owner') {
          dailyOwnerRevenue += recordTotal;
          totalOwnerRevenue += recordTotal;
        } else if (employee?.role === 'Karyawan') {
          dailyEmployeeRevenue += recordTotal;
          totalEmployeeRevenue += recordTotal;
          dailyEmployeeCount++;
        }
      });

      // Calculate daily owner salary
      const dailyOwnerSalary = dailyOwnerRevenue + (dailyEmployeeRevenue * 0.5) - 40000 - (10000 * dailyEmployeeCount);
      totalOwnerSalary += dailyOwnerSalary;
    });

    return {
      totalOwnerSalary,
      totalOwnerRevenue,
      totalEmployeeRevenue
    };
  };

  const calculateMonthlyReport = () => {
    const [year, month] = selectedMonth.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);
    
    // Filter daily records for the selected month
    const monthlyRecords = Object.values(businessData.dailyRecords || {}).filter((record) => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= endDate;
    });

    // Filter transactions for the selected month
    const monthlyTransactions = Object.values(businessData.transactions || {}).filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    // Calculate total revenue
    const totalPendapatan = monthlyRecords.reduce((sum, record) => {
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
    
    const totalPengeluaran = monthlyTransactions
      .filter((t) => t.type === 'Pengeluaran')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // Calculate employee salaries (50% of their revenue)
    const totalGajiKaryawan = monthlyRecords.reduce((sum, record) => {
      const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
      if (employee?.role === 'Karyawan') {
        const recordTotal = Object.entries(record.services || {})
          .filter(([_, quantity]) => Number(quantity) > 0)
          .reduce((recordSum, [serviceId, quantity]) => {
            const service = businessData.services?.find(s => s.id === serviceId);
            const servicePrice = Number(service?.price) || 0;
            const serviceQuantity = Number(quantity) || 0;
            return recordSum + (servicePrice * serviceQuantity);
          }, 0);
        
        const potongan = recordTotal * 0.5; // 50% cut for employee
        return sum + potongan;
      }
      return sum;
    }, 0);

    // Calculate owner salary using new logic
    const ownerSalaryData = calculateOwnerMonthlySalary(monthlyRecords);
    const totalGajiOwner = ownerSalaryData.totalOwnerSalary;

    // Calculate owner savings (fixed daily amount × active days)
    const activeDays = new Set(monthlyRecords.map((record) => record.date)).size;
    const totalTabunganOwner = activeDays * 40000; // Rp 40,000 per active day

    const labaBersih = totalPendapatan - totalPengeluaran - totalGajiKaryawan - totalGajiOwner - totalTabunganOwner;

    // Calculate active employees
    const activeEmployees = new Set(monthlyRecords.map((record) => record.employeeId)).size;

    setReportData({
      totalPendapatan,
      totalPengeluaran,
      totalGajiKaryawan,
      totalGajiOwner,
      totalTabunganOwner,
      labaBersih,
      activeDays,
      activeEmployees,
      monthlyRecords,
      monthlyTransactions,
      ownerSalaryData
    });
  };

  const exportToExcel = async () => {
    if (!reportData) return;

    try {
      const XLSX = (await import('xlsx')).default;
      const workbook = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['LAPORAN BULANAN', selectedMonth],
        [''],
        ['RINGKASAN'],
        ['Total Pendapatan', reportData.totalPendapatan],
        ['Total Pengeluaran', reportData.totalPengeluaran],
        ['Total Gaji Karyawan', reportData.totalGajiKaryawan],
        ['Total Gaji Owner', reportData.totalGajiOwner],
        ['Total Tabungan Owner', reportData.totalTabunganOwner],
        ['Laba Bersih', reportData.labaBersih],
        [''],
        ['AKTIVITAS'],
        ['Hari Aktif', reportData.activeDays],
        ['Karyawan Aktif', reportData.activeEmployees]
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan Bulanan');

      XLSX.writeFile(workbook, `Laporan_Bulanan_${selectedMonth}.xlsx`);
      
      toast.success('Laporan berhasil diekspor ke Excel');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Gagal mengekspor laporan');
    }
  };

  const stats = [
    {
      title: 'Total Pendapatan',
      value: reportData ? formatCurrency(reportData.totalPendapatan) : formatCurrency(0),
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Total Pengeluaran',
      value: reportData ? formatCurrency(reportData.totalPengeluaran) : formatCurrency(0),
      icon: TrendingUp,
      color: 'bg-red-500'
    },
    {
      title: 'Total Gaji Karyawan',
      value: reportData ? formatCurrency(reportData.totalGajiKaryawan) : formatCurrency(0),
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Gaji Owner',
      value: reportData ? formatCurrency(reportData.totalGajiOwner) : formatCurrency(0),
      icon: PiggyBank,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gray-50 rounded-xl shadow-sm p-8 border border-gray-300">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Laporan Bulanan</h2>
            <p className="text-gray-600 mt-1">Generate monthly business reports</p>
          </div>
          {reportData && (
            <button
              onClick={exportToExcel}
              className="flex items-center space-x-2 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              <span>Export to Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-gray-50 rounded-xl shadow-sm p-8 border border-gray-300">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
          <div className="flex items-center space-x-3">
            <Calendar size={20} className="text-gray-600" />
            <label className="text-sm font-medium text-gray-700">Bulan & Tahun:</label>
          </div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={calculateMonthlyReport}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Hitung Rekap Bulanan
          </button>
        </div>
      </div>

      {/* Stats */}
      {reportData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-gray-50 rounded-xl shadow-sm p-6 border border-gray-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-xl font-bold text-gray-800">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <Icon className="text-white" size={20} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-50 rounded-xl shadow-sm p-6 border border-gray-300">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Laba Bersih</h3>
              <p className={`text-3xl font-bold ${reportData.labaBersih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(reportData.labaBersih)}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Setelah semua pengeluaran
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl shadow-sm p-6 border border-gray-300">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Tabungan Owner</h3>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(reportData.totalTabunganOwner)}</p>
              <p className="text-sm text-gray-600 mt-2">
                Rp 40k × {reportData.activeDays} hari
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl shadow-sm p-6 border border-gray-300">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Hari Aktif</h3>
              <p className="text-3xl font-bold text-blue-600">{reportData.activeDays}</p>
              <p className="text-sm text-gray-600 mt-2">
                Hari dengan aktivitas bisnis
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl shadow-sm p-6 border border-gray-300">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Karyawan Aktif</h3>
              <p className="text-3xl font-bold text-purple-600">{reportData.activeEmployees}</p>
              <p className="text-sm text-gray-600 mt-2">
                Karyawan yang bekerja bulan ini
              </p>
            </div>
          </div>

          {/* Owner Salary Breakdown */}
          <div className="bg-gray-50 rounded-xl shadow-sm p-6 border border-gray-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Rincian Gaji Owner</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Revenue dari layanan Owner:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(reportData.ownerSalaryData?.totalOwnerRevenue || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">50% dari revenue karyawan:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency((reportData.ownerSalaryData?.totalEmployeeRevenue || 0) * 0.5)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Tabungan harian ({reportData.activeDays} hari):</span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(reportData.totalTabunganOwner)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Potongan karyawan (10k × jumlah kehadiran):</span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(Math.max(0, (reportData.monthlyRecords?.filter(r => businessData.employees?.find(e => e.id === r.employeeId)?.role === 'Karyawan')?.length || 0) * 10000))}
                </span>
              </div>
              <div className="border-t border-gray-300 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Total Gaji Owner:</span>
                  <span className={`text-xl font-bold ${reportData.totalGajiOwner >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(reportData.totalGajiOwner)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* No Data Message */}
      {!reportData && (
        <div className="bg-gray-50 rounded-xl shadow-sm p-12 border border-gray-300 text-center">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Pilih Bulan untuk Melihat Laporan</h3>
          <p className="text-gray-500">
            Klik "Hitung Rekap Bulanan" untuk generate laporan bulan yang dipilih
          </p>
        </div>
      )}
    </div>
  );
};

export default MonthlyReport;
