
import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, User } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  role: string;
}

interface BusinessData {
  employees: Employee[];
}

interface EmployeeManagerProps {
  businessData: BusinessData;
  updateBusinessData: (data: Partial<BusinessData>) => void;
}

const EmployeeManager: React.FC<EmployeeManagerProps> = ({ businessData, updateBusinessData }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    role: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.role) return;

    const newEmployee: Employee = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      role: formData.role
    };

    const updatedEmployees = [...businessData.employees, newEmployee];
    updateBusinessData({ employees: updatedEmployees });
    
    setFormData({ name: '', role: '' });
    setIsAdding(false);
  };

  const handleEdit = (employee: Employee) => {
    setEditingId(employee.id);
    setFormData({ 
      name: employee.name,
      role: employee.role || ''
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.role) return;

    const updatedEmployees = businessData.employees.map(employee =>
      employee.id === editingId
        ? { 
            ...employee, 
            name: formData.name.trim(),
            role: formData.role
          }
        : employee
    );

    updateBusinessData({ employees: updatedEmployees });
    setEditingId(null);
    setFormData({ name: '', role: '' });
  };

  const handleDelete = (employeeId: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      const updatedEmployees = businessData.employees.filter(employee => employee.id !== employeeId);
      updateBusinessData({ employees: updatedEmployees });
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', role: '' });
  };

  const renderForm = (onSubmit: (e: React.FormEvent) => void, submitText: string) => (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nama
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., John Doe"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Pilih Role</option>
          <option value="Owner">Owner</option>
          <option value="Karyawan">Karyawan</option>
        </select>
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          <Save size={18} />
          <span>{submitText}</span>
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
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gray-50 rounded-xl shadow-sm p-8 border border-gray-300">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Employee Manager</h2>
            <p className="text-gray-600 mt-1">Manage your business employees</p>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              <Plus size={20} />
              <span>Add New Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Add Employee Form */}
      {isAdding && (
        <div className="bg-gray-50 rounded-xl shadow-sm p-8 border border-gray-300">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Add New Employee</h3>
          {renderForm(handleSubmit, "Save Employee")}
        </div>
      )}

      {/* Employees List */}
      <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-300">
        <div className="p-8 border-b border-gray-300">
          <h3 className="text-lg font-semibold text-gray-800">
            Current Employees ({businessData.employees.length})
          </h3>
        </div>
        
        {businessData.employees.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="text-gray-400" size={32} />
            </div>
            <h4 className="text-lg font-medium text-gray-600 mb-2">No employees yet</h4>
            <p className="text-gray-500 mb-6">Add your first employee to get started</p>
            <button
              onClick={() => setIsAdding(true)}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Add Employee
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
            {businessData.employees.map((employee) => (
              <div key={employee.id} className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
                {editingId === employee.id ? (
                  <div>
                    <h4 className="text-lg font-medium text-gray-800 mb-4">Edit Employee</h4>
                    {renderForm(handleUpdate, "Update Employee")}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-800">{employee.name}</h4>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          employee.role === 'Owner' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {employee.role || 'No Role'}
                        </span>
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
