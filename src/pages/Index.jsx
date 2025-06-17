
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import Dashboard from '../components/Dashboard';
import ServicesManager from '../components/ServicesManager';
import EmployeeManager from '../components/EmployeeManager';
import DailyInput from '../components/DailyInput';
import DailyRecap from '../components/DailyRecap';
import Settings from '../components/Settings';
import { loadData, saveData } from '../utils/dataManager';
import { Toaster } from '../components/ui/toaster';

const Index = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [businessData, setBusinessData] = useState({
    businessName: 'My Business',
    services: [],
    employees: [],
    dailyRecords: {}
  });

  useEffect(() => {
    const savedData = loadData();
    if (savedData) {
      setBusinessData(savedData);
    }
  }, []);

  useEffect(() => {
    saveData(businessData);
  }, [businessData]);

  const updateBusinessData = (newData) => {
    setBusinessData(prev => ({ ...prev, ...newData }));
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard businessData={businessData} />;
      case 'services':
        return <ServicesManager businessData={businessData} updateBusinessData={updateBusinessData} />;
      case 'employees':
        return <EmployeeManager businessData={businessData} updateBusinessData={updateBusinessData} />;
      case 'daily-input':
        return <DailyInput businessData={businessData} updateBusinessData={updateBusinessData} />;
      case 'daily-recap':
        return <DailyRecap businessData={businessData} />;
      case 'settings':
        return <Settings businessData={businessData} updateBusinessData={updateBusinessData} />;
      default:
        return <Dashboard businessData={businessData} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        businessName={businessData.businessName}
      />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {renderCurrentPage()}
      </main>
      <Toaster />
    </div>
  );
};

export default Index;
