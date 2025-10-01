const STORAGE_KEY = 'business_bookkeeping_data';
const DB_NAME = 'businessDB';
const DB_VERSION = 1;
const STORE_NAME = 'data';
const HANDLE_KEY = 'auto_backup_handle';
const HANDLE_META_KEY = 'auto_backup_meta';
const LAST_BACKUP_TS_KEY = 'autoBackupLastTs';
const COMPRESSION_PREF_KEY = 'backupCompression';

// Basic IndexedDB helpers (no external deps)
const openDB = () => {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('IndexedDB not supported'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open DB'));
  });
};

const idbGet = async (key) => {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error || new Error('IDB get error'));
    });
  } catch (e) {
    return null;
  }
};

const idbSet = async (key, value) => {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error('IDB set error'));
    });
  } catch (e) {
    // Swallow errors; fall back to localStorage
  }
};

// Raw variants for storing non-JSON-serializable values (e.g., FileSystem handles)
const idbGetRaw = idbGet; // same implementation stores structured clones
const idbSetRaw = idbSet;

// Compression helpers
const supportsCompression = () => typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

const compressStringToGzipBlob = async (str) => {
  if (!supportsCompression()) return new Blob([str], { type: 'application/json' });
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(new TextEncoder().encode(str));
  await writer.close();
  const ab = await new Response(cs.readable).arrayBuffer();
  return new Blob([ab], { type: 'application/gzip' });
};

const decompressGzipBlobToString = async (blob) => {
  if (!supportsCompression()) return await blob.text();
  const ds = new DecompressionStream('gzip');
  const stream = blob.stream().pipeThrough(ds);
  const ab = await new Response(stream).arrayBuffer();
  return new TextDecoder().decode(ab);
};

// File System Access helpers (Chromium/Android)
const isFSASupported = () => typeof window !== 'undefined' && 'showSaveFilePicker' in window;

const writeToHandle = async (handle, contentBlob) => {
  const writable = await handle.createWritable();
  await writable.write(contentBlob);
  await writable.close();
};

export const setCompressionPreference = (enabled) => {
  try { localStorage.setItem(COMPRESSION_PREF_KEY, enabled ? '1' : '0'); } catch (_) {}
};
export const getCompressionPreference = () => {
  try { return localStorage.getItem(COMPRESSION_PREF_KEY) === '1'; } catch (_) { return false; }
};

export const requestAutoBackupFile = async () => {
  if (!isFSASupported()) return { supported: false, ok: false };
  try {
    const compressed = getCompressionPreference();
    const suggestedName = compressed ? 'nekat-mbois-backup.json.gz' : 'nekat-mbois-backup.json';
    const types = [
      {
        description: compressed ? 'Gzip JSON' : 'JSON',
        accept: compressed ? { 'application/gzip': ['.gz'] } : { 'application/json': ['.json'] },
      },
    ];
    const handle = await window.showSaveFilePicker({ suggestedName, types });
    await idbSetRaw(HANDLE_KEY, handle);
    await idbSetRaw(HANDLE_META_KEY, { compressed });
    return { supported: true, ok: true };
  } catch (e) {
    return { supported: true, ok: false };
  }
};

const getAutoBackupHandle = async () => {
  const handle = await idbGetRaw(HANDLE_KEY);
  const meta = (await idbGetRaw(HANDLE_META_KEY)) || { compressed: false };
  return { handle, meta };
};

export const clearAutoBackup = async () => {
  try {
    await idbSetRaw(HANDLE_KEY, null);
    await idbSetRaw(HANDLE_META_KEY, null);
  } catch (_) {}
};

