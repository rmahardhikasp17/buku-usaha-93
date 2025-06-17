
import React, { useState, useEffect } from 'react';
import { Calendar, User, Save, Plus } from 'lucide-react';
import { formatCurrency } from '../utils/dataManager';

const DailyInput = ({ businessData, updateBusinessData }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedEmployeeData, setSelectedEmployeeData] = useState(null);
  const [serviceQuantities, setServiceQuantities] = useState({});
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [potongan, setPotongan] = useState(0);
  const [gajiDiterima, setGajiDiterima] = useState(0);

  // Update selected employee data when employee changes
  useEffect(() => {
    if (selectedEmployee) {
      const employee = businessData.employees.find(emp => emp.id === selectedEmployee);
      setSelectedEmployeeData(employee);
    } else {
      setSelectedEmployeeData(null);
    }
  }, [selectedEmployee, businessData.employees]);

  // Calculate total revenue when service quantities change
  useEffect(() => {
    const total = businessData.services.reduce((sum, service) => {
      const quantity = serviceQuantities[service.id] || 0;
      return sum + (service.price * quantity);
    }, 0);
    setTotalRevenue(total);
  }, [serviceQuantities, businessData.services]);

  // Calculate potongan and gaji diterima when total revenue or employee changes
  useEffect(() => {
    if (selectedEmployeeData && totalRevenue > 0) {
      let calculatedPotongan = 0;
      let calculatedGajiDiterima = 0;

      if (selectedEmployeeData.role === 'Karyawan') {
        calculatedPotongan = totalRevenue * 0.5; // 50% dari Total Revenue
        calculatedGajiDiterima = (totalRevenue * 0.5) + 10000; // 50% + uang hadir 10000
      } else if (selectedEmployeeData.role === 'Owner') {
        calculatedPotongan = 40000; // Fixed 40000
        calculatedGajiDiterima = totalRevenue - 40000; // Total Revenue - 40000
      }

      setPotongan(calculatedPotongan);
      setGajiDiterima(calculatedGajiDiterima);
    } else {
      setPotongan(0);
      setGajiDiterima(0);
    }
  }, [totalRevenue, selectedEmployeeData]);

  const handleServiceQuantityChange = (serviceId, quantity) => {
    setServiceQuantities(prev => ({
      ...prev,
      [serviceId]: parseInt(quantity) || 0
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedEmployee) {
      alert('Please select an employee');
      return;
    }

    const hasQuantities = Object.values(serviceQuantities).some(qty => qty > 0);
    if (!hasQuantities) {
      alert('Please enter at least one service quantity');
      return;
    }

    const recordKey = `${selectedDate}_${selectedEmployee}`;
    const newRecord = {
      date: selectedDate,
      employeeId: selectedEmployee,
      employeeName: selectedEmployeeData.name,
      employeeRole: selectedEmployeeData.role,
      services: serviceQuantities,
      totalRevenue: totalRevenue,
      potongan: potongan,
      gajiDiterima: gajiDiterima
    };

    const updatedRecords = {
      ...businessData.dailyRecords,
      [recordKey]: newRecord
    };

    updateBusinessData({ dailyRecords: updatedRecords });
    
    // Reset form
    setServiceQuantities({});
    setSelectedEmployee('');
    alert('Daily record saved successfully!');
  };

  if (businessData.services.length === 0 || businessData.employees.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Daily Input</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="text-yellow-600" size={32} />
            </div>
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Setup Required</h3>
            <p className="text-yellow-700 mb-4">
              You need to add services and employees before you can record daily income.
            </p>
            <div className="space-y-2">
              {businessData.services.length === 0 && (
                <p className="text-sm text-yellow-600">• Add at least one service</p>
              )}
              {businessData.employees.length === 0 && (
                <p className="text-sm text-yellow-600">• Add at least one employee</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">Daily Input</h2>
        <p className="text-gray-600 mt-1">Record daily services and calculate revenue</p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 space-y-6">
        {/* Date and Employee Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline mr-2" size={16} />
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline mr-2" size={16} />
              Employee
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="">Select an employee</option>
              {businessData.employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Employee Role Display */}
        {selectedEmployeeData && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <input
              type="text"
              value={selectedEmployeeData.role}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              readOnly
            />
          </div>
        )}

        {/* Service Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Service Selection</h3>
          <div className="space-y-4">
            {businessData.services.map((service) => (
              <div key={service.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-800">{service.name}</h4>
                  <p className="text-sm text-gray-600">{formatCurrency(service.price)} per service</p>
                </div>
                <div className="flex items-center space-x-3">
                  <label className="text-sm text-gray-600">Quantity:</label>
                  <input
                    type="number"
                    min="0"
                    value={serviceQuantities[service.id] || ''}
                    onChange={(e) => handleServiceQuantityChange(service.id, e.target.value)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0"
                  />
                  <span className="text-sm font-medium text-green-600 min-w-20 text-right">
                    {formatCurrency(service.price * (serviceQuantities[service.id] || 0))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calculations Summary */}
        <div className="border-t border-gray-200 pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Revenue</label>
              <div className="text-xl font-bold text-blue-600">{formatCurrency(totalRevenue)}</div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Potongan</label>
              <div className="text-xl font-bold text-red-600">{formatCurrency(potongan)}</div>
              {selectedEmployeeData && (
                <p className="text-xs text-gray-500 mt-1">
                  {selectedEmployeeData.role === 'Karyawan' && '50% dari Total Revenue'}
                  {selectedEmployeeData.role === 'Owner' && 'Fixed Rp 40.000'}
                </p>
              )}
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Gaji Diterima</label>
              <div className="text-xl font-bold text-green-600">{formatCurrency(gajiDiterima)}</div>
              {selectedEmployeeData && (
                <p className="text-xs text-gray-500 mt-1">
                  {selectedEmployeeData.role === 'Karyawan' && '50% Revenue + Rp 10.000 (uang hadir)'}
                  {selectedEmployeeData.role === 'Owner' && 'Total Revenue - Rp 40.000'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="border-t border-gray-200 pt-6">
          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Save size={20} />
            <span>Save Daily Record</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default DailyInput;
