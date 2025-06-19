
import React, { useState } from 'react';
import { Home, Package, Users, PlusCircle, BarChart3, Settings, Menu, X, DollarSign, FileText, Scissors } from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  businessName: string;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, setCurrentPage, businessName }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'services', label: 'Services', icon: Scissors },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'daily-input', label: 'Daily Input', icon: PlusCircle },
    { id: 'transactions', label: 'Pemasukan & Pengeluaran', icon: DollarSign },
    { id: 'daily-recap', label: 'Daily Recap', icon: BarChart3 },
    { id: 'monthly-report', label: 'Laporan Bulanan', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleMenuClick = (pageId: string) => {
    setCurrentPage(pageId);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg border-b-2 border-barbershop-red">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Business Name with Barbershop Theme */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 barbershop-gradient rounded-lg flex items-center justify-center shadow-sm">
              <Scissors className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 font-poppins">✂️ Nekat Barbershop</h1>
              <div className="w-16 h-1 barber-pole rounded-full"></div>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium font-poppins hover-lift ${
                    currentPage === item.id
                      ? 'bg-barbershop-blue text-white shadow-md'
                      : 'text-gray-700 hover:text-barbershop-blue hover:bg-blue-50'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 animate-fade-in">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-poppins ${
                      currentPage === item.id
                        ? 'bg-barbershop-blue text-white'
                        : 'text-gray-700 hover:text-barbershop-blue hover:bg-blue-50'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
