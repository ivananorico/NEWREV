<?php
// test_webhook_direct.php - Test webhook directly
header('Content-Type: text/html; charset=utf-8');

// Test with an actual quarterly_tax ID that exists
echo "<h1>Testing RPT Webhook Directly</h1>";

// First, check what's in quarterly_taxes table
$rpt_host = 'localhost:3307';
$rpt_dbname = 'rpt';
$rpt_username = 'root';
$rpt_password = '';

try {
    $rpt_pdo = new PDO("mysql:host=$rpt_host;dbname=$rpt_dbname;charset=utf8mb4", $rpt_username, $rpt_password);
    $rpt_pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get all quarterly taxes
    $stmt = $rpt_pdo->query("SELECT * FROM quarterly_taxes ORDER BY id");
    $taxes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h2>Current Quarterly Taxes in RPT Database:</h2>";
    echo "<table border='1' cellpadding='5'>";
    echo "<tr><th>ID</th><th>Quarter</th><th>Year</th><th>Payment Status</th><th>Receipt Number</th><th>Total Tax</th></tr>";
    foreach ($taxes as $tax) {
        echo "<tr>";
        echo "<td>" . $tax['id'] . "</td>";
        echo "<td>" . $tax['quarter'] . "</td>";
        echo "<td>" . $tax['year'] . "</td>";
        echo "<td>" . $tax['payment_status'] . "</td>";
        echo "<td>" . ($tax['receipt_number'] ?? 'NULL') . "</td>";
        echo "<td>₱" . number_format($tax['total_quarterly_tax'], 2) . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    if (empty($taxes)) {
        echo "<p style='color: red;'>No quarterly taxes found! You need to have properties approved first.</p>";
        exit;
    }
    
    // Pick the first pending tax
    $selected_tax = null;
    foreach ($taxes as $tax) {
        if ($tax['payment_status'] === 'pending') {
            $selected_tax = $tax;
            break;
        }
    }
    
    if (!$selected_tax) {
        echo "<p style='color: orange;'>No pending taxes found. All are already paid.</p>";
        $selected_tax = $taxes[0]; // Use first one anyway for testing
    }
    
    echo "<h2>Selected Tax for Testing:</h2>";
    echo "<pre>" . print_r($selected_tax, true) . "</pre>";
    
    // Test webhook call
    $test_data = [
        'payment_id' => 'PAY-DIRECT-TEST-' . time(),
        'client_system' => 'rpt',
        'client_reference' => 'RPT-' . $selected_tax['id'], // Use actual ID
        'purpose' => 'Direct Test Payment',
        'amount' => $selected_tax['total_quarterly_tax'],
        'payment_method' => 'gcash',
        'receipt_number' => 'RCPT-DIRECT-' . date('YmdHis'),
        'paid_at' => date('Y-m-d H:i:s'),
        'status' => 'paid',
        'phone' => '09123456789'
    ];
    
    echo "<h2>Sending Webhook Data:</h2>";
    echo "<pre>" . json_encode($test_data, JSON_PRETTY_PRINT) . "</pre>";
    
    $ch = curl_init('http://localhost/revenue/citizen_dashboard/rpt/rpt_tax_payment/rpt_webhook.php');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($test_data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    echo "<h2>Webhook Response (HTTP $http_code):</h2>";
    if ($error) {
        echo "<p style='color: red;'>CURL Error: $error</p>";
    }
    echo "<pre>" . htmlspecialchars($response) . "</pre>";
    
    // Check if database was updated
    $check_stmt = $rpt_pdo->prepare("SELECT * FROM quarterly_taxes WHERE id = ?");
    $check_stmt->execute([$selected_tax['id']]);
    $updated_tax = $check_stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "<h2>After Webhook - Database Status:</h2>";
    echo "<pre>" . print_r($updated_tax, true) . "</pre>";
    
    if ($updated_tax['payment_status'] === 'paid') {
        echo "<p style='color: green; font-weight: bold;'>SUCCESS: Database updated!</p>";
    } else {
        echo "<p style='color: red; font-weight: bold;'>FAILED: Database not updated!</p>";
    }
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>Database Error: " . $e->getMessage() . "</p>";
}
?>