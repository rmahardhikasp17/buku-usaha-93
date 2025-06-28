import React from 'react';
import {
  Calendar,
  Download,
  FileText,
  DollarSign,
  Users,
  PiggyBank,
  TrendingUp,
  ShoppingCart,
  Briefcase,
  Clock,
  UserCheck
} from 'lucide-react';
import { formatCurrency, exportMonthlyReportToExcel } from '../utils/dataManager';
import { Badge } from '@/components/ui/badge';
import { useMonthlyReport } from './useMonthlyReport';

interface PerEmployeeSalary {
  employeeId: string;
  name: string;
  role: string;
  gaji: number;
  bonus: number;
  potongan: number;
}

interface MonthlyReportExportProps {
  businessData: any;
  selectedMonth: number;
  selectedYear: number;
}


// Komponen untuk tombol ekspor saja (opsional jika ingin dipakai terpisah)
export const MonthlyExportButton: React.FC<MonthlyReportExportProps> = ({ businessData, selectedMonth, selectedYear }) => {
  const handleExport = () => {
    if (!businessData || !businessData.dailyRecords) {
      alert('Data tidak tersedia untuk diekspor.');
      return;
    }
    exportMonthlyReportToExcel(businessData, selectedMonth, selectedYear);
  };

  return (
    <div className="my-4">
      <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
        📥 Ekspor Laporan Bulanan ke Excel
      </button>
    </div>
  );
};

const MonthlyReport: React.FC<{ businessData: any }> = ({ businessData }) => {
  const {
    selectedMonth,
    setSelectedMonth,
    reportData,
    calculateMonthlyReport,
    handleExport,
    showExport
  } = useMonthlyReport(businessData);

  const totalSalaryPaid = reportData
    ? (reportData.totalEmployeeSalaries || 0) + (reportData.ownerSalary || 0)
    : 0;

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
      title: 'Pemilik Total Tabungan',
      value: reportData ? formatCurrency(reportData.ownerSavings) : formatCurrency(0),
      icon: PiggyBank,
      color: 'bg-purple-500'
    },
    {
      title: 'Pendapatan Produk',
      value: reportData ? formatCurrency(reportData.totalProductRevenue) : formatCurrency(0),
      icon: ShoppingCart,
      color: 'bg-orange-500'
    },
    {
      title: 'Laba Bersih',
      value: reportData ? formatCurrency(reportData.netProfit) : formatCurrency(0),
      icon: Briefcase,
      color: reportData && reportData.netProfit >= 0 ? 'bg-green-500' : 'bg-red-500'
    },
    {
      title: 'Hari Aktif',
      value: reportData ? `${reportData.activeDays}` : '0',
      icon: Clock,
      color: 'bg-blue-500'
    },
    {
      title: 'Karyawan Aktif',
      value: reportData ? `${reportData.activeEmployees}` : '0',
      icon: UserCheck,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gray-50 rounded-xl shadow-sm p-8 border border-gray-300">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Laporan Bulanan</h2>
            <p className="text-gray-600 mt-1">Hasilkan laporan bisnis bulanan</p>
          </div>
          {showExport && (
            <button
              onClick={handleExport}
              disabled={!reportData}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={20} />
              <span>Ekspor ke Excel</span>
            </button>
          )}
        </div>
      </div>

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

      {reportData ? (
        <>
          {/* Statistik */}
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

          {/* Owner Breakdown */}
          {reportData.ownerBreakdown && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detail Gaji Owner</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Pendapatan Layanan Pemilik:</span>
                  <span>{formatCurrency(reportData.ownerBreakdown.ownerServiceRevenue)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Layanan Bonus Pemilik:</span>
                  <span>{formatCurrency(reportData.ownerBreakdown.ownerBonus)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Pendapatan Karyawan 50%:</span>
                  <span>{formatCurrency(reportData.ownerBreakdown.ownerShareFromKaryawan)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Penghematan Harian:</span>
                  <span className="text-red-500">-{formatCurrency(reportData.ownerBreakdown.tabunganHarian)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Potongan Karyawan:</span>
                  <span className="text-red-500">-{formatCurrency(reportData.ownerBreakdown.uangHadirKaryawan)}</span>
                </div>
                <div className="border-t pt-2 font-medium text-gray-800 flex justify-between">
                  <span>Gaji Akhir Pemilik:</span>
                  <span className="text-green-600 font-bold">{formatCurrency(reportData.ownerSalary)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Gaji Karyawan */}
          {reportData.perEmployeeSalaries && reportData.perEmployeeSalaries.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">💼 Rangkuman Gaji Karyawan Bulan Ini</h3>
              <div className="space-y-3">
                {reportData.perEmployeeSalaries.map((emp: PerEmployeeSalary, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{emp.role === 'Owner' ? '👤' : '🧑‍🔧'}</span>
                      <div>
                        <span className="font-medium text-gray-800">{emp.name} ({emp.role})</span>
                        {emp.bonus > 0 && <div className="text-sm text-gray-600">Bonus: {formatCurrency(emp.bonus)}</div>}
                        {emp.potongan > 0 && <div className="text-sm text-gray-600">Potongan: {formatCurrency(emp.potongan)}</div>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-gray-800">{formatCurrency(emp.gaji)}</span>
                      <Badge className={emp.role === 'Owner' ? 'bg-gray-100 text-gray-700' : (emp.gaji >= 2000000 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                        {emp.role === 'Owner' ? '✅ Owner' : (emp.gaji >= 2000000 ? '✅ Sesuai UMR' : '❌ Belum UMR')}
                      </Badge>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-3 mt-3 flex justify-between">
                  <span className="font-semibold text-gray-800">🧾 Total Gaji Dibayarkan :</span>
                  <span className="font-bold text-xl text-green-600">{formatCurrency(totalSalaryPaid)}</span>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
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
