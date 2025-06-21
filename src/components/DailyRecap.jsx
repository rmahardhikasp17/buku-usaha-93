
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

  const calculateBonusTotal = (bonusServices) => {
    if (!bonusServices) return 0;
    return Object.entries(bonusServices)
      .filter(([_, selected]) => selected)
      .reduce((sum, [serviceId, _]) => {
        const service = businessData.services?.find(s => s.id === serviceId);
        return sum + (Number(service?.price) || 0);
      }, 0);
  };

  const calculateOwnerSalary = (dailyRecords) => {
    let ownerRevenue = 0;
    let ownerBonus = 0;
    let employeeRevenue = 0;
    let employeeCount = 0;

    dailyRecords.forEach(record => {
      const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
      const recordTotal = Object.entries(record.services || {})
        .filter(([_, quantity]) => Number(quantity) > 0)
        .reduce((sum, [serviceId, quantity]) => {
          return sum + calculateServiceTotal(serviceId, quantity);
        }, 0);

      const bonusTotal = calculateBonusTotal(record.bonusServices);

      if (employee?.role === 'Owner') {
        ownerRevenue += recordTotal;
        ownerBonus += bonusTotal;
      } else if (employee?.role === 'Karyawan') {
        employeeRevenue += recordTotal;
        employeeCount++;
      }
    });

    // Owner salary calculation:
    // + Owner's service revenue
    // + Owner's bonus services
    // + 50% of all employee revenue
    // - Rp 40,000 (daily savings)
    // - Rp 10,000 × number of employees present
    const ownerSalary = ownerRevenue + ownerBonus + (employeeRevenue * 0.5) - 40000 - (10000 * employeeCount);
    
    return {
      ownerSalary,
      ownerRevenue,
      ownerBonus,
      employeeRevenue,
      employeeCount
    };
  };

  const dailyRecords = getDailyRecords(selectedDate);
  
  // Calculate grand total properly by summing all service totals
  const grandTotal = dailyRecords.reduce((sum, record) => {
    const recordTotal = Object.entries(record.services || {})
      .filter(([_, quantity]) => Number(quantity) > 0)
      .reduce((recordSum, [serviceId, quantity]) => {
        return recordSum + calculateServiceTotal(serviceId, quantity);
      }, 0);
    return sum + recordTotal;
  }, 0);

  const ownerData = calculateOwnerSalary(dailyRecords);

  const handleExport = () => {
    exportDailyRecapToExcel(dailyRecords, businessData, selectedDate);
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

      {/* Summary Cards */}
      {dailyRecords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Employees</p>
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
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(grandTotal)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Average per Employee</p>
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(dailyRecords.length > 0 ? grandTotal / dailyRecords.length : 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Owner Salary</p>
                <p className={`text-2xl font-bold ${ownerData.ownerSalary >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(ownerData.ownerSalary)}
                </p>
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
            <h4 className="text-lg font-medium text-gray-600 mb-2">No records found</h4>
            <p className="text-gray-500">No data recorded for this date</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {dailyRecords.map((record, index) => {
              // Calculate employee total properly
              const employeeTotal = Object.entries(record.services || {})
                .filter(([_, quantity]) => Number(quantity) > 0)
                .reduce((sum, [serviceId, quantity]) => {
                  return sum + calculateServiceTotal(serviceId, quantity);
                }, 0);

              const bonusTotal = calculateBonusTotal(record.bonusServices);
              const employee = businessData.employees?.find(emp => emp.id === record.employeeId);

              return (
                <div key={index} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-800">
                        {getEmployeeName(record.employeeId)}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {employee?.role === 'Owner' ? 'Owner Revenue' : 'Employee Revenue'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(employeeTotal)}
                      </p>
                      {bonusTotal > 0 && (
                        <p className="text-lg font-medium text-yellow-600">
                          Bonus: {formatCurrency(bonusTotal)}
                        </p>
                      )}
                      {employee?.role === 'Owner' && (
                        <p className="text-sm text-gray-600 mt-1">
                          Salary: <span className={`font-medium ${ownerData.ownerSalary >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(ownerData.ownerSalary)}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Main Services Performed:</h5>
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

                    {/* Bonus Services */}
                    {record.bonusServices && Object.values(record.bonusServices).some(selected => selected) && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Bonus Services:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(record.bonusServices || {})
                            .filter(([_, selected]) => selected)
                            .map(([serviceId, _]) => {
                              const service = businessData.services?.find(s => s.id === serviceId);
                              return (
                                <div key={serviceId} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                  <span className="text-sm text-gray-700">{getServiceName(serviceId)}</span>
                                  <span className="text-sm text-yellow-600 font-medium">
                                    {formatCurrency(service?.price || 0)}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Grand Total */}
            <div className="p-6 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">Grand Total:</span>
                <span className="text-3xl font-bold text-green-600">{formatCurrency(grandTotal)}</span>
              </div>
              {ownerData.employeeCount > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Owner Service Revenue:</span>
                      <span>{formatCurrency(ownerData.ownerRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Owner Bonus:</span>
                      <span>{formatCurrency(ownerData.ownerBonus)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>50% Employee Revenue:</span>
                      <span>{formatCurrency(ownerData.employeeRevenue * 0.5)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Daily Savings:</span>
                      <span className="text-red-600">-{formatCurrency(40000)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Employee Deduction ({ownerData.employeeCount}×10k):</span>
                      <span className="text-red-600">-{formatCurrency(10000 * ownerData.employeeCount)}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t border-gray-300">
                      <span>Owner Final Salary:</span>
                      <span className={ownerData.ownerSalary >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(ownerData.ownerSalary)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyRecap;
