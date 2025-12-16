<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include your PDO DB connection
require_once '../../db/Business/business_db.php'; // adjust path if needed

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    saveBusinessPermit();
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// ==================== SAVE BUSINESS PERMIT ====================
function saveBusinessPermit() {
    global $pdo;
    
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No data received']);
        exit();
    }

    // Validate required fields
    $required_fields = ['business_permit_id', 'business_name', 'owner_name', 'business_type', 'capital_investment'];
    $missing_fields = [];
    
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || $input[$field] === '') {
            $missing_fields[] = $field;
        }
    }
    
    if (!empty($missing_fields)) {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'message' => 'Missing required fields: ' . implode(', ', $missing_fields)
        ]);
        exit();
    }

    try {
        $pdo->beginTransaction();
        
        // Generate business permit ID if not provided
        if (empty($input['business_permit_id']) || $input['business_permit_id'] === 'auto') {
            $input['business_permit_id'] = generateBusinessPermitId($pdo);
        }
        
        // Prepare SQL with correct field names matching your database schema
        $sql = "INSERT INTO business_permits (
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
            created_at
        ) VALUES (
            :business_permit_id, 
            :business_name, 
            :owner_name, 
            :business_type,
            :capital_investment, 
            :gross_sales, 
            :address, 
            :contact_number, 
            :phone,
            :issue_date, 
            :expiry_date, 
            :is_renewal, 
            :previous_permit_id, 
            :status,
            NOW()
        )";

        $stmt = $pdo->prepare($sql);
        
        // Set default values and sanitize data
        $params = [
            ':business_permit_id' => htmlspecialchars($input['business_permit_id']),
            ':business_name' => htmlspecialchars($input['business_name']),
            ':owner_name' => htmlspecialchars($input['owner_name']),
            ':business_type' => htmlspecialchars($input['business_type']),
            ':capital_investment' => floatval($input['capital_investment']),
            ':gross_sales' => isset($input['gross_sales']) ? floatval($input['gross_sales']) : 0.00,
            ':address' => isset($input['address']) ? htmlspecialchars($input['address']) : '',
            ':contact_number' => isset($input['contact_number']) ? htmlspecialchars($input['contact_number']) : '',
            ':phone' => isset($input['phone']) ? htmlspecialchars($input['phone']) : (isset($input['contact_number']) ? htmlspecialchars($input['contact_number']) : ''),
            ':issue_date' => isset($input['issue_date']) ? $input['issue_date'] : date('Y-m-d'),
            ':expiry_date' => isset($input['expiry_date']) ? $input['expiry_date'] : date('Y-m-d', strtotime('+1 year')),
            ':is_renewal' => isset($input['is_renewal']) ? intval($input['is_renewal']) : 0,
            ':previous_permit_id' => isset($input['previous_permit_id']) ? htmlspecialchars($input['previous_permit_id']) : null,
            ':status' => isset($input['status']) ? $input['status'] : 'Pending' // Default to Pending for validation
        ];

        // Execute the query
        if ($stmt->execute($params)) {
            $permitId = $pdo->lastInsertId();
            
            // Automatically calculate tax assessment
            $assessmentId = calculateTaxAssessment($pdo, $input);
            
            $pdo->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Business permit saved successfully',
                'permit_id' => $input['business_permit_id'],
                'record_id' => $permitId,
                'assessment_id' => $assessmentId
            ]);
            
        } else {
            throw new Exception("Failed to insert permit");
        }
        
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        
        // Log the error
        error_log("Business Permit Save Error: " . $e->getMessage());
        
        echo json_encode([
            'success' => false,
            'message' => 'Failed to save business permit: ' . $e->getMessage(),
            'error_details' => $stmt ? $stmt->errorInfo() : []
        ]);
    }
}

