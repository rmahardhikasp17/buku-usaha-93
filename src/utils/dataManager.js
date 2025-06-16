
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

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
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

  // Get all unique services from the business data
  const allServices = businessData.services || [];
  
  // Create headers: Date, Employee Name, [Service Names...], Total Income
  const serviceHeaders = allServices.map(service => service.name);
  const headers = ['Date', 'Employee Name', ...serviceHeaders, 'Total Income'];
  
  // Process each daily record into a row
  const exportData = dailyRecords.map(record => {
    const employeeName = getEmployeeName(record.employeeId, businessData);
    
    // Create the row data
    const row = {
      'Date': record.date,
      'Employee Name': employeeName,
      'Total Income': record.total
    };
    
    // Add service quantities to the row
    serviceHeaders.forEach(serviceName => {
      const service = allServices.find(s => s.name === serviceName);
      if (service) {
        const quantity = record.services[service.id] || 0;
        row[serviceName] = quantity;
      } else {
        row[serviceName] = 0;
      }
    });
    
    return row;
  });

  // Convert to CSV format
  const csvContent = [
    headers.join(','),
    ...exportData.map(row => 
      headers.map(header => {
        const value = row[header] || 0;
        // Clean the value to avoid CSV formatting issues
        if (typeof value === 'string') {
          // Remove any commas, quotes, and line breaks that could break CSV
          const cleanValue = value.replace(/[,"\n\r]/g, ' ').trim();
          return `"${cleanValue}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Create and download the file
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

// Helper function to get employee name
const getEmployeeName = (employeeId, businessData) => {
  const employee = businessData.employees.find(emp => emp.id === employeeId);
  return employee ? employee.name : 'Unknown Employee';
};
