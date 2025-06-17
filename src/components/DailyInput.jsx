
import React, { useState } from 'react';
import { Calendar, User, Save, Plus } from 'lucide-react';
import { formatCurrency } from '../utils/dataManager';
import { useToast } from '../hooks/use-toast';

const DailyInput = ({ businessData, updateBusinessData }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [serviceQuantities, setServiceQuantities] = useState({});
  const { toast } = useToast();

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
      toast({
        title: "Error",
        description: "Please select an employee",
        variant: "destructive",
      });
      return;
    }

    const hasQuantities = Object.values(serviceQuantities).some(qty => qty > 0);
    if (!hasQuantities) {
      toast({
        title: "Error",
        description: "Please enter at least one service quantity",
        variant: "destructive",
      });
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
    toast({
      title: "Success",
      description: "Daily record saved successfully!",
    });
  };

  const total = calculateTotal();

  if (businessData.services.length === 0 || businessData.employees.length === 0) {
    return (
      <div className="space-y-8">
        <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
          <h2 className="text-3xl font-semibold text-gray-700 mb-2">Daily Input</h2>
          <p className="text-gray-600">Record daily services and calculate revenue</p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Plus className="text-yellow-600" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-yellow-800 mb-4">Setup Required</h3>
          <p className="text-yellow-700 mb-6">
            You need to add services and employees before you can record daily income.
          </p>
          <div className="space-y-2">
            {businessData.services.length === 0 && (
              <p className="text-yellow-600">• Add at least one service</p>
            )}
            {businessData.employees.length === 0 && (
              <p className="text-yellow-600">• Add at least one employee</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
        <h2 className="text-3xl font-semibold text-gray-700 mb-2">Daily Input</h2>
        <p className="text-gray-600">Record daily services and calculate revenue</p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-8 border border-gray-200 space-y-8">
        {/* Date and Employee Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Calendar className="inline mr-2" size={16} />
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <User className="inline mr-2" size={16} />
              Employee
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <h3 className="text-lg font-semibold text-gray-700 mb-6">Service Quantities</h3>
          <div className="space-y-4">
            {businessData.services.map((service) => (
              <div key={service.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white border border-gray-200 rounded-lg">
                <div className="mb-4 sm:mb-0">
                  <h4 className="font-medium text-gray-700 text-lg">{service.name}</h4>
                  <p className="text-gray-600">{formatCurrency(service.price)} per service</p>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="text-sm text-gray-600 whitespace-nowrap">Quantity:</label>
                  <input
                    type="number"
                    min="0"
                    value={serviceQuantities[service.id] || ''}
                    onChange={(e) => handleServiceQuantityChange(service.id, e.target.value)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                  <span className="text-sm font-medium text-green-600 min-w-24 text-right">
                    {formatCurrency(service.price * (serviceQuantities[service.id] || 0))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total and Submit */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
            <span className="text-xl font-semibold text-gray-700">Total Revenue:</span>
            <span className="text-3xl font-bold text-green-600">{formatCurrency(total)}</span>
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-3 bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
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
