import React from 'react';
import { exportMonthlyReportToExcel } from '../utils/dataManager';

interface MonthlyReportProps {
  businessData: any;
  selectedMonth: number; // bulan 0–11 (contoh: Juni = 5)
  selectedYear: number;  // tahun 4 digit (contoh: 2025)
}

const MonthlyReport: React.FC<MonthlyReportProps> = ({ businessData, selectedMonth, selectedYear }) => {
  const handleExport = () => {
    if (!businessData || !businessData.dailyRecords) {
      alert('Data tidak tersedia untuk diekspor.');
      return;
    }
    exportMonthlyReportToExcel(businessData, selectedMonth, selectedYear);
  };

  return (
    <div className="my-4">
      <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
        📥 Ekspor Laporan Bulanan ke Excel
      </button>
    </div>
  );
};

export default MonthlyReport;
