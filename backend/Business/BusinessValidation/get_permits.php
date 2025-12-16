<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../../../db/Business/business_db.php';

try {
    // Fetch all business permits
    $stmt = $pdo->prepare("
        SELECT 
            id,
            business_permit_id,
            business_name,
            owner_name,
            business_type,
            capital_investment,
            gross_sales,
            address,
            contact_number,
            phone,
            issue_date,
            expiry_date,
            is_renewal,
            previous_permit_id,
            status,
            created_at,
            user_id
        FROM business_permits 
        ORDER BY 
            CASE status 
                WHEN 'Pending' THEN 1
                WHEN 'Active' THEN 2
                WHEN 'Expired' THEN 3
                ELSE 4
            END,
            created_at DESC
    ");
    
    $stmt->execute();
    $permits = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "count" => count($permits),
        "permits" => $permits
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>