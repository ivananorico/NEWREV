import { useState, useEffect } from 'react';

export default function RPTConfig() {
  const [activeTab, setActiveTab] = useState('land');
  const [landConfigurations, setLandConfigurations] = useState([]);
  const [propertyConfigurations, setPropertyConfigurations] = useState([]);
  const [taxConfigurations, setTaxConfigurations] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Land Configuration Form
  const [landFormData, setLandFormData] = useState({
    classification: '',
    market_value: '',
    assessment_level: '',
    description: '',
    effective_date: '',
    expiration_date: '',
    status: 'active',
    vicinity: 'General Area'
  });

  // Property Configuration Form
  const [propertyFormData, setPropertyFormData] = useState({
    classification: '',
    material_type: '',
    unit_cost: '',
    depreciation_rate: '',
    min_value: '',
    max_value: '',
    level_percent: '',
    effective_date: '',
    expiration_date: '',
    status: 'active'
  });

  // Tax Configuration Form
  const [taxFormData, setTaxFormData] = useState({
    tax_name: '',
    tax_percent: '',
    effective_date: '',
    expiration_date: '',
    status: 'active'
  });

  const [editingId, setEditingId] = useState(null);
  const [editingType, setEditingType] = useState(null);

  const API_BASE = "http://localhost/revenue/backend/RPT/RPTConfig";

  // Fetch all data
  const fetchLandConfigurations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/land-configurations.php?current_date=${currentDate}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLandConfigurations(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching land configurations:', error);
      setError('Failed to load land configurations: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPropertyConfigurations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/property-configurations.php?current_date=${currentDate}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPropertyConfigurations(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching property configurations:', error);
      setError('Failed to load property configurations: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTaxConfigurations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/tax-configurations.php?current_date=${currentDate}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTaxConfigurations(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching tax configurations:', error);
      setError('Failed to load tax configurations: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLandConfigurations();
    fetchPropertyConfigurations();
    fetchTaxConfigurations();
  }, [currentDate]);

  // Land Configuration Handlers
  const handleLandSubmit = async (e) => {
    e.preventDefault();
    const url = editingId 
      ? `${API_BASE}/land-configurations.php?id=${editingId}`
      : `${API_BASE}/land-configurations.php`;
    
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(landFormData)
      });

      const result = await response.json();
      
      if (response.ok) {
        fetchLandConfigurations();
        resetLandForm();
        alert(editingId ? 'Land configuration updated successfully!' : 'Land configuration created successfully!');
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving land configuration:', error);
      alert('Error saving land configuration');
    }
  };

  const handleLandEdit = (config) => {
    setLandFormData({
      classification: config.classification,
      market_value: config.market_value,
      assessment_level: config.assessment_level,
      description: config.description,
      effective_date: config.effective_date,
      expiration_date: config.expiration_date || '',
      status: config.status,
      vicinity: config.vicinity || 'General Area'
    });
    setEditingId(config.id);
    setEditingType('land');
  };

  // Property Configuration Handlers
  const handlePropertySubmit = async (e) => {
    e.preventDefault();
    const url = editingId 
      ? `${API_BASE}/property-configurations.php?id=${editingId}`
      : `${API_BASE}/property-configurations.php`;
    
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(propertyFormData)
      });

      const result = await response.json();
      
      if (response.ok) {
        fetchPropertyConfigurations();
        resetPropertyForm();
        alert(editingId ? 'Property configuration updated successfully!' : 'Property configuration created successfully!');
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving property configuration:', error);
      alert('Error saving property configuration');
    }
  };

  const handlePropertyEdit = (config) => {
    setPropertyFormData({
      classification: config.classification,
      material_type: config.material_type,
      unit_cost: config.unit_cost,
      depreciation_rate: config.depreciation_rate,
      min_value: config.min_value,
      max_value: config.max_value,
      level_percent: config.level_percent,
      effective_date: config.effective_date,
      expiration_date: config.expiration_date || '',
      status: config.status
    });
    setEditingId(config.id);
    setEditingType('property');
  };

  // Tax Configuration Handlers
  const handleTaxSubmit = async (e) => {
    e.preventDefault();
    const url = editingId 
      ? `${API_BASE}/tax-configurations.php?id=${editingId}`
      : `${API_BASE}/tax-configurations.php`;
    
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taxFormData)
      });

      const result = await response.json();
      
      if (response.ok) {
        fetchTaxConfigurations();
        resetTaxForm();
        alert(editingId ? 'Tax configuration updated successfully!' : 'Tax configuration created successfully!');
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving tax configuration:', error);
      alert('Error saving tax configuration');
    }
  };

  const handleTaxEdit = (config) => {
    setTaxFormData({
      tax_name: config.tax_name,
      tax_percent: config.tax_percent,
      effective_date: config.effective_date,
      expiration_date: config.expiration_date || '',
      status: config.status
    });
    setEditingId(config.id);
    setEditingType('tax');
  };

  // Common Handlers
  const handleDelete = async (id, type) => {
    const typeName = type.replace('-configurations', '').replace('-', ' ');
    if (window.confirm(`Are you sure you want to delete this ${typeName} configuration?`)) {
      try {
        const response = await fetch(`${API_BASE}/${type}.php?id=${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          if (type === 'land-configurations') {
            fetchLandConfigurations();
          } else if (type === 'property-configurations') {
            fetchPropertyConfigurations();
          } else if (type === 'tax-configurations') {
            fetchTaxConfigurations();
          }
          alert(`${typeName} configuration deleted successfully!`);
        }
      } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        alert('Error deleting configuration');
      }
    }
  };

  const handleExpire = async (id, type) => {
    const typeName = type.replace('-configurations', '').replace('-', ' ');
    if (window.confirm(`Are you sure you want to expire this ${typeName}?`)) {
      try {
        const response = await fetch(`${API_BASE}/${type}.php?id=${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            status: 'expired',
            expiration_date: new Date().toISOString().split('T')[0]
          })
        });

        if (response.ok) {
          if (type === 'land-configurations') {
            fetchLandConfigurations();
          } else if (type === 'property-configurations') {
            fetchPropertyConfigurations();
          } else if (type === 'tax-configurations') {
            fetchTaxConfigurations();
          }
          alert(`${typeName} configuration expired successfully!`);
        }
      } catch (error) {
        console.error(`Error expiring ${type}:`, error);
        alert('Error expiring configuration');
      }
    }
  };

  const resetLandForm = () => {
    setLandFormData({
      classification: '',
      market_value: '',
      assessment_level: '',
      description: '',
      effective_date: '',
      expiration_date: '',
      status: 'active',
      vicinity: 'General Area'
    });
    setEditingId(null);
    setEditingType(null);
  };

  const resetPropertyForm = () => {
    setPropertyFormData({
      classification: '',
      material_type: '',
      unit_cost: '',
      depreciation_rate: '',
      min_value: '',
      max_value: '',
      level_percent: '',
      effective_date: '',
      expiration_date: '',
      status: 'active'
    });
    setEditingId(null);
    setEditingType(null);
  };

  const resetTaxForm = () => {
    setTaxFormData({
      tax_name: '',
      tax_percent: '',
      effective_date: '',
      expiration_date: '',
      status: 'active'
    });
    setEditingId(null);
    setEditingType(null);
  };

  // Calculations
  const calculateLandAssessedValue = () => {
    const marketValue = parseFloat(landFormData.market_value) || 0;
    const assessmentLevel = parseFloat(landFormData.assessment_level) || 0;
    return (marketValue * (assessmentLevel / 100)).toFixed(2);
  };

  // Statistics
  const activeLandConfigs = landConfigurations.filter(config => config.status === 'active').length;
  const expiredLandConfigs = landConfigurations.filter(config => config.status === 'expired').length;
  const activePropertyConfigs = propertyConfigurations.filter(config => config.status === 'active').length;
  const expiredPropertyConfigs = propertyConfigurations.filter(config => config.status === 'expired').length;
  const activeTaxConfigs = taxConfigurations.filter(config => config.status === 'active').length;
  const expiredTaxConfigs = taxConfigurations.filter(config => config.status === 'expired').length;

  return (
    <div className='mx-1 mt-1 p-6 dark:bg-slate-900 bg-white dark:text-slate-300 rounded-lg'>
      <h1 className="text-2xl font-bold mb-6">Real Property Tax Configuration</h1>
      
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
            onClick={() => setActiveTab('land')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'land'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Land Configurations
          </button>
          <button
            onClick={() => setActiveTab('property')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'property'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Property Configurations
          </button>
          <button
            onClick={() => setActiveTab('tax')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tax'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Tax Configurations
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
          <h3 className="font-semibold text-blue-800 dark:text-blue-300">Land Configs</h3>
          <p className="text-2xl font-bold">{landConfigurations.length}</p>
          <p className="text-sm">Active: {activeLandConfigs} | Expired: {expiredLandConfigs}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800 dark:text-green-300">Property Configs</h3>
          <p className="text-2xl font-bold">{propertyConfigurations.length}</p>
          <p className="text-sm">Active: {activePropertyConfigs} | Expired: {expiredPropertyConfigs}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800 dark:text-purple-300">Tax Configs</h3>
          <p className="text-2xl font-bold">{taxConfigurations.length}</p>
          <p className="text-sm">Active: {activeTaxConfigs} | Expired: {expiredTaxConfigs}</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-orange-800 dark:text-orange-300">Active Total</h3>
          <p className="text-2xl font-bold">{activeLandConfigs + activePropertyConfigs + activeTaxConfigs}</p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading configurations...</p>
        </div>
      )}

      {/* Land Configuration Tab */}
      {activeTab === 'land' && !loading && (
        <>
          {/* Land Form Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingType === 'land' ? 'Edit Land Configuration' : 'Add New Land Configuration'}
            </h2>
            <form onSubmit={handleLandSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Classification *</label>
                <input
                  type="text"
                  value={landFormData.classification}
                  onChange={(e) => setLandFormData({...landFormData, classification: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="e.g., Residential, Commercial, Agricultural"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Vicinity *</label>
                <input
                  type="text"
                  value={landFormData.vicinity}
                  onChange={(e) => setLandFormData({...landFormData, vicinity: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="e.g., City Center, Suburban Area, Rural Area"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Market Value (per sqm) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={landFormData.market_value}
                  onChange={(e) => setLandFormData({...landFormData, market_value: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Assessment Level (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={landFormData.assessment_level}
                  onChange={(e) => setLandFormData({...landFormData, assessment_level: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={landFormData.status}
                  onChange={(e) => setLandFormData({...landFormData, status: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                >
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Effective Date *</label>
                <input
                  type="date"
                  value={landFormData.effective_date}
                  onChange={(e) => setLandFormData({...landFormData, effective_date: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Expiration Date</label>
                <input
                  type="date"
                  value={landFormData.expiration_date}
                  onChange={(e) => setLandFormData({...landFormData, expiration_date: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty if no expiration</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={landFormData.description}
                  onChange={(e) => setLandFormData({...landFormData, description: e.target.value})}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="Additional details about this land classification..."
                />
              </div>

              {/* Land Calculation Preview */}
              {landFormData.market_value && landFormData.assessment_level && (
                <div className="md:col-span-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Land Calculation Preview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Market Value:</span>
                      <div className="text-lg">₱{parseFloat(landFormData.market_value).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="font-medium">Assessment Level:</span>
                      <div className="text-lg">{landFormData.assessment_level}%</div>
                    </div>
                    <div>
                      <span className="font-medium">Assessed Value:</span>
                      <div className="text-lg">₱{calculateLandAssessedValue()}</div>
                      <p className="text-xs text-gray-600">per square meter</p>
                    </div>
                    <div>
                      <span className="font-medium">Vicinity:</span>
                      <div className="text-lg">{landFormData.vicinity}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Land Form Actions */}
              <div className="md:col-span-2 flex gap-4 mt-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  {editingType === 'land' ? 'Update Land Configuration' : 'Create Land Configuration'}
                </button>
                <button
                  type="button"
                  onClick={resetLandForm}
                  className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Land Configurations List */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Land Configurations ({landConfigurations.length})
            </h2>
            
            {landConfigurations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No land configurations found for the selected date.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 dark:border-slate-700">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-slate-800">
                      <th className="border p-2 text-left">Classification</th>
                      <th className="border p-2 text-left">Vicinity</th>
                      <th className="border p-2 text-left">Market Value</th>
                      <th className="border p-2 text-left">Assessment Level</th>
                      <th className="border p-2 text-left">Assessed Value</th>
                      <th className="border p-2 text-left">Effective Date</th>
                      <th className="border p-2 text-left">Expiration Date</th>
                      <th className="border p-2 text-left">Status</th>
                      <th className="border p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {landConfigurations.map((config) => (
                      <tr 
                        key={config.id} 
                        className={`hover:bg-gray-50 dark:hover:bg-slate-800 ${
                          config.status === 'expired' ? 'bg-gray-50 dark:bg-slate-800/50 text-gray-500' : ''
                        }`}
                      >
                        <td className="border p-2">
                          <div className="font-medium">{config.classification}</div>
                          {config.description && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {config.description.length > 50 
                                ? `${config.description.substring(0, 50)}...` 
                                : config.description
                              }
                            </div>
                          )}
                        </td>
                        <td className="border p-2 font-medium">{config.vicinity}</td>
                        <td className="border p-2">₱{parseFloat(config.market_value).toLocaleString()}</td>
                        <td className="border p-2">{config.assessment_level}%</td>
                        <td className="border p-2">
                          ₱{(config.market_value * (config.assessment_level / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="border p-2">{config.effective_date}</td>
                        <td className="border p-2">{config.expiration_date || '-'}</td>
                        <td className="border p-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            config.status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {config.status}
                          </span>
                        </td>
                        <td className="border p-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleLandEdit(config)}
                              className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors"
                              disabled={config.status === 'expired'}
                            >
                              Edit
                            </button>
                            {config.status === 'active' && (
                              <button
                                onClick={() => handleExpire(config.id, 'land-configurations')}
                                className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 transition-colors"
                              >
                                Expire
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(config.id, 'land-configurations')}
                              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Property Configuration Tab */}
      {activeTab === 'property' && !loading && (
        <>
          {/* Property Form Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingType === 'property' ? 'Edit Property Configuration' : 'Add New Property Configuration'}
            </h2>
            <form onSubmit={handlePropertySubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Classification *</label>
                <input
                  type="text"
                  value={propertyFormData.classification}
                  onChange={(e) => setPropertyFormData({...propertyFormData, classification: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="e.g., Residential, Commercial, Industrial"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Material Type *</label>
                <input
                  type="text"
                  value={propertyFormData.material_type}
                  onChange={(e) => setPropertyFormData({...propertyFormData, material_type: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="e.g., Concrete, Wooden, Semi-Concrete"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Enter the building material type</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Unit Cost (per sqm) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={propertyFormData.unit_cost}
                  onChange={(e) => setPropertyFormData({...propertyFormData, unit_cost: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Depreciation Rate (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={propertyFormData.depreciation_rate}
                  onChange={(e) => setPropertyFormData({...propertyFormData, depreciation_rate: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Min Value Range *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={propertyFormData.min_value}
                  onChange={(e) => setPropertyFormData({...propertyFormData, min_value: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Max Value Range *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={propertyFormData.max_value}
                  onChange={(e) => setPropertyFormData({...propertyFormData, max_value: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Assessment Level (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={propertyFormData.level_percent}
                  onChange={(e) => setPropertyFormData({...propertyFormData, level_percent: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={propertyFormData.status}
                  onChange={(e) => setPropertyFormData({...propertyFormData, status: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                >
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Effective Date *</label>
                <input
                  type="date"
                  value={propertyFormData.effective_date}
                  onChange={(e) => setPropertyFormData({...propertyFormData, effective_date: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Expiration Date</label>
                <input
                  type="date"
                  value={propertyFormData.expiration_date}
                  onChange={(e) => setPropertyFormData({...propertyFormData, expiration_date: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty if no expiration</p>
              </div>

              {/* Property Form Actions */}
              <div className="md:col-span-2 flex gap-4 mt-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  {editingType === 'property' ? 'Update Property Configuration' : 'Create Property Configuration'}
                </button>
                <button
                  type="button"
                  onClick={resetPropertyForm}
                  className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Property Configurations List */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Property Configurations ({propertyConfigurations.length})
            </h2>
            
            {propertyConfigurations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No property configurations found for the selected date.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 dark:border-slate-700">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-slate-800">
                      <th className="border p-2 text-left">Classification</th>
                      <th className="border p-2 text-left">Material Type</th>
                      <th className="border p-2 text-left">Unit Cost</th>
                      <th className="border p-2 text-left">Depreciation</th>
                      <th className="border p-2 text-left">Value Range</th>
                      <th className="border p-2 text-left">Assessment Level</th>
                      <th className="border p-2 text-left">Effective Date</th>
                      <th className="border p-2 text-left">Status</th>
                      <th className="border p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {propertyConfigurations.map((config) => (
                      <tr 
                        key={config.id} 
                        className={`hover:bg-gray-50 dark:hover:bg-slate-800 ${
                          config.status === 'expired' ? 'bg-gray-50 dark:bg-slate-800/50 text-gray-500' : ''
                        }`}
                      >
                        <td className="border p-2 font-medium">{config.classification}</td>
                        <td className="border p-2">{config.material_type}</td>
                        <td className="border p-2">₱{parseFloat(config.unit_cost).toLocaleString()}</td>
                        <td className="border p-2">{config.depreciation_rate}%</td>
                        <td className="border p-2">
                          ₱{parseFloat(config.min_value).toLocaleString()} - ₱{parseFloat(config.max_value).toLocaleString()}
                        </td>
                        <td className="border p-2">{config.level_percent}%</td>
                        <td className="border p-2">{config.effective_date}</td>
                        <td className="border p-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            config.status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {config.status}
                          </span>
                        </td>
                        <td className="border p-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePropertyEdit(config)}
                              className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors"
                              disabled={config.status === 'expired'}
                            >
                              Edit
                            </button>
                            {config.status === 'active' && (
                              <button
                                onClick={() => handleExpire(config.id, 'property-configurations')}
                                className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 transition-colors"
                              >
                                Expire
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(config.id, 'property-configurations')}
                              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Tax Configuration Tab */}
      {activeTab === 'tax' && !loading && (
        <>
          {/* Tax Form Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingType === 'tax' ? 'Edit Tax Configuration' : 'Add New Tax Configuration'}
            </h2>
            <form onSubmit={handleTaxSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tax Name *</label>
                <input
                  type="text"
                  value={taxFormData.tax_name}
                  onChange={(e) => setTaxFormData({...taxFormData, tax_name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="e.g., RPT, Special Tax, Penalty, Interest"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Enter any tax name you want to create</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tax Percentage (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={taxFormData.tax_percent}
                  onChange={(e) => setTaxFormData({...taxFormData, tax_percent: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  placeholder="0.00"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Enter percentage (e.g., 1.00 for 1%)</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={taxFormData.status}
                  onChange={(e) => setTaxFormData({...taxFormData, status: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                >
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Effective Date *</label>
                <input
                  type="date"
                  value={taxFormData.effective_date}
                  onChange={(e) => setTaxFormData({...taxFormData, effective_date: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Expiration Date</label>
                <input
                  type="date"
                  value={taxFormData.expiration_date}
                  onChange={(e) => setTaxFormData({...taxFormData, expiration_date: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded dark:bg-slate-800 dark:border-slate-600"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty if no expiration</p>
              </div>

              {/* Tax Calculation Preview */}
              {taxFormData.tax_percent && (
                <div className="md:col-span-2 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Tax Rate Preview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Tax Type:</span>
                      <div className="text-lg">{taxFormData.tax_name}</div>
                    </div>
                    <div>
                      <span className="font-medium">Tax Rate:</span>
                      <div className="text-lg">{taxFormData.tax_percent}%</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tax Form Actions */}
              <div className="md:col-span-2 flex gap-4 mt-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  {editingType === 'tax' ? 'Update Tax Configuration' : 'Create Tax Configuration'}
                </button>
                <button
                  type="button"
                  onClick={resetTaxForm}
                  className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Tax Configurations List */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Tax Configurations ({taxConfigurations.length})
            </h2>
            
            {taxConfigurations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No tax configurations found for the selected date.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 dark:border-slate-700">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-slate-800">
                      <th className="border p-2 text-left">Tax Name</th>
                      <th className="border p-2 text-left">Tax Percentage</th>
                      <th className="border p-2 text-left">Effective Date</th>
                      <th className="border p-2 text-left">Expiration Date</th>
                      <th className="border p-2 text-left">Status</th>
                      <th className="border p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxConfigurations.map((config) => (
                      <tr 
                        key={config.id} 
                        className={`hover:bg-gray-50 dark:hover:bg-slate-800 ${
                          config.status === 'expired' ? 'bg-gray-50 dark:bg-slate-800/50 text-gray-500' : ''
                        }`}
                      >
                        <td className="border p-2 font-medium">{config.tax_name}</td>
                        <td className="border p-2">{config.tax_percent}%</td>
                        <td className="border p-2">{config.effective_date}</td>
                        <td className="border p-2">{config.expiration_date || '-'}</td>
                        <td className="border p-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            config.status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {config.status}
                          </span>
                        </td>
                        <td className="border p-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleTaxEdit(config)}
                              className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors"
                              disabled={config.status === 'expired'}
                            >
                              Edit
                            </button>
                            {config.status === 'active' && (
                              <button
                                onClick={() => handleExpire(config.id, 'tax-configurations')}
                                className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 transition-colors"
                              >
                                Expire
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(config.id, 'tax-configurations')}
                              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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