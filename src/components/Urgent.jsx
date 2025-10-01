import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Save, Trash2, Calendar, DollarSign, TrendingDown, Users, PiggyBank, Package } from 'lucide-react';
import { formatCurrency } from '../utils/dataManager';

const Urgent = ({ businessData, updateBusinessData }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [form, setForm] = useState({
    totalPendapatan: '',
    totalPengeluaran: '',
    totalGajiDibayarkan: '',
    tabunganOwner: '',
    pendapatanProduk: ''
  });

  const overrides = businessData.urgentOverrides || {};

  useEffect(() => {
    const ov = overrides[date];
    if (ov) {
      setForm({
        totalPendapatan: ov.totalPendapatan ?? '',
        totalPengeluaran: ov.totalPengeluaran ?? '',
        totalGajiDibayarkan: ov.totalGajiDibayarkan ?? '',
        tabunganOwner: ov.tabunganOwner ?? '',
        pendapatanProduk: ov.pendapatanProduk ?? ''
      });
    } else {
      setForm({
        totalPendapatan: '',
        totalPengeluaran: '',
        totalGajiDibayarkan: '',
        tabunganOwner: '',
        pendapatanProduk: ''
      });
    }
  }, [date]);

  const handleChange = (key, value) => {
    const onlyNumber = value.replace(/[^0-9]/g, '');
    setForm(prev => ({ ...prev, [key]: onlyNumber }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    const payload = {
      ...overrides,
      [date]: {
        totalPendapatan: form.totalPendapatan === '' ? undefined : Number(form.totalPendapatan),
        totalPengeluaran: form.totalPengeluaran === '' ? undefined : Number(form.totalPengeluaran),
        totalGajiDibayarkan: form.totalGajiDibayarkan === '' ? undefined : Number(form.totalGajiDibayarkan),
        tabunganOwner: form.tabunganOwner === '' ? undefined : Number(form.tabunganOwner),
        pendapatanProduk: form.pendapatanProduk === '' ? undefined : Number(form.pendapatanProduk)
      }
    };
    updateBusinessData({ urgentOverrides: payload });
    alert('Override disimpan untuk tanggal ini.');
  };

  const handleClear = () => {
    const newOv = { ...overrides };
    delete newOv[date];
    updateBusinessData({ urgentOverrides: newOv });
    setForm({
      totalPendapatan: '',
      totalPengeluaran: '',
      totalGajiDibayarkan: '',
      tabunganOwner: '',
      pendapatanProduk: ''
    });
    alert('Override dihapus untuk tanggal ini.');
  };

  const Field = ({ label, icon: Icon, name, placeholder }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
          <Icon size={18} />
        </div>
        <input
          type="text"
          inputMode="numeric"
          value={form[name]}
          onChange={(e) => handleChange(name, e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      {form[name] !== '' && (
        <p className="mt-1 text-xs text-gray-500">{formatCurrency(Number(form[name]))}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
            <AlertTriangle className="text-yellow-600" size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Urgent Override</h2>
            <p className="text-gray-600 text-sm">Fitur darurat untuk menggantikan data yang hilang pada tanggal tertentu.</p>
          </div>
        </div>
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-gray-500" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {overrides[date] && (
          <p className="mt-2 text-xs text-amber-600">Override sudah ada untuk tanggal ini. Menyimpan akan mengganti nilai yang ada.</p>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Total Pendapatan (layanan + bonus)" icon={DollarSign} name="totalPendapatan" placeholder="cth: 1500000" />
          <Field label="Total Pengeluaran" icon={TrendingDown} name="totalPengeluaran" placeholder="cth: 250000" />
          <Field label="Total Gaji Dibayarkan" icon={Users} name="totalGajiDibayarkan" placeholder="cth: 900000" />
          <Field label="Tabungan Owner" icon={PiggyBank} name="tabunganOwner" placeholder="cth: 50000" />
          <Field label="Pendapatan Produk" icon={Package} name="pendapatanProduk" placeholder="cth: 300000" />
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <button type="submit" className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            <Save size={18} />
            <span>Simpan Override</span>
          </button>
          {overrides[date] && (
            <button type="button" onClick={handleClear} className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              <Trash2 size={18} />
              <span>Hapus Override</span>
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500">Catatan: Nilai yang diisi akan menggantikan perhitungan otomatis pada laporan bulanan untuk tanggal yang dipilih.</p>
      </form>
    </div>
  );
};

export default Urgent;
