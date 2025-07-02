import React, { useState } from 'react';
import { Calendar, Download, DollarSign, TrendingUp, Users, PiggyBank, FileText, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '../utils/dataManager';
import { toast } from 'sonner';

const MonthlyReport = ({ businessData }) => {
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

    // Filter daily records for the selected month
    const monthlyRecords = Object.values(businessData.dailyRecords || {})
      .filter(record => record.date >= monthStart && record.date <= monthEnd);

    // Filter transactions for the selected month
    const monthlyTransactions = Object.values(businessData.transactions || {})
      .filter(transaction => transaction.date >= monthStart && transaction.date <= monthEnd);

    // Filter product sales for the selected month
    const monthlyProductSales = Object.values(businessData.productSales || {})
      .filter(sale => sale.date >= monthStart && sale.date <= monthEnd);

    // Use saved data from dailyRecords
    const totalGajiKaryawan = monthlyRecords
      .filter(r => getEmployeeRole(r.employeeId) === 'Karyawan')
      .reduce((sum, r) => sum + (r.gajiDiterima || 0), 0);

    const totalGajiOwner = monthlyRecords
      .filter(r => getEmployeeRole(r.employeeId) === 'Owner')
      .reduce((sum, r) => sum + (r.gajiDiterima || 0), 0);

    const totalBonus = monthlyRecords.reduce((sum, r) => sum + (r.bonusTotal || 0), 0);

    const totalTabungan = monthlyRecords.reduce((sum, r) => sum + (r.potongan || 0), 0);

    // Calculate revenue from services
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

    const data = {
      totalRevenue,
      totalExpenses: expenses,
      totalEmployeeSalaries: totalGajiKaryawan,
      ownerSavings: totalTabungan,
      totalBonuses: totalBonus,
      totalProductRevenue,
      netProfit,
      activeDays,
      activeEmployees,
      ownerSalary: totalGajiOwner,
      income,
      monthlyRecords,
      monthlyProductSales,
      perEmployeeSalaries
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

      // Summary sheet
      const summaryData = [
        ['LAPORAN BULANAN', selectedMonth],
        [''],
        ['RINGKASAN'],
        ['Total Pendapatan', reportData.totalRevenue],
        ['Total Pengeluaran', reportData.totalExpenses],
        ['Total Gaji Karyawan', reportData.totalEmployeeSalaries],
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

      // Daily records sheet
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

      // Gaji per orang sheet
      if (reportData.perEmployeeSalaries.length > 0) {
        const salaryData = [
          ['Nama', 'Role', 'Total Gaji', 'Bonus', 'Potongan', 'Keterangan'],
          ...reportData.perEmployeeSalaries.map((emp) => [
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
      if (reportData.monthlyRecords && reportData.monthlyRecords.length > 0) {
        const transactionData = [
          ['Tanggal', 'Jenis', 'Deskripsi', 'Nominal'],
          ...Object.values(businessData.transactions || {})
            .filter(transaction => {
              const [year, month] = selectedMonth.split('-');
              const monthStart = `${year}-${month}-01`;
              const monthEnd = `${year}-${month}-31`;
              return transaction.date >= monthStart && transaction.date <= monthEnd;
            })
            .map((transaction) => [
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-barbershop-cream rounded-xl shadow-sm p-8 border border-barbershop-red">
        <h2 className="text-2xl font-bold text-gray-800">Laporan Bulanan</h2>
        <p className="text-gray-600 mt-2">Generate monthly business reports</p>
      </div>

      {/* Filter Form */}
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-barbershop-red focus:border-transparent bg-white"
            />
          </div>
          <button
            onClick={calculateMonthlyReport}
            className="bg-barbershop-blue text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
          >
            Hitung Rekap Bulanan
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      {reportData && (
        <>
          {/* Main Statistics - 5 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Pendapatan</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.totalRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-red-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Pengeluaran</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(reportData.totalExpenses)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Gaji Karyawan</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(reportData.totalEmployeeSalaries)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <PiggyBank className="text-yellow-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Tabungan Owner</p>
                  <p className="text-2xl font-bold text-yellow-600">{formatCurrency(reportData.ownerSavings)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="text-orange-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Product Revenue</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(reportData.totalProductRevenue)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Statistics - 3 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 ${reportData.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-lg flex items-center justify-center`}>
                  <DollarSign className={reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'} size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Laba Bersih</p>
                  <p className={`text-2xl font-bold ${reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(reportData.netProfit)}
                  </p>
                  <p className="text-xs text-gray-500">Including product sales</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Hari Aktif</p>
                  <p className="text-2xl font-bold text-purple-600">{reportData.activeDays}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Users className="text-indigo-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Karyawan Aktif</p>
                  <p className="text-2xl font-bold text-indigo-600">{reportData.activeEmployees}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bonus Services Summary */}
          {reportData.totalBonuses > 0 && (
            <div className="bg-yellow-50 rounded-xl shadow-sm p-6 border border-yellow-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-yellow-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Bonus Services</p>
                  <p className="text-2xl font-bold text-yellow-600">{formatCurrency(reportData.totalBonuses)}</p>
                  <p className="text-xs text-gray-500 mt-1">100% bonus diberikan ke karyawan</p>
                </div>
              </div>
            </div>
          )}

          {/* Product Sales Summary */}
          {reportData.totalProductRevenue > 0 && (
            <div className="bg-orange-50 rounded-xl shadow-sm p-6 border border-orange-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="text-orange-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Product Sales</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(reportData.totalProductRevenue)}</p>
                  <p className="text-xs text-gray-500 mt-1">{reportData.monthlyProductSales.length} transactions</p>
                </div>
              </div>
            </div>
          )}

          {/* Owner Salary Breakdown */}
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

          {/* Employee Salaries Section - New */}
          {reportData && reportData.perEmployeeSalaries && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">💼 Rangkuman Gaji Karyawan Bulan Ini</h3>
              <div className="space-y-3">
                {reportData.perEmployeeSalaries.map((emp, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">
                        {emp.role === 'Owner' ? '👤' : '🧑‍🔧'}
                      </span>
                      <span className="font-medium text-gray-800">
                        {emp.name} ({emp.role})
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-gray-800">{formatCurrency(emp.gaji)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        emp.gaji >= 2000000 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {emp.gaji >= 2000000 ? 'Sesuai UMR' : 'Belum UMR'}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800">🧾 Total Gaji Dibayarkan :</span>
                    <span className="font-bold text-xl text-green-600">
                      {formatCurrency(reportData.totalEmployeeSalaries + Math.max(0, reportData.ownerSalary))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Export Button */}
          {showExport && (
            <div className="flex justify-center">
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Download size={20} />
                <span>Export to Excel</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
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
