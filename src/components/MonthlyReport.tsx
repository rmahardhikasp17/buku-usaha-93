
import React, { useState } from 'react';
import { Calendar, Download, FileText, DollarSign, Users, PiggyBank, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../utils/dataManager';

interface BusinessData {
  services: any[];
  employees: any[];
  dailyRecords: Record<string, any>;
  transactions: Record<string, any>;
}

interface MonthlyReportProps {
  businessData: BusinessData;
}

const MonthlyReport: React.FC<MonthlyReportProps> = ({ businessData }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [reportData, setReportData] = useState<any>(null);

  const calculateMonthlyReport = () => {
    const [year, month] = selectedMonth.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);
    
    // Filter daily records for the selected month
    const monthlyRecords = Object.values(businessData.dailyRecords).filter((record: any) => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= endDate;
    });

    // Filter transactions for the selected month
    const monthlyTransactions = Object.values(businessData.transactions).filter((transaction: any) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    // Calculate totals
    const totalPendapatan = monthlyRecords.reduce((sum: number, record: any) => sum + (record.totalRevenue || 0), 0);
    
    const totalPengeluaran = monthlyTransactions
      .filter((t: any) => t.type === 'Pengeluaran')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const totalGajiKaryawan = monthlyRecords.reduce((sum: number, record: any) => {
      const employee = businessData.employees.find(emp => emp.id === record.employeeId);
      if (employee?.role === 'Karyawan') {
        return sum + (record.gajiDiterima || 0);
      }
      return sum;
    }, 0);

    const totalTabunganOwner = monthlyRecords.reduce((sum: number, record: any) => {
      const employee = businessData.employees.find(emp => emp.id === record.employeeId);
      if (employee?.role === 'Owner') {
        return sum + (record.potongan || 0);
      }
      return sum;
    }, 0);

    const labaBersih = totalPendapatan - totalPengeluaran - totalGajiKaryawan - totalTabunganOwner;

    // Calculate active days and employees
    const activeDays = new Set(monthlyRecords.map((record: any) => record.date)).size;
    const activeEmployees = new Set(monthlyRecords.map((record: any) => record.employeeId)).size;

    setReportData({
      totalPendapatan,
      totalPengeluaran,
      totalGajiKaryawan,
      totalTabunganOwner,
      labaBersih,
      activeDays,
      activeEmployees,
      monthlyRecords,
      monthlyTransactions
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
        ['Total Tabungan Owner', reportData.totalTabunganOwner],
        ['Laba Bersih', reportData.labaBersih],
        [''],
        ['AKTIVITAS'],
        ['Hari Aktif', reportData.activeDays],
        ['Karyawan Aktif', reportData.activeEmployees]
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan Bulanan');

      // Daily records sheet
      if (reportData.monthlyRecords.length > 0) {
        const dailyData = [
          ['Tanggal', 'Karyawan', 'Role', 'Total Pendapatan', 'Potongan', 'Gaji Diterima'],
          ...reportData.monthlyRecords.map((record: any) => {
            const employee = businessData.employees.find(emp => emp.id === record.employeeId);
            return [
              record.date,
              record.employeeName || employee?.name || 'Unknown',
              record.employeeRole || employee?.role || 'Unknown',
              record.totalRevenue || 0,
              record.potongan || 0,
              record.gajiDiterima || 0
            ];
          })
        ];

        const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
        XLSX.utils.book_append_sheet(workbook, dailySheet, 'Data Harian');
      }

      // Transactions sheet
      if (reportData.monthlyTransactions.length > 0) {
        const transactionData = [
          ['Tanggal', 'Jenis', 'Deskripsi', 'Nominal'],
          ...reportData.monthlyTransactions.map((transaction: any) => [
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
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export to Excel');
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
      title: 'Total Tabungan Owner',
      value: reportData ? formatCurrency(reportData.totalTabunganOwner) : formatCurrency(0),
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
              <Download size={20} />
              <span>Export to Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-gray-50 rounded-xl shadow-sm p-8 border border-gray-300">
        <div className="flex items-center space-x-6">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-xl shadow-sm p-6 border border-gray-300">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Laba Bersih</h3>
              <p className={`text-3xl font-bold ${reportData.labaBersih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(reportData.labaBersih)}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Pendapatan - Pengeluaran - Gaji - Tabungan
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
