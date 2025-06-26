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
        // Escape commas and quotes in CSV
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

export const exportDailyRecapToExcel = (dailyRecords, businessData, selectedDate) => {
  if (!dailyRecords || dailyRecords.length === 0) {
    alert('No records to export for this date');
    return;
  }

  // Ambil semua layanan dari data bisnis
  const allServices = businessData.services || [];

  // Buat header CSV: Date, Employee Name, [Service Names], Total Income
  const serviceHeaders = allServices.map(service => service.name);
  const headers = ['Date', 'Employee Name', ...serviceHeaders, 'Total Income'];

  // Proses setiap record harian menjadi satu baris data
  const exportData = dailyRecords.map(record => {
    const employeeName = getEmployeeName(record.employeeId, businessData);

    let totalIncome = 0;
    const row = {
      'Date': record.date,
      'Employee Name': employeeName
    };

    serviceHeaders.forEach(serviceName => {
      const service = allServices.find(s => s.name === serviceName);
      const quantity = service ? (record.services?.[service.id] || 0) : 0;
      const income = quantity * (service?.price || 0);
      row[serviceName] = quantity;
      totalIncome += income;
    });

    row['Total Income'] = totalIncome;

    return row;
  });

  // Konversi ke format CSV
  const csvContent = [
    headers.join(','),
    ...exportData.map(row =>
      headers.map(header => {
        const value = row[header] || 0;
        if (typeof value === 'string') {
          const cleanValue = value.replace(/[,"\n\r]/g, ' ').trim();
          return `"${cleanValue}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Buat dan unduh file CSV
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `daily_recap_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Fungsi bantu untuk mendapatkan nama karyawan
const getEmployeeName = (employeeId, businessData) => {
  const employee = businessData.employees.find(emp => emp.id === employeeId);
  return employee ? employee.name : 'Unknown Employee';
};
