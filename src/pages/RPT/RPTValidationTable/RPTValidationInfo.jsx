import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function RPTValidationInfo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [landConfigs, setLandConfigs] = useState([]);
  const [propertyConfigs, setPropertyConfigs] = useState([]);
  const [taxConfigs, setTaxConfigs] = useState([]);
  const [buildingWarning, setBuildingWarning] = useState("");

  // Form states
  const [inspectionForm, setInspectionForm] = useState({
    scheduled_date: "",
    assessor_name: ""
  });

  const [assessmentForm, setAssessmentForm] = useState({
    // Land Properties
    land_tdn: "",
    land_property_type: "",
    land_area_sqm: "",
    land_market_value: "",
    land_assessed_value: "",
    land_assessment_level: "",
    
    // Building Properties (only if has_building === 'yes')
    building_tdn: "",
    construction_type: "",
    floor_area_sqm: "",
    year_built: new Date().getFullYear(),
    useful_life_years: 50,
    building_market_value: "",
    building_depreciated_value: "",
    depreciation_percent: "",
    building_assessed_value: "",
    building_assessment_level: ""
  });

  // Calculation states
  const [landCalculations, setLandCalculations] = useState({
    market_value: 0,
    assessed_value: 0,
    assessment_level: 0,
    classification: "",
    market_value_per_sqm: 0
  });

  const [buildingCalculations, setBuildingCalculations] = useState({
    market_value: 0,
    depreciated_value: 0,
    assessed_value: 0,
    assessment_level: 0,
    depreciation_percent: 0,
    material_type: "",
    building_age: 0,
    range_matched: false,
    matched_config: null,
    market_value_per_sqm: 0
  });

  const [taxCalculations, setTaxCalculations] = useState({
    total_assessed_value: 0,
    tax_breakdown: [],
    total_tax: 0
  });

  const API_BASE = "http://localhost/revenue/backend/RPT/RPTValidationTable";

  useEffect(() => {
    fetchRegistrationDetails();
    fetchConfigurations();
  }, [id]);

  useEffect(() => {
    calculateTotalTaxes();
  }, [landCalculations.assessed_value, buildingCalculations.assessed_value, taxConfigs]);

  const fetchRegistrationDetails = async () => {
    try {
      const response = await fetch(`${API_BASE}/get_registration_details.php?id=${id}`);
      const data = await response.json();

      if (data.status === "success") {
        setRegistration(data.registration);
      } else {
        throw new Error(data.message || "Failed to fetch registration details");
      }
    } catch (err) {
      console.error("Error fetching registration details:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfigurations = async () => {
    try {
      // Fetch land configurations
      const landResponse = await fetch(`${API_BASE}/get_land_configurations.php`);
      const landData = await landResponse.json();
      if (landData.status === "success") {
        const activeLandConfigs = landData.configurations.filter(config => config.status === 'active') || [];
        setLandConfigs(activeLandConfigs);
        
        if (activeLandConfigs.length > 0 && !assessmentForm.land_property_type) {
          setAssessmentForm(prev => ({
            ...prev,
            land_property_type: activeLandConfigs[0].classification
          }));
        }
      }

      // Fetch property configurations
      const propertyResponse = await fetch(`${API_BASE}/get_property_configurations.php`);
      const propertyData = await propertyResponse.json();
      if (propertyData.status === "success") {
        const activePropertyConfigs = propertyData.configurations.filter(config => config.status === 'active') || [];
        setPropertyConfigs(activePropertyConfigs);
        
        if (activePropertyConfigs.length > 0 && !assessmentForm.construction_type) {
          setAssessmentForm(prev => ({
            ...prev,
            construction_type: activePropertyConfigs[0].material_type
          }));
        }
      }

      // Fetch tax configurations
      const taxResponse = await fetch(`${API_BASE}/get_tax_configurations.php`);
      const taxData = await taxResponse.json();
      if (taxData.status === "success") {
        setTaxConfigs(taxData.tax_configurations || []);
      }

    } catch (err) {
      console.error("Error fetching configurations:", err);
    }
  };

  // Calculate land values
  useEffect(() => {
    calculateLandValues();
  }, [assessmentForm.land_property_type, assessmentForm.land_area_sqm, landConfigs]);

  // Calculate building values
  useEffect(() => {
    calculateBuildingValues();
  }, [assessmentForm.construction_type, assessmentForm.floor_area_sqm, assessmentForm.year_built, propertyConfigs]);

  const calculateLandValues = () => {
    const { land_property_type, land_area_sqm } = assessmentForm;
    
    if (!land_area_sqm || land_area_sqm <= 0 || !land_property_type) {
      setLandCalculations({ 
        market_value: 0, 
        assessed_value: 0, 
        assessment_level: 0,
        classification: "",
        market_value_per_sqm: 0
      });
      setAssessmentForm(prev => ({
        ...prev,
        land_market_value: "",
        land_assessed_value: "",
        land_assessment_level: ""
      }));
      return;
    }

    const landConfig = landConfigs.find(config => 
      config.classification === land_property_type && config.status === 'active'
    );

    if (landConfig) {
      const market_value_per_sqm = parseFloat(landConfig.market_value);
      const market_value = parseFloat(land_area_sqm) * market_value_per_sqm;
      const assessed_value = market_value * (parseFloat(landConfig.assessment_level) / 100);
      
      setLandCalculations({
        market_value: market_value,
        assessed_value: assessed_value,
        assessment_level: parseFloat(landConfig.assessment_level),
        classification: landConfig.classification,
        market_value_per_sqm: market_value_per_sqm
      });

      setAssessmentForm(prev => ({
        ...prev,
        land_market_value: market_value.toFixed(2),
        land_assessed_value: assessed_value.toFixed(2),
        land_assessment_level: landConfig.assessment_level
      }));
    } else {
      setLandCalculations({ 
        market_value: 0, 
        assessed_value: 0, 
        assessment_level: 0,
        classification: "",
        market_value_per_sqm: 0
      });
      setAssessmentForm(prev => ({
        ...prev,
        land_market_value: "",
        land_assessed_value: "",
        land_assessment_level: ""
      }));
    }
  };

  const calculateBuildingValues = () => {
    const { construction_type, floor_area_sqm, year_built } = assessmentForm;
    
    if (!floor_area_sqm || floor_area_sqm <= 0 || !construction_type) {
      setBuildingCalculations({ 
        market_value: 0, 
        depreciated_value: 0, 
        assessed_value: 0, 
        assessment_level: 0,
        depreciation_percent: 0,
        material_type: "",
        building_age: 0,
        range_matched: false,
        matched_config: null,
        market_value_per_sqm: 0
      });
      setAssessmentForm(prev => ({
        ...prev,
        building_market_value: "",
        building_depreciated_value: "",
        building_assessed_value: "",
        building_assessment_level: "",
        depreciation_percent: ""
      }));
      setBuildingWarning("");
      return;
    }

    const propertyConfigsForType = propertyConfigs.filter(config => 
      config.material_type === construction_type && config.status === 'active'
    );

    if (propertyConfigsForType.length > 0) {
      const currentYear = new Date().getFullYear();
      const buildingAge = currentYear - parseInt(year_built);
      const market_value_per_sqm = parseFloat(propertyConfigsForType[0].unit_cost);
      const market_value = parseFloat(floor_area_sqm) * market_value_per_sqm;
      
      const matchingConfig = propertyConfigsForType.find(config => 
        market_value >= parseFloat(config.min_value) && market_value <= parseFloat(config.max_value)
      );

      if (matchingConfig) {
        const depreciationPercent = Math.min(100, buildingAge * parseFloat(matchingConfig.depreciation_rate));
        const depreciated_value = market_value * ((100 - depreciationPercent) / 100);
        const assessed_value = depreciated_value * (parseFloat(matchingConfig.level_percent) / 100);
        
        setBuildingCalculations({
          market_value: market_value,
          depreciated_value: depreciated_value,
          assessed_value: assessed_value,
          assessment_level: parseFloat(matchingConfig.level_percent),
          depreciation_percent: depreciationPercent,
          material_type: matchingConfig.material_type,
          building_age: buildingAge,
          range_matched: true,
          matched_config: matchingConfig,
          market_value_per_sqm: market_value_per_sqm
        });

        setAssessmentForm(prev => ({
          ...prev,
          building_market_value: market_value.toFixed(2),
          building_depreciated_value: depreciated_value.toFixed(2),
          building_assessed_value: assessed_value.toFixed(2),
          building_assessment_level: matchingConfig.level_percent,
          depreciation_percent: depreciationPercent.toFixed(2)
        }));

        setBuildingWarning("");
      } else {
        const depreciationPercent = Math.min(100, buildingAge * parseFloat(propertyConfigsForType[0].depreciation_rate));
        const depreciated_value = market_value * ((100 - depreciationPercent) / 100);
        
        setBuildingCalculations({
          market_value: market_value,
          depreciated_value: depreciated_value,
          assessed_value: 0,
          assessment_level: 0,
          depreciation_percent: depreciationPercent,
          material_type: construction_type,
          building_age: buildingAge,
          range_matched: false,
          matched_config: null,
          market_value_per_sqm: market_value_per_sqm
        });

        setAssessmentForm(prev => ({
          ...prev,
          building_market_value: market_value.toFixed(2),
          building_depreciated_value: depreciated_value.toFixed(2),
          building_assessed_value: "",
          building_assessment_level: "",
          depreciation_percent: depreciationPercent.toFixed(2)
        }));

        const minRange = Math.min(...propertyConfigsForType.map(config => parseFloat(config.min_value)));
        const maxRange = Math.max(...propertyConfigsForType.map(config => parseFloat(config.max_value)));
        
        setBuildingWarning(
          `❌ Market value ${formatCurrency(market_value)} is outside configured ranges for ${construction_type} ` +
          `(${formatCurrency(minRange)} - ${formatCurrency(maxRange)}). ` +
          `Assessment level and assessed value cannot be calculated.`
        );
      }
    } else {
      setBuildingCalculations({ 
        market_value: 0, 
        depreciated_value: 0, 
        assessed_value: 0, 
        assessment_level: 0,
        depreciation_percent: 0,
        material_type: "",
        building_age: 0,
        range_matched: false,
        matched_config: null,
        market_value_per_sqm: 0
      });
      setAssessmentForm(prev => ({
        ...prev,
        building_market_value: "",
        building_depreciated_value: "",
        building_assessed_value: "",
        building_assessment_level: "",
        depreciation_percent: ""
      }));
      setBuildingWarning(`No active configurations found for construction type: ${construction_type}`);
    }
  };

  const calculateTotalTaxes = () => {
    const totalAssessedValue = landCalculations.assessed_value + buildingCalculations.assessed_value;
    
    const taxBreakdown = taxConfigs.map(taxConfig => {
      const taxAmount = totalAssessedValue * (parseFloat(taxConfig.tax_percent) / 100);
      return {
        name: taxConfig.tax_name,
        percent: parseFloat(taxConfig.tax_percent),
        amount: taxAmount
      };
    });

    const totalTax = taxBreakdown.reduce((sum, tax) => sum + tax.amount, 0);

    setTaxCalculations({
      total_assessed_value: totalAssessedValue,
      tax_breakdown: taxBreakdown,
      total_tax: totalTax
    });
  };

  // Handle inspection scheduling
  const handleInspectionSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/schedule_inspection.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registration_id: id,
          ...inspectionForm
        })
      });

      const data = await response.json();

      if (data.status === "success") {
        alert("Inspection scheduled successfully!");
        setShowInspectionForm(false);
        setInspectionForm({
          scheduled_date: "",
          assessor_name: ""
        });
        await updateRegistrationStatus('for_inspection');
      } else {
        throw new Error(data.message || "Failed to schedule inspection");
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Handle assessment submission
  const handleAssessmentSubmit = async (e) => {
    e.preventDefault();
    
    // Show warning if building range doesn't match
    if (buildingWarning && registration.has_building === 'yes') {
      const proceed = window.confirm(
        "Building market value is outside configured ranges. Assessment level and assessed value cannot be calculated. Do you want to proceed with the assessment anyway?"
      );
      if (!proceed) return;
    }

    try {
      // Generate TDN numbers automatically
      const land_tdn = `LAND-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${registration.reference_number}`;
      const building_tdn = `BLDG-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${registration.reference_number}`;

      const submissionData = {
        registration_id: id,
        land_tdn: land_tdn,
        land_property_type: assessmentForm.land_property_type,
        land_area_sqm: assessmentForm.land_area_sqm,
        land_market_value: assessmentForm.land_market_value,
        land_assessed_value: assessmentForm.land_assessed_value,
        land_assessment_level: assessmentForm.land_assessment_level,
        // Only include building data if property has building
        ...(registration.has_building === 'yes' && {
          building_tdn: building_tdn,
          construction_type: assessmentForm.construction_type,
          floor_area_sqm: assessmentForm.floor_area_sqm,
          year_built: assessmentForm.year_built,
          useful_life_years: assessmentForm.useful_life_years,
          building_market_value: assessmentForm.building_market_value,
          building_depreciated_value: assessmentForm.building_depreciated_value,
          depreciation_percent: assessmentForm.depreciation_percent,
          building_assessed_value: assessmentForm.building_assessed_value,
          building_assessment_level: assessmentForm.building_assessment_level
        })
      };

      const response = await fetch(`${API_BASE}/assess_property.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });

      const data = await response.json();

      if (data.status === "success") {
        alert("Property assessed successfully!");
        setShowAssessmentForm(false);
        // Reset form
        setAssessmentForm({
          land_tdn: "",
          land_property_type: landConfigs.length > 0 ? landConfigs[0].classification : "",
          land_area_sqm: "",
          land_market_value: "",
          land_assessed_value: "",
          land_assessment_level: "",
          building_tdn: "",
          construction_type: propertyConfigs.length > 0 ? propertyConfigs[0].material_type : "",
          floor_area_sqm: "",
          year_built: new Date().getFullYear(),
          useful_life_years: 50,
          building_market_value: "",
          building_depreciated_value: "",
          depreciation_percent: "",
          building_assessed_value: "",
          building_assessment_level: ""
        });
        // Reset calculations
        setLandCalculations({ market_value: 0, assessed_value: 0, assessment_level: 0, classification: "", market_value_per_sqm: 0 });
        setBuildingCalculations({ 
          market_value: 0, depreciated_value: 0, assessed_value: 0, 
          assessment_level: 0, depreciation_percent: 0, material_type: "", building_age: 0, range_matched: false, matched_config: null, market_value_per_sqm: 0
        });
        setBuildingWarning("");
        // Update status to 'assessed' AFTER successful data submission
        await updateRegistrationStatus('assessed');
      } else {
        throw new Error(data.message || "Failed to assess property");
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Handle approval
  const handleApprove = async () => {
    if (window.confirm("Are you sure you want to approve this property assessment?")) {
      try {
        const response = await fetch(`${API_BASE}/update_registration_status.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            registration_id: id,
            status: 'approved'
          })
        });

        const data = await response.json();

        if (data.status === "success") {
          alert("Property approved successfully!");
          await fetchRegistrationDetails();
        } else {
          throw new Error(data.message || "Failed to approve property");
        }
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  // Update registration status
  const updateRegistrationStatus = async (status) => {
    try {
      const response = await fetch(`${API_BASE}/update_registration_status.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registration_id: id,
          status: status
        })
      });
      await response.json();
      await fetchRegistrationDetails();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-700 font-medium">Loading registration details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {error ? "Error Loading Data" : "Registration Not Found"}
          </h2>
          <p className="text-gray-600 mb-6">{error || "The requested registration could not be found."}</p>
          <div className="space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={fetchRegistrationDetails}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <span className="text-xl">←</span>
                  <span className="font-medium">Back to List</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-xl">🏠</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Property Registration Application</h1>
                  <p className="text-gray-600">Reference: <span className="font-mono font-semibold">{registration.reference_number}</span></p>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mt-4 lg:mt-0">
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                registration.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                registration.status === 'for_inspection' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                registration.status === 'assessed' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                'bg-green-100 text-green-800 border border-green-200'
              }`}>
                {registration.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Admin Actions</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Schedule Inspection Button - Show when pending */}
            {registration.status === 'pending' && (
              <button
                onClick={() => setShowInspectionForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>📅</span>
                <span>Schedule Inspection</span>
              </button>
            )}

            {/* Assess Button - Show when for_inspection OR assessed (to allow input/editing) */}
            {(registration.status === 'for_inspection' || registration.status === 'assessed') && (
              <button
                onClick={() => setShowAssessmentForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>📊</span>
                <span>{registration.status === 'assessed' ? 'Edit Assessment' : 'Assess Property'}</span>
              </button>
            )}

            {/* Approve Button - Show when assessed (after property details are input) */}
            {registration.status === 'assessed' && (
              <button
                onClick={handleApprove}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>✅</span>
                <span>Approve Property</span>
              </button>
            )}
          </div>
        </div>

        {/* Inspection Form */}
        {showInspectionForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-blue-900">Schedule Property Inspection</h3>
              <button
                onClick={() => setShowInspectionForm(false)}
                className="text-blue-600 hover:text-blue-800"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleInspectionSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date *</label>
                  <input
                    type="date"
                    required
                    value={inspectionForm.scheduled_date}
                    onChange={(e) => setInspectionForm({...inspectionForm, scheduled_date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assessor Name *</label>
                  <input
                    type="text"
                    required
                    value={inspectionForm.assessor_name}
                    onChange={(e) => setInspectionForm({...inspectionForm, assessor_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter assessor's name"
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Schedule Inspection
                </button>
                <button
                  type="button"
                  onClick={() => setShowInspectionForm(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Assessment Form */}
        {showAssessmentForm && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-green-900">Property Assessment</h3>
              <button
                onClick={() => setShowAssessmentForm(false)}
                className="text-green-600 hover:text-green-800"
              >
                ✕
              </button>
            </div>
            
            {buildingWarning && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-red-600 text-lg mr-2">❌</span>
                  <p className="text-red-800 text-sm">{buildingWarning}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleAssessmentSubmit} className="space-y-6">
              {/* Land Assessment */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2">Land Assessment</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Type *</label>
                    <select
                      value={assessmentForm.land_property_type}
                      onChange={(e) => setAssessmentForm({...assessmentForm, land_property_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {landConfigs.map((config) => (
                        <option key={config.id} value={config.classification}>
                          {config.classification}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Land Area (sqm) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={assessmentForm.land_area_sqm}
                      onChange={(e) => setAssessmentForm({...assessmentForm, land_area_sqm: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter land area"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Market Value per SQM</label>
                    <input
                      type="number"
                      step="0.01"
                      readOnly
                      value={landCalculations.market_value_per_sqm || ""}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Market Value</label>
                    <input
                      type="number"
                      step="0.01"
                      readOnly
                      value={assessmentForm.land_market_value}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Level (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      readOnly
                      value={assessmentForm.land_assessment_level}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assessed Value</label>
                    <input
                      type="number"
                      step="0.01"
                      readOnly
                      value={assessmentForm.land_assessed_value}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Building Assessment */}
              {registration.has_building === 'yes' && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2">Building Assessment</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Construction Type *</label>
                      <select
                        value={assessmentForm.construction_type}
                        onChange={(e) => setAssessmentForm({...assessmentForm, construction_type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {propertyConfigs.map((config) => (
                          <option key={config.id} value={config.material_type}>
                            {config.material_type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Floor Area (sqm) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={assessmentForm.floor_area_sqm}
                        onChange={(e) => setAssessmentForm({...assessmentForm, floor_area_sqm: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter floor area"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Market Value per SQM</label>
                      <input
                        type="number"
                        step="0.01"
                        readOnly
                        value={buildingCalculations.market_value_per_sqm || ""}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year Built *</label>
                      <input
                        type="number"
                        required
                        min="1900"
                        max={new Date().getFullYear()}
                        value={assessmentForm.year_built}
                        onChange={(e) => setAssessmentForm({...assessmentForm, year_built: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Market Value</label>
                      <input
                        type="number"
                        step="0.01"
                        readOnly
                        value={assessmentForm.building_market_value}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Depreciation (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        readOnly
                        value={assessmentForm.depreciation_percent}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Level (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        readOnly
                        value={assessmentForm.building_assessment_level || ""}
                        className={`w-full px-3 py-2 border rounded-md ${
                          buildingCalculations.range_matched 
                            ? 'border-gray-300 bg-gray-100' 
                            : 'border-red-300 bg-red-50 text-red-700'
                        }`}
                        placeholder={buildingCalculations.range_matched ? "" : "No valid range"}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assessed Value</label>
                      <input
                        type="number"
                        step="0.01"
                        readOnly
                        value={assessmentForm.building_assessed_value || ""}
                        className={`w-full px-3 py-2 border rounded-md ${
                          buildingCalculations.range_matched 
                            ? 'border-gray-300 bg-gray-100 font-semibold' 
                            : 'border-red-300 bg-red-50 text-red-700'
                        }`}
                        placeholder={buildingCalculations.range_matched ? "" : "Cannot calculate"}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tax Calculation Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-blue-900 mb-3">Tax Calculation Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Land Assessed Value</label>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(landCalculations.assessed_value)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Building Assessed Value</label>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(buildingCalculations.assessed_value)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Assessed Value</label>
                    <p className="text-xl font-bold text-blue-900">{formatCurrency(taxCalculations.total_assessed_value)}</p>
                  </div>
                </div>
                
                {/* Tax Breakdown */}
                {taxCalculations.tax_breakdown.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Tax Breakdown:</h5>
                    <div className="space-y-2">
                      {taxCalculations.tax_breakdown.map((tax, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span>{tax.name} ({tax.percent}%)</span>
                          <span className="font-semibold">{formatCurrency(tax.amount)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="flex justify-between items-center text-lg font-bold text-green-900">
                        <span>Total Annual Tax:</span>
                        <span>{formatCurrency(taxCalculations.total_tax)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={buildingWarning && !buildingCalculations.range_matched}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    buildingWarning && !buildingCalculations.range_matched
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {buildingWarning && !buildingCalculations.range_matched 
                    ? 'Cannot Assess (Invalid Range)' 
                    : 'Complete Assessment'
                  }
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssessmentForm(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Registration Details */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="space-y-6">
            {/* Owner Information */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Owner Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                    <p className="text-gray-900 text-lg font-medium">{registration.owner_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                    <p className="text-gray-900">{registration.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                    <p className="text-gray-900 font-mono">{registration.phone}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">TIN Number</label>
                    <p className="text-gray-900">{registration.tin_number || <span className="text-gray-400">Not provided</span>}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Home Address</label>
                    <p className="text-gray-900 leading-relaxed">{registration.address}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Submitted On</label>
                    <p className="text-gray-900">{formatDate(registration.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Information */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Property Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Lot Location</label>
                    <p className="text-gray-900 text-lg font-medium">{registration.lot_location}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Barangay</label>
                    <p className="text-gray-900">{registration.barangay}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">District</label>
                    <p className="text-gray-900">{registration.district}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Building Type</label>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      registration.has_building === 'yes' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {registration.has_building === 'yes' ? '🏠 With Building' : '🌱 Vacant Land'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Correction Notes (if any) */}
            {registration.correction_notes && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600">⚠️</span>
                  </div>
                  <h3 className="text-lg font-bold text-orange-800">Correction Required</h3>
                </div>
                <p className="text-orange-700 leading-relaxed">{registration.correction_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}