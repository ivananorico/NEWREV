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

  // Penalty Configuration State (Simplified - following RPT pattern)
  const [penaltyConfigs, setPenaltyConfigs] = useState([]);
  const [penaltyForm, setPenaltyForm] = useState({
    penalty_percent: '',
    effective_date: new Date().toISOString().split('T')[0],
    expiration_date: '',
    remarks: ''
  });

  // Discount Configuration State (Simplified - following RPT pattern)
  const [discountConfigs, setDiscountConfigs] = useState([]);
  const [discountForm, setDiscountForm] = useState({
    discount_percent: '',
    effective_date: new Date().toISOString().split('T')[0],
    expiration_date: '',
    remarks: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [editingType, setEditingType] = useState(null);

  const API_BASE = "http://localhost/revenue/backend/Business/BusinessTaxConfig";

  // Fetch all configurations
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

  const fetchRegulatoryConfigs = async () => {
    try {
      const response = await fetch(`${API_BASE}/regulatory-configurations.php?current_date=${currentDate}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setRegulatoryConfigs(data);
    } catch (error) {
      console.error('Error fetching regulatory configurations:', error);
    }
  };

  const fetchPenaltyConfigs = async () => {
    try {
      const response = await fetch(`${API_BASE}/penalty-configurations.php?current_date=${currentDate}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setPenaltyConfigs(data);
    } catch (error) {
      console.error('Error fetching penalty configurations:', error);
    }
  };

  const fetchDiscountConfigs = async () => {
    try {
      const response = await fetch(`${API_BASE}/discount-configurations.php?current_date=${currentDate}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setDiscountConfigs(data);
    } catch (error) {
      console.error('Error fetching discount configurations:', error);
    }
  };

  useEffect(() => {
    fetchBusinessConfigs();
    fetchRegulatoryConfigs();
    fetchPenaltyConfigs();
    fetchDiscountConfigs();
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
      business_type: config.business_type || '',
      tax_rate: config.tax_rate || '',
      effective_date: config.effective_date || new Date().toISOString().split('T')[0],
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
      fee_name: config.fee_name || '',
      business_type: config.business_type || '',
      amount: config.amount || '',
      effective_date: config.effective_date || new Date().toISOString().split('T')[0],
      expiration_date: config.expiration_date || '',
      remarks: config.remarks || ''
    });
    setEditingId(config.id);
    setEditingType('regulatory');
  };

  // Penalty Configuration Handlers
  const handlePenaltySubmit = async (e) => {
    e.preventDefault();
    const url = editingId 
      ? `${API_BASE}/penalty-configurations.php?id=${editingId}`
      : `${API_BASE}/penalty-configurations.php`;
    
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(penaltyForm)
      });

      const result = await response.json();
      
      if (response.ok) {
        fetchPenaltyConfigs();
        resetPenaltyForm();
        alert(editingId ? 'Penalty configuration updated successfully!' : 'Penalty configuration created successfully!');
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving penalty configuration:', error);
      alert('Error saving penalty configuration');
    }
  };

  const handlePenaltyEdit = (config) => {
    setPenaltyForm({
      penalty_percent: config.penalty_percent || '',
      effective_date: config.effective_date || new Date().toISOString().split('T')[0],
      expiration_date: config.expiration_date || '',
      remarks: config.remarks || ''
    });
    setEditingId(config.id);
    setEditingType('penalty');
  };

  // Discount Configuration Handlers
  const handleDiscountSubmit = async (e) => {
    e.preventDefault();
    const url = editingId 
      ? `${API_BASE}/discount-configurations.php?id=${editingId}`
      : `${API_BASE}/discount-configurations.php`;
    
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discountForm)
      });

      const result = await response.json();
      
      if (response.ok) {
        fetchDiscountConfigs();
        resetDiscountForm();
        alert(editingId ? 'Discount configuration updated successfully!' : 'Discount configuration created successfully!');
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving discount configuration:', error);
      alert('Error saving discount configuration');
    }
  };

  const handleDiscountEdit = (config) => {
    setDiscountForm({
      discount_percent: config.discount_percent || '',
      effective_date: config.effective_date || new Date().toISOString().split('T')[0],
      expiration_date: config.expiration_date || '',
      remarks: config.remarks || ''
    });
    setEditingId(config.id);
    setEditingType('discount');
  };

  // Common Handlers
  const handleDelete = async (id, type) => {
    const typeName = type === 'business' ? 'business configuration' : 
                    type === 'regulatory' ? 'regulatory configuration' :
                    type === 'penalty' ? 'penalty configuration' : 'discount configuration';
    
    if (window.confirm(`Are you sure you want to delete this ${typeName}?`)) {
      try {
        const endpoint = `${type}-configurations`;
        const response = await fetch(`${API_BASE}/${endpoint}.php?id=${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          switch (type) {
            case 'business':
              fetchBusinessConfigs();
              break;
            case 'regulatory':
              fetchRegulatoryConfigs();
              break;
            case 'penalty':
              fetchPenaltyConfigs();
              break;
            case 'discount':
              fetchDiscountConfigs();
              break;
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
    const typeName = type === 'business' ? 'business configuration' : 
                    type === 'regulatory' ? 'regulatory configuration' :
                    type === 'penalty' ? 'penalty configuration' : 'discount configuration';
    
    if (window.confirm(`Are you sure you want to expire this ${typeName}?`)) {
      try {
        const endpoint = `${type}-configurations`;
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
          switch (type) {
            case 'business':
              fetchBusinessConfigs();
              break;
            case 'regulatory':
              fetchRegulatoryConfigs();
              break;
            case 'penalty':
              fetchPenaltyConfigs();
              break;
            case 'discount':
              fetchDiscountConfigs();
              break;
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

  const resetPenaltyForm = () => {
    setPenaltyForm({
      penalty_percent: '',
      effective_date: new Date().toISOString().split('T')[0],
      expiration_date: '',
      remarks: ''
    });
    setEditingId(null);
    setEditingType(null);
  };

  const resetDiscountForm = () => {
    setDiscountForm({
      discount_percent: '',
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
  const activePenaltyConfigs = penaltyConfigs.filter(config => !config.expiration_date || new Date(config.expiration_date) > new Date()).length;
  const expiredPenaltyConfigs = penaltyConfigs.filter(config => config.expiration_date && new Date(config.expiration_date) <= new Date()).length;
  const activeDiscountConfigs = discountConfigs.filter(config => !config.expiration_date || new Date(config.expiration_date) > new Date()).length;
  const expiredDiscountConfigs = discountConfigs.filter(config => config.expiration_date && new Date(config.expiration_date) <= new Date()).length;

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
          {['business', 'regulatory', 'penalty', 'discount'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {tab === 'business' ? 'Business Tax' : 
               tab === 'regulatory' ? 'Regulatory Fees' :
               tab === 'penalty' ? 'Penalties' : 'Discounts'}
            </button>
          ))}
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
          <h3 className="font-semibold text-blue-800 dark:text-blue-300">Business Tax</h3>
          <p className="text-2xl font-bold">{businessConfigs.length}</p>
          <p className="text-sm">Active: {activeBusinessConfigs} | Expired: {expiredBusinessConfigs}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800 dark:text-green-300">Regulatory Fees</h3>
          <p className="text-2xl font-bold">{regulatoryConfigs.length}</p>
          <p className="text-sm">Active: {activeRegulatoryConfigs} | Expired: {expiredRegulatoryConfigs}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-red-800 dark:text-red-300">Penalties</h3>
          <p className="text-2xl font-bold">{penaltyConfigs.length}</p>
          <p className="text-sm">Active: {activePenaltyConfigs} | Expired: {expiredPenaltyConfigs}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800 dark:text-purple-300">Discounts</h3>
          <p className="text-2xl font-bold">{discountConfigs.length}</p>
          <p className="text-sm">Active: {activeDiscountConfigs} | Expired: {expiredDiscountConfigs}</p>
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
              {editingType === 'business' ? 'Edit Business Tax Configuration' : 'Add New Business Tax Configuration'}
            </h2>
            <form onSubmit={handleBusinessSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Business Type *</label>
                <input
                  type="text"
                  value={businessForm.business_type}
                  onChange={(e) => setBusinessForm({...businessForm, business_type: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="e.g., Retailer, Wholesaler, Service Provider"
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
                  placeholder="Additional notes about this business tax configuration..."
                />
              </div>

              {/* Tax Preview */}
              {businessForm.tax_rate && (
                <div className="md:col-span-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Tax Rate Preview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Business Type:</span>
                      <div className="text-lg">{businessForm.business_type || 'Not specified'}</div>
                    </div>
                    <div>
                      <span className="font-medium">Tax Rate:</span>
                      <div className="text-lg">{businessForm.tax_rate}%</div>
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
                  {editingType === 'business' ? 'Update Business Tax' : 'Create Business Tax'}
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
              Business Tax Configurations ({businessConfigs.length})
            </h2>
            
            {businessConfigs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No business tax configurations found for the selected date.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 dark:border-slate-700">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-slate-800">
                      <th className="border p-2 text-left">Business Type</th>
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
                                {config.remarks}
                              </div>
                            )}
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
              {editingType === 'regulatory' ? 'Edit Regulatory Fee Configuration' : 'Add New Regulatory Fee Configuration'}
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
                  {editingType === 'regulatory' ? 'Update Regulatory Fee' : 'Create Regulatory Fee'}
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
              Regulatory Fee Configurations ({regulatoryConfigs.length})
            </h2>
            
            {regulatoryConfigs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No regulatory fee configurations found for the selected date.
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
                                {config.remarks}
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

      {/* Penalty Configuration Tab */}
      {activeTab === 'penalty' && !loading && (
        <>
          {/* Penalty Configuration Form */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingType === 'penalty' ? 'Edit Penalty Configuration' : 'Add New Penalty Configuration'}
            </h2>
            <form onSubmit={handlePenaltySubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Penalty Percentage (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={penaltyForm.penalty_percent}
                  onChange={(e) => setPenaltyForm({...penaltyForm, penalty_percent: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Effective Date *</label>
                <input
                  type="date"
                  value={penaltyForm.effective_date}
                  onChange={(e) => setPenaltyForm({...penaltyForm, effective_date: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Expiration Date</label>
                <input
                  type="date"
                  value={penaltyForm.expiration_date}
                  onChange={(e) => setPenaltyForm({...penaltyForm, expiration_date: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty if no expiration</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Remarks</label>
                <textarea
                  value={penaltyForm.remarks}
                  onChange={(e) => setPenaltyForm({...penaltyForm, remarks: e.target.value})}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="Additional details about this penalty (e.g., Late payment penalty, Underpayment penalty...)"
                />
              </div>

              {/* Penalty Preview */}
              {penaltyForm.penalty_percent && (
                <div className="md:col-span-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Penalty Preview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Penalty Rate:</span>
                      <div className="text-lg">{penaltyForm.penalty_percent}%</div>
                    </div>
                    <div>
                      <span className="font-medium">Example (₱1,000 base):</span>
                      <div className="text-lg">₱{(1000 * (parseFloat(penaltyForm.penalty_percent) / 100)).toFixed(2)}</div>
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
                  {editingType === 'penalty' ? 'Update Penalty' : 'Create Penalty'}
                </button>
                <button
                  type="button"
                  onClick={resetPenaltyForm}
                  className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Penalty Configurations List */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Penalty Configurations ({penaltyConfigs.length})
            </h2>
            
            {penaltyConfigs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No penalty configurations found for the selected date.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 dark:border-slate-700">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-slate-800">
                      <th className="border p-2 text-left">Penalty Rate</th>
                      <th className="border p-2 text-left">Effective Date</th>
                      <th className="border p-2 text-left">Expiration Date</th>
                      <th className="border p-2 text-left">Status</th>
                      <th className="border p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {penaltyConfigs.map((config) => {
                      const isExpired = config.expiration_date && new Date(config.expiration_date) <= new Date();
                      return (
                        <tr 
                          key={config.id} 
                          className={`hover:bg-gray-50 dark:hover:bg-slate-800 ${
                            isExpired ? 'bg-gray-50 dark:bg-slate-800/50 text-gray-500' : ''
                          }`}
                        >
                          <td className="border p-2">
                            <div className="font-medium">{config.penalty_percent}%</div>
                            {config.remarks && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {config.remarks}
                              </div>
                            )}
                          </td>
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
                                onClick={() => handlePenaltyEdit(config)}
                                className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors"
                                disabled={isExpired}
                              >
                                Edit
                              </button>
                              {!isExpired && (
                                <button
                                  onClick={() => handleExpire(config.id, 'penalty')}
                                  className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 transition-colors"
                                >
                                  Expire
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(config.id, 'penalty')}
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

      {/* Discount Configuration Tab */}
      {activeTab === 'discount' && !loading && (
        <>
          {/* Discount Configuration Form */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingType === 'discount' ? 'Edit Discount Configuration' : 'Add New Discount Configuration'}
            </h2>
            <form onSubmit={handleDiscountSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Discount Percentage (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={discountForm.discount_percent}
                  onChange={(e) => setDiscountForm({...discountForm, discount_percent: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Effective Date *</label>
                <input
                  type="date"
                  value={discountForm.effective_date}
                  onChange={(e) => setDiscountForm({...discountForm, effective_date: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Expiration Date</label>
                <input
                  type="date"
                  value={discountForm.expiration_date}
                  onChange={(e) => setDiscountForm({...discountForm, expiration_date: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty if no expiration</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Remarks</label>
                <textarea
                  value={discountForm.remarks}
                  onChange={(e) => setDiscountForm({...discountForm, remarks: e.target.value})}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="Additional details about this discount (e.g., Early payment discount, Senior citizen discount...)"
                />
              </div>

              {/* Discount Preview */}
              {discountForm.discount_percent && (
                <div className="md:col-span-2 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Discount Preview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Discount Rate:</span>
                      <div className="text-lg">{discountForm.discount_percent}%</div>
                    </div>
                    <div>
                      <span className="font-medium">Example (₱1,000 base):</span>
                      <div className="text-lg">₱{(1000 * (parseFloat(discountForm.discount_percent) / 100)).toFixed(2)}</div>
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
                  {editingType === 'discount' ? 'Update Discount' : 'Create Discount'}
                </button>
                <button
                  type="button"
                  onClick={resetDiscountForm}
                  className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Discount Configurations List */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Discount Configurations ({discountConfigs.length})
            </h2>
            
            {discountConfigs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No discount configurations found for the selected date.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 dark:border-slate-700">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-slate-800">
                      <th className="border p-2 text-left">Discount Rate</th>
                      <th className="border p-2 text-left">Effective Date</th>
                      <th className="border p-2 text-left">Expiration Date</th>
                      <th className="border p-2 text-left">Status</th>
                      <th className="border p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discountConfigs.map((config) => {
                      const isExpired = config.expiration_date && new Date(config.expiration_date) <= new Date();
                      return (
                        <tr 
                          key={config.id} 
                          className={`hover:bg-gray-50 dark:hover:bg-slate-800 ${
                            isExpired ? 'bg-gray-50 dark:bg-slate-800/50 text-gray-500' : ''
                          }`}
                        >
                          <td className="border p-2">
                            <div className="font-medium">{config.discount_percent}%</div>
                            {config.remarks && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {config.remarks}
                              </div>
                            )}
                          </td>
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
                                onClick={() => handleDiscountEdit(config)}
                                className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors"
                                disabled={isExpired}
                              >
                                Edit
                              </button>
                              {!isExpired && (
                                <button
                                  onClick={() => handleExpire(config.id, 'discount')}
                                  className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 transition-colors"
                                >
                                  Expire
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(config.id, 'discount')}
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