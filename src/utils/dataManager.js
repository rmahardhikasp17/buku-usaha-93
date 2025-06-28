const STORAGE_KEY = 'business_bookkeeping_data';

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

export const formatCurrency = (value) => {
  const numValue = Number(value) || 0;
  return `Rp ${numValue.toLocaleString('id-ID')}`;
};

export const getTodayTotal = (businessData) => {
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = Object.values(businessData.dailyRecords)
    .filter(record => record.date === today);

  return todayRecords.reduce((sum, record) => sum + record.total, 0);
};

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

import * as XLSX from 'xlsx';

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

    // Hitung jumlah untuk setiap layanan (reguler + bonus)
    serviceHeaders.forEach(serviceName => {
      const service = allServices.find(s => s.name === serviceName);
      if (!service) {
        row[serviceName] = 0;
        return;
      }

      // Jumlah dari layanan reguler
      const regularQuantity = record.services?.[service.id] || 0;

      // Jumlah dari bonus - hitung semua bonus yang menggunakan layanan ini
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

    // Ambil gaji dari mappedSalaries
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

// Fungsi bantu
const getEmployeeName = (employeeId, businessData) => {
  const employee = businessData.employees.find(emp => emp.id === employeeId);
  return employee ? employee.name : 'Unknown';
};