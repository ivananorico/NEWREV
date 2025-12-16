<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Include your PDO DB connection
require_once '../../db/Business/business_db.php'; // adjust path if needed

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'message' => 'No data received']);
    exit;
}

// Save the business permit
$permit_id = saveBusinessPermit($input, $pdo);

if ($permit_id) {
    echo json_encode([
        'success' => true,
        'message' => 'Business permit received successfully',
        'permit_id' => $permit_id
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to save permit'
    ]);
}

// ==================== SAVE BUSINESS PERMIT ====================
function saveBusinessPermit($data, $pdo) {
    $sql = "INSERT INTO business_permits (
        business_permit_id, business_name, owner_name, business_type,
        capital_investment, gross_sales, address, contact_number, phone,
        issue_date, expiry_date, is_renewal, previous_permit_id, status
    ) VALUES (
        :business_permit_id, :business_name, :owner_name, :business_type,
        :capital_investment, :gross_sales, :address, :contact_number, :phone,
        :issue_date, :expiry_date, :is_renewal, :previous_permit_id, 'Active'
    )";

    $stmt = $pdo->prepare($sql);
    $params = [
        ':business_permit_id' => $data['business_permit_id'],
        ':business_name' => $data['business_name'],
        ':owner_name' => $data['owner_name'],
        ':business_type' => $data['business_type'],
        ':capital_investment' => $data['capital_investment'] ?? 0,
        ':gross_sales' => $data['gross_sales'] ?? 0,
        ':address' => $data['address'] ?? '',
        ':contact_number' => $data['contact_number'] ?? '',
        ':phone' => $data['phone'] ?? ($data['contact_number'] ?? ''),
        ':issue_date' => $data['issue_date'] ?? date('Y-m-d'),
        ':expiry_date' => $data['expiry_date'] ?? date('Y-m-d', strtotime('+1 year')),
        ':is_renewal' => isset($data['gross_sales']) && $data['gross_sales'] > 0 ? 1 : 0,
        ':previous_permit_id' => $data['previous_permit_id'] ?? null
    ];

    if ($stmt->execute($params)) {
        return $data['business_permit_id'];
    } else {
        error_log("Failed to insert permit: " . implode(", ", $stmt->errorInfo()));
        return false;
    }
}
?>
