
import React from 'react';
import { Package, Users, DollarSign, TrendingUp, ArrowRight } from 'lucide-react';
import { getTodayTotal, formatCurrency } from '../utils/dataManager';

interface BusinessData {
  businessName: string;
  services: any[];
  employees: any[];
  dailyRecords: Record<string, any>;
  transactions: Record<string, any>;
}

interface DashboardProps {
  businessData: BusinessData;
  setCurrentPage: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ businessData, setCurrentPage }) => {
  const todayTotal = getTodayTotal(businessData);
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const stats = [
    {
      title: 'Total Services',
      value: businessData.services.length,
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Employees',
      value: businessData.employees.length,
      icon: Users,
      color: 'bg-green-500'
    },
    {
      title: "Today's Revenue",
      value: formatCurrency(todayTotal),
      icon: DollarSign,
      color: 'bg-purple-500'
    },
    {
      title: 'Active Records',
      value: Object.keys(businessData.dailyRecords).length,
      icon: TrendingUp,
      color: 'bg-orange-500'
    }
  ];

  const quickActions = [
    {
      title: 'Manage Services',
      description: 'Add or edit your business services',
      icon: Package,
      color: 'hover:border-blue-400 hover:bg-blue-50',
      action: () => setCurrentPage('services')
    },
    {
      title: 'Manage Employees',
      description: 'Add or manage your team members',
      icon: Users,
      color: 'hover:border-green-400 hover:bg-green-50',
      action: () => setCurrentPage('employees')
    },
    {
      title: 'Record Daily Income',
      description: 'Input today\'s business transactions',
      icon: DollarSign,
      color: 'hover:border-purple-400 hover:bg-purple-50',
      action: () => setCurrentPage('daily-input')
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gray-50 rounded-xl shadow-sm p-8 border border-gray-300">
        <h2 className="text-3xl font-bold text-gray-800 mb-3">
          Welcome to Nekat Mbois
        </h2>
        <p className="text-gray-600 text-lg">
          {today} - Here's your business overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-gray-50 rounded-xl shadow-sm p-6 border border-gray-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg shadow-sm`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-xl shadow-sm p-8 border border-gray-300">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.action}
                className={`p-6 border-2 border-gray-300 rounded-lg text-center transition-all duration-200 ${action.color} group`}
              >
                <Icon className="mx-auto text-gray-400 mb-3 group-hover:text-gray-600 transition-colors" size={32} />
                <h4 className="font-medium text-gray-800 mb-2">{action.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                <ArrowRight className="mx-auto text-gray-400 group-hover:text-blue-500 transition-colors" size={16} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-gray-50 rounded-xl shadow-sm p-8 border border-gray-300">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Getting Started</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <p className="text-gray-700 font-medium">Add your services and set their prices</p>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <p className="text-gray-700 font-medium">Register your employees</p>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <p className="text-gray-700 font-medium">Start recording daily income</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
