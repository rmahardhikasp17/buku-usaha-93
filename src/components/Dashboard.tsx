
import React from 'react';
import { Scissors, Users, DollarSign, Calendar, ArrowRight, TrendingUp } from 'lucide-react';
import { getTodayTotal, getTodayProductSales, getTotalProducts, formatCurrency } from '../utils/dataManager';

interface BusinessData {
  businessName: string;
  services: any[];
  employees: any[];
  products: any[];
  dailyRecords: Record<string, any>;
  transactions: Record<string, any>;
  productSales: Record<string, any>;
}

interface DashboardProps {
  businessData: BusinessData;
  setCurrentPage: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ businessData, setCurrentPage }) => {
  const todayServiceTotal = getTodayTotal(businessData) || 0;
  const todayProductSales = getTodayProductSales(businessData) || 0;
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const stats = [
    {
      title: 'Total Layanan',
      value: businessData.services?.length || 0,
      icon: Scissors,
      color: 'bg-barbershop-red',
      emoji: '✂️'
    },
    {
      title: 'Total Karyawan',
      value: businessData.employees?.length || 0,
      icon: Users,
      color: 'bg-barbershop-blue',
      emoji: '👤'
    },
    {
      title: "Pendapatan Layanan Hari Ini",
      value: formatCurrency(todayServiceTotal),
      icon: DollarSign,
      color: 'bg-green-600',
      emoji: '💰'
    },
    {
      title: 'Penjualan Produk Hari Ini',
      value: formatCurrency(todayProductSales),
      icon: Calendar,
      color: 'bg-purple-600',
      emoji: '📦'
    }
  ];

  const quickActions = [
    {
      title: 'Kelola Layanan',
      description: 'Tambah atau edit layanan barbershop',
      icon: Scissors,
      color: 'hover:border-barbershop-red hover:bg-red-50',
      emoji: '✂️',
      action: () => setCurrentPage('services')
    },
    {
      title: 'Kelola Karyawan',
      description: 'Tambah atau kelola tim barbershop',
      icon: Users,
      color: 'hover:border-barbershop-blue hover:bg-blue-50',
      emoji: '👥',
      action: () => setCurrentPage('employees')
    },
    {
      title: 'Input Pendapatan',
      description: 'Catat transaksi harian barbershop',
      icon: DollarSign,
      color: 'hover:border-green-500 hover:bg-green-50',
      emoji: '💵',
      action: () => setCurrentPage('daily-recap')
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section with Barbershop Theme */}
      <div className="barbershop-card p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 barber-pole opacity-10 rounded-full"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-3 font-poppins">
            💈 Selamat Datang di Nekat Barbershop
          </h2>
          <p className="text-gray-600 text-lg font-poppins">
            {today} - Siap melayani pelanggan dengan profesional
          </p>
        </div>
      </div>

      {/* Stats Grid with Barbershop Icons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="barbershop-card p-6 hover-lift">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1 font-poppins">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800 font-poppins">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg shadow-sm flex items-center justify-center`}>
                  <span className="text-2xl">{stat.emoji}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions with Barbershop Theme */}
      <div className="barbershop-card p-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 font-poppins flex items-center">
          <Scissors className="mr-2 text-barbershop-red" size={24} />
          Menu Utama Barbershop
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.action}
                className={`p-6 border-2 border-gray-200 rounded-xl text-center transition-all duration-200 ${action.color} group bg-white hover:shadow-md hover-lift`}
              >
                <div className="text-3xl mb-3">{action.emoji}</div>
                <h4 className="font-semibold text-gray-800 mb-2 font-poppins">{action.title}</h4>
                <p className="text-sm text-gray-600 mb-3 font-poppins">{action.description}</p>
                <ArrowRight className="mx-auto text-gray-400 group-hover:text-barbershop-blue transition-colors" size={16} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Getting Started with Barbershop Theme */}
      <div className="barbershop-card p-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 font-poppins flex items-center">
          <TrendingUp className="mr-2 text-barbershop-blue" size={24} />
          Panduan Memulai
        </h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-red-50 rounded-lg border border-red-200 hover-lift">
            <div className="w-3 h-3 bg-barbershop-red rounded-full"></div>
            <p className="text-gray-700 font-medium font-poppins">✂️ Tambahkan layanan barbershop dan tentukan harga</p>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200 hover-lift">
            <div className="w-3 h-3 bg-barbershop-blue rounded-full"></div>
            <p className="text-gray-700 font-medium font-poppins">👤 Daftarkan karyawan barbershop</p>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200 hover-lift">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <p className="text-gray-700 font-medium font-poppins">💰 Mulai catat pendapatan harian</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
