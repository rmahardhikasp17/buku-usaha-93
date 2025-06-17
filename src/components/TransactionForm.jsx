
import React, { useState } from 'react';
import { Calendar, DollarSign, FileText, Save } from 'lucide-react';
import { formatCurrency } from '../utils/dataManager';

const TransactionForm = ({ businessData, updateBusinessData }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactionType, setTransactionType] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!transactionType || !description || !amount) {
      alert('Please fill in all fields');
      return;
    }

    const newTransaction = {
      id: Date.now().toString(),
      date: selectedDate,
      type: transactionType,
      description: description,
      amount: parseFloat(amount)
    };

    const updatedTransactions = {
      ...businessData.transactions,
      [newTransaction.id]: newTransaction
    };

    updateBusinessData({ transactions: updatedTransactions });
    
    // Reset form
    setTransactionType('');
    setDescription('');
    setAmount('');
    alert('Transaction saved successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">Pemasukan & Pengeluaran</h2>
        <p className="text-gray-600 mt-1">Record business income and expenses</p>
      </div>

      {/* Transaction Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 space-y-6">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline mr-2" size={16} />
            Tanggal
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>

        {/* Transaction Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="inline mr-2" size={16} />
            Tipe Transaksi
          </label>
          <select
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          >
            <option value="">Select transaction type</option>
            <option value="Pemasukan">Pemasukan</option>
            <option value="Pengeluaran">Pengeluaran</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="inline mr-2" size={16} />
            Deskripsi
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter transaction description"
            required
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="inline mr-2" size={16} />
            Nominal
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter amount"
            min="0"
            step="1000"
            required
          />
          {amount && (
            <p className="text-sm text-gray-500 mt-1">
              {formatCurrency(parseFloat(amount) || 0)}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="border-t border-gray-200 pt-6">
          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Save size={20} />
            <span>Simpan Transaksi</span>
          </button>
        </div>
      </form>

      {/* Recent Transactions */}
      {businessData.transactions && Object.keys(businessData.transactions).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {Object.values(businessData.transactions)
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 5)
              .map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{transaction.description}</p>
                    <p className="text-sm text-gray-600">{transaction.date}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      transaction.type === 'Pemasukan' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'Pemasukan' ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-gray-500">{transaction.type}</p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionForm;
