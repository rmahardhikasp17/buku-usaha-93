
import React, { useState } from 'react';
import { Calendar, Download, DollarSign, TrendingUp, Users, PiggyBank, FileText } from 'lucide-react';
import { formatCurrency } from '../utils/dataManager';
import { toast } from 'sonner';

const MonthlyReport = ({ businessData }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportData, setReportData] = useState(null);
  const [showExport, setShowExport] = useState(false);

  const calculateBonusTotal = (bonusServices) => {
    if (!bonusServices) return 0;
    return Object.entries(bonusServices)
      .filter(([_, selected]) => selected)
      .reduce((sum, [serviceId, _]) => {
        const service = businessData.services?.find(s => s.id === serviceId);
        return sum + (Number(service?.price) || 0);
      }, 0);
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

    // Calculate totals
    let totalRevenue = 0;
    let totalEmployeeSalaries = 0;
    let totalOwnerSalary = 0;
    let totalBonuses = 0;
    let activeDays = new Set();
    let activeEmployees = new Set();

    // Calculate owner salary for the month
    const calculateOwnerSalaryForPeriod = () => {
      let ownerRevenue = 0;
      let ownerBonus = 0;
      let employeeRevenue = 0;
      let totalEmployeeWorkingDays = 0;

      monthlyRecords.forEach(record => {
        const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
        const recordTotal = Object.entries(record.services || {})
          .filter(([_, quantity]) => Number(quantity) > 0)
          .reduce((sum, [serviceId, quantity]) => {
            const service = businessData.services?.find(s => s.id === serviceId);
            const servicePrice = Number(service?.price) || 0;
            const serviceQuantity = Number(quantity) || 0;
            return sum + (servicePrice * serviceQuantity);
          }, 0);

        const bonusTotal = calculateBonusTotal(record.bonusServices);

        if (employee?.role === 'Owner') {
          ownerRevenue += recordTotal;
          ownerBonus += bonusTotal;
        } else if (employee?.role === 'Karyawan') {
          employeeRevenue += recordTotal;
          totalEmployeeWorkingDays++;
        }

        activeDays.add(record.date);
        activeEmployees.add(record.employeeId);
      });

      // Owner salary = Owner service revenue + Owner bonus + 50% employee revenue - 40k × active days - 10k × total employee working days
      const ownerSalary = ownerRevenue + ownerBonus + (employeeRevenue * 0.5) - (40000 * activeDays.size) - (10000 * totalEmployeeWorkingDays);
      
      return {
        ownerSalary,
        ownerRevenue,
        ownerBonus,
        employeeRevenue,
        totalEmployeeWorkingDays
      };
    };

    const ownerData = calculateOwnerSalaryForPeriod();

    monthlyRecords.forEach(record => {
      const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
      
      // Calculate main service revenue
      const recordTotal = Object.entries(record.services || {})
        .filter(([_, quantity]) => Number(quantity) > 0)
        .reduce((sum, [serviceId, quantity]) => {
          const service = businessData.services?.find(s => s.id === serviceId);
          const servicePrice = Number(service?.price) || 0;
          const serviceQuantity = Number(quantity) || 0;
          return sum + (servicePrice * serviceQuantity);
        }, 0);

      // Calculate bonus total
      const bonusTotal = calculateBonusTotal(record.bonusServices);
      totalBonuses += bonusTotal;

      totalRevenue += recordTotal;
      
      if (employee?.role === 'Karyawan') {
        // Employee salary = 50% of their service revenue + 10k attendance + bonus
        const employeeSalary = (recordTotal * 0.5) + 10000 + bonusTotal;
        totalEmployeeSalaries += employeeSalary;
      }

      activeDays.add(record.date);
      activeEmployees.add(record.employeeId);
    });

    totalOwnerSalary = ownerData.ownerSalary;

    // Calculate income and expenses from transactions
    const income = monthlyTransactions
      .filter(t => t.type === 'Pemasukan')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = monthlyTransactions
      .filter(t => t.type === 'Pengeluaran')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Owner savings = 40k × active days
    const ownerSavings = 40000 * activeDays.size;

    // Net profit = Total revenue + Income - Total employee salaries - Owner salary - Expenses
    const netProfit = totalRevenue + income - totalEmployeeSalaries - Math.max(0, totalOwnerSalary) - expenses;

    const data = {
      totalRevenue,
      totalExpenses: expenses,
      totalEmployeeSalaries,
      ownerSavings,
      totalBonuses,
      netProfit,
      activeDays: activeDays.size,
      activeEmployees: activeEmployees.size,
      ownerSalary: totalOwnerSalary,
      income,
      monthlyRecords,
      ownerData
    };

    setReportData(data);
    setShowExport(true);
  };

  const handleExport = () => {
    if (!reportData) {
      toast.error('No data to export');
      return;
    }
    
    toast.success('Monthly report exported successfully!');
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
          {/* Main Statistics - 4 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
