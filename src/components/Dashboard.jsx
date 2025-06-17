
import React from 'react';
import { Package, Users, DollarSign, TrendingUp } from 'lucide-react';
import { getTodayTotal, formatCurrency } from '../utils/dataManager';

const Dashboard = ({ businessData }) => {
  const todayTotal = getTodayTotal(businessData);
  const today = new Date().toLocaleDateString();

  const stats = [
    {
      title: 'Total Services',
      value: businessData.services.length,
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'Total Employees',
      value: businessData.employees.length,
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: "Today's Revenue",
      value: formatCurrency(todayTotal),
      icon: DollarSign,
      color: 'text-purple-600'
    },
    {
      title: 'Active Records',
      value: Object.keys(businessData.dailyRecords).length,
      icon: TrendingUp,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
        <h2 className="text-3xl font-semibold text-gray-700 mb-3">
          Welcome to {businessData.businessName}
        </h2>
        <p className="text-gray-600 text-lg">
          Today is {today}. Here's your business overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-700">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-white border border-gray-200`}>
                  <Icon className={stat.color} size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-700 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-blue-400 transition-colors cursor-pointer">
            <Package className="mx-auto text-gray-500 mb-3" size={32} />
            <p className="text-gray-600 font-medium">Manage Services</p>
          </div>
          <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-green-400 transition-colors cursor-pointer">
            <Users className="mx-auto text-gray-500 mb-3" size={32} />
            <p className="text-gray-600 font-medium">Manage Employees</p>
          </div>
          <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-purple-400 transition-colors cursor-pointer">
            <DollarSign className="mx-auto text-gray-500 mb-3" size={32} />
            <p className="text-gray-600 font-medium">Record Daily Income</p>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-700 mb-6">Getting Started</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <p className="text-gray-700">Add your services and set their prices</p>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <p className="text-gray-700">Register your employees</p>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <p className="text-gray-700">Start recording daily income</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
