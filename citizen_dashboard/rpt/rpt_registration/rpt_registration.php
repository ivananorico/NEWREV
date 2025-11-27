<?php
// revenue/citizen_dashboard/rpt/rpt_registration/rpt_registration.php
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: ../../../../index.php');
    exit();
}

$user_id = $_SESSION['user_id'];
$user_name = $_SESSION['user_name'] ?? 'Citizen';

// Direct database connection
$host = 'localhost:3307';
$dbname = 'rpt';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

// Handle form submission
$message = '';
$message_type = '';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    try {
        // Generate reference number
        $reference_number = 'RPT-' . date('Ymd') . '-' . rand(1000, 9999);
        
        // Start transaction
        $pdo->beginTransaction();
        
        // 1. Insert into property_owners
        $owner_stmt = $pdo->prepare("INSERT INTO property_owners 
            (owner_code, full_name, email, phone, address, tin_number) 
            VALUES (?, ?, ?, ?, ?, ?)");
        
        $owner_code = 'OWNER-' . date('Ymd') . '-' . rand(1000, 9999);
        $owner_stmt->execute([
            $owner_code,
            $_POST['full_name'],
            $_POST['email'],
            $_POST['phone'],
            $_POST['address'],
            $_POST['tin_number'] ?? null
        ]);
        
        $owner_id = $pdo->lastInsertId();
        
        // 2. Insert into property_registrations (UPDATED - no lot_number)
        $reg_stmt = $pdo->prepare("INSERT INTO property_registrations 
            (reference_number, owner_id, lot_location, barangay, district, has_building, status) 
            VALUES (?, ?, ?, ?, ?, ?, 'pending')");
        
        $reg_stmt->execute([
            $reference_number,
            $owner_id,
            $_POST['lot_location'],
            $_POST['barangay'],
            $_POST['district'],
            $_POST['has_building']
        ]);
        
        $registration_id = $pdo->lastInsertId();
        
        // 3. Auto-schedule inspection (7 days from now)
        $inspection_stmt = $pdo->prepare("INSERT INTO property_inspections 
            (registration_id, scheduled_date, assessor_name, status) 
            VALUES (?, ?, ?, 'scheduled')");
        
        $inspection_date = date('Y-m-d', strtotime('+7 days'));
        $inspection_stmt->execute([
            $registration_id,
            $inspection_date,
            'To be assigned' // Default assessor
        ]);
        
        $pdo->commit();
        
        $message = "✅ Registration submitted successfully! Your Reference Number: <strong>$reference_number</strong>. Inspection scheduled on $inspection_date.";
        $message_type = 'success';
        
    } catch(PDOException $e) {
        $pdo->rollBack();
        $message = "❌ Error: " . $e->getMessage();
        $message_type = 'error';
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Property Registration - RPT Services</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
    <!-- Include Navbar -->
    <?php include '../../navbar.php'; ?>
    
    <!-- Main Content -->
    <main class="container mx-auto px-6 py-8">
        <!-- Page Header -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
            <div class="flex items-center mb-4">
                <a href="../rpt_services.php" class="text-blue-600 hover:text-blue-800 mr-4">
                    <i class="fas fa-arrow-left"></i>
                </a>
                <div>
                    <h1 class="text-3xl font-bold text-gray-800 mb-2">Property Registration</h1>
                    <p class="text-gray-600">Register your property for Real Property Tax assessment</p>
                </div>
            </div>
        </div>

        <!-- Registration Form -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <?php if ($message): ?>
                <div class="mb-6 p-4 rounded-lg <?php echo $message_type == 'success' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'; ?>">
                    <?php echo $message; ?>
                </div>
            <?php endif; ?>

            <form method="POST" class="space-y-6">
                <!-- Personal Information Section -->
                <div class="border-b border-gray-200 pb-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <i class="fas fa-user text-blue-500 mr-2"></i>
                        Personal Information
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                            <input type="text" name="full_name" required 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your full name">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                            <input type="email" name="email" required 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your email">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                            <input type="text" name="phone" required 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your phone number">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">TIN Number</label>
                            <input type="text" name="tin_number" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter TIN (optional)">
                        </div>
                    </div>
                    <div class="mt-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Home Address *</label>
                        <textarea name="address" required rows="3"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your complete home address"></textarea>
                    </div>
                </div>

                <!-- Property Information Section -->
                <div class="border-b border-gray-200 pb-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <i class="fas fa-map-marker-alt text-green-500 mr-2"></i>
                        Property Location
                    </h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Lot Location *</label>
                            <input type="text" name="lot_location" required 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="e.g., Lot 5, Block 2 or specific location">
                            <p class="text-xs text-gray-500 mt-1">The physical location identifier of your property</p>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Barangay *</label>
                                <input type="text" name="barangay" required 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="Enter barangay">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">District *</label>
                                <input type="text" name="district" required 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="Enter district">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Building Information Section -->
                <div class="pb-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <i class="fas fa-building text-purple-500 mr-2"></i>
                        Building Information
                    </h3>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <label class="block text-sm font-medium text-gray-700 mb-3">Does this property have any buildings? *</label>
                        <div class="flex space-x-6">
                            <label class="flex items-center">
                                <input type="radio" name="has_building" value="yes" required 
                                    class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300">
                                <span class="ml-2 text-gray-700">Yes, there is a building/house</span>
                            </label>
                            <label class="flex items-center">
                                <input type="radio" name="has_building" value="no" 
                                    class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300">
                                <span class="ml-2 text-gray-700">No, it's vacant land</span>
                            </label>
                        </div>
                        <p class="text-sm text-gray-500 mt-3">
                            <i class="fas fa-info-circle text-blue-500 mr-1"></i>
                            Our assessor will visit to verify property details and calculate taxes based on actual inspection.
                        </p>
                    </div>
                </div>

                <!-- Submit Button -->
                <div class="flex justify-end">
                    <button type="submit" 
                        class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 flex items-center">
                        <i class="fas fa-paper-plane mr-2"></i>
                        Submit Registration
                    </button>
                </div>
            </form>
        </div>

        <!-- Information Box -->
        <div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 class="font-semibold text-blue-800 mb-2 flex items-center">
                <i class="fas fa-clock mr-2"></i>
                What happens next?
            </h4>
            <ul class="text-blue-700 text-sm space-y-2">
                <li>• You will receive a reference number for tracking</li>
                <li>• Our assessor will contact you to schedule property inspection</li>
                <li>• After inspection, your tax assessment will be calculated</li>
                <li>• You will receive your Tax Declaration Number (TDN)</li>
            </ul>
        </div>
    </main>
</body>
</html>