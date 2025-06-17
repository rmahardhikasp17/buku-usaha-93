
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, User } from 'lucide-react';
import { formatCurrency } from '../utils/dataManager';

const EmployeeManager = ({ businessData, updateBusinessData }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    role: '',
    totalIncome: '',
    netIncome: 0
  });

  // Calculate net income when role or total income changes
  useEffect(() => {
    if (formData.role && formData.totalIncome) {
      const totalIncome = parseFloat(formData.totalIncome) || 0;
      let netIncome = 0;

      if (formData.role === 'Karyawan') {
        netIncome = totalIncome * 0.5; // 50% for employees
      } else if (formData.role === 'Owner') {
        netIncome = totalIncome - 40000; // Total income - 40000 for owner
      }

      setFormData(prev => ({ ...prev, netIncome }));
    } else {
      setFormData(prev => ({ ...prev, netIncome: 0 }));
    }
  }, [formData.role, formData.totalIncome]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.role || !formData.totalIncome) return;

    const newEmployee = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      role: formData.role,
      totalIncome: parseFloat(formData.totalIncome),
      netIncome: formData.netIncome
    };

    const updatedEmployees = [...businessData.employees, newEmployee];
    updateBusinessData({ employees: updatedEmployees });
    
    setFormData({ name: '', role: '', totalIncome: '', netIncome: 0 });
    setIsAdding(false);
  };

  const handleEdit = (employee) => {
    setEditingId(employee.id);
    setFormData({ 
      name: employee.name,
      role: employee.role || '',
      totalIncome: employee.totalIncome?.toString() || '',
      netIncome: employee.netIncome || 0
    });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.role || !formData.totalIncome) return;

    const updatedEmployees = businessData.employees.map(employee =>
      employee.id === editingId
        ? { 
            ...employee, 
            name: formData.name.trim(),
            role: formData.role,
            totalIncome: parseFloat(formData.totalIncome),
            netIncome: formData.netIncome
          }
        : employee
    );

    updateBusinessData({ employees: updatedEmployees });
    setEditingId(null);
    setFormData({ name: '', role: '', totalIncome: '', netIncome: 0 });
  };

  const handleDelete = (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      const updatedEmployees = businessData.employees.filter(employee => employee.id !== employeeId);
      updateBusinessData({ employees: updatedEmployees });
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', role: '', totalIncome: '', netIncome: 0 });
  };

  const renderForm = (onSubmit, submitText) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nama
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., John Doe"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Role
        </label>
        <select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        >
          <option value="">Pilih Role</option>
          <option value="Owner">Owner</option>
          <option value="Karyawan">Karyawan</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Total Pendapatan
        </label>
        <input
          type="number"
          value={formData.totalIncome}
          onChange={(e) => setFormData({ ...formData, totalIncome: e.target.value })}
          placeholder="e.g., 1000000"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
          min="0"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Penghasilan Bersih
        </label>
        <input
          type="text"
          value={formatCurrency(formData.netIncome)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
          readOnly
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.role === 'Karyawan' && 'Dihitung otomatis: 50% dari Total Pendapatan'}
          {formData.role === 'Owner' && 'Dihitung otomatis: Total Pendapatan - Rp 40.000'}
        </p>
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Save size={18} />
          <span>{submitText}</span>
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
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Employee Manager</h2>
            <p className="text-gray-600 mt-1">Manage your business employees</p>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={20} />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Add Employee Form */}
      {isAdding && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Employee</h3>
          {renderForm(handleSubmit, "Save Employee")}
        </div>
      )}

      {/* Employees List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Current Employees ({businessData.employees.length})
          </h3>
        </div>
        
        {businessData.employees.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="text-gray-400" size={32} />
            </div>
            <h4 className="text-lg font-medium text-gray-600 mb-2">No employees yet</h4>
            <p className="text-gray-500 mb-4">Add your first employee to get started</p>
            <button
              onClick={() => setIsAdding(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Employee
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {businessData.employees.map((employee) => (
              <div key={employee.id} className="border border-gray-200 rounded-lg p-4">
                {editingId === employee.id ? (
                  <div>
                    <h4 className="text-lg font-medium text-gray-800 mb-3">Edit Employee</h4>
                    {renderForm(handleUpdate, "Update Employee")}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="text-green-600" size={20} />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-800">{employee.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          employee.role === 'Owner' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {employee.role || 'No Role'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Pendapatan:</span>
                        <span className="font-medium">{formatCurrency(employee.totalIncome || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Penghasilan Bersih:</span>
                        <span className="font-medium text-green-600">{formatCurrency(employee.netIncome || 0)}</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(employee)}
                        className="flex items-center space-x-1 p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(employee.id)}
                        className="flex items-center space-x-1 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeManager;
