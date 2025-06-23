import React, { useState } from 'react';
import { Calendar, Download, FileText, DollarSign, Users, PiggyBank, TrendingUp, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '../utils/dataManager';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface BusinessData {
  services: any[];
  employees: any[];
  dailyRecords: Record<string, any>;
  transactions: Record<string, any>;
  productSales?: Record<string, any>;
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

interface ReportData {
  totalRevenue: number;
  totalExpenses: number;
  totalEmployeeSalaries: number;
  ownerSavings: number;
  totalBonuses: number;
  totalProductRevenue: number;
  netProfit: number;
  activeDays: number;
  activeEmployees: number;
  ownerSalary: number;
  income: number;
  monthlyRecords: any[];
  monthlyProductSales: any[];
  monthlyTransactions: any[];
  perEmployeeSalaries: PerEmployeeSalary[];
  ownerData: any;
}

const MonthlyReport: React.FC<MonthlyReportProps> = ({ businessData }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [showExport, setShowExport] = useState(false);

  const getEmployeeRole = (employeeId: string) => {
    const employee = businessData.employees?.find(emp => emp.id === employeeId);
    return employee?.role || 'Unknown';
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = businessData.employees?.find(emp => emp.id === employeeId);
    return employee?.name || 'Unknown';
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

      // Use saved data from daily records - no recalculation
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

    // Filter daily records for the selected month
    const monthlyRecords = Object.values(businessData.dailyRecords || {})
      .filter(record => record.date >= monthStart && record.date <= monthEnd);

    // Filter transactions for the selected month
    const monthlyTransactions = Object.values(businessData.transactions || {})
      .filter(transaction => transaction.date >= monthStart && transaction.date <= monthEnd);

    // Filter product sales for the selected month
    const monthlyProductSales = Object.values(businessData.productSales || {})
      .filter(sale => sale.date >= monthStart && sale.date <= monthEnd);

    // Calculate totals using ONLY saved data from dailyRecords
    const totalGajiKaryawan = monthlyRecords
      .filter(r => getEmployeeRole(r.employeeId) === 'Karyawan')
      .reduce((sum, r) => sum + (r.gajiDiterima || 0), 0);

    const totalGajiOwner = monthlyRecords
      .filter(r => getEmployeeRole(r.employeeId) === 'Owner')
      .reduce((sum, r) => sum + (r.gajiDiterima || 0), 0);

    const totalBonus = monthlyRecords.reduce((sum, r) => sum + (r.bonusTotal || 0), 0);

    // Calculate tabungan owner from potongan field only
    const totalTabunganOwner = monthlyRecords
      .filter(r => r.potongan && r.potongan > 0)
      .reduce((sum, r) => sum + (r.potongan || 0), 0);

    // Calculate revenue from services (for reference only - not for salary calculation)
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

    // Calculate income and expenses from transactions
    const income = monthlyTransactions
      .filter(t => t.type === 'Pemasukan')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = monthlyTransactions
      .filter(t => t.type === 'Pengeluaran')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate product sales revenue
    const totalProductRevenue = monthlyProductSales.reduce((sum, sale) => sum + sale.total, 0);

    // Calculate activity stats
    const activeDays = new Set(monthlyRecords.map(record => record.date)).size;
    const activeEmployees = new Set(monthlyRecords.map(record => record.employeeId)).size;

    // Net profit = Total revenue + Income + Product revenue - Employee salaries - Owner salary - Expenses
    const netProfit = totalRevenue + income + totalProductRevenue - totalGajiKaryawan - Math.max(0, totalGajiOwner) - expenses;

    // Calculate per employee salaries
    const perEmployeeSalaries = calculatePerEmployeeSalaries(monthlyRecords);

    // Calculate breakdown for display purposes
    const ownerRecords = monthlyRecords.filter(r => getEmployeeRole(r.employeeId) === 'Owner');
    const employeeRecords = monthlyRecords.filter(r => getEmployeeRole(r.employeeId) === 'Karyawan');
    
    const ownerRevenue = ownerRecords.reduce((sum, record) => {
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

    const totalEmployeeWorkingDays = employeeRecords.length;

    const ownerData = {
      ownerRevenue,
      ownerBonus,
      employeeRevenue,
      totalEmployeeWorkingDays
    };

    const data: ReportData = {
      totalRevenue,
      totalExpenses: expenses,
      totalEmployeeSalaries: totalGajiKaryawan,
      ownerSavings: totalTabunganOwner,
      totalBonuses: totalBonus,
      totalProductRevenue,
      netProfit,
      activeDays,
      activeEmployees,
      ownerSalary: totalGajiOwner,
      income,
      monthlyRecords,
      monthlyProductSales,
      monthlyTransactions,
      perEmployeeSalaries,
      ownerData
    };

    setReportData(data);
    setShowExport(true);
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
        ['Total Pendapatan', reportData.totalRevenue || 0],
        ['Total Pengeluaran', reportData.totalExpenses || 0],
        ['Total Gaji Karyawan', reportData.totalEmployeeSalaries || 0],
        ['Total Gaji Owner', reportData.ownerSalary || 0],
        ['Total Tabungan Owner', reportData.ownerSavings || 0],
        ['Total Product Revenue', reportData.totalProductRevenue || 0],
        ['Laba Bersih', reportData.netProfit || 0],
        [''],
        ['AKTIVITAS'],
        ['Hari Aktif', reportData.activeDays || 0],
        ['Karyawan Aktif', reportData.activeEmployees || 0]
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan Bulanan');

      // Daily records sheet
      if (reportData.monthlyRecords && reportData.monthlyRecords.length > 0) {
        const dailyData = [
          ['Tanggal', 'Karyawan', 'Role', 'Gaji Diterima', 'Bonus', 'Potongan'],
          ...reportData.monthlyRecords.map((record: any) => {
            const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
            return [
              record.date || '',
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
            emp.name || 'Unknown',
            emp.role || 'Unknown',
            emp.gaji || 0,
            emp.bonus || 0,
            emp.potongan || 0,
            emp.role === 'Owner' ? 'Owner' : (emp.gaji >= 2000000 ? 'Sesuai UMR' : 'Belum UMR')
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
            transaction.date || '',
            transaction.type || '',
            transaction.description || '',
            transaction.amount || 0
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

  // Calculate total salary paid to all employees from perEmployeeSalaries
  const totalSalaryPaid = reportData?.perEmployeeSalaries?.reduce((sum, emp) => sum + (emp.gaji || 0), 0) || 0;

  const stats = [
    {
      title: 'Total Pendapatan',
      value: reportData ? formatCurrency(reportData.totalRevenue) : formatCurrency(0),
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Total Pengeluaran',
      value: reportData ? formatCurrency(reportData.totalExpenses) : formatCurrency(0),
      icon: TrendingUp,
      color: 'bg-red-500'
    },
    {
      title: 'Total Gaji Karyawan',
      value: reportData ? formatCurrency(reportData.totalEmployeeSalaries) : formatCurrency(0),
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Tabungan Owner',
      value: reportData ? formatCurrency(reportData.ownerSavings) : formatCurrency(0),
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
          {showExport && (
            <button
              onClick={exportToExcel}
              disabled={!reportData}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={20} />
              <span>Export to Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Calendar size={16} />
              <span>Bulan & Tahun:</span>
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
          <button
            onClick={calculateMonthlyReport}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Hitung Rekap Bulanan
          </button>
        </div>
      </div>

      {/* Stats */}
      {reportData && (
        <>
          {/* Main Statistics - 4 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 ${stat.color.replace('bg-', 'bg-').replace('-500', '-100')} rounded-lg flex items-center justify-center`}>
                      <Icon className={stat.color.replace('bg-', 'text-')} size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional Statistics - Product Revenue */}
          {reportData.totalProductRevenue > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="text-orange-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Product Revenue</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(reportData.totalProductRevenue)}</p>
                  <p className="text-xs text-gray-500 mt-1">{reportData.monthlyProductSales?.length || 0} transactions</p>
                </div>
              </div>
            </div>
          )}

          {/* Employee Salaries Section */}
          {reportData.perEmployeeSalaries && reportData.perEmployeeSalaries.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">💼 Rangkuman Gaji Karyawan Bulan Ini</h3>
              <div className="space-y-3">
                {reportData.perEmployeeSalaries.map((emp: PerEmployeeSalary, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">
                        {emp.role === 'Owner' ? '👤' : '🧑‍🔧'}
                      </span>
                      <div>
                        <span className="font-medium text-gray-800">
                          {emp.name} ({emp.role})
                        </span>
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
                      <span className="font-bold text-gray-800">{formatCurrency(emp.gaji)}</span>
                      {emp.role === 'Owner' ? (
                        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
                          ✅ Owner
                        </Badge>
                      ) : (
                        <Badge 
                          className={emp.gaji >= 2000000 
                            ? "bg-green-100 text-green-800 hover:bg-green-100" 
                            : "bg-red-100 text-red-800 hover:bg-red-100"}
                        >
                          {emp.gaji >= 2000000 ? '✅ Sesuai UMR' : '❌ Belum UMR'}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800">🧾 Total Gaji Dibayarkan :</span>
                    <span className="font-bold text-xl text-green-600">
                      {formatCurrency(totalSalaryPaid)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`bg-white rounded-xl shadow-sm p-6 border border-gray-200 ${reportData.netProfit >= 0 ? 'border-green-200' : 'border-red-200'}`}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Laba Bersih</h3>
              <p className={`text-3xl font-bold ${reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(reportData.netProfit)}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Including product sales & owner salary
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Hari Aktif</h3>
              <p className="text-3xl font-bold text-blue-600">{reportData.activeDays}</p>
              <p className="text-sm text-gray-600 mt-2">
                Hari dengan aktivitas bisnis
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Karyawan Aktif</h3>
              <p className="text-3xl font-bold text-purple-600">{reportData.activeEmployees}</p>
              <p className="text-sm text-gray-600 mt-2">
                Karyawan yang bekerja bulan ini
              </p>
            </div>
          </div>

          {/* Owner Salary Breakdown */}
          {reportData.ownerData && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Owner Salary Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Owner Service Revenue:</span>
                  <span className="font-medium">{formatCurrency(reportData.ownerData.ownerRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Owner Bonus Services:</span>
                  <span className="font-medium">{formatCurrency(reportData.ownerData.ownerBonus)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">50% Employee Revenue:</span>
                  <span className="font-medium">{formatCurrency(reportData.ownerData.employeeRevenue * 0.5)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Daily Savings ({reportData.activeDays} days):</span>
                  <span className="font-medium text-red-600">-{formatCurrency(40000 * reportData.activeDays)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Employee Deductions ({reportData.ownerData.totalEmployeeWorkingDays} × 10k):</span>
                  <span className="font-medium text-red-600">-{formatCurrency(10000 * reportData.ownerData.totalEmployeeWorkingDays)}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800">Owner Final Salary:</span>
                    <span className={`font-bold text-xl ${reportData.ownerSalary >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(reportData.ownerSalary)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* No Data Message */}
      {!reportData && (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-200 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="text-gray-400" size={40} />
          </div>
          <h3 className="text-xl font-medium text-gray-600 mb-3">Pilih Bulan untuk Melihat Laporan</h3>
          <p className="text-gray-500">Klik "Hitung Rekap Bulanan" untuk generate laporan bulan yang dipilih</p>
        </div>
      )}
    </div>
  );
};

export default MonthlyReport;