
import React, { useState } from 'react';
import { Calendar, Download, Eye, User, DollarSign } from 'lucide-react';
import { formatCurrency, exportDailyRecapToExcel } from '../utils/dataManager';
import { useToast } from '../hooks/use-toast';

const DailyRecap = ({ businessData }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  const getEmployeeName = (employeeId) => {
    const employee = businessData.employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : 'Karyawan Tidak Dikenal';
  };

  const getServiceName = (serviceId) => {
    const service = businessData.services.find(srv => srv.id === serviceId);
    return service ? service.name : 'Layanan Tidak Dikenal';
  };

  const getDailyRecords = (date) => {
    return Object.values(businessData.dailyRecords).filter(record => record.date === date);
  };

  const dailyRecords = getDailyRecords(selectedDate);
  const grandTotal = dailyRecords.reduce((sum, record) => sum + record.total, 0);

  const handleExport = () => {
    if (dailyRecords.length === 0) {
      toast({
        title: "Tidak Ada Data",
        description: "Tidak ada catatan untuk diekspor pada tanggal ini",
        variant: "destructive",
      });
      return;
    }

    try {
      exportDailyRecapToExcel(dailyRecords, businessData, selectedDate);
      toast({
        title: "Berhasil!",
        description: "Data berhasil diekspor ke Excel",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengekspor data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Rekap Harian</h1>
            <p className="text-gray-600">Lihat dan ekspor ringkasan pendapatan harian</p>
          </div>
          {dailyRecords.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center space-x-3 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Download size={20} />
              <span>Ekspor Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Date Selection */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <Calendar size={16} />
            <span>Pilih Tanggal:</span>
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
      </div>

      {/* Summary Cards */}
      {dailyRecords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <User className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Karyawan Aktif</p>
                <p className="text-2xl font-semibold text-gray-900">{dailyRecords.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <DollarSign className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Pendapatan</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(grandTotal)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Eye className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Rata-rata per Karyawan</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(dailyRecords.length > 0 ? grandTotal / dailyRecords.length : 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Records Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-900">
            Catatan untuk {new Date(selectedDate).toLocaleDateString('id-ID', { 
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
            <h4 className="text-lg font-medium text-gray-600 mb-2">Tidak ada catatan</h4>
            <p className="text-gray-500">Tidak ada data yang tercatat untuk tanggal ini</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {dailyRecords.map((record, index) => (
              <div key={index} className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {getEmployeeName(record.employeeId)}
                    </h4>
                    <p className="text-sm text-gray-600">Pendapatan Karyawan</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-blue-600">
                      {formatCurrency(record.total)}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-gray-700">Layanan yang Dilakukan:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(record.services)
                      .filter(([_, quantity]) => quantity > 0)
                      .map(([serviceId, quantity]) => {
                        const service = businessData.services.find(s => s.id === serviceId);
                        return (
                          <div key={serviceId} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">{getServiceName(serviceId)}</span>
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-gray-900">{quantity}x</span>
                              <span className="text-sm text-blue-600 font-medium">
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
            <div className="p-6 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Total Keseluruhan:</span>
                <span className="text-3xl font-semibold text-blue-600">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyRecap;
