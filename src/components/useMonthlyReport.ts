import { useMemo } from 'react';
import {
  calculateEmployeeSalary,
  calculateOwnerSalary
} from '../utils/dataManager.js';


export interface MonthlyRecap {
  bulan: number;
  tahun: number;
  totalPendapatanService: number;
  totalPendapatanProduct: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  totalGajiKaryawan: number;
  totalGajiOwner: number;
  totalTabunganOwner: number;
  labaBersih: number;
  hariAktif: number;
}

// Fungsi utama: rekap total bulanan
export const generateMonthlyRecap = (businessData: any, month: number, year: number): MonthlyRecap => {
  if (!businessData?.dailyRecords) {
    return {
      bulan: month,
      tahun: year,
      totalPendapatanService: 0,
      totalPendapatanProduct: 0,
      totalPemasukan: 0,
      totalPengeluaran: 0,
      totalGajiKaryawan: 0,
      totalGajiOwner: 0,
      totalTabunganOwner: 0,
      labaBersih: 0,
      hariAktif: 0
    };
  }

  const allRecords = Object.values(businessData.dailyRecords) as any[];
  const filteredRecords = allRecords.filter((record) => {
    const dateObj = new Date(record.date);
    return dateObj.getMonth() === month && dateObj.getFullYear() === year;
  });

  const groupedByDate: Record<string, any[]> = {};
  filteredRecords.forEach(record => {
    if (!groupedByDate[record.date]) groupedByDate[record.date] = [];
    groupedByDate[record.date].push(record);
  });

  let totalPendapatanService = 0;
  let totalPendapatanProduct = 0;
  let totalGajiKaryawan = 0;
  let totalGajiOwner = 0;
  let totalTabunganOwner = 0;
  let hariAktif = 0;

  const tabunganPerHari = businessData?.tabunganPerHari || 0;

  for (const [date, records] of Object.entries(groupedByDate)) {
    hariAktif += 1;

    // Gaji Karyawan
    for (const record of records) {
      const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
      if (!employee?.isOwner) {
        const result = calculateEmployeeSalary(record, businessData);
        totalGajiKaryawan += result.gajiDiterima;
        totalPendapatanService += result.layananTotal || 0;
      } else {
        const layananOwner = Object.entries(record.services || {}).reduce((sum, [serviceId, qty]) => {
          const service = businessData.services?.find(s => s.id === serviceId);
          if (!service) return sum;
          return sum + ((service?.price || 0) * Number(qty));
        }, 0);
        totalPendapatanService += layananOwner;
      }

      // Hitung Produk (kalau kamu pisahkan produk)
      const productSales = Object.entries(record.products || {}).reduce((sum, [productId, qty]) => {
        const product = businessData.products?.find(p => p.id === productId);
        return sum + ((product?.price || 0) * Number(qty));
      }, 0);
      totalPendapatanProduct += productSales;
    }

    // Gaji Owner
    const ownerSalary = calculateOwnerSalary(records, businessData);
    totalGajiOwner += ownerSalary?.gajiDiterima || 0;

    // Tabungan
    totalTabunganOwner += tabunganPerHari;
  }

  const totalPemasukan = totalPendapatanService + totalPendapatanProduct;
  const totalPengeluaran = totalGajiKaryawan + totalGajiOwner + totalTabunganOwner;
  const labaBersih = totalPemasukan - totalPengeluaran + totalTabunganOwner;

  return {
    bulan: month,
    tahun: year,
    totalPendapatanService,
    totalPendapatanProduct,
    totalPemasukan,
    totalPengeluaran,
    totalGajiKaryawan,
    totalGajiOwner,
    totalTabunganOwner,
    labaBersih,
    hariAktif
  };
};
