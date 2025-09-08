import React, { useEffect, useMemo, useState } from 'react';
import { Save, Building, Trash2, Download, Upload, ShieldCheck, HardDrive, FilePlus2, FileOutput, AlarmClock } from 'lucide-react';
import { downloadJSONBackup, importJSONFile, requestAutoBackupFile, clearAutoBackup, saveAutoBackup, setCompressionPreference, getCompressionPreference, getStorageEstimate } from '../utils/dataManager';

const Settings = ({ businessData, updateBusinessData }) => {
  const [businessName, setBusinessName] = useState(businessData.businessName);
  const [persistStatus, setPersistStatus] = useState(null);
  const [useGzip, setUseGzip] = useState(getCompressionPreference());
  const [storageInfo, setStorageInfo] = useState(null);
  const lastBackupTs = useMemo(() => {
    try { return Number(localStorage.getItem('autoBackupLastTs')) || null; } catch (_) { return null; }
  }, [businessData]);

  useEffect(() => {
    setCompressionPreference(useGzip);
  }, [useGzip]);

  useEffect(() => {
    const refresh = async () => setStorageInfo(await getStorageEstimate());
    refresh();
  }, []);

  const nearQuota = useMemo(() => {
    if (!storageInfo || !storageInfo.quota) return false;
    const ratio = (storageInfo.usage || 0) / storageInfo.quota;
    return ratio >= 0.8;
  }, [storageInfo]);

  const staleBackup = useMemo(() => {
    if (!lastBackupTs) return true;
    const oneDay = 24 * 60 * 60 * 1000;
    return Date.now() - lastBackupTs > oneDay;
  }, [lastBackupTs]);

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

  const handleExportJSON = async (compressed) => {
    try {
      await downloadJSONBackup(businessData, compressed);
    } catch (e) {
      alert('Failed to export backup');
    }
  };

  const handleImportJSON = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importJSONFile(file);
      updateBusinessData(data);
      alert('Data restored successfully');
    } catch (err) {
      alert('Invalid backup file');
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

  const setupAutoBackup = async () => {
    const res = await requestAutoBackupFile();
    if (!res.supported) {
      alert('Auto-backup ke file tidak didukung di browser ini. Gunakan tombol Download/Share sebagai alternatif.');
      return;
    }
    if (res.ok) alert('Auto-backup berhasil di-setup. Perubahan data akan dibackup ke file tersebut.');
    else alert('Autorisasi dibatalkan.');
  };

  const backupNow = async () => {
    try {
      const ok = await saveAutoBackup(JSON.stringify(businessData));
      if (ok) alert('Backup berhasil disimpan ke file.');
      else alert('Gagal menyimpan. Pastikan file backup sudah di-setup dan izinnya diberikan.');
    } catch (_) {
      alert('Gagal menyimpan backup.');
    }
  };

  const disableAutoBackup = async () => {
    await clearAutoBackup();
    alert('Auto-backup dimatikan.');
  };

  const refreshStorage = async () => {
    setStorageInfo(await getStorageEstimate());
  };

  return (
    <div className="space-y-6">
      {(nearQuota || staleBackup) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlarmClock className="text-amber-600" size={20} />
          <div className="text-amber-800 text-sm">
            <p className="font-medium mb-1">Backup disarankan.</p>
            {nearQuota && <p>Mendekati batas penyimpanan browser. Lakukan backup/kompresi.</p>}
            {staleBackup && <p>Backup terakhir lebih dari 1 hari lalu. Simpan backup terbaru.</p>}
          </div>
        </div>
      )}

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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
        <div className="flex items-center gap-3 mb-3">
          <input id="gzip" type="checkbox" checked={useGzip} onChange={(e) => setUseGzip(e.target.checked)} />
          <label htmlFor="gzip" className="text-sm text-gray-700">Gunakan kompresi (gzip)</label>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <button
            onClick={() => handleExportJSON(useGzip)}
            className="flex items-center justify-center space-x-2 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
          >
            <Download size={18} />
            <span>Download {useGzip ? 'JSON (gzip)' : 'JSON'}</span>
          </button>
          <label className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            <Upload size={18} />
            <span>Restore from JSON / GZIP</span>
            <input type="file" accept=".json,.gz,application/json,application/gzip" className="hidden" onChange={handleImportJSON} />
          </label>
        </div>
      </div>

      {/* Auto-backup to File (FSA) */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <HardDrive className="text-indigo-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-800">Auto-backup ke File</h3>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <button onClick={setupAutoBackup} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            <FilePlus2 size={18} />
            <span>Setup Auto-backup</span>
          </button>
          <button onClick={backupNow} className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            <FileOutput size={18} />
            <span>Backup Sekarang</span>
          </button>
          <button onClick={disableAutoBackup} className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            <Trash2 size={18} />
            <span>Matikan Auto-backup</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Jika browser tidak mendukung, gunakan Download/Share sebagai alternatif (terutama iOS).</p>
      </div>

      {/* Storage Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <ShieldCheck className="text-emerald-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-800">Storage Settings</h3>
        </div>
        <p className="text-gray-600 mb-4">Request persistent storage to reduce the chance of browser clearing IndexedDB when space is low.</p>
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={requestPersistentStorage}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <ShieldCheck size={18} />
            <span>Request Persistent Storage</span>
          </button>
          {persistStatus && (
            <span className="text-sm text-gray-600">Status: {persistStatus}</span>
          )}
        </div>
        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
          <span>
            {storageInfo?.quota ? (
              <>
                Penggunaan: {((storageInfo?.usage || 0) / (1024 * 1024)).toFixed(2)} MB / {(storageInfo.quota / (1024 * 1024)).toFixed(2)} MB
                {nearQuota && <span className="ml-2 text-amber-600">(mendekati batas)</span>}
              </>
            ) : 'Storage estimate tidak tersedia'}
          </span>
          <button onClick={refreshStorage} className="bg-amber-500 text-white px-3 py-1.5 rounded-md hover:bg-amber-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500">Refresh</button>
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
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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

      {/* Penjelasan Fitur */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Penjelasan Fitur</h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div>
            <p className="font-medium">Informasi Bisnis</p>
            <p>Ubah nama usaha Anda yang akan tampil di seluruh aplikasi.</p>
          </div>
          <div>
            <p className="font-medium">Ringkasan Data</p>
            <p>Melihat jumlah layanan, karyawan, dan catatan yang tersimpan.</p>
          </div>
          <div>
            <p className="font-medium">Backup & Export</p>
            <p>Unduh cadangan data ke file JSON atau JSON terkompresi (gzip), serta pulihkan dari file tersebut.</p>
          </div>
          <div>
            <p className="font-medium">Auto-backup ke File</p>
            <p>Mengaktifkan pencadangan otomatis ke file menggunakan File System Access API agar perubahan disimpan berkala.</p>
          </div>
          <div>
            <p className="font-medium">Storage Settings</p>
            <p>Meminta izin penyimpanan persisten untuk mengurangi risiko data dibersihkan oleh browser saat ruang rendah.</p>
          </div>
          <div>
            <p className="font-medium">Data Management</p>
            <p>Menghapus semua data aplikasi secara permanen. Gunakan dengan hati-hati.</p>
          </div>
          <div>
            <p className="font-medium">Informasi Aplikasi</p>
            <p>Menampilkan detail aplikasi seperti nama, versi, dan lokasi penyimpanan data.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
