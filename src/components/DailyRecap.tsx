
import React, { useState } from 'react';
import { Calendar, Download, Eye, User, DollarSign } from 'lucide-react';
import { formatCurrency, exportDailyRecapToExcel } from '../utils/dataManager';
import { toast } from 'sonner';

interface BusinessData {
  employees: any[];
  services: any[];
  dailyRecords: Record<string, any>;
}

interface DailyRecapProps {
  businessData: BusinessData;
}

const DailyRecap: React.FC<DailyRecapProps> = ({ businessData }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const getEmployeeName = (employeeId: string) => {
    const employee = businessData.employees?.find(emp => emp.id === employeeId);
    return employee ? employee.name : 'Unknown Employee';
  };

  const getServiceName = (serviceId: string) => {
    const service = businessData.services?.find(srv => srv.id === serviceId);
    return service ? service.name : 'Unknown Service';
  };

  const getDailyRecords = (date: string) => {
    return Object.values(businessData.dailyRecords || {}).filter(record => record.date === date);
  };

  const calculateServiceTotal = (serviceId: string, quantity: number) => {
    const service = businessData.services?.find(s => s.id === serviceId);
    if (!service || !service.price || quantity <= 0) return 0;
    return service.price * quantity;
  };

  const calculateBonusTotal = (bonusServices: any, bonusQuantities: any) => {
    if (!bonusServices || !bonusQuantities) return 0;
    
    let total = 0;
    Object.entries(bonusServices).forEach(([serviceId, bonusData]: [string, any]) => {
      Object.entries(bonusData || {}).forEach(([bonusId, isEnabled]: [string, any]) => {
        if (isEnabled) {
          const bonusService = businessData.services?.find(s => s.id === bonusId);
          const bonusQty = bonusQuantities[serviceId]?.[bonusId] || 0;
          total += (bonusService?.price || 0) * bonusQty;
        }
      });
    });
    
    return total;
  };

  const getBonusDetails = (bonusServices: any, bonusQuantities: any) => {
    const details: { name: string; quantity: number; value: number }[] = [];
    
    if (!bonusServices || !bonusQuantities) return details;
    
    Object.entries(bonusServices).forEach(([serviceId, bonusData]: [string, any]) => {
      Object.entries(bonusData || {}).forEach(([bonusId, isEnabled]: [string, any]) => {
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

  const calculateEmployeeSalary = (record: any, totalEmployeeRevenue: number, employeeCount: number) => {
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
      const employeeShareRevenue = totalEmployeeRevenue * 0.5;
      const dailySavings = 40000;
      const employeeDeduction = 10000 * employeeCount;
      
      return {
        salary: serviceRevenue + bonusTotal + employeeShareRevenue - dailySavings - employeeDeduction,
        breakdown: {
          serviceRevenue,
          bonusTotal,
          bonusDetails,
          employeeShareRevenue,
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
  
  // Calculate total employee revenue (excluding owner)
  const totalEmployeeRevenue = dailyRecords.reduce((sum, record) => {
    const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
    if (employee?.role !== 'Owner') {
      const recordTotal = Object.entries(record.services || {})
        .filter(([_, quantity]) => Number(quantity) > 0)
        .reduce((recordSum, [serviceId, quantity]) => {
          return recordSum + calculateServiceTotal(serviceId, Number(quantity));
        }, 0);
      return sum + recordTotal;
    }
    return sum;
  }, 0);

  const employeeCount = dailyRecords.filter(record => {
    const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
    return employee?.role !== 'Owner';
  }).length;

  // Calculate total salary of all employees for the day
  const totalGaji = dailyRecords.reduce((sum, record) => {
    const salaryData = calculateEmployeeSalary(record, totalEmployeeRevenue, employeeCount);
    return sum + salaryData.salary;
  }, 0);


  const handleExport = () => {
    if (dailyRecords.length === 0) {
      toast.error('No data to export for this date');
      return;
    }
    
    try {
      exportDailyRecapToExcel(dailyRecords, businessData, selectedDate);
      toast.success('Excel file exported successfully!');
    } catch (error) {
      toast.error('Failed to export Excel file');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gray-50 rounded-xl shadow-sm p-4 md:p-6 lg:p-8 border border-gray-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Daily Recap</h2>
            <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">View and export daily revenue summary</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm md:text-base"
          >
            <Download size={20} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Date Selection */}
      <div className="bg-gray-50 rounded-xl shadow-sm p-4 md:p-6 border border-gray-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <Calendar size={16} />
            <span>Select Date:</span>
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-auto px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm md:text-base"
          />
        </div>
      </div>

      {/* Summary Cards - Only Active Employees and Total Revenue */}
      {dailyRecords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-gray-50 rounded-xl shadow-sm p-4 md:p-6 border border-gray-300">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Active Employees</p>
                <p className="text-xl md:text-2xl font-bold text-gray-800">{dailyRecords.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl shadow-sm p-4 md:p-6 border border-gray-300">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">Total Gaji Hari Ini</p>
                <p className="text-xl md:text-2xl font-bold text-gray-800">{formatCurrency(totalGaji)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Records Details */}
      <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-300">
        <div className="p-4 md:p-6 lg:p-8 border-b border-gray-300">
          <h3 className="text-base md:text-lg font-semibold text-gray-800">
            Records for {new Date(selectedDate).toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>

        {dailyRecords.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-gray-400" size={32} />
            </div>
            <h4 className="text-lg font-medium text-gray-600 mb-2">No records found</h4>
            <p className="text-gray-500">No data recorded for this date</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-300">
            {dailyRecords.map((record, index) => {
              const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
              const isOwner = employee?.role === 'Owner';
              const salaryData = calculateEmployeeSalary(record, totalEmployeeRevenue, employeeCount);

              const employeeTotal = Object.entries(record.services || {})
                .filter(([_, quantity]) => Number(quantity) > 0)
                .reduce((sum, [serviceId, quantity]) => {
                  return sum + calculateServiceTotal(serviceId, Number(quantity));
                }, 0);

              return (
                <div key={index} className="p-4 md:p-6 lg:p-8">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-start mb-4 md:mb-6 gap-4 lg:gap-0">
                    <div>
                      <h4 className="text-base md:text-lg font-medium text-gray-800">
                        {getEmployeeName(record.employeeId)}
                      </h4>
                      <p className="text-xs md:text-sm text-gray-600">{isOwner ? 'Owner' : 'Employee'}</p>
                    </div>
                    <div className="text-left lg:text-right w-full lg:w-auto">
                      <p className="text-lg md:text-xl font-bold text-blue-600 mb-2 md:mb-3">
                        Gaji: {formatCurrency(salaryData.salary)}
                      </p>
                      
                      {/* Structured Salary Breakdown */}
                      <div className="text-xs md:text-sm text-gray-700 space-y-1 bg-blue-50 p-3 md:p-4 rounded-lg border w-full lg:max-w-md">
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
                            {salaryData.breakdown.employeeShareRevenue > 0 && (
                              <div className="flex justify-between">
                                <span>+ 50% Pendapatan Karyawan:</span>
                                <span className="text-green-600">{formatCurrency(salaryData.breakdown.employeeShareRevenue)}</span>
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
                  
                    <div className="space-y-2">
                    <h5 className="text-xs md:text-sm font-medium text-gray-700">Services Performed:</h5>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3">
                      {Object.entries(record.services || {})
                        .filter(([_, quantity]) => Number(quantity) > 0)
                        .map(([serviceId, quantity]) => {
                          const quantityNum = Number(quantity);
                          const serviceTotal = calculateServiceTotal(serviceId, quantityNum);
                          return (
                            <div key={serviceId} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                              <span className="text-sm text-gray-700">{getServiceName(serviceId)}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-800">{quantityNum}x</span>
                                <span className="text-sm text-green-600">
                                  {formatCurrency(serviceTotal)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Bonus Services */}
                    {record.bonusServices && Object.keys(record.bonusServices).length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Bonus Services:</h5>
                        <div className="space-y-2">
                          {Object.entries(record.bonusServices || {}).map(([serviceId, bonusData]: [string, any]) => (
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
            
            {/* Total Gaji */}
            <div className="p-8 bg-blue-50 border-t border-gray-300">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">Total Gaji Hari Ini:</span>
                <span className="text-3xl font-bold text-blue-600">{formatCurrency(totalGaji)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyRecap;
