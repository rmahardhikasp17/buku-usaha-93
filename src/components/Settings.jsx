
import React, { useState } from 'react';
import { Save, Building, Trash2 } from 'lucide-react';

const Settings = ({ businessData, updateBusinessData }) => {
  const [businessName, setBusinessName] = useState(businessData.businessName);

  const handleSaveBusinessName = (e) => {
    e.preventDefault();
    if (!businessName.trim()) return;
    
    updateBusinessData({ businessName: businessName.trim() });
    alert('Business name updated successfully!');
  };

  const handleClearAllData = () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear all data? This action cannot be undone.'
    );
    
    if (confirmed) {
      const secondConfirm = window.confirm(
        'This will delete all services, employees, and daily records. Are you absolutely sure?'
      );
      
      if (secondConfirm) {
        updateBusinessData({
          services: [],
          employees: [],
          dailyRecords: {}
        });
        alert('All data has been cleared.');
      }
    }
  };

  const getTotalRecords = () => {
    return Object.keys(businessData.dailyRecords).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
        <p className="text-gray-600 mt-1">Manage your business configuration</p>
      </div>

      {/* Business Name Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <Building className="text-blue-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-800">Business Information</h3>
        </div>
        
        <form onSubmit={handleSaveBusinessName} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Enter your business name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save size={18} />
            <span>Save Business Name</span>
          </button>
        </form>
      </div>

      {/* Data Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Total Services</p>
            <p className="text-2xl font-bold text-blue-800">{businessData.services.length}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Total Employees</p>
            <p className="text-2xl font-bold text-green-800">{businessData.employees.length}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Total Records</p>
            <p className="text-2xl font-bold text-purple-800">{getTotalRecords()}</p>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <Trash2 className="text-red-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-800">Data Management</h3>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-red-800 font-medium mb-2">Danger Zone</h4>
          <p className="text-red-700 text-sm mb-4">
            This action will permanently delete all your business data including services, employees, and daily records.
          </p>
          <button
            onClick={handleClearAllData}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 size={18} />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>

      {/* App Information */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">App Information</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>App Name:</strong> Business Bookkeeping Calculator</p>
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>Purpose:</strong> Track employee services and calculate daily revenue</p>
          <p><strong>Data Storage:</strong> Local browser storage</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
