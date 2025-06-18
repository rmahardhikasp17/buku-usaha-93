
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

  const dailyRecords = getDailyRecords(selectedDate);
  
  // Calculate grand total properly
  const grandTotal = dailyRecords.reduce((sum, record) => {
    const recordTotal = Object.entries(record.services || {})
      .filter(([_, quantity]) => Number(quantity) > 0)
      .reduce((recordSum, [serviceId, quantity]) => {
        return recordSum + calculateServiceTotal(serviceId, Number(quantity));
      }, 0);
    return sum + recordTotal;
  }, 0);

  const averagePerEmployee = dailyRecords.length > 0 ? grandTotal / dailyRecords.length : 0;

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
      <div className="bg-gray-50 rounded-xl shadow-sm p-8 border border-gray-300">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Daily Recap</h2>
            <p className="text-gray-600 mt-2">View and export daily revenue summary</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            <Download size={20} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Date Selection */}
      <div className="bg-gray-50 rounded-xl shadow-sm p-6 border border-gray-300">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <Calendar size={16} />
            <span>Select Date:</span>
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>
      </div>

      {/* Summary Cards */}
      {dailyRecords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-xl shadow-sm p-6 border border-gray-300">
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
          <div className="bg-gray-50 rounded-xl shadow-sm p-6 border border-gray-300">
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
          <div className="bg-gray-50 rounded-xl shadow-sm p-6 border border-gray-300">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Average per Employee</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(averagePerEmployee)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Records Details */}
      <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-300">
        <div className="p-8 border-b border-gray-300">
          <h3 className="text-lg font-semibold text-gray-800">
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
              const employeeTotal = Object.entries(record.services || {})
                .filter(([_, quantity]) => Number(quantity) > 0)
                .reduce((sum, [serviceId, quantity]) => {
                  return sum + calculateServiceTotal(serviceId, Number(quantity));
                }, 0);

              return (
                <div key={index} className="p-8">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-800">
                        {getEmployeeName(record.employeeId)}
                      </h4>
                      <p className="text-sm text-gray-600">Employee Revenue</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(employeeTotal)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700">Services Performed:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(record.services || {})
                        .filter(([_, quantity]) => Number(quantity) > 0)
                        .map(([serviceId, quantity]) => {
                          const serviceTotal = calculateServiceTotal(serviceId, Number(quantity));
                          return (
                            <div key={serviceId} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                              <span className="text-sm text-gray-700">{getServiceName(serviceId)}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-800">{quantity}x</span>
                                <span className="text-sm text-green-600">
                                  {formatCurrency(serviceTotal)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Grand Total */}
            <div className="p-8 bg-blue-50 border-t border-gray-300">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">Grand Total:</span>
                <span className="text-3xl font-bold text-blue-600">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyRecap;
