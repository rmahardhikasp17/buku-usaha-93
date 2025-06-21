
import React, { useState } from 'react';
import { ShoppingCart, Plus, Save, Trash2, Package } from 'lucide-react';
import { formatCurrency } from '../utils/dataManager';
import { toast } from 'sonner';

const ProductSales = ({ businessData, updateBusinessData }) => {
  const [sales, setSales] = useState(businessData.productSales || {});
  const [newSale, setNewSale] = useState({
    date: new Date().toISOString().split('T')[0],
    productId: '',
    quantity: 1,
    unitPrice: '',
    sellerName: ''
  });

  const products = businessData.products || [];
  const today = new Date().toISOString().split('T')[0];
  const todaySales = Object.values(sales).filter(sale => sale.date === today);

  const handleProductChange = (productId) => {
    const product = products.find(p => p.id === productId);
    setNewSale({
      ...newSale,
      productId,
      unitPrice: product ? product.price.toString() : ''
    });
  };

  const calculateTotal = () => {
    return Number(newSale.quantity) * Number(newSale.unitPrice || 0);
  };

  const handleAddSale = () => {
    if (!newSale.productId || !newSale.quantity || !newSale.unitPrice) {
      toast.error('Please fill in all required fields');
      return;
    }

    const product = products.find(p => p.id === newSale.productId);
    if (!product) {
      toast.error('Selected product not found');
      return;
    }

    const sale = {
      id: Date.now().toString(),
      date: newSale.date,
      productId: newSale.productId,
      productName: product.name,
      quantity: Number(newSale.quantity),
      unitPrice: Number(newSale.unitPrice),
      total: calculateTotal(),
      sellerName: newSale.sellerName.trim() || 'N/A',
      createdAt: new Date().toISOString()
    };

    const updatedSales = { ...sales, [sale.id]: sale };
    setSales(updatedSales);
    updateBusinessData({ productSales: updatedSales });

    // Reset form
    setNewSale({
      date: newSale.date,
      productId: '',
      quantity: 1,
      unitPrice: '',
      sellerName: ''
    });

    toast.success('Product sale added successfully');
  };

  const handleDeleteSale = (saleId) => {
    const updatedSales = { ...sales };
    delete updatedSales[saleId];
    setSales(updatedSales);
    updateBusinessData({ productSales: updatedSales });
    toast.success('Sale deleted successfully');
  };

  const getTodayTotal = () => {
    return todaySales.reduce((sum, sale) => sum + sale.total, 0);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <ShoppingCart className="mr-3 text-green-600" size={28} />
              Penjualan Produk
            </h2>
            <p className="text-gray-600 mt-2">Record product sales transactions</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Today's Sales</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(getTodayTotal())}</p>
          </div>
        </div>
      </div>

      {/* Add Sale Form */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Plus className="mr-2" size={20} />
          Add Product Sale
        </h3>
        
        {products.length === 0 ? (
          <div className="text-center py-8">
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 mb-4">No products available. Add products first to record sales.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={newSale.date}
                onChange={(e) => setNewSale({ ...newSale, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
              <select
                value={newSale.productId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select Product</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {formatCurrency(product.price)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <input
                type="number"
                min="1"
                value={newSale.quantity}
                onChange={(e) => setNewSale({ ...newSale, quantity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price (Rp)</label>
              <input
                type="number"
                value={newSale.unitPrice}
                onChange={(e) => setNewSale({ ...newSale, unitPrice: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Seller Name (Optional)</label>
              <input
                type="text"
                value={newSale.sellerName}
                onChange={(e) => setNewSale({ ...newSale, sellerName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter seller name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total</label>
              <div className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-lg font-semibold text-green-600">
                {formatCurrency(calculateTotal())}
              </div>
            </div>
          </div>
        )}
        
        {products.length > 0 && (
          <button
            onClick={handleAddSale}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2"
          >
            <Save size={20} />
            <span>Save Transaction</span>
          </button>
        )}
      </div>

      {/* Today's Sales List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Today's Sales ({todaySales.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {todaySales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No sales recorded for today.
                  </td>
                </tr>
              ) : (
                todaySales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{sale.productName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{sale.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(sale.unitPrice)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">{formatCurrency(sale.total)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{sale.sellerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteSale(sale.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductSales;
