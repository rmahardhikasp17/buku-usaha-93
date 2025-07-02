
import React, { useState } from 'react';
import { Calendar, Download, FileText, DollarSign, Users, PiggyBank, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../utils/dataManager';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface BusinessData {
  services: any[];
  employees: any[];
  dailyRecords: Record<string, any>;
  transactions: Record<string, any>;
}

interface MonthlyReportProps {
  businessData: BusinessData;
}

interface PerEmployeeSalary {
  employeeId: string;
  name: string;
  role: string;
  gaji: number;
  bonus: number;
  potongan: number;
}

const MonthlyReport: React.FC<MonthlyReportProps> = ({ businessData }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [reportData, setReportData] = useState<any>(null);

  // Helper functions
  const calculateServiceTotal = (serviceId: string, quantity: number) => {
    const service = businessData.services?.find(s => s.id === serviceId);
    if (!service || !service.price || quantity <= 0) return 0;
    return service.price * quantity;
  };

  const calculateBonusTotal = (bonusServices: any, bonusQuantities: any) => {
    if (!bonusServices || !bonusQuantities) return 0;
    
    let total = 0;
    Object.entries(bonusServices).forEach(([serviceId, bonusData]: [string, any]) => {
      Object.entries(bonusData || {}).forEach(([bonusId, isEnabled]: [string, any]) => {
        if (isEnabled) {
          const bonusService = businessData.services?.find(s => s.id === bonusId);
          const bonusQty = bonusQuantities[serviceId]?.[bonusId] || 0;
          total += (bonusService?.price || 0) * bonusQty;
        }
      });
    });
    
    return total;
  };

  const calculateEmployeeSalary = (record: any, isOwner: boolean, totalEmployeeRevenue: number, employeeCount: number, activeDays: number) => {
    const serviceRevenue = Object.entries(record.services || {})
      .filter(([_, quantity]) => Number(quantity) > 0)
      .reduce((sum, [serviceId, quantity]) => {
        return sum + calculateServiceTotal(serviceId, Number(quantity));
      }, 0);

    const bonusTotal = calculateBonusTotal(record.bonusServices, record.bonusQuantities);

    if (isOwner) {
      const employeeShareRevenue = totalEmployeeRevenue * 0.5;
      const dailySavings = 40000 * activeDays;
      const employeeDeduction = 10000 * employeeCount;
      
      return serviceRevenue + bonusTotal + employeeShareRevenue - dailySavings - employeeDeduction;
    } else {
      const baseRevenue = serviceRevenue * 0.5;
      const attendanceBonus = 10000;
      
      return baseRevenue + bonusTotal + attendanceBonus;
    }
  };

  const calculatePerEmployeeSalaries = (monthlyRecords: any[]): PerEmployeeSalary[] => {
    const employeeSalaries: Record<string, PerEmployeeSalary> = {};

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

      // Use saved data from daily records
      employeeSalaries[employeeId].gaji += (record.gajiDiterima || 0);
      employeeSalaries[employeeId].bonus += (record.bonusTotal || 0);
      employeeSalaries[employeeId].potongan += (record.potongan || 0);
    });

    return Object.values(employeeSalaries);
  };

  const calculateMonthlyReport = () => {
    const [year, month] = selectedMonth.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);
    
    // Filter daily records for the selected month
    const monthlyRecords = Object.values(businessData.dailyRecords || {}).filter((record: any) => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= endDate;
    });

    // Filter transactions for the selected month
    const monthlyTransactions = Object.values(businessData.transactions || {}).filter((transaction: any) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    // Use saved data from dailyRecords instead of recalculating
    const totalGajiKaryawan = monthlyRecords
      .filter(record => {
        const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
        return employee?.role === 'Karyawan';
      })
      .reduce((sum, record) => sum + (record.gajiDiterima || 0), 0);

    const totalGajiOwner = monthlyRecords
      .filter(record => {
        const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
        return employee?.role === 'Owner';
      })
      .reduce((sum, record) => sum + (record.gajiDiterima || 0), 0);

    const totalTabunganOwner = monthlyRecords.reduce((sum, record) => sum + (record.potongan || 0), 0);

    const totalBonus = monthlyRecords.reduce((sum, record) => sum + (record.bonusTotal || 0), 0);

    // Calculate total revenue from services
    const totalPendapatan = monthlyRecords.reduce((sum: number, record: any) => {
      const recordTotal = Object.entries(record.services || {})
        .filter(([_, quantity]) => Number(quantity) > 0)
        .reduce((recordSum, [serviceId, quantity]) => {
          return recordSum + calculateServiceTotal(serviceId, Number(quantity));
        }, 0);
      return sum + recordTotal;
    }, 0);
    
    const totalPengeluaran = monthlyTransactions
      .filter((t: any) => t.type === 'Pengeluaran')
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

    // Calculate active days and employee count
    const activeDays = new Set(monthlyRecords.map((record: any) => record.date)).size;
    const activeEmployees = new Set(monthlyRecords.map((record: any) => record.employeeId)).size;

    // Calculate net profit using saved data
    const labaBersih = totalPendapatan - totalPengeluaran - totalGajiKaryawan - totalTabunganOwner;

    // Calculate per employee salaries
    const perEmployeeSalaries = calculatePerEmployeeSalaries(monthlyRecords);

    setReportData({
      totalPendapatan,
      totalPengeluaran,
      totalGajiKaryawan,
      totalTabunganOwner,
      totalBonus,
      labaBersih,
      activeDays,
      activeEmployees,
      ownerSalary: totalGajiOwner,
      monthlyRecords,
      monthlyTransactions,
      perEmployeeSalaries
    });
  };

  const exportToExcel = async () => {
    if (!reportData || !reportData.monthlyRecords) {
      toast.error('No data to export');
      return;
    }

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
        ['Total Bonus', reportData.totalBonus],
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
          ['Tanggal', 'Karyawan', 'Role', 'Gaji Diterima', 'Bonus', 'Potongan'],
          ...reportData.monthlyRecords.map((record: any) => {
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

      // Gaji per orang sheet
      if (reportData.perEmployeeSalaries && reportData.perEmployeeSalaries.length > 0) {
        const salaryData = [
          ['Nama', 'Role', 'Total Gaji', 'Bonus', 'Potongan', 'Keterangan'],
          ...reportData.perEmployeeSalaries.map((emp: PerEmployeeSalary) => [
            emp.name,
            emp.role,
            emp.gaji,
            emp.bonus,
            emp.potongan,
            emp.gaji < 2000000 ? 'Belum UMR' : 'Sesuai UMR'
          ])
        ];

        const salarySheet = XLSX.utils.aoa_to_sheet(salaryData);
        XLSX.utils.book_append_sheet(workbook, salarySheet, 'GajiPerOrang');
      }

      // Transactions sheet
      if (reportData.monthlyTransactions && reportData.monthlyTransactions.length > 0) {
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
      toast.success('Excel file exported successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export to Excel');
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
          <button
            onClick={exportToExcel}
            disabled={!reportData}
            className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={20} />
            <span>Export to Excel</span>
          </button>
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

          {/* Employee Salaries Section */}
          {reportData.perEmployeeSalaries && reportData.perEmployeeSalaries.length > 0 && (
            <div className="bg-gray-50 rounded-xl shadow-sm p-8 border border-gray-300">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">💼 Rangkuman Gaji Karyawan Bulan Ini</h3>
              <div className="space-y-4">
                {reportData.perEmployeeSalaries.map((emp: PerEmployeeSalary, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">
                        {emp.role === 'Owner' ? '👤' : '🧑‍🔧'}
                      </span>
                      <div>
                        <div className="font-medium text-gray-800">
                          {emp.name} ({emp.role})
                        </div>
                        {emp.bonus > 0 && (
                          <div className="text-sm text-gray-600">
                            Bonus: {formatCurrency(emp.bonus)}
                          </div>
                        )}
                        {emp.potongan > 0 && (
                          <div className="text-sm text-gray-600">
                            Potongan: {formatCurrency(emp.potongan)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-lg text-gray-800">{formatCurrency(emp.gaji)}</span>
                      <Badge 
                        variant={emp.gaji >= 2000000 ? "default" : "destructive"}
                        className={emp.gaji >= 2000000 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        {emp.gaji >= 2000000 ? 'Sesuai UMR' : 'Belum UMR'}
                      </Badge>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4 mt-6">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800 text-lg">🧾 Total Gaji Dibayarkan :</span>
                    <span className="font-bold text-2xl text-green-600">
                      {formatCurrency(reportData.totalGajiKaryawan + Math.max(0, reportData.ownerSalary || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

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
