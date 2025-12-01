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
        getCapitalConfigurations();
        break;
    case 'POST':
        createCapitalConfiguration();
        break;
    case 'PUT':
        updateCapitalConfiguration();
        break;
    case 'PATCH':
        patchCapitalConfiguration();
        break;
    case 'DELETE':
        deleteCapitalConfiguration();
        break;
    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
}

function getCapitalConfigurations() {
    global $pdo;
    
    $currentDate = isset($_GET['current_date']) ? $_GET['current_date'] : date('Y-m-d');
    
    try {
        $stmt = $pdo->prepare("
            SELECT * FROM capital_investment_tax_config 
            WHERE effective_date <= ? 
            AND (expiration_date IS NULL OR expiration_date >= ?)
            ORDER BY min_capital ASC
        ");
        $stmt->execute([$currentDate, $currentDate]);
        $configurations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($configurations);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $e->getMessage()]);
    }
}

function createCapitalConfiguration() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid JSON data"]);
        return;
    }
    
    // Validate required fields
    $required = ['min_capital', 'max_capital', 'tax_percent', 'effective_date'];
    foreach ($required as $field) {
        if (!isset($input[$field])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required field: $field"]);
            return;
        }
    }
    
    // Validate min < max
    if ($input['min_capital'] >= $input['max_capital']) {
        http_response_code(400);
        echo json_encode(["error" => "Minimum capital must be less than maximum capital"]);
        return;
    }
    
    // Check for overlapping capital ranges
    try {
        $checkStmt = $pdo->prepare("
            SELECT * FROM capital_investment_tax_config 
            WHERE (
                (min_capital <= ? AND max_capital >= ?) OR 
                (min_capital <= ? AND max_capital >= ?) OR
                (min_capital >= ? AND max_capital <= ?)
            )
            AND (expiration_date IS NULL OR expiration_date >= ?)
            AND id != ?
        ");
        
        // For new records, use ID 0 (won't match any existing record)
        $checkStmt->execute([
            $input['min_capital'], $input['min_capital'],
            $input['max_capital'], $input['max_capital'],
            $input['min_capital'], $input['max_capital'],
            $input['effective_date'],
            0
        ]);
        
        if ($checkStmt->rowCount() > 0) {
            http_response_code(400);
            echo json_encode(["error" => "Capital range overlaps with existing configuration"]);
            return;
        }
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Validation error: " . $e->getMessage()]);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO capital_investment_tax_config (
                min_capital, max_capital, tax_percent, effective_date, expiration_date, remarks
            ) VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $input['min_capital'],
            $input['max_capital'],
            $input['tax_percent'],
            $input['effective_date'],
            !empty($input['expiration_date']) ? $input['expiration_date'] : null,
            !empty($input['remarks']) ? $input['remarks'] : null
        ]);
        
        echo json_encode([
            "message" => "Capital investment tax configuration created successfully", 
            "id" => $pdo->lastInsertId()
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to create capital configuration: " . $e->getMessage()]);
    }
}

function updateCapitalConfiguration() {
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
    
    // Validate min < max if both provided
    if (isset($input['min_capital']) && isset($input['max_capital'])) {
        if ($input['min_capital'] >= $input['max_capital']) {
            http_response_code(400);
            echo json_encode(["error" => "Minimum capital must be less than maximum capital"]);
            return;
        }
    }
    
    // Check for overlapping capital ranges (excluding current record)
    if (isset($input['min_capital']) || isset($input['max_capital'])) {
        $min = isset($input['min_capital']) ? $input['min_capital'] : null;
        $max = isset($input['max_capital']) ? $input['max_capital'] : null;
        
        try {
            // First, get current values to fill missing ones
            $currentStmt = $pdo->prepare("SELECT min_capital, max_capital FROM capital_investment_tax_config WHERE id = ?");
            $currentStmt->execute([$id]);
            $current = $currentStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$current) {
                http_response_code(404);
                echo json_encode(["error" => "Capital configuration not found"]);
                return;
            }
            
            $min = $min ?? $current['min_capital'];
            $max = $max ?? $current['max_capital'];
            
            $checkStmt = $pdo->prepare("
                SELECT * FROM capital_investment_tax_config 
                WHERE (
                    (min_capital <= ? AND max_capital >= ?) OR 
                    (min_capital <= ? AND max_capital >= ?) OR
                    (min_capital >= ? AND max_capital <= ?)
                )
                AND (expiration_date IS NULL OR expiration_date >= ?)
                AND id != ?
            ");
            
            $checkStmt->execute([
                $min, $min,
                $max, $max,
                $min, $max,
                isset($input['effective_date']) ? $input['effective_date'] : date('Y-m-d'),
                $id
            ]);
            
            if ($checkStmt->rowCount() > 0) {
                http_response_code(400);
                echo json_encode(["error" => "Capital range overlaps with existing configuration"]);
                return;
            }
            
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Validation error: " . $e->getMessage()]);
            return;
        }
    }
    
    try {
        $stmt = $pdo->prepare("
            UPDATE capital_investment_tax_config SET 
                min_capital = COALESCE(?, min_capital),
                max_capital = COALESCE(?, max_capital),
                tax_percent = COALESCE(?, tax_percent),
                effective_date = COALESCE(?, effective_date),
                expiration_date = ?,
                remarks = COALESCE(?, remarks)
            WHERE id = ?
        ");
        
        $stmt->execute([
            isset($input['min_capital']) ? $input['min_capital'] : null,
            isset($input['max_capital']) ? $input['max_capital'] : null,
            isset($input['tax_percent']) ? $input['tax_percent'] : null,
            isset($input['effective_date']) ? $input['effective_date'] : null,
            isset($input['expiration_date']) ? $input['expiration_date'] : null,
            isset($input['remarks']) ? $input['remarks'] : null,
            $id
        ]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(["message" => "Capital investment tax configuration updated successfully"]);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Capital configuration not found"]);
        }
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to update capital configuration: " . $e->getMessage()]);
    }
}

function patchCapitalConfiguration() {
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
    
    // Special handling for expiration (common use case)
    if (isset($input['expiration_date'])) {
        try {
            $stmt = $pdo->prepare("
                UPDATE capital_investment_tax_config 
                SET expiration_date = ?
                WHERE id = ?
            ");
            
            $stmt->execute([
                $input['expiration_date'],
                $id
            ]);
            
            if ($stmt->rowCount() > 0) {
                echo json_encode(["message" => "Capital configuration expired successfully"]);
            } else {
                http_response_code(404);
                echo json_encode(["error" => "Capital configuration not found"]);
            }
            return;
            
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Failed to expire capital configuration: " . $e->getMessage()]);
            return;
        }
    }
    
    // General PATCH for other fields
    $fields = [];
    $values = [];
    
    // Only allow fields that exist in the database
    $allowedFields = ['min_capital', 'max_capital', 'tax_percent', 'effective_date', 'expiration_date', 'remarks'];
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
    $sql = "UPDATE capital_investment_tax_config SET " . implode(', ', $fields) . " WHERE id = ?";
    
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(["message" => "Capital configuration updated successfully"]);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Capital configuration not found"]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to update capital configuration: " . $e->getMessage()]);
    }
}

function deleteCapitalConfiguration() {
    global $pdo;
    
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "Missing ID parameter"]);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM capital_investment_tax_config WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(["message" => "Capital configuration deleted successfully"]);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Capital configuration not found"]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to delete capital configuration: " . $e->getMessage()]);
    }
}
?>