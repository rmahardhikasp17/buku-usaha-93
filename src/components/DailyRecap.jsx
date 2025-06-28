import React, { useState } from 'react';
import { Calendar, Download, Eye, User, DollarSign } from 'lucide-react';
import { formatCurrency, exportDailyRecapToExcel } from '../utils/dataManager';

const DailyRecap = ({ businessData }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const getEmployeeName = (employeeId) => {
    const employee = businessData.employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : 'Unknown Employee';
  };

  const getServiceName = (serviceId) => {
    const service = businessData.services.find(srv => srv.id === serviceId);
    return service ? service.name : 'Unknown Service';
  };

  const getDailyRecords = (date) => {
    return Object.values(businessData.dailyRecords).filter(record => record.date === date);
  };

  const calculateServiceTotal = (serviceId, quantity) => {
    const service = businessData.services?.find(s => s.id === serviceId);
    const servicePrice = Number(service?.price) || 0;
    const serviceQuantity = Number(quantity) || 0;
    return servicePrice * serviceQuantity;
  };

  const calculateBonusTotal = (bonusServices, bonusQuantities) => {
    if (!bonusServices || !bonusQuantities) return 0;
    
    let total = 0;
    Object.entries(bonusServices).forEach(([serviceId, bonusData]) => {
      Object.entries(bonusData || {}).forEach(([bonusId, isEnabled]) => {
        if (isEnabled) {
          const bonusService = businessData.services?.find(s => s.id === bonusId);
          const bonusQty = bonusQuantities[serviceId]?.[bonusId] || 0;
          total += (bonusService?.price || 0) * bonusQty;
        }
      });
    });
    
    return total;
  };

  const getBonusDetails = (bonusServices, bonusQuantities) => {
    const details = [];
    
    if (!bonusServices || !bonusQuantities) return details;
    
    Object.entries(bonusServices).forEach(([serviceId, bonusData]) => {
      Object.entries(bonusData || {}).forEach(([bonusId, isEnabled]) => {
        if (isEnabled) {
          const bonusService = businessData.services?.find(s => s.id === bonusId);
          const bonusQty = bonusQuantities[serviceId]?.[bonusId] || 0;
          if (bonusQty > 0 && bonusService) {
            details.push({
              name: bonusService.name,
              quantity: bonusQty,
              value: (bonusService.price || 0) * bonusQty
            });
          }
        }
      });
    });
    
    return details;
  };

  const calculateEmployeeSalary = (record, employeeRevenueData, employeeCount) => {
    const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
    const isOwner = employee?.role === 'Owner';
    
    const serviceRevenue = Object.entries(record.services || {})
      .filter(([_, quantity]) => Number(quantity) > 0)
      .reduce((sum, [serviceId, quantity]) => {
        return sum + calculateServiceTotal(serviceId, Number(quantity));
      }, 0);

    const bonusTotal = calculateBonusTotal(record.bonusServices, record.bonusQuantities);
    const bonusDetails = getBonusDetails(record.bonusServices, record.bonusQuantities);

    if (isOwner) {
      // Logic baru untuk owner: layanan owner + bonus + 50% pendapatan setiap karyawan - 40k tabungan - uang hadir karyawan
      const ownerShareFromEmployees = employeeRevenueData.reduce((sum, empData) => {
        if (empData.employeeId !== record.employeeId) { // Tidak termasuk owner sendiri
          return sum + (empData.revenue * 0.5);
        }
        return sum;
      }, 0);
      
      const dailySavings = 40000;
      const employeeDeduction = 10000 * employeeCount;
      
      return {
        salary: serviceRevenue + bonusTotal + ownerShareFromEmployees - dailySavings - employeeDeduction,
        breakdown: {
          serviceRevenue,
          bonusTotal,
          bonusDetails,
          ownerShareFromEmployees,
          dailySavings,
          employeeDeduction,
          employeeCount
        }
      };
    } else {
      const baseRevenue = serviceRevenue * 0.5;
      const attendanceBonus = 10000;
      
      return {
        salary: baseRevenue + bonusTotal + attendanceBonus,
        breakdown: {
          baseRevenue,
          bonusTotal,
          bonusDetails,
          attendanceBonus
        }
      };
    }
  };

  const dailyRecords = getDailyRecords(selectedDate);
  
  // Hitung data pendapatan setiap karyawan
  const employeeRevenueData = dailyRecords.map(record => {
    const serviceRevenue = Object.entries(record.services || {})
      .filter(([_, quantity]) => Number(quantity) > 0)
      .reduce((sum, [serviceId, quantity]) => {
        return sum + calculateServiceTotal(serviceId, quantity);
      }, 0);
    
    const bonusTotal = calculateBonusTotal(record.bonusServices, record.bonusQuantities);
    
    return {
      employeeId: record.employeeId,
      revenue: serviceRevenue + bonusTotal
    };
  });

  // Hitung total pendapatan keseluruhan
  const grandTotal = employeeRevenueData.reduce((sum, empData) => sum + empData.revenue, 0);

  // Hitung jumlah karyawan (tidak termasuk owner)
  const employeeCount = dailyRecords.filter(record => {
    const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
    return employee?.role !== 'Owner';
  }).length;

  // Hitung total gaji yang dibayarkan
  const totalSalaryPaid = dailyRecords.reduce((sum, record) => {
    const salaryData = calculateEmployeeSalary(record, employeeRevenueData, employeeCount);
    return sum + salaryData.salary;
  }, 0);

  const handleExport = () => {
    const mappedSalaries = dailyRecords.map((record) => {
      const salaryData = calculateEmployeeSalary(record, employeeRevenueData, employeeCount);
      
      // Perbaikan untuk masalah [Object Object] - ubah semua data menjadi primitif
      const serviceDetails = Object.entries(record.services || {})
        .filter(([_, quantity]) => Number(quantity) > 0)
        .map(([serviceId, quantity]) => {
          const serviceName = getServiceName(serviceId);
          return `${serviceName}: ${quantity}x`;
        })
        .join(', ');

      const bonusDetails = getBonusDetails(record.bonusServices, record.bonusQuantities)
        .map(bonus => `${bonus.name}: ${bonus.quantity}x`)
        .join(', ');

      return {
        employeeId: record.employeeId,
        employeeName: getEmployeeName(record.employeeId),
        date: record.date,
        gajiDiterima: salaryData.salary,
        serviceDetails: serviceDetails || 'Tidak ada layanan',
        bonusDetails: bonusDetails || 'Tidak ada bonus',
        totalRevenue: employeeRevenueData.find(emp => emp.employeeId === record.employeeId)?.revenue || 0
      };
    });

    exportDailyRecapToExcel(dailyRecords, businessData, selectedDate, mappedSalaries);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Daily Recap</h2>
            <p className="text-gray-600 mt-1">View and export daily revenue summary</p>
          </div>
          {dailyRecords.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={20} />
              <span>Export Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Date Selection */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <Calendar size={16} />
            <span>Select Date:</span>
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-barbershop-red focus:border-transparent"
          />
        </div>
      </div>

      {/* Summary Cards - Updated */}
      {dailyRecords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Karyawan Aktif</p>
                <p className="text-2xl font-bold text-gray-800">{dailyRecords.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Pendapatan</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(grandTotal)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Gaji Dibayar</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalSalaryPaid)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Records Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Records for {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>

        {dailyRecords.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-gray-400" size={32} />
            </div>
            <h4 className="text-lg font-medium text-gray-600 mb-2">Tidak ada catatan yang ditemukan</h4>
            <p className="text-gray-500">Tidak ada data yang tercatat untuk tanggal ini</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {dailyRecords.map((record, index) => {
              const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
              const isOwner = employee?.role === 'Owner';
              const salaryData = calculateEmployeeSalary(record, employeeRevenueData, employeeCount);

              // Hitung total pendapatan karyawan ini
              const employeeRevenue = employeeRevenueData.find(emp => emp.employeeId === record.employeeId)?.revenue || 0;

              return (
                <div key={index} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-800">
                        {getEmployeeName(record.employeeId)}
                      </h4>
                      <p className="text-sm text-gray-600">{isOwner ? 'Owner' : 'Employee'}</p>
                      <p className="text-sm text-blue-600 font-medium">
                        Pendapatan: {formatCurrency(employeeRevenue)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-600 mb-3">
                        Gaji: {formatCurrency(salaryData.salary)}
                      </p>
                      
                      {/* Structured Salary Breakdown */}
                      <div className="text-sm text-gray-700 space-y-1 bg-blue-50 p-4 rounded-lg border max-w-md">
                        <p className="font-medium text-gray-800 mb-2">Rinciannya:</p>
                        
                        {isOwner ? (
                          <>
                            <div className="flex justify-between">
                              <span>+ Pendapatan Layanan:</span>
                              <span className="text-green-600">{formatCurrency(salaryData.breakdown.serviceRevenue)}</span>
                            </div>
                            {salaryData.breakdown.bonusDetails.map((bonus, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>+ Bonus {bonus.name}:</span>
                                <span className="text-green-600">{formatCurrency(bonus.value)}</span>
                              </div>
                            ))}
                            {salaryData.breakdown.ownerShareFromEmployees > 0 && (
                              <div className="flex justify-between">
                                <span>+ 50% Pendapatan Karyawan:</span>
                                <span className="text-green-600">{formatCurrency(salaryData.breakdown.ownerShareFromEmployees)}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>- Tabungan Owner:</span>
                              <span className="text-red-600">-{formatCurrency(salaryData.breakdown.dailySavings)}</span>
                            </div>
                            {salaryData.breakdown.employeeDeduction > 0 && (
                              <div className="flex justify-between">
                                <span>- Uang Hadir Karyawan ({salaryData.breakdown.employeeCount} × {formatCurrency(10000)}):</span>
                                <span className="text-red-600">-{formatCurrency(salaryData.breakdown.employeeDeduction)}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between">
                              <span>+ 50% Pendapatan:</span>
                              <span className="text-green-600">{formatCurrency(salaryData.breakdown.baseRevenue)}</span>
                            </div>
                            {salaryData.breakdown.bonusDetails.map((bonus, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>+ Bonus {bonus.name}:</span>
                                <span className="text-green-600">{formatCurrency(bonus.value)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between">
                              <span>+ Hadir:</span>
                              <span className="text-green-600">{formatCurrency(salaryData.breakdown.attendanceBonus)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Layanan yang Dilakukan:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(record.services || {})
                          .filter(([_, quantity]) => Number(quantity) > 0)
                          .map(([serviceId, quantity]) => {
                            const serviceTotal = calculateServiceTotal(serviceId, quantity);
                            return (
                              <div key={serviceId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-700">{getServiceName(serviceId)}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-800">{Number(quantity)}x</span>
                                  <span className="text-sm text-green-600">
                                    {formatCurrency(serviceTotal)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Layanan Bonus dengan Jumlah */}
                    {record.bonusServices && Object.keys(record.bonusServices).length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Bonus Layanan:</h5>
                        <div className="space-y-2">
                          {Object.entries(record.bonusServices || {}).map(([serviceId, bonusData]) => (
                            Object.entries(bonusData || {})
                              .filter(([_, isEnabled]) => isEnabled)
                              .map(([bonusId, _]) => {
                                const bonusService = businessData.services?.find(s => s.id === bonusId);
                                const bonusQty = record.bonusQuantities?.[serviceId]?.[bonusId] || 0;
                                const bonusValue = (bonusService?.price || 0) * bonusQty;
                                
                                return (
                                  <div key={`${serviceId}-${bonusId}`} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm text-gray-700">{getServiceName(bonusId)}</span>
                                      <span className="text-xs text-gray-500">({getServiceName(serviceId)})</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-medium text-gray-800">{bonusQty}x</span>
                                      <span className="text-sm text-yellow-600 font-medium">
                                        {formatCurrency(bonusValue)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Updated Grand Total */}
            <div className="p-6 bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Total Pendapatan:</span>
                  <span className="text-2xl font-bold text-green-600">{formatCurrency(grandTotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Total Gaji:</span>
                  <span className="text-2xl font-bold text-blue-600">{formatCurrency(totalSalaryPaid)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyRecap;