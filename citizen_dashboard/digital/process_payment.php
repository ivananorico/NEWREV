<?php
// process_payment.php
header('Content-Type: application/json');

// Include database connection
include_once '../../db/Digital/digital_db.php';

// Get the input data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

error_log("Process Payment received: " . print_r($data, true));

if (!$data) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid input data']);
    exit;
}

// Validate required fields
if (!isset($data['payment_id']) || !isset($data['otp_code'])) {
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit;
}

$payment_id = $data['payment_id'];
$otp_code = $data['otp_code'];

try {
    // Start transaction
    $pdo->beginTransaction();

    // Check if transaction exists and is pending
    $check_stmt = $pdo->prepare("
        SELECT * FROM payment_transactions 
        WHERE payment_id = :payment_id 
        AND payment_status = 'pending'
        AND otp_verified = 0
    ");
    
    $check_stmt->execute([':payment_id' => $payment_id]);
    $transaction = $check_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$transaction) {
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => 'Transaction not found or already processed']);
        exit;
    }

    // Verify OTP
    if ($transaction['otp_code'] !== $otp_code) {
        // Increment OTP attempts
        $attempt_stmt = $pdo->prepare("
            UPDATE payment_transactions 
            SET otp_attempts = otp_attempts + 1 
            WHERE payment_id = :payment_id
        ");
        $attempt_stmt->execute([':payment_id' => $payment_id]);
        
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => 'Invalid OTP code']);
        exit;
    }

    // Generate receipt number
    $receipt_number = 'RCPT-' . date('YmdHis') . '-' . rand(1000, 9999);

    // Update payment as paid
    $update_stmt = $pdo->prepare("
        UPDATE payment_transactions 
        SET payment_status = 'paid',
            otp_verified = 1,
            receipt_number = :receipt_number,
            paid_at = NOW()
        WHERE payment_id = :payment_id
    ");
    
    $update_stmt->execute([
        ':payment_id' => $payment_id,
        ':receipt_number' => $receipt_number
    ]);

    // Call webhook if URL exists
    $webhook_result = null;
    if (!empty($transaction['webhook_url'])) {
        $webhook_payload = [
            'payment_id' => $transaction['payment_id'],
            'client_system' => $transaction['client_system'],
            'client_reference' => $transaction['client_reference'],
            'purpose' => $transaction['purpose'],
            'amount' => $transaction['amount'],
            'payment_method' => $transaction['payment_method'],
            'receipt_number' => $receipt_number,
            'paid_at' => date('Y-m-d H:i:s'),
            'status' => 'paid',
            'phone' => $transaction['phone']
        ];

        $webhook_result = callWebhook($transaction['webhook_url'], $webhook_payload);
        
        // Log webhook call
        $log_stmt = $pdo->prepare("
            INSERT INTO webhook_logs (transaction_id, webhook_url, payload, response, status_code)
            VALUES (:transaction_id, :webhook_url, :payload, :response, :status_code)
        ");
        
        $log_stmt->execute([
            ':transaction_id' => $transaction['id'],
            ':webhook_url' => $transaction['webhook_url'],
            ':payload' => json_encode($webhook_payload),
            ':response' => $webhook_result['response'],
            ':status_code' => $webhook_result['status_code']
        ]);
    }

    // Commit transaction
    $pdo->commit();

    echo json_encode([
        'status' => 'success',
        'message' => 'Payment completed successfully',
        'receipt_number' => $receipt_number,
        'webhook_called' => !empty($transaction['webhook_url'])
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    error_log("Payment processing error: " . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => 'Payment processing failed']);
}

function callWebhook($webhook_url, $payload) {
    $ch = curl_init();
    
    curl_setopt_array($ch, [
        CURLOPT_URL => $webhook_url,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
        ],
        CURLOPT_TIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => false
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'response' => $response,
        'status_code' => $http_code
    ];
}
?>