export const saveAutoBackup = async (jsonString) => {
  try {
    const { handle, meta } = await getAutoBackupHandle();
    if (!handle) return false;
    const mode = { mode: 'readwrite' };
    const p = await handle.queryPermission(mode);
    if (p === 'denied') return false;
    if (p === 'prompt') {
      const r = await handle.requestPermission(mode);
      if (r !== 'granted') return false;
    }
    const blob = meta?.compressed ? await compressStringToGzipBlob(jsonString) : new Blob([jsonString], { type: 'application/json' });
    await writeToHandle(handle, blob);
    try { localStorage.setItem(LAST_BACKUP_TS_KEY, String(Date.now())); } catch (_) {}
    return true;
  } catch (e) {
    return false;
  }
};

// OPFS mirror
const isOPFSSupported = () => typeof navigator !== 'undefined' && navigator.storage && navigator.storage.getDirectory;

const writeOPFSBackup = async (jsonString) => {
  if (!isOPFSSupported()) return false;
  try {
    const compressed = getCompressionPreference();
    const root = await navigator.storage.getDirectory();
    const fileName = compressed ? 'backup.json.gz' : 'backup.json';
    const fileHandle = await root.getFileHandle(fileName, { create: true });
    const blob = compressed ? await compressStringToGzipBlob(jsonString) : new Blob([jsonString], { type: 'application/json' });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return true;
  } catch (e) {
    return false;
  }
};

export const loadDataFromOPFS = async () => {
  if (!isOPFSSupported()) return null;
  try {
    const root = await navigator.storage.getDirectory();
    const tryRead = async (name, compressed) => {
      try {
        const fh = await root.getFileHandle(name, { create: false });
        const file = await fh.getFile();
        const text = compressed ? await decompressGzipBlobToString(file) : await file.text();
        return JSON.parse(text);
      } catch (_) { return null; }
    };
    const dataUncompressed = await tryRead('backup.json', false);
    if (dataUncompressed) return dataUncompressed;
    const dataCompressed = await tryRead('backup.json.gz', true);
    return dataCompressed;
  } catch (_) {
    return null;
  }
};

export const getStorageEstimate = async () => {
  try {
    if (!navigator.storage || !navigator.storage.estimate) return null;
    return await navigator.storage.estimate();
  } catch (_) {
    return null;
  }
};

export const loadData = () => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    return savedData ? JSON.parse(savedData) : null;
  } catch (error) {
    console.error('Error loading data:', error);
    return null;
  }
};

