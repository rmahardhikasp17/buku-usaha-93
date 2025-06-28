import { useMemo } from 'react';
import {
  calculateEmployeeSalary,
  calculateOwnerSalary
} from '../utils/dataManager.js';


// Tipe data ringkasan harian
export interface DailySummary {
  date: string;
  ownerSalary: number;
  employeeSalaries: Record<string, number>;
  totalRevenue: number;
  totalPayout: number;
  sisaSaldo: number;
}

// Hook utama untuk laporan bulanan
export const useMonthlyReport = (businessData: any): DailySummary[] => {
  return useMemo(() => {
    if (!businessData?.dailyRecords) return [];

    const allRecords = Object.values(businessData.dailyRecords) as any[];
    const groupedByDate: Record<string, any[]> = {};

    // Kelompokkan records berdasarkan tanggal
    allRecords.forEach(record => {
      const date = record.date;
      if (!groupedByDate[date]) groupedByDate[date] = [];
      groupedByDate[date].push(record);
    });

    // Proses masing-masing tanggal
    const summaries: DailySummary[] = [];

    Object.entries(groupedByDate).forEach(([date, records]) => {
      let totalRevenue = 0;
      let totalPayout = 0;
      const employeeSalaries: Record<string, number> = {};

      // Hitung gaji karyawan dan total layanan
      for (const record of records) {
        const result = calculateEmployeeSalary(record, businessData);
        employeeSalaries[record.employeeId] = result.gajiDiterima;
        totalPayout += result.gajiDiterima;
        totalRevenue += result.layananTotal; // hanya layanan, tanpa bonus
      }

      // Hitung gaji owner
      const ownerData = calculateOwnerSalary(records, businessData);
      const ownerSalary = ownerData?.gajiDiterima || 0;
      totalPayout += ownerSalary;

      // Hitung sisa kas harian
      const sisaSaldo = totalRevenue - totalPayout;

      summaries.push({
        date,
        ownerSalary,
        employeeSalaries,
        totalRevenue,
        totalPayout,
        sisaSaldo
      });
    });

    // Urutkan naik berdasarkan tanggal
    return summaries.sort((a, b) => a.date.localeCompare(b.date));
  }, [businessData]);
};
