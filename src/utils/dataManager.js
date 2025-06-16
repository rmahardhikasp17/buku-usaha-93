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

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths (auto-fit)
  const columnWidths = headers.map(header => {
    const maxLength = Math.max(
      header.length,
      ...exportData.map(row => String(row[header] || '').length)
    );
    return { wch: Math.min(Math.max(maxLength + 2, 10), 30) };
  });
  worksheet['!cols'] = columnWidths;

  // Create table range
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  const tableRange = {
    s: { c: range.s.c, r: range.s.r },
    e: { c: range.e.c, r: range.e.r }
  };

  // Add table formatting
  worksheet['!tables'] = [{
    ref: XLSX.utils.encode_range(tableRange),
    name: 'DailyRecapTable',
    displayName: 'Daily Recap',
    headerRowCount: 1,
    totalsRowShown: false,
    style: {
      theme: 'TableStyleMedium2',
      showFirstColumn: false,
      showLastColumn: false,
      showRowStripes: true,
      showColumnStripes: false
    }
  }];

  // Format cells
  const totalIncomeColIndex = headers.indexOf('Total Income');
  
  // Apply formatting to each cell
  for (let row = 0; row <= range.e.r; row++) {
    for (let col = 0; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      
      if (!cell) continue;
      
      // Header row formatting
      if (row === 0) {
        cell.s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4472C4" } },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          },
          alignment: { horizontal: "center", vertical: "center" }
        };
      } else {
        // Data rows formatting
        const isEvenRow = row % 2 === 0;
        const bgColor = isEvenRow ? "F2F2F2" : "FFFFFF";
        
        cell.s = {
          border: {
            top: { style: "thin", color: { rgb: "D0D0D0" } },
            bottom: { style: "thin", color: { rgb: "D0D0D0" } },
            left: { style: "thin", color: { rgb: "D0D0D0" } },
            right: { style: "thin", color: { rgb: "D0D0D0" } }
          },
          fill: { fgColor: { rgb: bgColor } },
          alignment: { horizontal: "left", vertical: "center" }
        };
        
        // Currency formatting for Total Income column
        if (col === totalIncomeColIndex && cell.v) {
          cell.s.numFmt = '"Rp "#,##0';
          cell.s.alignment = { horizontal: "right", vertical: "center" };
        }
        
        // Number formatting for service quantity columns
        if (col > 1 && col < totalIncomeColIndex && typeof cell.v === 'number') {
          cell.s.alignment = { horizontal: "center", vertical: "center" };
        }
      }
    }
  }

  // Add autofilter (Excel table automatically includes this, but we'll ensure it)
  worksheet['!autofilter'] = tableRange;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Recap');

  // Generate Excel file and download
  const excelBuffer = XLSX.write(workbook, { 
    bookType: 'xlsx', 
    type: 'array',
    cellStyles: true
  });
  
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `daily_recap_${selectedDate}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// Helper function to get employee name
const getEmployeeName = (employeeId, businessData) => {
  const employee = businessData.employees.find(emp => emp.id === employeeId);
  return employee ? employee.name : 'Unknown Employee';
};
