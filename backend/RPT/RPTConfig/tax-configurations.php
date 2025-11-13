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
require_once '../../../db/RPT/rpt_db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getConfigurations();
        break;
    case 'POST':
        createConfiguration();
        break;
    case 'PUT':
        updateConfiguration();
        break;
    case 'PATCH':
        patchConfiguration();
        break;
    case 'DELETE':
        deleteConfiguration();
        break;
    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
}

function getConfigurations() {
    global $pdo;
    
    $currentDate = isset($_GET['current_date']) ? $_GET['current_date'] : date('Y-m-d');
    
    try {
        // Simple query without status calculation
        $stmt = $pdo->prepare("
            SELECT * FROM rpt_tax_config 
            WHERE effective_date <= ? 
            AND (expiration_date IS NULL OR expiration_date >= ?)
            ORDER BY effective_date DESC, tax_name
        ");
        $stmt->execute([$currentDate, $currentDate]);
        $configurations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Add status field for frontend compatibility
        foreach ($configurations as &$config) {
            $config['status'] = 'active'; // All records from this query are active
        }
        
        echo json_encode($configurations);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $e->getMessage()]);
    }
}

function createConfiguration() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid JSON data"]);
        return;
    }
    
    // Validate required fields
    if (!isset($input['tax_name']) || !isset($input['tax_percent']) || !isset($input['effective_date'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required fields"]);
        return;
    }
    
    try {
        // Check for overlapping configurations
        $checkStmt = $pdo->prepare("
            SELECT id FROM rpt_tax_config 
            WHERE tax_name = ? 
            AND effective_date <= ? 
            AND (expiration_date IS NULL OR expiration_date >= ?)
        ");
        $checkStmt->execute([
            $input['tax_name'],
            $input['effective_date'],
            $input['effective_date']
        ]);
        
        if ($checkStmt->rowCount() > 0) {
            http_response_code(400);
            echo json_encode(["error" => "Active configuration already exists for this tax name on the selected date"]);
            return;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO rpt_tax_config (
                tax_name, tax_percent, effective_date, expiration_date
            ) VALUES (?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $input['tax_name'],
            $input['tax_percent'],
            $input['effective_date'],
            !empty($input['expiration_date']) ? $input['expiration_date'] : null
        ]);
        
        echo json_encode([
            "message" => "Tax configuration created successfully", 
            "id" => $pdo->lastInsertId()
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to create tax configuration: " . $e->getMessage()]);
    }
}

function updateConfiguration() {
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
        // Check for overlapping configurations (excluding current record)
        $checkStmt = $pdo->prepare("
            SELECT id FROM rpt_tax_config 
            WHERE tax_name = ? 
            AND effective_date <= ? 
            AND (expiration_date IS NULL OR expiration_date >= ?)
            AND id != ?
        ");
        $checkStmt->execute([
            $input['tax_name'],
            $input['effective_date'],
            $input['effective_date'],
            $id
        ]);
        
        if ($checkStmt->rowCount() > 0) {
            http_response_code(400);
            echo json_encode(["error" => "Active configuration already exists for this tax name on the selected date"]);
            return;
        }
        
        $stmt = $pdo->prepare("
            UPDATE rpt_tax_config SET 
                tax_name = ?, tax_percent = ?, effective_date = ?, 
                expiration_date = ?
            WHERE id = ?
        ");
        
        $stmt->execute([
            $input['tax_name'],
            $input['tax_percent'],
            $input['effective_date'],
            !empty($input['expiration_date']) ? $input['expiration_date'] : null,
            $id
        ]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(["message" => "Tax configuration updated successfully"]);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Tax configuration not found"]);
        }
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to update tax configuration: " . $e->getMessage()]);
    }
}

function patchConfiguration() {
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
    
    $allowedFields = ['expiration_date', 'tax_percent'];
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
    $sql = "UPDATE rpt_tax_config SET " . implode(', ', $fields) . " WHERE id = ?";
    
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(["message" => "Tax configuration updated successfully"]);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Tax configuration not found"]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to update tax configuration: " . $e->getMessage()]);
    }
}

function deleteConfiguration() {
    global $pdo;
    
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "Missing ID parameter"]);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM rpt_tax_config WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(["message" => "Tax configuration deleted successfully"]);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Tax configuration not found"]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to delete tax configuration: " . $e->getMessage()]);
    }
}
?>