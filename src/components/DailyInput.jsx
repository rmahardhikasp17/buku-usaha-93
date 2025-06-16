
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
        description: "Silakan pilih karyawan",
        variant: "destructive",
      });
      return;
    }

    const hasQuantities = Object.values(serviceQuantities).some(qty => qty > 0);
    if (!hasQuantities) {
      toast({
        title: "Error", 
        description: "Silakan masukkan minimal satu jumlah layanan",
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
      title: "Berhasil!",
      description: "Catatan harian berhasil disimpan",
    });
  };

  const total = calculateTotal();

  if (businessData.services.length === 0 || businessData.employees.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Input Harian</h1>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="text-amber-600" size={32} />
            </div>
            <h3 className="text-lg font-medium text-amber-800 mb-2">Pengaturan Diperlukan</h3>
            <p className="text-amber-700 mb-4">
              Anda perlu menambahkan layanan dan karyawan sebelum mencatat pendapatan harian.
            </p>
            <div className="space-y-2">
              {businessData.services.length === 0 && (
                <p className="text-sm text-amber-600">• Tambahkan minimal satu layanan</p>
              )}
              {businessData.employees.length === 0 && (
                <p className="text-sm text-amber-600">• Tambahkan minimal satu karyawan</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Input Harian</h1>
        <p className="text-gray-600">Catat layanan harian dan hitung pendapatan</p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 space-y-8">
        {/* Date and Employee Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
              <Calendar className="mr-2" size={16} />
              Tanggal
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              required
            />
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
              <User className="mr-2" size={16} />
              Karyawan
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              required
            >
              <option value="">Pilih karyawan</option>
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
          <h3 className="text-lg font-medium text-gray-900 mb-6">Jumlah Layanan</h3>
          <div className="space-y-4">
            {businessData.services.map((service) => (
              <div key={service.id} className="flex items-center justify-between p-6 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <div>
                  <h4 className="font-medium text-gray-900">{service.name}</h4>
                  <p className="text-sm text-gray-600">{formatCurrency(service.price)} per layanan</p>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="text-sm text-gray-600">Jumlah:</label>
                  <input
                    type="number"
                    min="0"
                    value={serviceQuantities[service.id] || ''}
                    onChange={(e) => handleServiceQuantityChange(service.id, e.target.value)}
                    className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="0"
                  />
                  <span className="text-sm font-medium text-blue-600 min-w-24 text-right">
                    {formatCurrency(service.price * (serviceQuantities[service.id] || 0))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total and Submit */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex justify-between items-center mb-6">
            <span className="text-lg font-medium text-gray-900">Total Pendapatan:</span>
            <span className="text-2xl font-semibold text-blue-600">{formatCurrency(total)}</span>
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-3 bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Save size={20} />
            <span>Simpan Catatan Harian</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default DailyInput;
