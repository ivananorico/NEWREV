<?php
// rpt_webhook.php
header('Content-Type: application/json');

// Database configuration for RPT system
$rpt_host = 'localhost:3307';
$rpt_dbname = 'rpt';
$rpt_username = 'root';
$rpt_password = '';

try {
    $rpt_pdo = new PDO("mysql:host=$rpt_host;dbname=$rpt_dbname;charset=utf8mb4", $rpt_username, $rpt_password);
    $rpt_pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    error_log("RPT Database connection failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
    exit;
}

// Get the raw POST data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Log the received webhook data
error_log("RPT Webhook received: " . $input);

if (!$data) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON data']);
    exit;
}

// Validate required fields
$required_fields = ['payment_id', 'client_reference', 'client_system', 'purpose', 'amount', 'payment_method', 'receipt_number', 'paid_at', 'status'];
foreach ($required_fields as $field) {
    if (!isset($data[$field])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => "Missing required field: $field"]);
        exit;
    }
}

// Only process paid transactions
if ($data['status'] !== 'paid') {
    echo json_encode(['status' => 'ignored', 'message' => 'Transaction not paid, ignoring']);
    exit;
}

try {
    // Extract the quarterly tax ID from client_reference (e.g., "RPT-2" -> ID 2)
    $client_ref = $data['client_reference'];
    
    if (!preg_match('/RPT-(\d+)/', $client_ref, $matches)) {
        throw new Exception("Invalid client reference format: " . $client_ref);
    }
    
    $quarterly_tax_id = $matches[1];

    // Update the quarterly_taxes table
    $update_query = "
        UPDATE quarterly_taxes 
        SET payment_status = 'paid', 
            payment_date = :payment_date,
            receipt_number = :receipt_number
        WHERE id = :id 
        AND payment_status = 'pending'
    ";
    
    $stmt = $rpt_pdo->prepare($update_query);
    $stmt->execute([
        ':id' => $quarterly_tax_id,
        ':payment_date' => date('Y-m-d', strtotime($data['paid_at'])),
        ':receipt_number' => $data['receipt_number']
    ]);
    
    $affected_rows = $stmt->rowCount();
    
    if ($affected_rows > 0) {
        http_response_code(200);
        echo json_encode([
            'status' => 'success', 
            'message' => 'Payment successfully recorded in RPT system',
            'quarterly_tax_id' => $quarterly_tax_id
        ]);
    } else {
        http_response_code(200);
        echo json_encode([
            'status' => 'warning', 
            'message' => 'No matching RPT record found or already updated'
        ]);
    }
    
} catch (Exception $e) {
    error_log("RPT Webhook error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Failed to process payment in RPT system'
    ]);
}
?>