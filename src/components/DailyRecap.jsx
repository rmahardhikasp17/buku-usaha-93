
import React, { useState } from 'react';
import { Calendar, Download, Eye, User, DollarSign } from 'lucide-react';
import { formatCurrency, exportDailyRecapToExcel } from '../utils/dataManager';
import { useToast } from '../hooks/use-toast';

const DailyRecap = ({ businessData }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

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

  const dailyRecords = getDailyRecords(selectedDate);
  const grandTotal = dailyRecords.reduce((sum, record) => sum + record.total, 0);

  const handleExport = () => {
    try {
      exportDailyRecapToExcel(dailyRecords, businessData, selectedDate);
      toast({
        title: "Success",
        description: "Excel file exported successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export Excel file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-3xl font-semibold text-gray-700 mb-2">Daily Recap</h2>
            <p className="text-gray-600">View and export daily revenue summary</p>
          </div>
          {dailyRecords.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Download size={20} />
              <span>Export Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Date Selection */}
      <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <Calendar size={16} />
            <span>Select Date:</span>
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Summary Cards */}
      {dailyRecords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Employees</p>
                <p className="text-2xl font-semibold text-gray-700">{dailyRecords.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-700">{formatCurrency(grandTotal)}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Average per Employee</p>
                <p className="text-2xl font-semibold text-gray-700">
                  {formatCurrency(dailyRecords.length > 0 ? grandTotal / dailyRecords.length : 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Records Details */}
      <div className="bg-gray-50 rounded-xl border border-gray-200">
        <div className="p-8 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-700">
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
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="text-gray-400" size={32} />
            </div>
            <h4 className="text-xl font-medium text-gray-600 mb-3">No records found</h4>
            <p className="text-gray-500">No data recorded for this date</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {dailyRecords.map((record, index) => (
              <div key={index} className="p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-700">
                      {getEmployeeName(record.employeeId)}
                    </h4>
                    <p className="text-gray-600">Employee Revenue</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrency(record.total)}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-gray-700">Services Performed:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(record.services)
                      .filter(([_, quantity]) => quantity > 0)
                      .map(([serviceId, quantity]) => {
                        const service = businessData.services.find(s => s.id === serviceId);
                        return (
                          <div key={serviceId} className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-200">
                            <span className="text-gray-700 font-medium">{getServiceName(serviceId)}</span>
                            <div className="flex items-center space-x-3">
                              <span className="text-gray-700 font-medium">{quantity}x</span>
                              <span className="text-green-600 font-semibold">
                                {service ? formatCurrency(service.price * quantity) : ''}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Grand Total */}
            <div className="p-8 bg-white">
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                <span className="text-xl font-semibold text-gray-700">Grand Total:</span>
                <span className="text-4xl font-bold text-green-600">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyRecap;
