
import React, { useState } from 'react';
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
import { formatCurrency } from '../utils/dataManager';
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';

interface MonthlyReportData {
  totalPendapatan: number;
  totalPengeluaran: number;
  totalGajiKaryawan: number;
  totalTabunganOwner: number;
  labaBersih: number;
  gajiOwner: number;
  hariAktif: number;
  karyawanAktif: number;
  rangkumanGajiKaryawan: Array<{
    employeeId: string;
    name: string;
    gaji: number;
    bonus: number;
    potongan: number;
    statusUMR: string;
  }>;
  ownerBreakdown: {
    layananOwner: number;
    bonusOwner: number;
    pendapatanKaryawan50: number;
    uangHadirKaryawan: number;
    tabunganOwner: number;
  };
  productSales: Array<{
    date: string;
    employeeName: string;
    productName: string;
    quantity: number;
    total: number;
  }>;
}

const MonthlyReport: React.FC<{ businessData: any }> = ({ businessData }) => {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
  
  const [reportData, setReportData] = useState<MonthlyReportData | null>(null);
  const [showExport, setShowExport] = useState(false);

  const calculateEmployeeSalary = (record: any) => {
    const services = businessData.services || [];
    const bonuses = businessData.bonusServices || [];

    const layanan = Object.entries(record.services || {}).reduce((total, [serviceId, qty]) => {
      const service = services.find(s => s.id === serviceId);
      return total + ((service?.price || 0) * Number(qty));
    }, 0);

    const bonusTotal = Object.entries(record.bonusQuantities || {}).reduce((total, [serviceId, bonusMap]) => {
      Object.entries(bonusMap).forEach(([bonusId, qty]) => {
        const bonus = bonuses.find(b => b.id === bonusId);
        total += (bonus?.price || 0) * Number(qty);
      });
      return total;
    }, 0);

    const hadir = record.attendance ? (record.attendanceBonus || 0) : 0;

    return {
      gajiDiterima: (layanan * 0.5) + bonusTotal + hadir,
      layananTotal: layanan,
      bonusTotal,
      hadir
    };
  };

  const calculateOwnerSalary = (records: any[]) => {
    const owner = businessData.employees?.find(emp => emp.isOwner);
    if (!owner) return null;

    const ownerRecord = records.find(r => r.employeeId === owner.id);
    if (!ownerRecord) return null;

    const services = businessData.services || [];
    const bonuses = businessData.bonusServices || [];

    const layananOwner = Object.entries(ownerRecord.services || {}).reduce((total, [serviceId, qty]) => {
      const service = services.find(s => s.id === serviceId);
      return total + ((service?.price || 0) * Number(qty));
    }, 0);

    const bonusOwner = Object.entries(ownerRecord.bonusQuantities || {}).reduce((total, [serviceId, bonusMap]) => {
      Object.entries(bonusMap).forEach(([bonusId, qty]) => {
        const bonus = bonuses.find(b => b.id === bonusId);
        total += (bonus?.price || 0) * Number(qty);
      });
      return total;
    }, 0);

    const karyawanRecords = records.filter(r => r.employeeId !== owner.id);
    const totalPendapatanKaryawan = karyawanRecords.reduce((sum, r) => {
      const layananReguler = Object.entries(r.services || {}).reduce((subtotal, [serviceId, qty]) => {
        const service = services.find(s => s.id === serviceId);
        return subtotal + ((service?.price || 0) * Number(qty));
      }, 0);
      return sum + layananReguler;
    }, 0);

    const pendapatanKaryawan50 = totalPendapatanKaryawan * 0.5;
    const uangHadirKaryawan = karyawanRecords.reduce((sum, r) => {
      return sum + (r.attendance ? (r.attendanceBonus || 0) : 0);
    }, 0);

    const tabunganOwner = businessData.tabunganPerHari || 0;
    const gajiOwner = layananOwner + bonusOwner + pendapatanKaryawan50 - uangHadirKaryawan - tabunganOwner;

    return {
      gajiOwner,
      layananOwner,
      bonusOwner,
      pendapatanKaryawan50,
      uangHadirKaryawan,
      tabunganOwner
    };
  };

  const generateMonthlyReport = (): MonthlyReportData => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const month = Number(monthStr) - 1;
    const year = Number(yearStr);

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

    let totalPendapatan = 0;
    let totalGajiKaryawan = 0;
    const rangkumanGajiKaryawan: MonthlyReportData['rangkumanGajiKaryawan'] = [];
    const employeeSalaries: Record<string, { gaji: number; bonus: number; potongan: number }> = {};
    let ownerBreakdown: MonthlyReportData['ownerBreakdown'] = {
      layananOwner: 0,
      bonusOwner: 0,
      pendapatanKaryawan50: 0,
      uangHadirKaryawan: 0,
      tabunganOwner: 0
    };
    let gajiOwner = 0;

    const hariAktif = Object.keys(groupedByDate).length;
    const totalTabunganOwner = (businessData.tabunganPerHari || 0) * hariAktif;

    // Calculate service revenue and salaries
    for (const [date, records] of Object.entries(groupedByDate)) {
      for (const record of records) {
        const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
        if (!employee) continue;

        if (employee.isOwner) {
          const ownerResult = calculateOwnerSalary(records);
          if (ownerResult) {
            gajiOwner += ownerResult.gajiOwner;
            ownerBreakdown.layananOwner += ownerResult.layananOwner;
            ownerBreakdown.bonusOwner += ownerResult.bonusOwner;
            ownerBreakdown.pendapatanKaryawan50 += ownerResult.pendapatanKaryawan50;
            ownerBreakdown.uangHadirKaryawan += ownerResult.uangHadirKaryawan;
            ownerBreakdown.tabunganOwner += ownerResult.tabunganOwner;
          }
        } else {
          const salary = calculateEmployeeSalary(record);
          totalGajiKaryawan += salary.gajiDiterima;
          totalPendapatan += salary.layananTotal;

          if (!employeeSalaries[record.employeeId]) {
            employeeSalaries[record.employeeId] = { gaji: 0, bonus: 0, potongan: 0 };
          }
          employeeSalaries[record.employeeId].gaji += salary.gajiDiterima;
          employeeSalaries[record.employeeId].bonus += salary.bonusTotal;
          employeeSalaries[record.employeeId].potongan += salary.hadir;
        }
      }
    }

    // Build employee salary summary
    Object.entries(employeeSalaries).forEach(([employeeId, salaryData]) => {
      const employee = businessData.employees?.find(emp => emp.id === employeeId);
      if (employee) {
        rangkumanGajiKaryawan.push({
          employeeId,
          name: employee.name,
          gaji: salaryData.gaji,
          bonus: salaryData.bonus,
          potongan: salaryData.potongan,
          statusUMR: salaryData.gaji >= 2000000 ? 'Sesuai UMR' : 'Belum UMR'
        });
      }
    });

    // Calculate expenses
    const allExpenses = businessData.expenses || [];
    const expenseThisMonth = allExpenses.filter((entry: any) => {
      const d = new Date(entry.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    const totalPengeluaran = expenseThisMonth.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Calculate net profit from incomes only
    const allIncomes = businessData.incomes || [];
    const incomeThisMonth = allIncomes.filter((entry: any) => {
      const d = new Date(entry.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    const labaBersih = incomeThisMonth.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Calculate active employees
    const activeEmployeeIds = new Set(filteredRecords.map(r => r.employeeId));
    const karyawanAktif = activeEmployeeIds.size;

    // Calculate product sales
    const productSales: MonthlyReportData['productSales'] = [];
    filteredRecords.forEach(record => {
      const employee = businessData.employees?.find(e => e.id === record.employeeId);
      const employeeName = employee?.name || 'Unknown';

      Object.entries(record.products || {}).forEach(([productId, qty]) => {
        const product = businessData.products?.find(p => p.id === productId);
        if (product && Number(qty) > 0) {
          productSales.push({
            date: record.date,
            employeeName,
            productName: product.name,
            quantity: Number(qty),
            total: product.price * Number(qty)
          });
        }
      });
    });

    return {
      totalPendapatan,
      totalPengeluaran,
      totalGajiKaryawan,
      totalTabunganOwner,
      labaBersih,
      gajiOwner,
      hariAktif,
      karyawanAktif,
      rangkumanGajiKaryawan,
      ownerBreakdown,
      productSales
    };
  };

  const calculateMonthlyReport = () => {
    const result = generateMonthlyReport();
    setReportData(result);
    setShowExport(true);
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const [yearStr, monthStr] = selectedMonth.split('-');
    
    // Sheet 1: Ringkasan
    const summaryData = [
      ['Laporan Bulanan', `${monthStr}/${yearStr}`],
      [''],
      ['Total Pendapatan Service', reportData.totalPendapatan],
      ['Total Pengeluaran', reportData.totalPengeluaran],
      ['Total Gaji Karyawan', reportData.totalGajiKaryawan],
      ['Gaji Owner', reportData.gajiOwner],
      ['Total Tabungan Owner', reportData.totalTabunganOwner],
      ['Laba Bersih (dari Pemasukan)', reportData.labaBersih],
      ['Hari Aktif', reportData.hariAktif],
      ['Karyawan Aktif', reportData.karyawanAktif]
    ];

    // Sheet 2: Rangkuman Gaji Karyawan
    const salaryData = [
      ['Nama Karyawan', 'Gaji', 'Bonus', 'Potongan', 'Status UMR'],
      ...reportData.rangkumanGajiKaryawan.map(emp => [
        emp.name, emp.gaji, emp.bonus, emp.potongan, emp.statusUMR
      ])
    ];

    // Sheet 3: Rekap Penjualan Produk
    const productData = [
      ['Tanggal', 'Nama Karyawan', 'Nama Produk', 'Jumlah', 'Total'],
      ...reportData.productSales.map(sale => [
        sale.date, sale.employeeName, sale.productName, sale.quantity, sale.total
      ])
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    const salarySheet = XLSX.utils.aoa_to_sheet(salaryData);
    const productSheet = XLSX.utils.aoa_to_sheet(productData);
    
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');
    XLSX.utils.book_append_sheet(workbook, salarySheet, 'Rangkuman Gaji');
    XLSX.utils.book_append_sheet(workbook, productSheet, 'Penjualan Produk');
    
    const fileName = `Laporan_Bulanan_${yearStr}-${monthStr}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const stats = [
    {
      title: 'Total Pendapatan Service',
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
      title: 'Gaji Owner',
      value: reportData ? formatCurrency(reportData.gajiOwner) : formatCurrency(0),
      icon: PiggyBank,
      color: 'bg-purple-500'
    },
    {
      title: 'Total Tabungan Owner',
      value: reportData ? formatCurrency(reportData.totalTabunganOwner) : formatCurrency(0),
      icon: ShoppingCart,
      color: 'bg-orange-500'
    },
    {
      title: 'Laba Bersih',
      value: reportData ? formatCurrency(reportData.labaBersih) : formatCurrency(0),
      icon: Briefcase,
      color: reportData && reportData.labaBersih >= 0 ? 'bg-green-500' : 'bg-red-500'
    },
    {
      title: 'Hari Aktif',
      value: reportData ? `${reportData.hariAktif}` : '0',
      icon: Clock,
      color: 'bg-blue-500'
    },
    {
      title: 'Karyawan Aktif',
      value: reportData ? `${reportData.karyawanAktif}` : '0',
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
            <p className="text-gray-600 mt-1">Hasilkan laporan bisnis bulanan sesuai logika UMKM</p>
          </div>
          {showExport && (
            <button
              onClick={exportToExcel}
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
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Detail Gaji Owner</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Layanan Owner:</span>
                <span>{formatCurrency(reportData.ownerBreakdown.layananOwner)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Bonus Owner:</span>
                <span>{formatCurrency(reportData.ownerBreakdown.bonusOwner)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>50% Pendapatan Karyawan:</span>
                <span>{formatCurrency(reportData.ownerBreakdown.pendapatanKaryawan50)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Uang Hadir Karyawan:</span>
                <span className="text-red-500">-{formatCurrency(reportData.ownerBreakdown.uangHadirKaryawan)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tabungan Harian:</span>
                <span className="text-red-500">-{formatCurrency(reportData.ownerBreakdown.tabunganOwner)}</span>
              </div>
              <div className="border-t pt-2 font-medium text-gray-800 flex justify-between">
                <span>Gaji Akhir Owner:</span>
                <span className="text-green-600 font-bold">{formatCurrency(reportData.gajiOwner)}</span>
              </div>
            </div>
          </div>

          {/* Rangkuman Gaji Karyawan */}
          {reportData.rangkumanGajiKaryawan.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">💼 Rangkuman Gaji Karyawan Bulan Ini</h3>
              <div className="space-y-3">
                {reportData.rangkumanGajiKaryawan.map((emp, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">🧑‍🔧</span>
                      <div>
                        <span className="font-medium text-gray-800">{emp.name}</span>
                        {emp.bonus > 0 && <div className="text-sm text-gray-600">Bonus: {formatCurrency(emp.bonus)}</div>}
                        {emp.potongan > 0 && <div className="text-sm text-gray-600">Potongan: {formatCurrency(emp.potongan)}</div>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-gray-800">{formatCurrency(emp.gaji)}</span>
                      <Badge className={emp.statusUMR === 'Sesuai UMR' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {emp.statusUMR === 'Sesuai UMR' ? '✅ Sesuai UMR' : '❌ Belum UMR'}
                      </Badge>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-3 mt-3 flex justify-between">
                  <span className="font-semibold text-gray-800">🧾 Total Gaji Karyawan:</span>
                  <span className="font-bold text-xl text-green-600">{formatCurrency(reportData.totalGajiKaryawan)}</span>
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
