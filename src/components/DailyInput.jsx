
import React, { useState, useEffect } from 'react';
import { Calendar, User, Save, Plus } from 'lucide-react';
import { formatCurrency } from '../utils/dataManager';
import { Checkbox } from './ui/checkbox';

const DailyInput = ({ businessData, updateBusinessData }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedEmployeeData, setSelectedEmployeeData] = useState(null);
  const [serviceQuantities, setServiceQuantities] = useState({});
  const [bonusServices, setBonusServices] = useState({});
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [bonusTotal, setBonusTotal] = useState(0);
  const [potongan, setPotongan] = useState(0);
  const [gajiDiterima, setGajiDiterima] = useState(0);

  // Get main services (non-bonus) and bonus services
  const mainServices = businessData.services.filter(service => !service.bonusable);
  const bonusServicesList = businessData.services.filter(service => service.bonusable);

  // Update selected employee data when employee changes
  useEffect(() => {
    if (selectedEmployee) {
      const employee = businessData.employees.find(emp => emp.id === selectedEmployee);
      setSelectedEmployeeData(employee);
    } else {
      setSelectedEmployeeData(null);
    }
  }, [selectedEmployee, businessData.employees]);

  // Calculate total revenue from main services only
  useEffect(() => {
    const total = mainServices.reduce((sum, service) => {
      const quantity = serviceQuantities[service.id] || 0;
      return sum + (service.price * quantity);
    }, 0);
    setTotalRevenue(total);
  }, [serviceQuantities, mainServices]);

  // Calculate bonus total
  useEffect(() => {
    const total = bonusServicesList.reduce((sum, service) => {
      if (bonusServices[service.id]) {
        return sum + service.price;
      }
      return sum;
    }, 0);
    setBonusTotal(total);
  }, [bonusServices, bonusServicesList]);

  // Calculate potongan and gaji diterima when total revenue, bonus, or employee changes
  useEffect(() => {
    if (selectedEmployeeData && (totalRevenue > 0 || bonusTotal > 0)) {
      let calculatedPotongan = 0;
      let calculatedGajiDiterima = 0;

      if (selectedEmployeeData.role === 'Karyawan') {
        calculatedPotongan = totalRevenue * 0.5; // 50% dari Total Revenue
        calculatedGajiDiterima = (totalRevenue * 0.5) + 10000 + bonusTotal; // 50% + uang hadir + bonus
      } else if (selectedEmployeeData.role === 'Owner') {
        calculatedPotongan = 40000; // Fixed 40000
        calculatedGajiDiterima = totalRevenue - 40000 + bonusTotal; // Total Revenue - 40000 + bonus
      }

      setPotongan(calculatedPotongan);
      setGajiDiterima(calculatedGajiDiterima);
    } else {
      setPotongan(0);
      setGajiDiterima(0);
    }
  }, [totalRevenue, bonusTotal, selectedEmployeeData]);

  const handleServiceQuantityChange = (serviceId, quantity) => {
    setServiceQuantities(prev => ({
      ...prev,
      [serviceId]: parseInt(quantity) || 0
    }));
  };

  const handleBonusServiceChange = (serviceId, checked) => {
    setBonusServices(prev => ({
      ...prev,
      [serviceId]: checked
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedEmployee) {
      alert('Please select an employee');
      return;
    }

    const hasQuantities = Object.values(serviceQuantities).some(qty => qty > 0);
    const hasBonusServices = Object.values(bonusServices).some(selected => selected);
    
    if (!hasQuantities && !hasBonusServices) {
      alert('Please enter at least one service quantity or select bonus services');
      return;
    }

    const recordKey = `${selectedDate}_${selectedEmployee}`;
    const newRecord = {
      date: selectedDate,
      employeeId: selectedEmployee,
      employeeName: selectedEmployeeData.name,
      employeeRole: selectedEmployeeData.role,
      services: serviceQuantities,
      bonusServices: bonusServices,
      totalRevenue: totalRevenue,
      bonusTotal: bonusTotal,
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
    setBonusServices({});
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-barbershop-red focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-barbershop-red focus:border-transparent"
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

        {/* Main Service Selection */}
        {mainServices.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Main Services</h3>
            <div className="space-y-4">
              {mainServices.map((service) => (
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
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-barbershop-red focus:border-transparent"
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
        )}

        {/* Bonus Services */}
        {bonusServicesList.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Bonus Services (100% to Employee)</h3>
            <div className="space-y-3">
              {bonusServicesList.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`bonus-${service.id}`}
                      checked={bonusServices[service.id] || false}
                      onCheckedChange={(checked) => handleBonusServiceChange(service.id, checked)}
                    />
                    <label htmlFor={`bonus-${service.id}`} className="text-sm font-medium text-gray-800">
                      {service.name} ({formatCurrency(service.price)})
                    </label>
                  </div>
                  {bonusServices[service.id] && (
                    <span className="text-sm font-medium text-yellow-600">
                      +{formatCurrency(service.price)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calculations Summary */}
        <div className="border-t border-gray-200 pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Revenue</label>
              <div className="text-xl font-bold text-blue-600">{formatCurrency(totalRevenue)}</div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Bonus Total</label>
              <div className="text-xl font-bold text-yellow-600">{formatCurrency(bonusTotal)}</div>
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
                  {selectedEmployeeData.role === 'Karyawan' && '50% Revenue + Rp 10.000 + Bonus'}
                  {selectedEmployeeData.role === 'Owner' && 'Total Revenue - Rp 40.000 + Bonus'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="border-t border-gray-200 pt-6">
          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 bg-barbershop-red text-white py-3 rounded-lg hover:bg-opacity-90 transition-colors"
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
