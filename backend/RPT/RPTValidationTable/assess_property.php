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
    
    // Get the latest inspection for this registration
    $stmt = $pdo->prepare("SELECT id FROM property_inspections WHERE registration_id = ? ORDER BY id DESC LIMIT 1");
    $stmt->execute([$input['registration_id']]);
    $inspection = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$inspection) {
        throw new Exception("No inspection found for this registration");
    }

    $inspection_id = $inspection['id'];

    // Start transaction
    $pdo->beginTransaction();

    // Insert land property
    $stmt = $pdo->prepare("
        INSERT INTO land_properties 
        (registration_id, inspection_id, tdn, property_type, land_area_sqm, land_market_value, land_assessed_value, assessment_level)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $input['registration_id'],
        $inspection_id,
        $input['land_tdn'],
        $input['land_property_type'],
        $input['land_area_sqm'],
        $input['land_market_value'] ?? null,
        $input['land_assessed_value'] ?? null,
        $input['land_assessment_level'] ?? null
    ]);

    $land_id = $pdo->lastInsertId();

    // Insert building property if has building data
    if (isset($input['building_tdn']) && !empty($input['building_tdn'])) {
        $stmt = $pdo->prepare("
            INSERT INTO building_properties 
            (land_id, inspection_id, tdn, construction_type, floor_area_sqm, year_built, useful_life_years,
             building_market_value, building_depreciated_value, depreciation_percent, building_assessed_value, assessment_level)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $land_id,
            $inspection_id,
            $input['building_tdn'],
            $input['construction_type'],
            $input['floor_area_sqm'],
            $input['year_built'],
            $input['useful_life_years'] ?? 50,
            $input['building_market_value'] ?? null,
            $input['building_depreciated_value'] ?? null,
            $input['depreciation_percent'] ?? null,
            $input['building_assessed_value'] ?? null,
            $input['building_assessment_level'] ?? null
        ]);
    }

    // Commit transaction
    $pdo->commit();

    echo json_encode([
        'status' => 'success',
        'message' => 'Property assessed successfully'
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>