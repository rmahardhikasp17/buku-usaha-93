
import React, { useState } from 'react';
import { Calendar, User, Save, Plus } from 'lucide-react';
import { formatCurrency } from '../utils/dataManager';

const DailyInput = ({ businessData, updateBusinessData }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [serviceQuantities, setServiceQuantities] = useState({});

  const handleServiceQuantityChange = (serviceId, quantity) => {
    setServiceQuantities(prev => ({
      ...prev,
      [serviceId]: parseInt(quantity) || 0
    }));
  };

  const calculateTotal = () => {
    return businessData.services.reduce((total, service) => {
      const quantity = serviceQuantities[service.id] || 0;
      return total + (service.price * quantity);
    }, 0);
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
      services: serviceQuantities,
      total: calculateTotal()
    };

    const updatedRecords = {
      ...businessData.dailyRecords,
      [recordKey]: newRecord
    };

    updateBusinessData({ dailyRecords: updatedRecords });
    
    // Reset form
    setServiceQuantities({});
    alert('Daily record saved successfully!');
  };

  const total = calculateTotal();

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

        {/* Services Input */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Service Quantities</h3>
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

        {/* Total and Submit */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold text-gray-800">Total Revenue:</span>
            <span className="text-2xl font-bold text-green-600">{formatCurrency(total)}</span>
          </div>
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