export const loadDataFromIndexedDB = async () => {
  try {
    const data = await idbGet(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};

export const saveData = (data) => {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, json);
    idbSet(STORAGE_KEY, json);
    writeOPFSBackup(json);
    saveAutoBackup(json);
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

export const formatCurrency = (value) => {
  const numValue = Number(value) || 0;
  return `Rp ${numValue.toLocaleString('id-ID')}`;
};

// Calculate today's service revenue including bonuses
export const getTodayTotal = (businessData) => {
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = Object.values(businessData.dailyRecords || {})
    .filter(record => record.date === today);
  
  return todayRecords.reduce((sum, record) => {
    const serviceRevenue = Object.entries(record.services || {})
      .filter(([_, quantity]) => Number(quantity) > 0)
      .reduce((serviceSum, [serviceId, quantity]) => {
        const service = businessData.services?.find(s => s.id === serviceId);
        return serviceSum + (service?.price || 0) * Number(quantity);
      }, 0);

    let bonusTotal = 0;
    if (record.bonusServices && record.bonusQuantities) {
      Object.entries(record.bonusServices).forEach(([serviceId, bonusData]) => {
        Object.entries(bonusData || {}).forEach(([bonusId, isEnabled]) => {
          if (isEnabled) {
            const bonusService = businessData.services?.find(s => s.id === bonusId);
            const bonusQty = record.bonusQuantities[serviceId]?.[bonusId] || 0;
            bonusTotal += (bonusService?.price || 0) * bonusQty;
          }
        });
      });
    }

    return sum + serviceRevenue + bonusTotal;
  }, 0);
};

// Calculate today's product sales
export const getTodayProductSales = (businessData) => {
  const today = new Date().toISOString().split('T')[0];
  return Object.values(businessData.productSales || {})
    .filter(sale => sale.date === today)
    .reduce((sum, sale) => sum + sale.total, 0);
};

// Get total number of products
export const getTotalProducts = (businessData) => {
  return businessData.products?.length || 0;
};

export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportDailyRecapToExcel = (dailyRecords, businessData, selectedDate) => {
  if (!dailyRecords || dailyRecords.length === 0) {
    throw new Error('No records to export for this date');
  }

  try {
    import('xlsx').then(XLSX => {
      const wb = XLSX.utils.book_new();
      
      const totalEmployeeRevenue = dailyRecords.reduce((sum, record) => {
        const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
        if (employee?.role !== 'Owner') {
          const recordTotal = Object.entries(record.services || {})
            .filter(([_, quantity]) => Number(quantity) > 0)
            .reduce((recordSum, [serviceId, quantity]) => {
              const service = businessData.services?.find(s => s.id === serviceId);
              return recordSum + (service?.price || 0) * Number(quantity);
            }, 0);
          return sum + recordTotal;
        }
        return sum;
      }, 0);

      dailyRecords.filter(record => {
        const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
        return employee?.role !== 'Owner';
      }).length;

      const exportData = dailyRecords.map(record => {
        const employee = businessData.employees?.find(emp => emp.id === record.employeeId);
        const isOwner = employee?.role === 'Owner';
        
        const serviceRevenue = Object.entries(record.services || {})
          .filter(([_, quantity]) => Number(quantity) > 0)
          .reduce((sum, [serviceId, quantity]) => {
            const service = businessData.services?.find(s => s.id === serviceId);
            return sum + (service?.price || 0) * Number(quantity);
          }, 0);

        let bonusTotal = 0;
        if (record.bonusServices && record.bonusQuantities) {
          Object.entries(record.bonusServices).forEach(([serviceId, bonusData]) => {
            Object.entries(bonusData || {}).forEach(([bonusId, isEnabled]) => {
              if (isEnabled) {
                const bonusService = businessData.services?.find(s => s.id === bonusId);
                const bonusQty = record.bonusQuantities[serviceId]?.[bonusId] || 0;
                bonusTotal += (bonusService?.price || 0) * bonusQty;
              }
            });
          });
        }

        let salary;
        if (isOwner) {
          const employeeShareRevenue = totalEmployeeRevenue * 0.5;
          const dailySavings = 50000;
          salary = serviceRevenue + bonusTotal + employeeShareRevenue - dailySavings;
        } else {
          const baseRevenue = serviceRevenue * 0.5;
          salary = baseRevenue + bonusTotal;
        }

        return {
          'Tanggal': record.date,
          'Nama Karyawan': employee?.name || 'Unknown',
          'Role': isOwner ? 'Owner' : 'Employee',
          'Pendapatan Layanan': serviceRevenue,
          'Bonus Layanan': bonusTotal,
          'Total Gaji': salary
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Daily Recap');
      XLSX.writeFile(wb, `daily_recap_${selectedDate}.xlsx`);
    }).catch(error => {
      console.error('Failed to load XLSX library:', error);
      throw new Error('Failed to export Excel file');
    });
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};

// Helper function to get employee name
const getEmployeeName = (employeeId, businessData) => {
  const employee = businessData.employees.find(emp => emp.id === employeeId);
  return employee ? employee.name : 'Unknown Employee';
};

// Download helpers for JSON backups
export const downloadJSONBackup = async (data, compressed = false) => {
  const json = JSON.stringify(data, null, 2);
  const blob = compressed ? await compressStringToGzipBlob(json) : new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  a.download = compressed ? `backup_${ts}.json.gz` : `backup_${ts}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importJSONFile = async (file) => {
  if (!file) throw new Error('No file');
  const isGzip = file.name.endsWith('.gz') || file.type === 'application/gzip';
  const text = isGzip ? await decompressGzipBlobToString(file) : await file.text();
  const data = JSON.parse(text);
  if (typeof data !== 'object' || data === null) throw new Error('Invalid JSON');
  return data;
};
