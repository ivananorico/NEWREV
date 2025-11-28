<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . "/../../../db/RPT/rpt_db.php";

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['registration_id'])) {
        throw new Exception("Registration ID is required");
    }

    $registration_id = $input['registration_id'];

    // Get tax config IDs
    $tax_stmt = $pdo->prepare("SELECT id, tax_name FROM rpt_tax_config WHERE status = 'active'");
    $tax_stmt->execute();
    $tax_configs = $tax_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $basic_tax_id = null;
    $sef_tax_id = null;
    
    foreach ($tax_configs as $config) {
        if ($config['tax_name'] === 'Basic Tax') {
            $basic_tax_id = $config['id'];
        } elseif ($config['tax_name'] === 'SEF Tax') {
            $sef_tax_id = $config['id'];
        }
    }

    // Get inspection_id
    $inspection_stmt = $pdo->prepare("SELECT id FROM property_inspections WHERE registration_id = ? ORDER BY id DESC LIMIT 1");
    $inspection_stmt->execute([$registration_id]);
    $inspection_id = $inspection_stmt->fetch(PDO::FETCH_COLUMN);

    // Get land_config_id
    $land_config_stmt = $pdo->prepare("SELECT id FROM land_configurations WHERE classification = ? AND status = 'active' LIMIT 1");
    $land_config_stmt->execute([$input['land_property_type']]);
    $land_config_id = $land_config_stmt->fetch(PDO::FETCH_COLUMN);

    // Calculate land annual tax (5% Basic + 5% SEF = 10% total)
    $land_annual_tax = $input['land_assessed_value'] * 0.10;
    $land_basic_tax = $land_annual_tax * 0.5; // 50% of total tax
    $land_sef_tax = $land_annual_tax * 0.5;   // 50% of total tax

    // Update or insert land assessment
    $land_query = "
        INSERT INTO land_properties 
        (registration_id, inspection_id, property_type, land_config_id, 
         land_area_sqm, land_market_value, land_assessed_value, assessment_level,
         basic_tax_config_id, sef_tax_config_id, basic_tax_amount, sef_tax_amount, annual_tax)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        property_type = VALUES(property_type),
        land_area_sqm = VALUES(land_area_sqm),
        land_market_value = VALUES(land_market_value),
        land_assessed_value = VALUES(land_assessed_value),
        assessment_level = VALUES(assessment_level),
        basic_tax_config_id = VALUES(basic_tax_config_id),
        sef_tax_config_id = VALUES(sef_tax_config_id),
        basic_tax_amount = VALUES(basic_tax_amount),
        sef_tax_amount = VALUES(sef_tax_amount),
        annual_tax = VALUES(annual_tax)
    ";
    
    $land_stmt = $pdo->prepare($land_query);
    $land_stmt->execute([
        $registration_id, $inspection_id, $input['land_property_type'], $land_config_id,
        $input['land_area_sqm'], $input['land_market_value'], $input['land_assessed_value'], $input['land_assessment_level'],
        $basic_tax_id, $sef_tax_id, $land_basic_tax, $land_sef_tax, $land_annual_tax
    ]);
    
    $land_id = $pdo->lastInsertId();

    // Handle building assessment if property has building
    $building_action = 'none';
    $building_annual_tax = 0;
    
    if (isset($input['construction_type']) && isset($input['floor_area_sqm']) && $input['floor_area_sqm'] > 0) {
        // Get property_config_id
        $prop_config_stmt = $pdo->prepare("SELECT id FROM property_configurations WHERE material_type = ? AND status = 'active' LIMIT 1");
        $prop_config_stmt->execute([$input['construction_type']]);
        $property_config_id = $prop_config_stmt->fetch(PDO::FETCH_COLUMN);

        // Calculate building annual tax (5% Basic + 5% SEF = 10% total)
        $building_annual_tax = $input['building_assessed_value'] * 0.10;
        $building_basic_tax = $building_annual_tax * 0.5; // 50% of total tax
        $building_sef_tax = $building_annual_tax * 0.5;   // 50% of total tax

        $building_query = "
            INSERT INTO building_properties 
            (land_id, inspection_id, construction_type, property_config_id,
             floor_area_sqm, year_built, building_market_value, building_depreciated_value,
             depreciation_percent, building_assessed_value, assessment_level,
             basic_tax_config_id, sef_tax_config_id, basic_tax_amount, sef_tax_amount, annual_tax)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            construction_type = VALUES(construction_type),
            floor_area_sqm = VALUES(floor_area_sqm),
            year_built = VALUES(year_built),
            building_market_value = VALUES(building_market_value),
            building_depreciated_value = VALUES(building_depreciated_value),
            depreciation_percent = VALUES(depreciation_percent),
            building_assessed_value = VALUES(building_assessed_value),
            assessment_level = VALUES(assessment_level),
            basic_tax_config_id = VALUES(basic_tax_config_id),
            sef_tax_config_id = VALUES(sef_tax_config_id),
            basic_tax_amount = VALUES(basic_tax_amount),
            sef_tax_amount = VALUES(sef_tax_amount),
            annual_tax = VALUES(annual_tax)
        ";
        
        $building_stmt = $pdo->prepare($building_query);
        $building_stmt->execute([
            $land_id, $inspection_id, $input['construction_type'], $property_config_id,
            $input['floor_area_sqm'], $input['year_built'], $input['building_market_value'], $input['building_depreciated_value'],
            $input['depreciation_percent'], $input['building_assessed_value'], $input['building_assessment_level'],
            $basic_tax_id, $sef_tax_id, $building_basic_tax, $building_sef_tax, $building_annual_tax
        ]);
        
        $building_action = $building_stmt->rowCount() > 0 ? 'updated' : 'inserted';
    }

    // Create or update property_totals (for display purposes, status remains assessed)
    $total_annual_tax = $land_annual_tax + $building_annual_tax;
    
    $totals_query = "
        INSERT INTO property_totals 
        (registration_id, land_id, land_annual_tax, total_building_annual_tax, total_annual_tax, status)
        VALUES (?, ?, ?, ?, ?, 'active')
        ON DUPLICATE KEY UPDATE
        land_annual_tax = VALUES(land_annual_tax),
        total_building_annual_tax = VALUES(total_building_annual_tax),
        total_annual_tax = VALUES(total_annual_tax),
        status = VALUES(status)
    ";
    
    $totals_stmt = $pdo->prepare($totals_query);
    $totals_stmt->execute([
        $registration_id, 
        $land_id,
        $land_annual_tax,
        $building_annual_tax,
        $total_annual_tax
    ]);

    // Update registration status to assessed
    $status_stmt = $pdo->prepare("UPDATE property_registrations SET status = 'assessed' WHERE id = ?");
    $status_stmt->execute([$registration_id]);

    echo json_encode([
        'status' => 'success',
        'message' => 'Property assessment saved successfully',
        'action' => $building_action !== 'none' ? 'Land and building assessment saved' : 'Land assessment saved',
        'land_annual_tax' => $land_annual_tax,
        'building_annual_tax' => $building_annual_tax,
        'total_annual_tax' => $total_annual_tax
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>