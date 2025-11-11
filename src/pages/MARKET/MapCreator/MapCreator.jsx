import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MapCreator.css";

export default function Market1() {
  const [mapId, setMapId] = useState(null);
  const [stallCount, setStallCount] = useState(0);
  const [stalls, setStalls] = useState([]);
  const [mapImage, setMapImage] = useState(null); // Preview only
  const [mapFile, setMapFile] = useState(null);   // Actual file to upload
  const [isFinished, setIsFinished] = useState(false);
  const [sections, setSections] = useState([]); // All available sections from database
  const [selectedSection, setSelectedSection] = useState("all"); // Filter state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStallIndex, setSelectedStallIndex] = useState(null);
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });

  const marketMapRef = useRef(null);
  const modalRef = useRef(null);
  const navigate = useNavigate();
  
  // CORRECTED URL - Fixed typo from MapCretor to MapCreator
  const API_BASE = "http://localhost/revenue/backend/Market/MapCreator";

  // Fetch sections from backend
  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching sections from:', `${API_BASE}/get_sections.php`);
      
      const res = await fetch(`${API_BASE}/get_sections.php`);
      const data = await res.json();
      
      console.log('Sections response:', data);
      
      if (data.status === "success") {
        setSections(data.sections);
        console.log('Sections loaded successfully:', data.sections);
      } else {
        console.error("Failed to fetch sections from database:", data.message);
        setSections([]);
        setError("Failed to load sections: " + data.message);
      }
    } catch (err) {
      console.error("Error fetching sections:", err);
      setSections([]);
      setError("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Preview the map
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMapFile(file);
      setMapImage(URL.createObjectURL(file));
    }
  };

  // Add a stall
  const addStall = () => {
    const newCount = stallCount + 1;
    
    setStallCount(newCount);
    setStalls([
      ...stalls,
      { 
        name: `Stall ${newCount}`, 
        pos_x: 50, 
        pos_y: 50, 
        status: "available", 
        class_id: 3, // Default to Class C
        class_name: "C",
        price: 5000.00, // Default price for Class C
        height: 0, 
        length: 0, 
        width: 0,
        section_id: sections.length > 0 ? sections[0].id : null // Default to first section if available
      }
    ]);
  };

  // Delete a stall
  const deleteStall = (index) => {
    if (window.confirm(`Delete ${stalls[index].name}?`)) {
      const updated = stalls.filter((_, i) => i !== index);
      setStalls(updated);
      setStallCount(updated.length);
    }
  };

  // Save map and stalls to backend
  const saveStalls = async () => {
    if (!mapFile) return alert("Select a map image first.");
    const mapName = document.querySelector('input[name="mapName"]').value || "Unnamed Map";

    const formData = new FormData();
    formData.append("mapName", mapName);
    formData.append("mapImage", mapFile);
    formData.append("stalls", JSON.stringify(stalls));

    try {
      const res = await fetch(`${API_BASE}/save_stalls.php`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.status === "success") {
        alert("Map and stalls saved!");
        setMapId(data.map_id);
        navigate(`/Market/MarketOutput/view/${data.map_id}`);
      } else {
        alert("Save failed: " + (data.message || "Unknown"));
      }
    } catch (err) {
      alert("Upload error: " + err.message);
    }
  };

  // Drag stalls
  const handleDrag = (e, index) => {
    const containerRect = marketMapRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left - 31.5;
    const y = e.clientY - containerRect.top - 29;

    const updated = [...stalls];
    updated[index].pos_x = Math.max(0, Math.min(containerRect.width - 63, x));
    updated[index].pos_y = Math.max(0, Math.min(containerRect.height - 58, y));
    setStalls(updated);
  };

  const handleMouseDown = (e, index) => {
    e.preventDefault();
    const onMouseMove = (ev) => handleDrag(ev, index);
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // Open stall modal
  const openPriceModal = (index, e) => {
    e.preventDefault();
    setSelectedStallIndex(index);
    const viewportX = e.clientX;
    const viewportY = e.clientY;
    const modalWidth = 350;
    const modalHeight = 550;

    let x = viewportX;
    let y = viewportY;
    if (x + modalWidth > window.innerWidth) x = window.innerWidth - modalWidth - 10;
    if (y + modalHeight > window.innerHeight) y = window.innerHeight - modalHeight - 10;
    x = Math.max(10, x);
    y = Math.max(10, y);
    setModalPos({ x, y });
    setModalOpen(true);
  };

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setModalOpen(false);
    }
  };

  // Update stall class
  const updateStallClass = (class_id) => {
    const updated = [...stalls];
    const classPrices = {
      1: 15000.00, // Class A
      2: 10000.00, // Class B
      3: 5000.00   // Class C
    };
    
    updated[selectedStallIndex].class_id = parseInt(class_id);
    updated[selectedStallIndex].class_name = class_id == 1 ? "A" : class_id == 2 ? "B" : "C";
    updated[selectedStallIndex].price = classPrices[class_id] || 5000.00;
    setStalls(updated);
  };

  // Update price separately
  const updateStallPrice = (price) => {
    const updated = [...stalls];
    updated[selectedStallIndex].price = parseFloat(price) || 0;
    setStalls(updated);
  };

  // Update stall section
  const updateStallSection = (section_id) => {
    const updated = [...stalls];
    updated[selectedStallIndex].section_id = section_id ? parseInt(section_id) : null;
    setStalls(updated);
  };

  // Filter stalls by section
  const filteredStalls = selectedSection === "all" 
    ? stalls 
    : stalls.filter(stall => stall.section_id == selectedSection);

  // Get section name by ID
  const getSectionName = (section_id) => {
    const section = sections.find(s => s.id == section_id);
    return section ? section.name : "No Section";
  };

  // Get stall rights price based on class
  const getStallRightsPrice = (class_id) => {
    const prices = {
      1: 15000.00, // Class A
      2: 10000.00, // Class B
      3: 5000.00   // Class C
    };
    return prices[class_id] || 5000.00;
  };

  if (loading) {
    return (
      <div className="market-container">
        <div className="loading">Loading sections...</div>
      </div>
    );
  }

  return (
    <div className="market-container">
      <h1>{isFinished ? "Finished Market Map" : "Market Map Creator"}</h1>

      {error && (
        <div className="error-banner">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
            <button onClick={fetchSections} className="retry-btn">
              Retry
            </button>
          </div>
        </div>
      )}

      {!isFinished && (
        <div className="upload-form">
          <input type="text" name="mapName" placeholder="Map Name" required />
          <input type="file" name="mapImage" accept="image/*" onChange={handleFileSelect} required />
        </div>
      )}

      {/* Market Section Filter */}
      {stalls.length > 0 && sections.length > 0 && (
        <div className="section-filter">
          <label htmlFor="sectionFilter">Filter by Market Section:</label>
          <select 
            id="sectionFilter"
            value={selectedSection} 
            onChange={(e) => setSelectedSection(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Sections</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
          <div className="filter-info">
            Showing {filteredStalls.length} of {stalls.length} stalls
            {selectedSection !== "all" && ` in "${getSectionName(selectedSection)}"`}
          </div>
        </div>
      )}

      {/* Debug info for sections */}
      {sections.length === 0 && !loading && (
        <div className="debug-info">
          No sections loaded. Check if the PHP file exists and returns valid JSON.
        </div>
      )}

      <div
        id="marketMap"
        ref={marketMapRef}
        className="market-map"
        style={{ backgroundImage: mapImage ? `url('${mapImage}')` : "none" }}
      >
        {filteredStalls.map((stall, index) => {
          const originalIndex = stalls.findIndex(s => s.name === stall.name);
          return (
            <div
              key={originalIndex}
              className={`stall ${stall.status} ${selectedSection !== "all" ? "filtered" : ""}`}
              style={{ left: stall.pos_x, top: stall.pos_y }}
              onMouseDown={isFinished ? null : (e) => handleMouseDown(e, originalIndex)}
              onContextMenu={(e) => openPriceModal(originalIndex, e)}
            >
              <div className="stall-content">
                <div className="stall-name">{stall.name}</div>
                <div className="stall-class">Class: {stall.class_name}</div>
                <div className="stall-price">₱{stall.price.toLocaleString()}</div>
                <div className="stall-size">{stall.length}m × {stall.width}m × {stall.height}m</div>
                {stall.section_id && (
                  <div className="stall-section">Section: {getSectionName(stall.section_id)}</div>
                )}
              </div>

              {/* Delete button - always visible in edit mode */}
              {!isFinished && (
                <button
                  className="delete-stall-btn"
                  onClick={(e) => { e.stopPropagation(); deleteStall(originalIndex); }}
                  title="Delete stall"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
          <div
            ref={modalRef}
            className="price-modal"
            style={{ left: `${modalPos.x}px`, top: `${modalPos.y}px`, position: 'fixed' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4>Set Stall Details - {stalls[selectedStallIndex]?.name}</h4>

            {/* Section Selection Field */}
            <label>Market Section</label>
            <select
              value={stalls[selectedStallIndex]?.section_id || ""}
              onChange={(e) => updateStallSection(e.target.value)}
            >
              <option value="">No Section</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>

            <label>Stall Class</label>
            <select
              value={stalls[selectedStallIndex]?.class_id || ""}
              onChange={(e) => updateStallClass(e.target.value)}
            >
              <option value="1">Class A - ₱15,000.00 (Premium Location)</option>
              <option value="2">Class B - ₱10,000.00 (Standard Location)</option>
              <option value="3">Class C - ₱5,000.00 (Economy Location)</option>
            </select>

            <div className="current-class-info">
              <strong>Selected: Class {stalls[selectedStallIndex]?.class_name}</strong>
              <br />
              <span>Stall Rights: ₱{getStallRightsPrice(stalls[selectedStallIndex]?.class_id).toLocaleString()}</span>
            </div>

            <label>Custom Price (₱)</label>
            <input
              type="number"
              value={stalls[selectedStallIndex]?.price || 0}
              onChange={(e) => updateStallPrice(e.target.value)}
              step="0.01"
              min="0"
            />

            <label>Height (m)</label>
            <input
              type="number"
              value={stalls[selectedStallIndex]?.height || 0}
              onChange={(e) => {
                const updated = [...stalls];
                updated[selectedStallIndex].height = parseFloat(e.target.value) || 0;
                setStalls(updated);
              }}
              step="0.01"
            />

            <label>Length (m)</label>
            <input
              type="number"
              value={stalls[selectedStallIndex]?.length || 0}
              onChange={(e) => {
                const updated = [...stalls];
                updated[selectedStallIndex].length = parseFloat(e.target.value) || 0;
                setStalls(updated);
              }}
              step="0.01"
            />

            <label>Width (m)</label>
            <input
              type="number"
              value={stalls[selectedStallIndex]?.width || 0}
              onChange={(e) => {
                const updated = [...stalls];
                updated[selectedStallIndex].width = parseFloat(e.target.value) || 0;
                setStalls(updated);
              }}
              step="0.01"
            />

            <div className="modal-buttons">
              <button onClick={() => setModalOpen(false)}>Save</button>
              <button onClick={() => setModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {!isFinished && (
        <div className="controls">
          <button onClick={addStall} disabled={!mapImage}>Add Stall</button>
          <button onClick={saveStalls} disabled={!mapFile}>Save Stalls</button>
          <button onClick={() => navigate("/Market/ViewAllMaps")}>View All Maps</button>
          <button onClick={fetchSections}>Refresh Sections</button>
        </div>
      )}
    </div>
  );
}