// ==================== GENERATE BUSINESS PERMIT ID ====================
function generateBusinessPermitId($pdo) {
    $currentYear = date('Y');
    
    // Get the latest permit ID for current year
    $sql = "SELECT business_permit_id FROM business_permits 
            WHERE business_permit_id LIKE 'BP-{$currentYear}-%'
            ORDER BY business_permit_id DESC LIMIT 1";
    
    $stmt = $pdo->query($sql);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result) {
        $lastId = $result['business_permit_id'];
        $parts = explode('-', $lastId);
        $lastNumber = intval($parts[2]);
        $newNumber = str_pad($lastNumber + 1, 3, '0', STR_PAD_LEFT);
    } else {
        $newNumber = '001';
    }
    
    return "BP-{$currentYear}-{$newNumber}";
}

// ==================== AUTOMATIC TAX CALCULATION ====================
function calculateTaxAssessment($pdo, $permitData) {
    try {
        // Get business tax rate
        $taxRateQuery = "SELECT tax_rate FROM business_tax_rate_config 
                        WHERE business_type = :business_type 
                        AND (expiration_date IS NULL OR expiration_date >= CURDATE())
                        ORDER BY effective_date DESC LIMIT 1";
        $taxRateStmt = $pdo->prepare($taxRateQuery);
        $taxRateStmt->execute([':business_type' => $permitData['business_type']]);
        $taxRate = $taxRateStmt->fetch(PDO::FETCH_ASSOC);
        
        // Get capital investment tax rate
        $capitalTaxQuery = "SELECT tax_percent FROM capital_investment_tax_config 
                           WHERE :capital BETWEEN min_capital AND max_capital
                           AND (expiration_date IS NULL OR expiration_date >= CURDATE())
                           ORDER BY effective_date DESC LIMIT 1";
        $capitalTaxStmt = $pdo->prepare($capitalTaxQuery);
        $capitalTaxStmt->execute([':capital' => $permitData['capital_investment']]);
        $capitalTax = $capitalTaxStmt->fetch(PDO::FETCH_ASSOC);
        
        // Get regulatory fees
        $regulatoryQuery = "SELECT SUM(amount) as total_fees FROM regulatory_fee_config 
                           WHERE (business_type = :business_type OR business_type = 'All')
                           AND (expiration_date IS NULL OR expiration_date >= CURDATE())";
        $regulatoryStmt = $pdo->prepare($regulatoryQuery);
        $regulatoryStmt->execute([':business_type' => $permitData['business_type']]);
        $regulatoryFees = $regulatoryStmt->fetch(PDO::FETCH_ASSOC);
        
        // Calculate taxes
        $businessTax = $permitData['gross_sales'] * ($taxRate['tax_rate'] / 100);
        $capitalTaxAmount = $permitData['capital_investment'] * ($capitalTax['tax_percent'] / 100);
        $totalRegulatory = $regulatoryFees['total_fees'] ?? 999.98; // Default if not found
        
        $totalAnnualTax = $businessTax + $capitalTaxAmount + $totalRegulatory;
        
        // Save tax assessment
        $assessmentSql = "INSERT INTO business_tax_assessments (
            business_permit_id, 
            assessment_date, 
            capital_investment, 
            gross_sales, 
            capital_tax, 
            business_tax, 
            regulatory_fees, 
            total_annual_tax,
            created_at
        ) VALUES (
            :business_permit_id, 
            CURDATE(), 
            :capital_investment, 
            :gross_sales, 
            :capital_tax, 
            :business_tax, 
            :regulatory_fees, 
            :total_annual_tax,
            NOW()
        )";
        
        $assessmentStmt = $pdo->prepare($assessmentSql);
        $assessmentStmt->execute([
            ':business_permit_id' => $permitData['business_permit_id'],
            ':capital_investment' => $permitData['capital_investment'],
            ':gross_sales' => $permitData['gross_sales'] ?? 0,
            ':capital_tax' => $capitalTaxAmount,
            ':business_tax' => $businessTax,
            ':regulatory_fees' => $totalRegulatory,
            ':total_annual_tax' => $totalAnnualTax
        ]);
        
        return $pdo->lastInsertId();
        
    } catch (Exception $e) {
        error_log("Tax Calculation Error: " . $e->getMessage());
        return null;
    }
}

?>