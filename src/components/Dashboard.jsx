import React from 'react';
import { Package, Users, DollarSign, TrendingUp } from 'lucide-react';
import { getTodayTotal, formatCurrency } from '../utils/dataManager';

const Dashboard = ({ businessData }) => {
  const todayTotal = getTodayTotal(businessData);
  const today = new Date().toLocaleDateString();
  
  // Calculate today's product sales
  const todayProductSales = Object.values(businessData.productSales || {})
    .filter(sale => sale.date === new Date().toISOString().split('T')[0])
    .reduce((sum, sale) => sum + sale.total, 0);

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
      title: "Today's Service Revenue",
      value: formatCurrency(todayTotal),
      icon: DollarSign,
      color: 'bg-purple-500'
    },
    {
      title: "Today's Product Sales",
      value: formatCurrency(todayProductSales),
      icon: Package,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Welcome to {businessData.businessName}
        </h2>
        <p className="text-gray-600">
          Today is {today}. Here's your business overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 transition-colors">
            <Package className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-sm text-gray-600">Manage Services</p>
          </div>
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-green-400 transition-colors">
            <Users className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-sm text-gray-600">Manage Employees</p>
          </div>
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-purple-400 transition-colors">
            <DollarSign className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-sm text-gray-600">Record Daily Income</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Getting Started</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <p className="text-sm text-gray-700">Add your services and set their prices</p>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p className="text-sm text-gray-700">Register your employees</p>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <p className="text-sm text-gray-700">Start recording daily income</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
