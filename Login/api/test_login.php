<?php
header('Content-Type: text/plain');
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Test password verification
$password = 'admin';
$hash_from_db = '$2y$10$r3.bbqix6pX4o.ZQ5WrL.e.bBS.w7/.K.wmM8p8JQc8.wtV7.jB7O';

echo "=== PASSWORD VERIFICATION TEST ===\n";
echo "Password: 'admin'\n";
echo "Hash from DB: " . $hash_from_db . "\n";

if (password_verify($password, $hash_from_db)) {
    echo "✅ PASSWORD VERIFIES CORRECTLY!\n";
} else {
    echo "❌ PASSWORD VERIFICATION FAILED!\n";
    
    // Let's try to create a new hash
    $new_hash = password_hash('admin', PASSWORD_DEFAULT);
    echo "New hash for 'admin': " . $new_hash . "\n";
    
    if (password_verify('admin', $new_hash)) {
        echo "✅ New hash works!\n";
    }
}

echo "\n=== DATABASE CONNECTION TEST ===\n";
try {
    require_once '../config/database.php';
    $database = new Database();
    $db = $database->getConnection();
    echo "✅ Database connection successful\n";
    
    // Check if admin user exists
    $query = "SELECT id, email, password_hash, role FROM users WHERE email = 'admin@system.com'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "✅ Admin user found:\n";
        echo "   ID: " . $row['id'] . "\n";
        echo "   Email: " . $row['email'] . "\n";
        echo "   Role: " . $row['role'] . "\n";
        echo "   Password Hash: " . $row['password_hash'] . "\n";
        
        // Test the actual hash from database
        if (password_verify('admin', $row['password_hash'])) {
            echo "✅ Database hash verifies correctly!\n";
        } else {
            echo "❌ Database hash verification failed!\n";
        }
    } else {
        echo "❌ Admin user not found in database!\n";
    }
    
} catch (Exception $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
}
?>