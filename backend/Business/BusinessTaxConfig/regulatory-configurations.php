<?php
// Enable CORS with proper headers
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database connection
require_once '../../../db/Business/business_db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getRegulatoryConfigurations();
        break;
    case 'POST':
        createRegulatoryConfiguration();
        break;
    case 'PUT':
        updateRegulatoryConfiguration();
        break;
    case 'PATCH':
        patchRegulatoryConfiguration();
        break;
    case 'DELETE':
        deleteRegulatoryConfiguration();
        break;
    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
}

function getRegulatoryConfigurations() {
    global $pdo;
    
    $currentDate = isset($_GET['current_date']) ? $_GET['current_date'] : date('Y-m-d');
    
    try {
        $stmt = $pdo->prepare("
            SELECT * FROM regulatory_fee_config 
            WHERE effective_date <= ? 
            AND (expiration_date IS NULL OR expiration_date >= ?)
            ORDER BY fee_name, business_type
        ");
        $stmt->execute([$currentDate, $currentDate]);
        $configurations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($configurations);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $e->getMessage()]);
    }
}

function createRegulatoryConfiguration() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid JSON data"]);
        return;
    }
    
    // Validate required fields
    $required = ['fee_name', 'amount', 'effective_date'];
    foreach ($required as $field) {
        if (!isset($input[$field])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required field: $field"]);
            return;
        }
    }
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO regulatory_fee_config (
                fee_name, business_type, amount, effective_date, expiration_date, remarks
            ) VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $input['fee_name'],
            !empty($input['business_type']) ? $input['business_type'] : null,
            $input['amount'],
            $input['effective_date'],
            !empty($input['expiration_date']) ? $input['expiration_date'] : null,
            !empty($input['remarks']) ? $input['remarks'] : null
        ]);
        
        echo json_encode([
            "message" => "Regulatory configuration created successfully", 
            "id" => $pdo->lastInsertId()
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to create regulatory configuration: " . $e->getMessage()]);
    }
}

function updateRegulatoryConfiguration() {
    global $pdo;
    
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "Missing ID parameter"]);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid JSON data"]);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("
            UPDATE regulatory_fee_config SET 
                fee_name = ?, business_type = ?, amount = ?, 
                effective_date = ?, expiration_date = ?, remarks = ?
            WHERE id = ?
        ");
        
        $stmt->execute([
            $input['fee_name'],
            !empty($input['business_type']) ? $input['business_type'] : null,
            $input['amount'],
            $input['effective_date'],
            !empty($input['expiration_date']) ? $input['expiration_date'] : null,
            !empty($input['remarks']) ? $input['remarks'] : null,
            $id
        ]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(["message" => "Regulatory configuration updated successfully"]);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Regulatory configuration not found"]);
        }
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to update regulatory configuration: " . $e->getMessage()]);
    }
}

function patchRegulatoryConfiguration() {
    global $pdo;
    
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "Missing ID parameter"]);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid JSON data"]);
        return;
    }
    
    $fields = [];
    $values = [];
    
    $allowedFields = ['expiration_date', 'amount', 'business_type'];
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $fields[] = "$field = ?";
            $values[] = $input[$field];
        }
    }
    
    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(["error" => "No valid fields to update"]);
        return;
    }
    
    $values[] = $id;
    $sql = "UPDATE regulatory_fee_config SET " . implode(', ', $fields) . " WHERE id = ?";
    
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(["message" => "Regulatory configuration updated successfully"]);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Regulatory configuration not found"]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to update regulatory configuration: " . $e->getMessage()]);
    }
}

function deleteRegulatoryConfiguration() {
    global $pdo;
    
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "Missing ID parameter"]);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM regulatory_fee_config WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(["message" => "Regulatory configuration deleted successfully"]);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Regulatory configuration not found"]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to delete regulatory configuration: " . $e->getMessage()]);
    }
}
?>