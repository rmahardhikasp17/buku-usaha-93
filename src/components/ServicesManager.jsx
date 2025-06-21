
import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { formatCurrency } from '../utils/dataManager';
import { Checkbox } from './ui/checkbox';

const ServicesManager = ({ businessData, updateBusinessData }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', bonusable: false });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) return;

    const newService = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      price: parseFloat(formData.price),
      bonusable: formData.bonusable
    };

    const updatedServices = [...businessData.services, newService];
    updateBusinessData({ services: updatedServices });
    
    setFormData({ name: '', price: '', bonusable: false });
    setIsAdding(false);
  };

  const handleEdit = (service) => {
    setEditingId(service.id);
    setFormData({ 
      name: service.name, 
      price: service.price.toString(),
      bonusable: service.bonusable || false
    });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) return;

    const updatedServices = businessData.services.map(service =>
      service.id === editingId
        ? { 
            ...service, 
            name: formData.name.trim(), 
            price: parseFloat(formData.price),
            bonusable: formData.bonusable
          }
        : service
    );

    updateBusinessData({ services: updatedServices });
    setEditingId(null);
    setFormData({ name: '', price: '', bonusable: false });
  };

  const handleDelete = (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      const updatedServices = businessData.services.filter(service => service.id !== serviceId);
      updateBusinessData({ services: updatedServices });
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', price: '', bonusable: false });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Services Manager</h2>
            <p className="text-gray-600 mt-1">Manage your business services and prices</p>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center space-x-2 bg-barbershop-red text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
            >
              <Plus size={20} />
              <span>Add Service</span>
            </button>
          )}
        </div>
      </div>

      {/* Add Service Form */}
      {isAdding && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Service</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Haircut, Wash & Dry"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-barbershop-red focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (Rp)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-barbershop-red focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bonusable"
                checked={formData.bonusable}
                onCheckedChange={(checked) => setFormData({ ...formData, bonusable: checked })}
              />
              <label htmlFor="bonusable" className="text-sm font-medium text-gray-700">
                Bonus Service (100% to employee)
              </label>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save size={18} />
                <span>Save Service</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <X size={18} />
                <span>Cancel</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Current Services ({businessData.services.length})
          </h3>
        </div>
        
        {businessData.services.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="text-gray-400" size={32} />
            </div>
            <h4 className="text-lg font-medium text-gray-600 mb-2">No services yet</h4>
            <p className="text-gray-500 mb-4">Add your first service to get started</p>
            <button
              onClick={() => setIsAdding(true)}
              className="bg-barbershop-red text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Add Service
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {businessData.services.map((service) => (
              <div key={service.id} className="p-6">
                {editingId === service.id ? (
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-barbershop-red focus:border-transparent"
                        required
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-barbershop-red focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-bonusable-${service.id}`}
                        checked={formData.bonusable}
                        onCheckedChange={(checked) => setFormData({ ...formData, bonusable: checked })}
                      />
                      <label htmlFor={`edit-bonusable-${service.id}`} className="text-sm font-medium text-gray-700">
                        Bonus Service (100% to employee)
                      </label>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="flex items-center space-x-2 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Save size={16} />
                        <span>Save</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="flex items-center space-x-2 bg-gray-500 text-white px-3 py-1.5 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                      >
                        <X size={16} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-medium text-gray-800">{service.name}</h4>
                        {service.bonusable && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                            Bonus
                          </span>
                        )}
                      </div>
                      <p className="text-xl font-bold text-green-600 mt-1">
                        {formatCurrency(service.price)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(service)}
                        className="p-2 text-barbershop-blue hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesManager;
