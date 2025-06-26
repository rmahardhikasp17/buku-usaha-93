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

export const exportDailyRecapToExcel = (dailyRecords, businessData, selectedDate) => {
  if (!dailyRecords || dailyRecords.length === 0) {
    alert('No records to export for this date');
    return;
  }

  const allServices = businessData.services || [];
  const serviceHeaders = allServices.map(service => service.name);
  const headers = ['Date', 'Employee Name', ...serviceHeaders, 'Total Income'];

  const exportData = dailyRecords.map(record => {
    const employeeName = getEmployeeName(record.employeeId, businessData);
    const row = {
      'Date': record.date,
      'Employee Name': employeeName,
      'Total Income': record.gajiDiterima || 0  // ✅ Ambil langsung dari gaji yang sudah dihitung
    };

    serviceHeaders.forEach(serviceName => {
      const service = allServices.find(s => s.name === serviceName);
      row[serviceName] = service ? (record.services?.[service.id] || 0) : 0;
    });

    return row;
  });

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

// Fungsi bantu
const getEmployeeName = (employeeId, businessData) => {
  const employee = businessData.employees.find(emp => emp.id === employeeId);
  return employee ? employee.name : 'Unknown Employee';
};
