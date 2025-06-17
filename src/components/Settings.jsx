
import React, { useState } from 'react';
import { Save, Building, Trash2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const Settings = ({ businessData, updateBusinessData }) => {
  const [businessName, setBusinessName] = useState(businessData.businessName);
  const { toast } = useToast();

  const handleSaveBusinessName = (e) => {
    e.preventDefault();
    if (!businessName.trim()) return;
    
    updateBusinessData({ businessName: businessName.trim() });
    toast({
      title: "Success",
      description: "Business name updated successfully!",
    });
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
        toast({
          title: "Success",
          description: "All data has been cleared.",
        });
      }
    }
  };

  const getTotalRecords = () => {
    return Object.keys(businessData.dailyRecords).length;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
        <h2 className="text-3xl font-semibold text-gray-700 mb-2">Settings</h2>
        <p className="text-gray-600">Manage your business configuration</p>
      </div>

      {/* Business Name Settings */}
      <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <Building className="text-blue-600" size={24} />
          <h3 className="text-xl font-semibold text-gray-700">Business Information</h3>
        </div>
        
        <form onSubmit={handleSaveBusinessName} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Business Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Enter your business name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Save size={18} />
            <span>Save Business Name</span>
          </button>
        </form>
      </div>

      {/* Data Summary */}
      <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-700 mb-6">Data Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600 font-medium mb-2">Total Services</p>
            <p className="text-3xl font-bold text-blue-800">{businessData.services.length}</p>
          </div>
          <div className="p-6 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-600 font-medium mb-2">Total Employees</p>
            <p className="text-3xl font-bold text-green-800">{businessData.employees.length}</p>
          </div>
          <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-600 font-medium mb-2">Total Records</p>
            <p className="text-3xl font-bold text-purple-800">{getTotalRecords()}</p>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <Trash2 className="text-red-600" size={24} />
          <h3 className="text-xl font-semibold text-gray-700">Data Management</h3>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h4 className="text-red-800 font-semibold mb-3">Danger Zone</h4>
          <p className="text-red-700 mb-6">
            This action will permanently delete all your business data including services, employees, and daily records.
          </p>
          <button
            onClick={handleClearAllData}
            className="flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            <Trash2 size={18} />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>

      {/* App Information */}
      <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-700 mb-6">App Information</h3>
        <div className="space-y-3 text-gray-600">
          <p><strong className="text-gray-700">App Name:</strong> Business Bookkeeping Calculator</p>
          <p><strong className="text-gray-700">Version:</strong> 1.0.0</p>
          <p><strong className="text-gray-700">Purpose:</strong> Track employee services and calculate daily revenue</p>
          <p><strong className="text-gray-700">Data Storage:</strong> Local browser storage</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
