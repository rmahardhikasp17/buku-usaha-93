
import React from 'react';
import { Package, Users, DollarSign, TrendingUp } from 'lucide-react';
import { getTodayTotal, formatCurrency } from '../utils/dataManager';

const Dashboard = ({ businessData }) => {
  const todayTotal = getTodayTotal(businessData);
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const stats = [
    {
      title: 'Total Layanan',
      value: businessData.services.length,
      icon: Package,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Total Karyawan',
      value: businessData.employees.length,
      icon: Users,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Pendapatan Hari Ini',
      value: formatCurrency(todayTotal),
      icon: DollarSign,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Total Catatan',
      value: Object.keys(businessData.dailyRecords).length,
      icon: TrendingUp,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
        <h1 className="text-3xl font-semibold text-gray-900 mb-3">
          Selamat Datang di {businessData.businessName}
        </h1>
        <p className="text-gray-600 text-lg">
          {today}. Berikut ringkasan bisnis Anda.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-4 rounded-xl`}>
                  <Icon className={stat.iconColor} size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Getting Started */}
      <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Memulai</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <p className="text-gray-700">Tambahkan layanan dan tetapkan harganya</p>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <p className="text-gray-700">Daftarkan karyawan Anda</p>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <p className="text-gray-700">Mulai catat pendapatan harian</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
