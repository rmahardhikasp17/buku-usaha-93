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

// Calculate today's service revenue including bonuses
export const getTodayTotal = (businessData) => {
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = Object.values(businessData.dailyRecords || {})
    .filter(record => record.date === today);
  
  return todayRecords.reduce((sum, record) => {
    // Calculate service revenue
    const serviceRevenue = Object.entries(record.services || {})
      .filter(([_, quantity]) => Number(quantity) > 0)
      .reduce((serviceSum, [serviceId, quantity]) => {
        const service = businessData.services?.find(s => s.id === serviceId);
        return serviceSum + (service?.price || 0) * Number(quantity);
      }, 0);

    // Calculate bonus revenue
    let bonusTotal = 0;
    if (record.bonusServices && record.bonusQuantities) {
      Object.entries(record.bonusServices).forEach(([serviceId, bonusData]) => {
        Object.entries(bonusData || {}).forEach(([bonusId, isEnabled]) => {
          if (isEnabled) {
            const bonusService = businessData.services?.find(s => s.id === bonusId);
            const bonusQty = record.bonusQuantities[serviceId]?.[bonusId] || 0;
            bonusTotal += (bonusService?.price || 0) * bonusQty;
          }
        });
      });
    }

    return sum + serviceRevenue + bonusTotal;
  }, 0);
};

// Calculate today's product sales
export const getTodayProductSales = (businessData) => {
  const today = new Date().toISOString().split('T')[0];
  return Object.values(businessData.productSales || {})
    .filter(sale => sale.date === today)
    .reduce((sum, sale) => sum + sale.total, 0);
};

// Get total number of products
export const getTotalProducts = (businessData) => {
  return businessData.products?.length || 0;
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
    throw new Error('No records to export for this date');
  }

  try {
    // Dynamic import XLSX
    import('xlsx').then(XLSX => {
      const wb = XLSX.utils.book_new();
      
      // Calculate employee salaries
      const totalEmployeeRevenue = dailyRecords.reduce((sum, record) => {
        const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
        if (employee?.role !== 'Owner') {
          const recordTotal = Object.entries(record.services || {})
            .filter(([_, quantity]) => Number(quantity) > 0)
            .reduce((recordSum, [serviceId, quantity]) => {
              const service = businessData.services?.find(s => s.id === serviceId);
              return recordSum + (service?.price || 0) * Number(quantity);
            }, 0);
          return sum + recordTotal;
        }
        return sum;
      }, 0);

      const employeeCount = dailyRecords.filter(record => {
        const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
        return employee?.role !== 'Owner';
      }).length;

      // Prepare export data
      const exportData = dailyRecords.map(record => {
        const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
        const isOwner = employee?.role === 'Owner';
        
        // Calculate service revenue
        const serviceRevenue = Object.entries(record.services || {})
          .filter(([_, quantity]) => Number(quantity) > 0)
          .reduce((sum, [serviceId, quantity]) => {
            const service = businessData.services?.find(s => s.id === serviceId);
            return sum + (service?.price || 0) * Number(quantity);
          }, 0);

        // Calculate bonus revenue
        let bonusTotal = 0;
        if (record.bonusServices && record.bonusQuantities) {
          Object.entries(record.bonusServices).forEach(([serviceId, bonusData]) => {
            Object.entries(bonusData || {}).forEach(([bonusId, isEnabled]) => {
              if (isEnabled) {
                const bonusService = businessData.services?.find(s => s.id === bonusId);
                const bonusQty = record.bonusQuantities[serviceId]?.[bonusId] || 0;
                bonusTotal += (bonusService?.price || 0) * bonusQty;
              }
            });
          });
        }

        // Calculate salary
        let salary;
        if (isOwner) {
          const employeeShareRevenue = totalEmployeeRevenue * 0.5;
          const dailySavings = 40000;
          salary = serviceRevenue + bonusTotal + employeeShareRevenue - dailySavings;
        } else {
          const baseRevenue = serviceRevenue * 0.5;
          salary = baseRevenue + bonusTotal;
        }

        return {
          'Tanggal': record.date,
          'Nama Karyawan': employee?.name || 'Unknown',
          'Role': isOwner ? 'Owner' : 'Employee',
          'Pendapatan Layanan': serviceRevenue,
          'Bonus Layanan': bonusTotal,
          'Total Gaji': salary
        };
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Daily Recap');
      
      // Download file
      XLSX.writeFile(wb, `daily_recap_${selectedDate}.xlsx`);
    }).catch(error => {
      console.error('Failed to load XLSX library:', error);
      throw new Error('Failed to export Excel file');
    });
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};

// Helper function to get employee name
const getEmployeeName = (employeeId, businessData) => {
  const employee = businessData.employees.find(emp => emp.id === employeeId);
  return employee ? employee.name : 'Unknown Employee';
};
