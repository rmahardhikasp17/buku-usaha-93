import { useState } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { formatCurrency } from '../utils/dataManager';

export interface Service {
  id: string;
  name: string;
  price: number;
}

export interface Employee {
  id: string;
  name: string;
  role: 'Owner' | 'Karyawan';
}

export interface DailyRecord {
  date: string;
  employeeId: string;
  services?: Record<string, number>;
  bonusServices?: Record<string, Record<string, boolean>>;
  bonusQuantities?: Record<string, Record<string, number>>;
}

export interface Transaction {
  date: string;
  type: 'Pemasukan' | 'Pengeluaran';
  amount: number;
  description: string;
}

export interface ProductSale {
  date: string;
  total: number;
}

export interface BusinessData {
  services: Service[];
  employees: Employee[];
  dailyRecords: Record<string, DailyRecord>;
  transactions: Record<string, Transaction>;
  productSales?: Record<string, ProductSale>;
}

export function useMonthlyReport(businessData: BusinessData) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportData, setReportData] = useState<any>(null);
  const [showExport, setShowExport] = useState(false);

  const getEmployeeRole = (employeeId: string): string => {
    const employee = businessData.employees?.find(emp => emp.id === employeeId);
    return employee?.role || 'Unknown';
  };

  const calculateServiceTotal = (serviceId: string, quantity: number) => {
    const service = businessData.services?.find(s => s.id === serviceId);
    const servicePrice = Number(service?.price) || 0;
    const serviceQuantity = Number(quantity) || 0;
    return servicePrice * serviceQuantity;
  };

  const calculateBonusTotal = (record: DailyRecord) => {
    if (!record.bonusServices || !record.bonusQuantities) return 0;
    
    let total = 0;
    Object.entries(record.bonusServices).forEach(([serviceId, bonusData]) => {
      Object.entries(bonusData || {}).forEach(([bonusId, isEnabled]) => {
        if (isEnabled) {
          const bonusService = businessData.services?.find(s => s.id === bonusId);
          const bonusQty = record.bonusQuantities?.[serviceId]?.[bonusId] || 0;
          total += (bonusService?.price || 0) * bonusQty;
        }
      });
    });
    
    return total;
  };

  const calculateEmployeeRevenue = (record: DailyRecord) => {
    // Hitung pendapatan dari layanan reguler
    const serviceRevenue = Object.entries(record.services || {})
      .filter(([_, quantity]) => Number(quantity) > 0)
      .reduce((sum, [serviceId, quantity]) => {
        return sum + calculateServiceTotal(serviceId, Number(quantity));
      }, 0);

    // Hitung pendapatan dari bonus
    const bonusRevenue = calculateBonusTotal(record);

    return serviceRevenue + bonusRevenue;
  };

  const calculateEmployeeSalary = (record: DailyRecord, allRecords: DailyRecord[]) => {
    const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
    const isOwner = employee?.role === 'Owner';
    
    if (isOwner) {
      // Untuk Owner: Pendapatan sendiri + 50% dari semua karyawan - tabungan - uang hadir karyawan
      
      // Hitung total pendapatan dari semua karyawan (bukan Owner)
      const employeeRecords = allRecords.filter(r => {
        const emp = businessData.employees?.find(e => e.id === r.employeeId);
        return emp?.role !== 'Owner';
      });

      const totalEmployeeRevenue = employeeRecords.reduce((sum, empRecord) => {
        return sum + calculateEmployeeRevenue(empRecord);
      }, 0);

      const employeeShareRevenue = totalEmployeeRevenue * 0.5;
      const dailySavings = 40000;
      const employeeCount = employeeRecords.length;
      const employeeDeduction = 10000 * employeeCount;
      
      const serviceRevenue = Object.entries(record.services || {})
        .filter(([_, quantity]) => Number(quantity) > 0)
        .reduce((sum, [serviceId, quantity]) => {
          return sum + calculateServiceTotal(serviceId, Number(quantity));
        }, 0);

      const bonusTotal = calculateBonusTotal(record);

      return {
        salary: serviceRevenue + bonusTotal + employeeShareRevenue - dailySavings - employeeDeduction,
        breakdown: {
          serviceRevenue,
          bonusTotal,
          employeeShareRevenue,
          dailySavings,
          employeeDeduction,
          employeeCount,
          totalEmployeeRevenue
        }
      };
    } else {
      // Untuk Karyawan: 50% dari pendapatannya + uang hadir
      const serviceRevenue = Object.entries(record.services || {})
        .filter(([_, quantity]) => Number(quantity) > 0)
        .reduce((sum, [serviceId, quantity]) => {
          return sum + calculateServiceTotal(serviceId, Number(quantity));
        }, 0);

      const bonusTotal = calculateBonusTotal(record);
      const baseRevenue = serviceRevenue * 0.5; // 50% dari layanan reguler
      const attendanceBonus = 10000;
      
      return {
        salary: baseRevenue + bonusTotal + attendanceBonus, // Bonus 100% untuk karyawan
        breakdown: {
          baseRevenue,
          bonusTotal,
          attendanceBonus,
          totalRevenue: serviceRevenue + bonusTotal
        }
      };
    }
  };

  const calculatePerEmployeeSalaries = (monthlyRecords: DailyRecord[]) => {
    const employeeSalaries: Record<string, any> = {};
    
    // Group records by date to calculate daily salaries correctly
    const recordsByDate: Record<string, DailyRecord[]> = {};
    monthlyRecords.forEach(record => {
      if (!recordsByDate[record.date]) {
        recordsByDate[record.date] = [];
      }
      recordsByDate[record.date].push(record);
    });

    // Calculate salaries for each day and accumulate
    Object.values(recordsByDate).forEach(dailyRecords => {
      dailyRecords.forEach(record => {
        const employeeId = record.employeeId;
        const employee = businessData.employees?.find(emp => emp.id === employeeId);
        
        if (!employeeSalaries[employeeId]) {
          employeeSalaries[employeeId] = {
            employeeId,
            name: employee?.name || 'Unknown',
            role: employee?.role || 'Unknown',
            gaji: 0,
            bonus: 0,
            potongan: 0,
            totalRevenue: 0
          };
        }

        const salaryData = calculateEmployeeSalary(record, dailyRecords);
        const revenue = calculateEmployeeRevenue(record);
        
        employeeSalaries[employeeId].gaji += salaryData.salary;
        employeeSalaries[employeeId].bonus += salaryData.breakdown.bonusTotal || 0;
        employeeSalaries[employeeId].totalRevenue += revenue;
        
        // For owner, add savings as "potongan"
        if (employee?.role === 'Owner') {
          employeeSalaries[employeeId].potongan += salaryData.breakdown.dailySavings || 0;
        }
      });
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

    // Calculate total revenue from all services
    const totalRevenue = monthlyRecords.reduce((sum, record) => {
      return sum + calculateEmployeeRevenue(record);
    }, 0);

    // Calculate per employee salaries using the correct logic
    const perEmployeeSalaries = calculatePerEmployeeSalaries(monthlyRecords);

    // Calculate totals
    const totalEmployeeSalaries = perEmployeeSalaries
      .filter(emp => emp.role === 'Karyawan')
      .reduce((sum, emp) => sum + emp.gaji, 0);

    const ownerSalary = perEmployeeSalaries
      .filter(emp => emp.role === 'Owner')
      .reduce((sum, emp) => sum + emp.gaji, 0);

    const totalBonuses = perEmployeeSalaries.reduce((sum, emp) => sum + emp.bonus, 0);
    const totalTabunganOwner = perEmployeeSalaries
      .filter(emp => emp.role === 'Owner')
      .reduce((sum, emp) => sum + emp.potongan, 0);

    const income = monthlyTransactions.filter(t => t.type === 'Pemasukan').reduce((sum, t) => sum + t.amount, 0);
    const expenses = monthlyTransactions.filter(t => t.type === 'Pengeluaran').reduce((sum, t) => sum + t.amount, 0);
    const totalProductRevenue = monthlyProductSales.reduce((sum, sale) => sum + sale.total, 0);
    const activeDays = new Set(monthlyRecords.map(record => record.date)).size;
    const activeEmployees = new Set(monthlyRecords.map(record => record.employeeId)).size;

    const netProfit = totalRevenue + income + totalProductRevenue - totalEmployeeSalaries - ownerSalary - expenses;

    const data = {
      totalRevenue,
      totalExpenses: expenses,
      totalEmployeeSalaries,
      ownerSavings: totalTabunganOwner,
      totalBonuses,
      totalProductRevenue,
      netProfit,
      activeDays,
      activeEmployees,
      ownerSalary,
      income,
      monthlyRecords,
      monthlyProductSales,
      monthlyTransactions,
      perEmployeeSalaries
    };

    setReportData(data);
    setShowExport(true);
  };

  const handleExport = () => {
    if (!reportData) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();

      // Summary Sheet
      const summarySheet = [
        ['Laporan Bulanan', selectedMonth],
        [],
        ['Ringkasan'],
        ['Total Pendapatan', reportData.totalRevenue],
        ['Total Pengeluaran', reportData.totalExpenses],
        ['Total Gaji Karyawan', reportData.totalEmployeeSalaries],
        ['Total Gaji Owner', reportData.ownerSalary],
        ['Total Tabungan Owner', reportData.ownerSavings],
        ['Total Product Revenue', reportData.totalProductRevenue],
        ['Laba Bersih', reportData.netProfit],
        [],
        ['Aktivitas'],
        ['Hari Aktif', reportData.activeDays],
        ['Karyawan Aktif', reportData.activeEmployees]
      ];
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summarySheet), 'Ringkasan');

      // Per Employee Summary with Service Quantities
      const serviceHeaders = businessData.services.map(service => service.name);
      const salaryHeaders = ['Nama', 'Role', 'Total Gaji', 'Total Bonus', 'Tabungan/Potongan', ...serviceHeaders];
      
      const salaryData = [
        salaryHeaders,
        ...reportData.perEmployeeSalaries.map((emp: any) => {
          const empRecords = reportData.monthlyRecords.filter((r: any) => r.employeeId === emp.employeeId);
          const serviceQuantities = serviceHeaders.map(serviceName => {
            const service = businessData.services.find(s => s.name === serviceName);
            if (!service) return 0;

            return empRecords.reduce((total: number, record: any) => {
              // Regular service quantity
              const regularQty = record.services?.[service.id] || 0;
              
              // Bonus service quantity
              let bonusQty = 0;
              if (record.bonusServices && record.bonusQuantities) {
                Object.entries(record.bonusServices).forEach(([serviceId, bonusData]: [string, any]) => {
                  Object.entries(bonusData || {}).forEach(([bonusId, isEnabled]: [string, any]) => {
                    if (isEnabled && bonusId === service.id) {
                      bonusQty += record.bonusQuantities[serviceId]?.[bonusId] || 0;
                    }
                  });
                });
              }
              
              return total + Number(regularQty) + Number(bonusQty);
            }, 0);
          });

          return [
            emp.name,
            emp.role,
            emp.gaji,
            emp.bonus,
            emp.potongan,
            ...serviceQuantities
          ];
        })
      ];
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(salaryData), 'Gaji Per Orang');

      // Daily Records Sheet
      const dailyHeaders = ['Tanggal', 'Nama', 'Role', ...serviceHeaders, 'Total Gaji'];
      const dailyData = [dailyHeaders];
      
      // Group by date for daily calculation
      const recordsByDate: Record<string, any[]> = {};
      reportData.monthlyRecords.forEach((record: any) => {
        if (!recordsByDate[record.date]) {
          recordsByDate[record.date] = [];
        }
        recordsByDate[record.date].push(record);
      });

      Object.entries(recordsByDate).forEach(([date, records]) => {
        records.forEach(record => {
          const emp = businessData.employees.find(e => e.id === record.employeeId);
          const salaryData = calculateEmployeeSalary(record, records);
          
          const serviceQuantities = serviceHeaders.map(serviceName => {
            const service = businessData.services.find(s => s.name === serviceName);
            if (!service) return 0;

            // Regular service quantity
            const regularQty = record.services?.[service.id] || 0;
            
            // Bonus service quantity  
            let bonusQty = 0;
            if (record.bonusServices && record.bonusQuantities) {
              Object.entries(record.bonusServices).forEach(([serviceId, bonusData]: [string, any]) => {
                Object.entries(bonusData || {}).forEach(([bonusId, isEnabled]: [string, any]) => {
                  if (isEnabled && bonusId === service.id) {
                    bonusQty += record.bonusQuantities[serviceId]?.[bonusId] || 0;
                  }
                });
              });
            }
            
            return Number(regularQty) + Number(bonusQty);
          });

          dailyData.push([
            date,
            emp?.name || 'Unknown',
            emp?.role || 'Unknown',
            ...serviceQuantities,
            salaryData.salary
          ]);
        });
      });
      
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(dailyData), 'Data Harian');

      // Transactions Sheet
      const transactionData = [
        ['Tanggal', 'Jenis', 'Deskripsi', 'Nominal'],
        ...reportData.monthlyTransactions.map((t: any) => [
          t.date,
          t.type,
          t.description,
          t.amount
        ])
      ];
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(transactionData), 'Transaksi');

      XLSX.writeFile(workbook, `Laporan_Bulanan_${selectedMonth}.xlsx`);
      toast.success('Berhasil ekspor laporan bulanan ke Excel!');
    } catch (error) {
      console.error('Gagal ekspor ke Excel:', error);
      toast.error('Gagal ekspor laporan');
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