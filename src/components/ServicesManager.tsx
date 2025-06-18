
import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { formatCurrency } from '../utils/dataManager';

interface Service {
  id: string;
  name: string;
  price: number;
}

interface BusinessData {
  services: Service[];
}

interface ServicesManagerProps {
  businessData: BusinessData;
  updateBusinessData: (data: Partial<BusinessData>) => void;
}

const ServicesManager: React.FC<ServicesManagerProps> = ({ businessData, updateBusinessData }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) return;

    const newService: Service = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      price: parseFloat(formData.price)
    };

    const updatedServices = [...businessData.services, newService];
    updateBusinessData({ services: updatedServices });
    
    setFormData({ name: '', price: '' });
    setIsAdding(false);
  };

  const handleEdit = (service: Service) => {
    setEditingId(service.id);
    setFormData({ name: service.name, price: service.price.toString() });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) return;

    const updatedServices = businessData.services.map(service =>
      service.id === editingId
        ? { ...service, name: formData.name.trim(), price: parseFloat(formData.price) }
        : service
    );

    updateBusinessData({ services: updatedServices });
    setEditingId(null);
    setFormData({ name: '', price: '' });
  };

  const handleDelete = (serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      const updatedServices = businessData.services.filter(service => service.id !== serviceId);
      updateBusinessData({ services: updatedServices });
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', price: '' });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gray-50 rounded-xl shadow-sm p-8 border border-gray-300">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Services Manager</h2>
            <p className="text-gray-600 mt-1">Manage your business services and prices</p>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              <Plus size={20} />
              <span>Add New Service</span>
            </button>
          )}
        </div>
      </div>

      {/* Add Service Form */}
      {isAdding && (
        <div className="bg-gray-50 rounded-xl shadow-sm p-8 border border-gray-300">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Add New Service</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Haircut, Wash & Dry"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (Rp)
                </label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                <Save size={18} />
                <span>Save Service</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center space-x-2 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                <X size={18} />
                <span>Cancel</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services List */}
      <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-300">
        <div className="p-8 border-b border-gray-300">
          <h3 className="text-lg font-semibold text-gray-800">
            Current Services ({businessData.services.length})
          </h3>
        </div>
        
        {businessData.services.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="text-gray-400" size={32} />
            </div>
            <h4 className="text-lg font-medium text-gray-600 mb-2">No services yet</h4>
            <p className="text-gray-500 mb-6">Add your first service to get started</p>
            <button
              onClick={() => setIsAdding(true)}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Add Service
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-300">
            {businessData.services.map((service) => (
              <div key={service.id} className="p-8">
                {editingId === service.id ? (
                  <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <input
                        type="number"
                        step="1000"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                      >
                        <Save size={16} />
                        <span>Save</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                      >
                        <X size={16} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-lg font-medium text-gray-800 mb-1">{service.name}</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(service.price)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(service)}
                        className="p-3 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="p-3 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
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
