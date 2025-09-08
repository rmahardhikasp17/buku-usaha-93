import React, { useState } from 'react';
import { Save, Building, Trash2, Download, Upload, ShieldCheck } from 'lucide-react';

const Settings = ({ businessData, updateBusinessData }) => {
  const [businessName, setBusinessName] = useState(businessData.businessName);
  const [persistStatus, setPersistStatus] = useState(null);

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
          products: [],
          dailyRecords: {},
          transactions: {},
          productSales: {},
          sisaPendapatanRecords: {}
        });
        alert('All data has been cleared.');
      }
    }
  };

  const handleExportJSON = () => {
    try {
      const json = JSON.stringify(businessData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `backup_${ts}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to export JSON');
    }
  };

  const handleImportJSON = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (typeof data !== 'object' || data === null) throw new Error('Invalid file');
      updateBusinessData(data);
      alert('Data restored successfully');
    } catch (err) {
      alert('Invalid JSON backup file');
    } finally {
      e.target.value = '';
    }
  };

  const requestPersistentStorage = async () => {
    try {
      if (navigator.storage && navigator.storage.persist) {
        const persisted = await navigator.storage.persist();
        setPersistStatus(persisted ? 'granted' : 'denied');
        alert(persisted ? 'Persistent storage granted' : 'Persistent storage denied');
      } else {
        setPersistStatus('unsupported');
        alert('Persistent storage is not supported on this browser');
      }
    } catch (e) {
      setPersistStatus('error');
      alert('Failed to request persistent storage');
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

      {/* Backup & Export */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <Download className="text-blue-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-800">Backup & Export</h3>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <button
            onClick={handleExportJSON}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={18} />
            <span>Download JSON</span>
          </button>
          <label className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
            <Upload size={18} />
            <span>Restore from JSON</span>
            <input type="file" accept="application/json" className="hidden" onChange={handleImportJSON} />
          </label>
        </div>
      </div>

      {/* Storage Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <ShieldCheck className="text-emerald-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-800">Storage Settings</h3>
        </div>
        <p className="text-gray-600 mb-4">Request persistent storage to reduce the chance of browser clearing IndexedDB when space is low.</p>
        <div className="flex items-center gap-3">
          <button
            onClick={requestPersistentStorage}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <ShieldCheck size={18} />
            <span>Request Persistent Storage</span>
          </button>
          {persistStatus && (
            <span className="text-sm text-gray-600">Status: {persistStatus}</span>
          )}
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
