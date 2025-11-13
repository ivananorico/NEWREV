import { useState, useEffect } from 'react';

export default function BUSINESS1() {
  const [activeTab, setActiveTab] = useState('business');
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Business Configuration State
  const [businessConfigs, setBusinessConfigs] = useState([]);
  const [businessForm, setBusinessForm] = useState({
    business_type: '',
    tax_base: 'gross_sales',
    first_year_base: 'capital_investment',
    min_range: '',
    max_range: '',
    tax_rate: '',
    effective_date: new Date().toISOString().split('T')[0],
    expiration_date: '',
    remarks: ''
  });

  // Regulatory Configuration State
  const [regulatoryConfigs, setRegulatoryConfigs] = useState([]);
  const [regulatoryForm, setRegulatoryForm] = useState({
    fee_name: '',
    business_type: '',
    amount: '',
    effective_date: new Date().toISOString().split('T')[0],
    expiration_date: '',
    remarks: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [editingType, setEditingType] = useState(null);

  const API_BASE = "http://localhost/revenue/backend/Business/BusinessTaxConfig";

  // Fetch Business Configurations
  const fetchBusinessConfigs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/business-configurations.php?current_date=${currentDate}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setBusinessConfigs(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching business configurations:', error);
      setError('Failed to load business configurations: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Regulatory Configurations
  const fetchRegulatoryConfigs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/regulatory-configurations.php?current_date=${currentDate}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setRegulatoryConfigs(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching regulatory configurations:', error);
      setError('Failed to load regulatory configurations: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessConfigs();
    fetchRegulatoryConfigs();
  }, [currentDate]);

  // Business Configuration Handlers
  const handleBusinessSubmit = async (e) => {
    e.preventDefault();
    const url = editingId 
      ? `${API_BASE}/business-configurations.php?id=${editingId}`
      : `${API_BASE}/business-configurations.php`;
    
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(businessForm)
      });

      const result = await response.json();
      
      if (response.ok) {
        fetchBusinessConfigs();
        resetBusinessForm();
        alert(editingId ? 'Business configuration updated successfully!' : 'Business configuration created successfully!');
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving business configuration:', error);
      alert('Error saving business configuration');
    }
  };

  const handleBusinessEdit = (config) => {
    setBusinessForm({
      business_type: config.business_type,
      tax_base: config.tax_base,
      first_year_base: config.first_year_base,
      min_range: config.min_range,
      max_range: config.max_range,
      tax_rate: config.tax_rate,
      effective_date: config.effective_date,
      expiration_date: config.expiration_date || '',
      remarks: config.remarks || ''
    });
    setEditingId(config.id);
    setEditingType('business');
  };

  // Regulatory Configuration Handlers
  const handleRegulatorySubmit = async (e) => {
    e.preventDefault();
    const url = editingId 
      ? `${API_BASE}/regulatory-configurations.php?id=${editingId}`
      : `${API_BASE}/regulatory-configurations.php`;
    
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(regulatoryForm)
      });

      const result = await response.json();
      
      if (response.ok) {
        fetchRegulatoryConfigs();
        resetRegulatoryForm();
        alert(editingId ? 'Regulatory configuration updated successfully!' : 'Regulatory configuration created successfully!');
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving regulatory configuration:', error);
      alert('Error saving regulatory configuration');
    }
  };

  const handleRegulatoryEdit = (config) => {
    setRegulatoryForm({
      fee_name: config.fee_name,
      business_type: config.business_type || '',
      amount: config.amount,
      effective_date: config.effective_date,
      expiration_date: config.expiration_date || '',
      remarks: config.remarks || ''
    });
    setEditingId(config.id);
    setEditingType('regulatory');
  };

  // Common Handlers
  const handleDelete = async (id, type) => {
    const typeName = type === 'business' ? 'business configuration' : 'regulatory configuration';
    if (window.confirm(`Are you sure you want to delete this ${typeName}?`)) {
      try {
        const endpoint = type === 'business' ? 'business-configurations' : 'regulatory-configurations';
        const response = await fetch(`${API_BASE}/${endpoint}.php?id=${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          if (type === 'business') {
            fetchBusinessConfigs();
          } else {
            fetchRegulatoryConfigs();
          }
          alert(`${typeName} deleted successfully!`);
        }
      } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        alert('Error deleting configuration');
      }
    }
  };

  const handleExpire = async (id, type) => {
    const typeName = type === 'business' ? 'business configuration' : 'regulatory configuration';
    if (window.confirm(`Are you sure you want to expire this ${typeName}?`)) {
      try {
        const endpoint = type === 'business' ? 'business-configurations' : 'regulatory-configurations';
        const response = await fetch(`${API_BASE}/${endpoint}.php?id=${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            expiration_date: new Date().toISOString().split('T')[0]
          })
        });

        if (response.ok) {
          if (type === 'business') {
            fetchBusinessConfigs();
          } else {
            fetchRegulatoryConfigs();
          }
          alert(`${typeName} expired successfully!`);
        }
      } catch (error) {
        console.error(`Error expiring ${type}:`, error);
        alert('Error expiring configuration');
      }
    }
  };

  // Form Resets
  const resetBusinessForm = () => {
    setBusinessForm({
      business_type: '',
      tax_base: 'gross_sales',
      first_year_base: 'capital_investment',
      min_range: '',
      max_range: '',
      tax_rate: '',
      effective_date: new Date().toISOString().split('T')[0],
      expiration_date: '',
      remarks: ''
    });
    setEditingId(null);
    setEditingType(null);
  };

  const resetRegulatoryForm = () => {
    setRegulatoryForm({
      fee_name: '',
      business_type: '',
      amount: '',
      effective_date: new Date().toISOString().split('T')[0],
      expiration_date: '',
      remarks: ''
    });
    setEditingId(null);
    setEditingType(null);
  };

  // Statistics
  const activeBusinessConfigs = businessConfigs.filter(config => !config.expiration_date || new Date(config.expiration_date) > new Date()).length;
  const expiredBusinessConfigs = businessConfigs.filter(config => config.expiration_date && new Date(config.expiration_date) <= new Date()).length;
  const activeRegulatoryConfigs = regulatoryConfigs.filter(config => !config.expiration_date || new Date(config.expiration_date) > new Date()).length;
  const expiredRegulatoryConfigs = regulatoryConfigs.filter(config => config.expiration_date && new Date(config.expiration_date) <= new Date()).length;

  // Calculate Tax Amount
  const calculateTaxAmount = () => {
    const baseAmount = parseFloat(businessForm.min_range) || 0;
    const taxRate = parseFloat(businessForm.tax_rate) || 0;
    return (baseAmount * (taxRate / 100)).toFixed(2);
  };

  return (
    <div className='mx-1 mt-1 p-6 dark:bg-slate-900 bg-white dark:text-slate-300 rounded-lg'>
      <h1 className="text-2xl font-bold mb-6">Business Tax Configuration</h1>
      
      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-red-600 font-medium">Error:</div>
            <div className="ml-2 text-red-700">{error}</div>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('business')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'business'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Business Configurations
          </button>
          <button
            onClick={() => setActiveTab('regulatory')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'regulatory'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Regulatory Configurations
          </button>
        </nav>
      </div>

      {/* Date Filter */}
      <div className="mb-6 p-4 border rounded-lg dark:border-slate-700">
        <label className="block text-sm font-medium mb-2">View Configurations Effective On:</label>
        <input
          type="date"
          value={currentDate}
          onChange={(e) => setCurrentDate(e.target.value)}
          className="p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
        />
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Showing configurations effective on or before {currentDate}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 dark:text-blue-300">Business Configs</h3>
          <p className="text-2xl font-bold">{businessConfigs.length}</p>
          <p className="text-sm">Active: {activeBusinessConfigs} | Expired: {expiredBusinessConfigs}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800 dark:text-green-300">Regulatory Configs</h3>
          <p className="text-2xl font-bold">{regulatoryConfigs.length}</p>
          <p className="text-sm">Active: {activeRegulatoryConfigs} | Expired: {expiredRegulatoryConfigs}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800 dark:text-purple-300">Total Active</h3>
          <p className="text-2xl font-bold">{activeBusinessConfigs + activeRegulatoryConfigs}</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-orange-800 dark:text-orange-300">Total Configs</h3>
          <p className="text-2xl font-bold">{businessConfigs.length + regulatoryConfigs.length}</p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading configurations...</p>
        </div>
      )}

      {/* Business Configuration Tab */}
      {activeTab === 'business' && !loading && (
        <>
          {/* Business Configuration Form */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingType === 'business' ? 'Edit Business Configuration' : 'Add New Business Configuration'}
            </h2>
            <form onSubmit={handleBusinessSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Business Type *</label>
                <input
                  type="text"
                  value={businessForm.business_type}
                  onChange={(e) => setBusinessForm({...businessForm, business_type: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="e.g., Retail, Manufacturing, Service"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tax Base *</label>
                <select
                  value={businessForm.tax_base}
                  onChange={(e) => setBusinessForm({...businessForm, tax_base: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  required
                >
                  <option value="gross_sales">Gross Sales</option>
                  <option value="gross_receipts">Gross Receipts</option>
                  <option value="capital_investment">Capital Investment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">First Year Base *</label>
                <select
                  value={businessForm.first_year_base}
                  onChange={(e) => setBusinessForm({...businessForm, first_year_base: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  required
                >
                  <option value="capital_investment">Capital Investment</option>
                  <option value="gross_sales">Gross Sales</option>
                  <option value="gross_receipts">Gross Receipts</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Minimum Range *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={businessForm.min_range}
                  onChange={(e) => setBusinessForm({...businessForm, min_range: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Maximum Range *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={businessForm.max_range}
                  onChange={(e) => setBusinessForm({...businessForm, max_range: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tax Rate (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={businessForm.tax_rate}
                  onChange={(e) => setBusinessForm({...businessForm, tax_rate: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Effective Date *</label>
                <input
                  type="date"
                  value={businessForm.effective_date}
                  onChange={(e) => setBusinessForm({...businessForm, effective_date: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Expiration Date</label>
                <input
                  type="date"
                  value={businessForm.expiration_date}
                  onChange={(e) => setBusinessForm({...businessForm, expiration_date: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty if no expiration</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Remarks</label>
                <textarea
                  value={businessForm.remarks}
                  onChange={(e) => setBusinessForm({...businessForm, remarks: e.target.value})}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="Additional notes about this business configuration..."
                />
              </div>

              {/* Tax Calculation Preview */}
              {businessForm.min_range && businessForm.tax_rate && (
                <div className="md:col-span-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Tax Calculation Preview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Range:</span>
                      <div className="text-lg">
                        ₱{parseFloat(businessForm.min_range).toLocaleString()} - ₱{parseFloat(businessForm.max_range).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Tax Rate:</span>
                      <div className="text-lg">{businessForm.tax_rate}%</div>
                    </div>
                    <div>
                      <span className="font-medium">Tax Amount (Min):</span>
                      <div className="text-lg">₱{calculateTaxAmount()}</div>
                    </div>
                    <div>
                      <span className="font-medium">Tax Base:</span>
                      <div className="text-lg capitalize">{businessForm.tax_base.replace('_', ' ')}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="md:col-span-2 flex gap-4 mt-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  {editingType === 'business' ? 'Update Business Configuration' : 'Create Business Configuration'}
                </button>
                <button
                  type="button"
                  onClick={resetBusinessForm}
                  className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Business Configurations List */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Business Configurations ({businessConfigs.length})
            </h2>
            
            {businessConfigs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No business configurations found for the selected date.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 dark:border-slate-700">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-slate-800">
                      <th className="border p-2 text-left">Business Type</th>
                      <th className="border p-2 text-left">Tax Base</th>
                      <th className="border p-2 text-left">First Year Base</th>
                      <th className="border p-2 text-left">Range</th>
                      <th className="border p-2 text-left">Tax Rate</th>
                      <th className="border p-2 text-left">Effective Date</th>
                      <th className="border p-2 text-left">Expiration Date</th>
                      <th className="border p-2 text-left">Status</th>
                      <th className="border p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businessConfigs.map((config) => {
                      const isExpired = config.expiration_date && new Date(config.expiration_date) <= new Date();
                      return (
                        <tr 
                          key={config.id} 
                          className={`hover:bg-gray-50 dark:hover:bg-slate-800 ${
                            isExpired ? 'bg-gray-50 dark:bg-slate-800/50 text-gray-500' : ''
                          }`}
                        >
                          <td className="border p-2">
                            <div className="font-medium">{config.business_type}</div>
                            {config.remarks && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {config.remarks.length > 50 
                                  ? `${config.remarks.substring(0, 50)}...` 
                                  : config.remarks
                                }
                              </div>
                            )}
                          </td>
                          <td className="border p-2 capitalize">{config.tax_base.replace('_', ' ')}</td>
                          <td className="border p-2 capitalize">{config.first_year_base.replace('_', ' ')}</td>
                          <td className="border p-2">
                            ₱{parseFloat(config.min_range).toLocaleString()} - ₱{parseFloat(config.max_range).toLocaleString()}
                          </td>
                          <td className="border p-2">{config.tax_rate}%</td>
                          <td className="border p-2">{config.effective_date}</td>
                          <td className="border p-2">{config.expiration_date || '-'}</td>
                          <td className="border p-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              !isExpired 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {isExpired ? 'Expired' : 'Active'}
                            </span>
                          </td>
                          <td className="border p-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleBusinessEdit(config)}
                                className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors"
                                disabled={isExpired}
                              >
                                Edit
                              </button>
                              {!isExpired && (
                                <button
                                  onClick={() => handleExpire(config.id, 'business')}
                                  className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 transition-colors"
                                >
                                  Expire
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(config.id, 'business')}
                                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Regulatory Configuration Tab */}
      {activeTab === 'regulatory' && !loading && (
        <>
          {/* Regulatory Configuration Form */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingType === 'regulatory' ? 'Edit Regulatory Configuration' : 'Add New Regulatory Configuration'}
            </h2>
            <form onSubmit={handleRegulatorySubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Fee Name *</label>
                <input
                  type="text"
                  value={regulatoryForm.fee_name}
                  onChange={(e) => setRegulatoryForm({...regulatoryForm, fee_name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="e.g., Mayor's Permit Fee, Sanitary Fee, Signage Fee"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Business Type</label>
                <input
                  type="text"
                  value={regulatoryForm.business_type}
                  onChange={(e) => setRegulatoryForm({...regulatoryForm, business_type: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="e.g., All, Food Establishment, Retail Store"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty if applicable to all businesses</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={regulatoryForm.amount}
                  onChange={(e) => setRegulatoryForm({...regulatoryForm, amount: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Effective Date *</label>
                <input
                  type="date"
                  value={regulatoryForm.effective_date}
                  onChange={(e) => setRegulatoryForm({...regulatoryForm, effective_date: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Expiration Date</label>
                <input
                  type="date"
                  value={regulatoryForm.expiration_date}
                  onChange={(e) => setRegulatoryForm({...regulatoryForm, expiration_date: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty if no expiration</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Remarks</label>
                <textarea
                  value={regulatoryForm.remarks}
                  onChange={(e) => setRegulatoryForm({...regulatoryForm, remarks: e.target.value})}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="Additional details about this regulatory fee..."
                />
              </div>

              {/* Fee Preview */}
              {regulatoryForm.amount && (
                <div className="md:col-span-2 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Fee Preview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Fee Type:</span>
                      <div className="text-lg">{regulatoryForm.fee_name}</div>
                    </div>
                    <div>
                      <span className="font-medium">Applicable To:</span>
                      <div className="text-lg">{regulatoryForm.business_type || 'All Businesses'}</div>
                    </div>
                    <div>
                      <span className="font-medium">Amount:</span>
                      <div className="text-lg">₱{parseFloat(regulatoryForm.amount).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="md:col-span-2 flex gap-4 mt-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  {editingType === 'regulatory' ? 'Update Regulatory Configuration' : 'Create Regulatory Configuration'}
                </button>
                <button
                  type="button"
                  onClick={resetRegulatoryForm}
                  className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Regulatory Configurations List */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Regulatory Configurations ({regulatoryConfigs.length})
            </h2>
            
            {regulatoryConfigs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No regulatory configurations found for the selected date.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 dark:border-slate-700">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-slate-800">
                      <th className="border p-2 text-left">Fee Name</th>
                      <th className="border p-2 text-left">Business Type</th>
                      <th className="border p-2 text-left">Amount</th>
                      <th className="border p-2 text-left">Effective Date</th>
                      <th className="border p-2 text-left">Expiration Date</th>
                      <th className="border p-2 text-left">Status</th>
                      <th className="border p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regulatoryConfigs.map((config) => {
                      const isExpired = config.expiration_date && new Date(config.expiration_date) <= new Date();
                      return (
                        <tr 
                          key={config.id} 
                          className={`hover:bg-gray-50 dark:hover:bg-slate-800 ${
                            isExpired ? 'bg-gray-50 dark:bg-slate-800/50 text-gray-500' : ''
                          }`}
                        >
                          <td className="border p-2">
                            <div className="font-medium">{config.fee_name}</div>
                            {config.remarks && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {config.remarks.length > 50 
                                  ? `${config.remarks.substring(0, 50)}...` 
                                  : config.remarks
                                }
                              </div>
                            )}
                          </td>
                          <td className="border p-2">{config.business_type || 'All'}</td>
                          <td className="border p-2">₱{parseFloat(config.amount).toLocaleString()}</td>
                          <td className="border p-2">{config.effective_date}</td>
                          <td className="border p-2">{config.expiration_date || '-'}</td>
                          <td className="border p-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              !isExpired 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {isExpired ? 'Expired' : 'Active'}
                            </span>
                          </td>
                          <td className="border p-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRegulatoryEdit(config)}
                                className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors"
                                disabled={isExpired}
                              >
                                Edit
                              </button>
                              {!isExpired && (
                                <button
                                  onClick={() => handleExpire(config.id, 'regulatory')}
                                  className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 transition-colors"
                                >
                                  Expire
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(config.id, 'regulatory')}
                                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}