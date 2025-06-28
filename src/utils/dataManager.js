const STORAGE_KEY = 'business_bookkeeping_data';
import * as XLSX from 'xlsx';

// 📦 Load & Save Data
export const loadData = () => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    return savedData ? JSON.parse(savedData) : null;
  } catch (error) {
    console.error('Error loading data:', error);
    return null;
  }
};

export const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

// 💰 Format Rupiah
export const formatCurrency = (value) => {
  const numValue = Number(value) || 0;
  return `Rp ${numValue.toLocaleString('id-ID')}`;
};

// 📅 Total Pendapatan Hari Ini
export const getTodayTotal = (businessData) => {
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = Object.values(businessData.dailyRecords || {})
    .filter(record => record.date === today);

  return todayRecords.reduce((sum, record) => {
    const services = businessData.services || [];
    const totalLayanan = Object.entries(record.services || {}).reduce((total, [serviceId, qty]) => {
      const service = services.find(s => s.id === serviceId);
      return total + ((service?.price || 0) * qty);
    }, 0);
    return sum + totalLayanan;
  }, 0);
};

// 📤 Export ke CSV
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// 📤 Export Rekap Harian ke Excel
export const exportDailyRecapToExcel = (
  dailyRecords,
  businessData,
  selectedDate,
  mappedSalaries = []
) => {
  if (!dailyRecords || dailyRecords.length === 0) {
    alert('No records to export for this date');
    return;
  }

  const allServices = businessData.services || [];
  const serviceHeaders = allServices.map(service => service.name);
  const headers = ['Tanggal', 'Nama Karyawan', ...serviceHeaders, 'Total Gaji'];

  const exportData = dailyRecords.map(record => {
    const employeeName = getEmployeeName(record.employeeId, businessData);
    const row = {
      'Tanggal': record.date,
      'Nama Karyawan': employeeName
    };

    serviceHeaders.forEach(serviceName => {
      const service = allServices.find(s => s.name === serviceName);
      if (!service) {
        row[serviceName] = 0;
        return;
      }

      const regularQuantity = record.services?.[service.id] || 0;

      let bonusQuantity = 0;
      if (record.bonusServices && record.bonusQuantities) {
        Object.entries(record.bonusServices).forEach(([serviceId, bonusData]) => {
          Object.entries(bonusData || {}).forEach(([bonusId, isEnabled]) => {
            if (isEnabled && bonusId === service.id) {
              bonusQuantity += record.bonusQuantities[serviceId]?.[bonusId] || 0;
            }
          });
        });
      }

      row[serviceName] = Number(regularQuantity) + Number(bonusQuantity);
    });

    const salaryMatch = mappedSalaries.find(
      s => s.employeeId === record.employeeId && s.date === record.date
    );
    row['Total Gaji'] = salaryMatch ? salaryMatch.gajiDiterima : 0;

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Harian');
  XLSX.writeFile(workbook, `Daily_Recap_${selectedDate}.xlsx`);
};

// 🧑 Get Nama Karyawan
const getEmployeeName = (employeeId, businessData) => {
  const employee = businessData.employees.find(emp => emp.id === employeeId);
  return employee ? employee.name : 'Unknown';
};

// 💼 Gaji Karyawan
export const calculateEmployeeSalary = (record, businessData) => {
  const services = businessData.services || [];
  const bonuses = businessData.bonusServices || [];

  const layanan = Object.entries(record.services || {}).reduce((total, [serviceId, qty]) => {
    const service = services.find(s => s.id === serviceId);
    return total + ((service?.price || 0) * qty);
  }, 0);

  const bonusTotal = Object.entries(record.bonusQuantities || {}).reduce((total, [serviceId, bonusMap]) => {
    Object.entries(bonusMap).forEach(([bonusId, qty]) => {
      const bonus = bonuses.find(b => b.id === bonusId);
      total += (bonus?.price || 0) * qty;
    });
    return total;
  }, 0);

  const hadir = record.attendance ? record.attendanceBonus || 0 : 0;

  return {
    employeeId: record.employeeId,
    date: record.date,
    gajiDiterima: (layanan * 0.5) + bonusTotal + hadir,
    layananTotal: layanan,
    bonusTotal,
    hadir
  };
};

// 👑 Gaji Owner
export const calculateOwnerSalary = (records, businessData) => {
  const owner = businessData.employees.find(emp => emp.isOwner);
  if (!owner) return null;

  const ownerRecord = records.find(r => r.employeeId === owner.id);
  if (!ownerRecord) return null;

  const services = businessData.services || [];
  const bonuses = businessData.bonusServices || [];

  const layananOwner = Object.entries(ownerRecord.services || {}).reduce((total, [serviceId, qty]) => {
    const service = services.find(s => s.id === serviceId);
    return total + ((service?.price || 0) * qty);
  }, 0);

  const bonusOwner = Object.entries(ownerRecord.bonusQuantities || {}).reduce((total, [serviceId, bonusMap]) => {
    Object.entries(bonusMap).forEach(([bonusId, qty]) => {
      const bonus = bonuses.find(b => b.id === bonusId);
      total += (bonus?.price || 0) * qty;
    });
    return total;
  }, 0);

  const karyawanRecords = records.filter(r => r.employeeId !== owner.id);
  // Hitung total pendapatan layanan reguler dari semua karyawan
  const totalBaseRevenueKaryawan = karyawanRecords.reduce((sum, r) => {
    const layananReguler = Object.entries(r.services || {}).reduce((subtotal, [serviceId, qty]) => {
      const service = services.find(s => s.id === serviceId);
      return subtotal + ((service?.price || 0) * qty);
    }, 0);
    return sum + layananReguler;
  }, 0);

  // Ambil hanya 50% dari layanan reguler karyawan
  const employeeShare = totalBaseRevenueKaryawan * 0.5;

  // Hitung total gaji owner
  const gajiOwner = layananOwner + bonusOwner + employeeShare - uangHadir - tabungan;


  const uangHadir = karyawanRecords.reduce((sum, r) => {
    return sum + (r.attendance ? (r.attendanceBonus || 0) : 0);
  }, 0);

  const tabungan = businessData.tabunganPerHari || 0;

  return {
  employeeId: owner.id,
  date: ownerRecord.date,
  gajiDiterima: gajiOwner,
  layananOwner,
  bonusOwner,
  layananKaryawan: totalBaseRevenueKaryawan, // nilai 100%-nya untuk referensi
  uangHadir,
  tabungan
  };
};


// 📊 Rekap Harian
export const calculateDailySummary = (selectedDate, businessData) => {
  const allRecords = Object.values(businessData.dailyRecords || {});
  const recordsToday = allRecords.filter(r => r.date === selectedDate);

  const employeeSalaries = recordsToday.map(r => calculateEmployeeSalary(r, businessData));
  const ownerSalary = calculateOwnerSalary(recordsToday, businessData);

  const totalRevenue = recordsToday.reduce((sum, r) => {
    const layanan = Object.entries(r.services || {}).reduce((total, [serviceId, qty]) => {
      const service = businessData.services.find(s => s.id === serviceId);
      return total + ((service?.price || 0) * qty);
    }, 0);
    return sum + layanan;
  }, 0);

  return {
    tanggal: selectedDate,
    totalPendapatan: totalRevenue,
    gajiOwner: ownerSalary,
    gajiKaryawan: employeeSalaries
  };
};

// 📤 Export Laporan Bulanan ke Excel (3 Sheet)
export const exportMonthlyReportToExcel = (businessData, month, year) => {
  const allRecords = Object.values(businessData.dailyRecords || {});
  const filteredRecords = allRecords.filter(record => {
    const date = new Date(record.date);
    return date.getMonth() === month && date.getFullYear() === year;
  });

  const groupedByDate = {};
  filteredRecords.forEach(record => {
    if (!groupedByDate[record.date]) groupedByDate[record.date] = [];
    groupedByDate[record.date].push(record);
  });

  const tabunganPerHari = businessData.tabunganPerHari || 0;

  // Sheet 1: Ringkasan Bulanan
  const summary = generateMonthlyRecap(businessData, month, year);

  const summarySheetData = [
    ['Bulan', `${month + 1}`],
    ['Tahun', `${year}`],
    ['Total Pendapatan Service', summary.totalPendapatanService],
    ['Total Pendapatan Produk', summary.totalPendapatanProduct],
    ['Total Pemasukan (dari Halaman Pemasukan)', summary.totalPemasukan],
    ['Total Pengeluaran (Halaman Pengeluaran)', summary.totalPengeluaran],
    ['Total Gaji Karyawan', summary.totalGajiKaryawan],
    ['Total Gaji Owner', summary.totalGajiOwner],
    ['Total Tabungan Owner', summary.totalTabunganOwner],
    ['Laba Bersih', summary.labaBersih],
    ['Hari Aktif', summary.hariAktif],
    ['Karyawan Aktif', summary.activeEmployees]
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summarySheetData);

  // Sheet 2: Data Harian (Service & Bonus)
  const serviceSheetData = [
    ['Tanggal', 'Nama Karyawan', 'Role', 'Pendapatan Layanan', 'Bonus', 'Gaji Diterima']
  ];

  Object.entries(groupedByDate).forEach(([date, records]) => {
    records.forEach(record => {
      const employee = businessData.employees.find(e => e.id === record.employeeId);
      const name = employee?.name || 'Tidak diketahui';
      const role = employee?.isOwner ? 'Owner' : 'Karyawan';

      const result = employee?.isOwner
        ? calculateOwnerSalary(records, businessData)
        : calculateEmployeeSalary(record, businessData);

      const layanan = result?.layananTotal || result?.layananOwner || 0;
      const bonus = result?.bonusTotal || result?.bonusOwner || 0;
      const gaji = result?.gajiDiterima || 0;

      serviceSheetData.push([date, name, role, layanan, bonus, gaji]);
    });
  });

  const serviceSheet = XLSX.utils.aoa_to_sheet(serviceSheetData);

  // Sheet 3: Penjualan Produk
  const productSheetData = [
    ['Tanggal', 'Nama Karyawan', 'Nama Produk', 'Jumlah', 'Total']
  ];

  filteredRecords.forEach(record => {
    const employee = businessData.employees.find(e => e.id === record.employeeId);
    const name = employee?.name || 'Tidak diketahui';

    Object.entries(record.products || {}).forEach(([productId, qty]) => {
      const product = businessData.products?.find(p => p.id === productId);
      if (product && Number(qty) > 0) {
        const total = product.price * Number(qty);
        productSheetData.push([record.date, name, product.name, qty, total]);
      }
    });
  });

  const productSheet = XLSX.utils.aoa_to_sheet(productSheetData);

  // Buat Workbook dan simpan
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');
  XLSX.utils.book_append_sheet(workbook, serviceSheet, 'Data Harian');
  XLSX.utils.book_append_sheet(workbook, productSheet, 'Penjualan Produk');

  const fileName = `Laporan_Bulanan_${year}-${String(month + 1).padStart(2, '0')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
