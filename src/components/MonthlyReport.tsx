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
  productSales?: Record<string, any>;
  urgentOverrides?: Record<string, {
    totalPendapatan?: number;
    totalPengeluaran?: number;
    totalGajiDibayarkan?: number;
    tabunganOwner?: number;
    pendapatanProduk?: number;
  }>;
}

interface MonthlyReportProps {
  businessData: BusinessData;
}

interface EmployeeSalary {
  employeeId: string;
  name: string;
  role: string;
  gaji: number;
  bonus: number;
  potongan: number;
  uangHadir: number;
}

interface OwnerBreakdown {
  ownerServiceRevenue: number;
  ownerBonus: number;
  ownerShareFromKaryawan: number;
  tabunganHarian: number;
  uangHadirKaryawan: number;
}

const MonthlyReport: React.FC<MonthlyReportProps> = ({ businessData }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [reportData, setReportData] = useState<any>(null);

  // Helper function to calculate service total from service ID and quantity
  const calculateServiceTotal = (serviceId: string, quantity: number) => {
    const service = businessData.services?.find(s => s.id === serviceId);
    if (!service || !service.price || quantity <= 0) return 0;
    return service.price * quantity;
  };

  // Helper function to calculate bonus total
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

  // Helpers to compute baseline totals by date
  const calcPendapatanForDate = (date: string) => {
    const records = Object.values(businessData.dailyRecords || {}).filter((r: any) => r.date === date);
    return records.reduce((sum: number, record: any) => {
      const servicesSum = Object.entries(record.services || {}).reduce((s, [serviceId, qty]) => s + calculateServiceTotal(serviceId as string, Number(qty)), 0);
      const bonusSum = calculateBonusTotal(record.bonusServices, record.bonusQuantities);
      return sum + servicesSum + bonusSum;
    }, 0);
  };
  const calcPengeluaranForDate = (date: string) => {
    return Object.values(businessData.transactions || {})
      .filter((t: any) => t.date === date && t.type === 'Pengeluaran')
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
  };
  const calcPendapatanProdukForDate = (date: string) => {
    return Object.values(businessData.productSales || {})
      .filter((s: any) => s.date === date)
      .reduce((sum: number, s: any) => sum + (s.total || 0), 0);
  };
  const calcGajiDibayarkanForDate = (date: string) => {
    const dailyRecords = Object.values(businessData.dailyRecords || {}).filter((r: any) => r.date === date);
    const totalEmployeeRevenue = dailyRecords.reduce((sum, record) => {
      const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
      if (employee?.role !== 'Owner') {
        const recordTotal = Object.entries(record.services || {})
          .reduce((recordSum, [serviceId, quantity]) => recordSum + calculateServiceTotal(serviceId as string, Number(quantity)), 0);
        return sum + recordTotal;
      }
      return sum;
    }, 0);
    return dailyRecords.reduce((sum, record) => {
      const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
      const isOwner = employee?.role === 'Owner';
      const serviceRevenue = Object.entries(record.services || {})
        .reduce((s, [serviceId, quantity]) => s + calculateServiceTotal(serviceId as string, Number(quantity)), 0);
      const bonusTotal = calculateBonusTotal(record.bonusServices, record.bonusQuantities);
      if (isOwner) {
        const employeeShareRevenue = totalEmployeeRevenue * 0.5;
        const dailySavings = 40000;
        return sum + (serviceRevenue + bonusTotal + employeeShareRevenue - dailySavings);
      } else {
        const baseRevenue = serviceRevenue * 0.5;
        return sum + (baseRevenue + bonusTotal);
      }
    }, 0);
  };
  const calcTabunganOwnerForDate = (date: string) => {
    const ownerCount = Object.values(businessData.dailyRecords || {}).filter((r: any) => r.date === date && (businessData.employees?.find(e => e.id === r.employeeId)?.role === 'Owner')).length;
    return ownerCount * 40000;
  };

  const calculateMonthlyReport = () => {
    const [year, month] = selectedMonth.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);
    
    console.log('🔍 DEBUG: Knowledge Base - Filter date range:', { selectedMonth, startDate, endDate });
    
    // Filter data for the selected month
    const monthlyRecords = Object.values(businessData.dailyRecords || {}).filter((record: any) => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= endDate;
    });

    const monthlyTransactions = Object.values(businessData.transactions || {}).filter((transaction: any) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    const monthlyProductSales = Object.values(businessData.productSales || {}).filter((sale: any) => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });

    console.log('📊 DEBUG: Knowledge Base - Filtered data counts:', {
      monthlyRecords: monthlyRecords.length,
      monthlyTransactions: monthlyTransactions.length,
      monthlyProductSales: monthlyProductSales.length
    });

    // 1. 🔢 Baseline Total Pendapatan - HANYA dari layanan murni + bonus (TIDAK termasuk produk)
    let totalPendapatan = monthlyRecords.reduce((sum: number, record: any) => {
      const recordServiceRevenue = Object.entries(record.services || {})
        .reduce((serviceSum, [serviceId, qty]) => {
          return serviceSum + calculateServiceTotal(serviceId as string, Number(qty));
        }, 0);
      const recordBonusRevenue = calculateBonusTotal(record.bonusServices, record.bonusQuantities);
      return sum + recordServiceRevenue + recordBonusRevenue;
    }, 0);

    // 2. 💸 Baseline Total Pengeluaran - dari transactions type "Pengeluaran"
    let totalPengeluaran = monthlyTransactions
      .filter((t: any) => t.type === 'Pengeluaran')
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

    // 7. 📦 Baseline Total Pendapatan Produk - dari productSales.total
    let totalPendapatanProduk = monthlyProductSales.reduce((sum: number, sale: any) => {
      return sum + (sale.total || 0);
    }, 0);

    // 3/6. Baseline gaji/tabungan akan dihitung di bawah, override diterapkan setelah baseline tersedia

    // Separate records by role
    const ownerRecords = monthlyRecords.filter(record => {
      const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
      return employee?.role === 'Owner';
    });

    const karyawanRecords = monthlyRecords.filter(record => {
      const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
      return employee?.role === 'Karyawan';
    });

    // 4. 👤 Gaji Owner dengan breakdown detail
    const ownerServiceRevenue = ownerRecords.reduce((sum, record) => {
      return sum + Object.entries(record.services || {})
        .reduce((serviceSum, [serviceId, qty]) => {
          return serviceSum + calculateServiceTotal(serviceId, Number(qty));
        }, 0);
    }, 0);

    const ownerBonus = ownerRecords.reduce((sum, record) => {
      return sum + calculateBonusTotal(record.bonusServices, record.bonusQuantities);
    }, 0);

    // Total layanan karyawan (murni tanpa bonus)
    const totalLayananKaryawan = karyawanRecords.reduce((sum, record) => {
      return sum + Object.entries(record.services || {})
        .reduce((serviceSum, [serviceId, qty]) => {
          return serviceSum + calculateServiceTotal(serviceId, Number(qty));
        }, 0);
    }, 0);

    const ownerShareFromKaryawan = totalLayananKaryawan * 0.5;
    const tabunganHarian = ownerRecords.length * 40000;
    
    const ownerBreakdown: OwnerBreakdown = {
      ownerServiceRevenue,
      ownerBonus,
      ownerShareFromKaryawan,
      tabunganHarian,
      uangHadirKaryawan: 0
    };

    const gajiOwner = ownerServiceRevenue + ownerShareFromKaryawan + ownerBonus - tabunganHarian;

    // 5. 🧑‍🔧 Rangkuman Gaji Karyawan per individu
    const employeeIds = [...new Set(karyawanRecords.map(r => r.employeeId))];
    const perEmployeeSalaries: EmployeeSalary[] = employeeIds.map(empId => {
      const empRecords = karyawanRecords.filter(r => r.employeeId === empId);
      const employee = businessData.employees?.find(e => e.id === empId);
      
      // 50% layanan murni
      const layananRevenue = empRecords.reduce((sum, record) => {
        return sum + Object.entries(record.services || {})
          .reduce((serviceSum, [serviceId, qty]) => {
            return serviceSum + calculateServiceTotal(serviceId, Number(qty));
          }, 0);
      }, 0) * 0.5;

      // 100% bonus layanan
      const bonusTotal = empRecords.reduce((sum, record) => {
        return sum + calculateBonusTotal(record.bonusServices, record.bonusQuantities);
      }, 0);

      // Calculate deductions (if any business rules exist)
      const potongan = 0; // No deduction rules defined yet
      
      return {
        employeeId: empId,
        name: employee?.name || 'Unknown',
        role: employee?.role || 'Unknown',
        gaji: layananRevenue + bonusTotal,
        bonus: bonusTotal,
        potongan,
        uangHadir: 0
      };
    });

    // Owner sebagai employee salary
    if (ownerRecords.length > 0) {
      const ownerEmployee = businessData.employees?.find(emp => emp.role === 'Owner');
      if (ownerEmployee) {
        perEmployeeSalaries.push({
          employeeId: ownerEmployee.id,
          name: ownerEmployee.name,
          role: 'Owner',
          gaji: gajiOwner,
          bonus: ownerBonus,
          potongan: 0,
          uangHadir: 0
        });
      }
    }

    // 3. 💼 Total Gaji Dibayarkan (baseline)
    const totalGajiKaryawan = perEmployeeSalaries
      .filter(emp => emp.role === 'Karyawan')
      .reduce((sum, emp) => sum + emp.gaji, 0);

    let totalGajiDibayarkan = totalGajiKaryawan + gajiOwner;

    // 6. 💰 Tabungan Owner (baseline)
    let totalTabunganOwner = tabunganHarian;

    // 🔧 Apply urgent overrides per-date (replace baseline)
    const ovMap = businessData.urgentOverrides || {};
    const baseDates = new Set<string>([...monthlyRecords.map((r: any) => r.date), ...monthlyTransactions.map((t: any) => t.date), ...monthlyProductSales.map((p: any) => p.date)]);
    const ovDatesInMonth = Object.keys(ovMap as any).filter((d) => {
      const dd = new Date(d);
      return dd >= startDate && dd <= endDate;
    });
    const allDatesInMonth = new Set<string>([...baseDates, ...ovDatesInMonth]);
    Array.from(allDatesInMonth).forEach((d) => {
      const ov: any = (ovMap as any)[d];
      if (!ov) return;
      if (typeof ov.totalPendapatan === 'number') {
        totalPendapatan -= calcPendapatanForDate(d);
        totalPendapatan += ov.totalPendapatan;
      }
      if (typeof ov.totalPengeluaran === 'number') {
        totalPengeluaran -= calcPengeluaranForDate(d);
        totalPengeluaran += ov.totalPengeluaran;
      }
      if (typeof ov.pendapatanProduk === 'number') {
        totalPendapatanProduk -= calcPendapatanProdukForDate(d);
        totalPendapatanProduk += ov.pendapatanProduk;
      }
      if (typeof ov.totalGajiDibayarkan === 'number') {
        totalGajiDibayarkan -= calcGajiDibayarkanForDate(d);
        totalGajiDibayarkan += ov.totalGajiDibayarkan;
      }
      if (typeof ov.tabunganOwner === 'number') {
        totalTabunganOwner -= calcTabunganOwnerForDate(d);
        totalTabunganOwner += ov.tabunganOwner;
      }
    });

    // 8. 📊 Statistik tambahan
    const activeDays = new Set(monthlyRecords.map((record: any) => record.date)).size;
    const activeEmployees = new Set(monthlyRecords.map((record: any) => record.employeeId)).size;

    console.log('💰 DEBUG: Knowledge Base - Final calculations:', {
      '1_totalPendapatan_layanan_murni': totalPendapatan,
      '2_totalPengeluaran_transactions': totalPengeluaran,
      '3_totalGajiDibayarkan': totalGajiDibayarkan,
      '4_gajiOwner': gajiOwner,
      '5_totalGajiKaryawan': totalGajiKaryawan,
      '6_totalTabunganOwner': totalTabunganOwner,
      '7_totalPendapatanProduk': totalPendapatanProduk,
      '8_statistik': { activeDays, activeEmployees },
      'ownerBreakdown': ownerBreakdown,
      'perEmployeeSalaries': perEmployeeSalaries
    });

    setReportData({
      totalPendapatan,
      totalPengeluaran,
      totalGajiDibayarkan,
      gajiOwner,
      totalGajiKaryawan,
      totalTabunganOwner,
      totalPendapatanProduk,
      activeDays,
      activeEmployees,
      ownerBreakdown,
      perEmployeeSalaries,
      monthlyRecords,
      monthlyTransactions,
      monthlyProductSales
    });
  };

  const exportToExcel = async () => {
    if (!reportData) {
      toast.error('No data to export');
      return;
    }

    try {
      toast.loading('Generating Excel file...');
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Ringkasan
      const summaryData = [
        ['LAPORAN BULANAN', selectedMonth],
        [''],
        ['RINGKASAN KEUANGAN'],
        ['Total Pendapatan', reportData.totalPendapatan],
        ['Total Pengeluaran', reportData.totalPengeluaran],
        ['Total Gaji Dibayarkan', reportData.totalGajiDibayarkan],
        ['Tabungan Owner', reportData.totalTabunganOwner],
        ['Pendapatan Produk', reportData.totalPendapatanProduk],
        [''],
        ['AKTIVITAS'],
        ['Hari Aktif', reportData.activeDays],
        ['Karyawan Aktif', reportData.activeEmployees]
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');

      // Sheet 2: Gaji Karyawan
      if (reportData.perEmployeeSalaries && reportData.perEmployeeSalaries.length > 0) {
        const salaryData = [
          ['Nama', 'Peran', 'Gaji Total', 'Bonus', 'Potongan', 'Status UMR'],
          ...reportData.perEmployeeSalaries.map((emp: EmployeeSalary) => [
            emp.name,
            emp.role,
            emp.gaji,
            emp.bonus,
            emp.potongan,
            emp.gaji >= 2000000 ? 'Sesuai UMR' : 'Belum UMR'
          ])
        ];
        const salarySheet = XLSX.utils.aoa_to_sheet(salaryData);
        XLSX.utils.book_append_sheet(workbook, salarySheet, 'Gaji Karyawan');
      }

      // Sheet 3: Recap Harian Selama 1 Bulan
      if (reportData.monthlyRecords && reportData.monthlyRecords.length > 0) {
        const dailyData = [
          ['Tanggal', 'Nama', 'Peran', 'Layanan Utama', 'Bonus', 'Pendapatan Murni', 'Gaji Final'],
          ...reportData.monthlyRecords.map((record: any) => {
            const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
            const serviceRevenue = Object.entries(record.services || {})
              .reduce((sum, [serviceId, qty]) => {
                return sum + calculateServiceTotal(serviceId, Number(qty));
              }, 0);
            const bonusTotal = calculateBonusTotal(record.bonusServices, record.bonusQuantities);
            
            // Calculate final salary
            let finalSalary;
            if (employee?.role === 'Owner') {
              // Calculate owner's daily salary using breakdown formula
              const employeeRecordsOnDate = reportData.monthlyRecords.filter((r: any) => 
                r.date === record.date && 
                businessData.employees?.find(emp => emp.id === r.employeeId)?.role === 'Karyawan'
              );
              
              const employeeServiceRevenueOnDate = employeeRecordsOnDate.reduce((sum: number, empRecord: any) => {
                return sum + Object.entries(empRecord.services || {})
                  .reduce((serviceSum, [serviceId, qty]) => {
                    return serviceSum + calculateServiceTotal(serviceId, Number(qty));
                  }, 0);
              }, 0);
              
              const ownerShareFromEmployees = employeeServiceRevenueOnDate * 0.5;
              const dailySavings = 40000; // 40K tabungan harian
              
              finalSalary = serviceRevenue + bonusTotal + ownerShareFromEmployees - dailySavings;
            } else {
              finalSalary = serviceRevenue * 0.5 + bonusTotal;
            }
            
            return [
              record.date,
              employee?.name || 'Unknown',
              employee?.role || 'Unknown',
              serviceRevenue,
              bonusTotal,
              serviceRevenue,
              finalSalary
            ];
          })
        ];
        const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
        XLSX.utils.book_append_sheet(workbook, dailySheet, 'Recap Harian');
      }

      // Sheet 4: Penjualan Produk
      if (reportData.monthlyProductSales && reportData.monthlyProductSales.length > 0) {
        const productData = [
          ['Nama Produk', 'Jumlah Terjual', 'Total Penjualan', 'Tanggal'],
          ...reportData.monthlyProductSales.map((sale: any) => [
            sale.productName || 'Unknown Product',
            sale.quantity || 0,
            sale.total || 0,
            sale.date
          ])
        ];
        const productSheet = XLSX.utils.aoa_to_sheet(productData);
        XLSX.utils.book_append_sheet(workbook, productSheet, 'Penjualan Produk');
      }

      // Sheet 5: Transaksi
      if (reportData.monthlyTransactions && reportData.monthlyTransactions.length > 0) {
        const transactionData = [
          ['Tanggal', 'Tipe Transaksi', 'Deskripsi', 'Nominal'],
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
      toast.dismiss();
      toast.success('Excel file exported successfully with 5 sheets!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.dismiss();
      toast.error(`Failed to export to Excel: ${error.message}`);
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
      title: 'Total Gaji Dibayarkan',
      value: reportData ? formatCurrency(reportData.totalGajiDibayarkan) : formatCurrency(0),
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Tabungan Owner',
      value: reportData ? formatCurrency(reportData.totalTabunganOwner) : formatCurrency(0),
      icon: PiggyBank,
      color: 'bg-purple-500'
    },
    {
      title: 'Pendapatan Produk',
      value: reportData ? formatCurrency(reportData.totalPendapatanProduk) : formatCurrency(0),
      icon: FileText,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 lg:p-8 border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Laporan Bulanan (Knowledge Base Baru)</h2>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">Generate monthly business reports</p>
          </div>
          <button
            onClick={exportToExcel}
            disabled={!reportData}
            className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
          >
            <Download size={20} />
            <span>Export to Excel (5 Sheets)</span>
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 lg:p-8 border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="flex items-center space-x-3">
            <Calendar size={20} className="text-muted-foreground" />
            <label className="text-sm font-medium">Bulan & Tahun:</label>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full sm:w-auto px-3 md:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base"
            />
            <button
              onClick={calculateMonthlyReport}
              className="w-full sm:w-auto bg-primary text-primary-foreground px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm md:text-base"
            >
              Hitung Rekap Bulanan
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {reportData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-card rounded-xl shadow-sm p-4 md:p-6 border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                      <p className="text-lg md:text-xl font-bold">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <Icon className="text-white" size={20} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Owner Breakdown Section */}
          {reportData.ownerBreakdown && (
            <div className="bg-card rounded-xl shadow-sm p-4 md:p-6 lg:p-8 border">
              <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-6">👤 Breakdown Gaji Owner</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Layanan Owner</div>
                    <div className="font-bold text-green-600">{formatCurrency(reportData.ownerBreakdown.ownerServiceRevenue)}</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Share dari Karyawan (50%)</div>
                    <div className="font-bold text-green-600">{formatCurrency(reportData.ownerBreakdown.ownerShareFromKaryawan)}</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Bonus Owner</div>
                    <div className="font-bold text-green-600">{formatCurrency(reportData.ownerBreakdown.ownerBonus)}</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Tabungan Harian (40K)</div>
                    <div className="font-bold text-red-600">-{formatCurrency(reportData.ownerBreakdown.tabunganHarian)}</div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">💰 Total Gaji Owner:</span>
                    <span className="font-bold text-2xl text-primary">
                      {formatCurrency(reportData.gajiOwner)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Employee Salaries Section */}
          {reportData.perEmployeeSalaries && reportData.perEmployeeSalaries.length > 0 && (
            <div className="bg-card rounded-xl shadow-sm p-8 border">
              <h3 className="text-lg font-semibold mb-6">🧑‍🔧 Rangkuman Gaji Karyawan Bulan Ini</h3>
              <div className="space-y-4">
                {reportData.perEmployeeSalaries.map((emp: EmployeeSalary, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">
                        {emp.role === 'Owner' ? '👤' : '🧑‍🔧'}
                      </span>
                      <div>
                        <div className="font-medium">
                          {emp.name} ({emp.role})
                        </div>
                        {emp.bonus > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Bonus: {formatCurrency(emp.bonus)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-lg">{formatCurrency(emp.gaji)}</span>
                      <Badge 
                        variant={emp.gaji >= 2000000 ? "default" : "destructive"}
                      >
                        {emp.gaji >= 2000000 ? 'Sesuai UMR' : 'Belum UMR'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card rounded-xl shadow-sm p-6 border">
              <h3 className="text-lg font-semibold mb-4">📦 Pendapatan Produk</h3>
              <p className="text-3xl font-bold text-orange-600">
                {formatCurrency(reportData.totalPendapatanProduk)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Penjualan produk bulan ini
              </p>
            </div>

            <div className="bg-card rounded-xl shadow-sm p-6 border">
              <h3 className="text-lg font-semibold mb-4">📅 Hari Aktif</h3>
              <p className="text-3xl font-bold text-blue-600">{reportData.activeDays}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Hari dengan aktivitas bisnis
              </p>
            </div>

            <div className="bg-card rounded-xl shadow-sm p-6 border">
              <h3 className="text-lg font-semibold mb-4">👥 Karyawan Aktif</h3>
              <p className="text-3xl font-bold text-purple-600">{reportData.activeEmployees}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Karyawan yang bekerja bulan ini
              </p>
            </div>
          </div>
        </>
      )}

      {/* No Data Message */}
      {!reportData && (
        <div className="bg-card rounded-xl shadow-sm p-12 border text-center">
          <FileText className="mx-auto text-muted-foreground mb-4" size={48} />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">Pilih Bulan untuk Melihat Laporan</h3>
          <p className="text-muted-foreground">
            Klik "Hitung Rekap Bulanan" untuk generate laporan bulan yang dipilih
          </p>
        </div>
      )}
    </div>
  );
};

export default MonthlyReport;
