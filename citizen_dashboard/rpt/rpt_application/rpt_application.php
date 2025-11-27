<?php
// revenue/citizen_dashboard/rpt/rpt_application/rpt_application.php
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: ../../../../index.php');
    exit();
}

$user_id = $_SESSION['user_id'];
$user_name = $_SESSION['user_name'] ?? 'Citizen';

// Database connection
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

// Get user's property applications
$applications = [];
try {
    $stmt = $pdo->prepare("
        SELECT 
            pr.reference_number,
            pr.lot_location,
            pr.barangay,
            pr.district,
            pr.has_building,
            pr.status,
            pr.correction_notes,
            pr.created_at,
            pi.scheduled_date,
            pi.assessor_name,
            pi.status as inspection_status
        FROM property_registrations pr
        LEFT JOIN property_owners po ON pr.owner_id = po.id
        LEFT JOIN property_inspections pi ON pr.id = pi.registration_id
        WHERE po.id = ?
        ORDER BY pr.created_at DESC
    ");
    $stmt->execute([$user_id]);
    $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    $error = "Error fetching applications: " . $e->getMessage();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Status - RPT Services</title>
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
                    <h1 class="text-3xl font-bold text-gray-800 mb-2">Application Status</h1>
                    <p class="text-gray-600">Track your property registration applications</p>
                </div>
            </div>
        </div>

        <!-- Applications List -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <?php if (isset($error)): ?>
                <div class="mb-6 p-4 rounded-lg bg-red-100 text-red-700 border border-red-300">
                    <?php echo $error; ?>
                </div>
            <?php endif; ?>

            <?php if (empty($applications)): ?>
                <div class="text-center py-12">
                    <i class="fas fa-folder-open text-gray-400 text-6xl mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-700 mb-2">No Applications Found</h3>
                    <p class="text-gray-500 mb-6">You haven't submitted any property registration applications yet.</p>
                    <a href="../rpt_registration/rpt_registration.php" 
                       class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 inline-flex items-center">
                        <i class="fas fa-plus mr-2"></i>
                        Register New Property
                    </a>
                </div>
            <?php else: ?>
                <div class="space-y-6">
                    <h2 class="text-xl font-semibold text-gray-800 mb-4">Your Applications (<?php echo count($applications); ?>)</h2>
                    
                    <?php foreach ($applications as $application): ?>
                        <div class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-300">
                            <div class="flex justify-between items-start mb-4">
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-800">Reference: <?php echo $application['reference_number']; ?></h3>
                                    <p class="text-gray-600 text-sm">Submitted: <?php echo date('M j, Y', strtotime($application['created_at'])); ?></p>
                                </div>
                                <div class="flex items-center">
                                    <?php
                                    $status_color = '';
                                    $status_icon = '';
                                    switch($application['status']) {
                                        case 'pending':
                                            $status_color = 'bg-yellow-100 text-yellow-800';
                                            $status_icon = 'fas fa-clock';
                                            break;
                                        case 'for_inspection':
                                            $status_color = 'bg-blue-100 text-blue-800';
                                            $status_icon = 'fas fa-search';
                                            break;
                                        case 'needs_correction':
                                            $status_color = 'bg-orange-100 text-orange-800';
                                            $status_icon = 'fas fa-exclamation-triangle';
                                            break;
                                        case 'assessed':
                                            $status_color = 'bg-purple-100 text-purple-800';
                                            $status_icon = 'fas fa-calculator';
                                            break;
                                        case 'approved':
                                            $status_color = 'bg-green-100 text-green-800';
                                            $status_icon = 'fas fa-check-circle';
                                            break;
                                        default:
                                            $status_color = 'bg-gray-100 text-gray-800';
                                            $status_icon = 'fas fa-question';
                                    }
                                    ?>
                                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium <?php echo $status_color; ?>">
                                        <i class="<?php echo $status_icon; ?> mr-2"></i>
                                        <?php echo ucfirst(str_replace('_', ' ', $application['status'])); ?>
                                    </span>
                                </div>
                            </div>

                            <!-- Property Details -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <h4 class="font-medium text-gray-700 mb-2">Property Location</h4>
                                    <p class="text-gray-600"><?php echo $application['lot_location']; ?></p>
                                    <p class="text-gray-500 text-sm"><?php echo $application['barangay']; ?>, <?php echo $application['district']; ?></p>
                                </div>
                                <div>
                                    <h4 class="font-medium text-gray-700 mb-2">Property Details</h4>
                                    <p class="text-gray-600">
                                        <i class="fas fa-<?php echo $application['has_building'] == 'yes' ? 'home' : 'mountain'; ?> mr-2"></i>
                                        <?php echo $application['has_building'] == 'yes' ? 'With Building' : 'Vacant Land'; ?>
                                    </p>
                                </div>
                            </div>

                            <!-- Inspection Details -->
                            <?php if ($application['scheduled_date']): ?>
                                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                    <h4 class="font-medium text-blue-700 mb-2 flex items-center">
                                        <i class="fas fa-calendar-alt mr-2"></i>
                                        Inspection Scheduled
                                    </h4>
                                    <p class="text-blue-600 text-sm">
                                        Date: <?php echo date('M j, Y', strtotime($application['scheduled_date'])); ?>
                                        <?php if ($application['assessor_name'] && $application['assessor_name'] != 'To be assigned'): ?>
                                            | Assessor: <?php echo $application['assessor_name']; ?>
                                        <?php endif; ?>
                                    </p>
                                </div>
                            <?php endif; ?>

                            <!-- Correction Notes -->
                            <?php if ($application['correction_notes']): ?>
                                <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                    <h4 class="font-medium text-orange-700 mb-2 flex items-center">
                                        <i class="fas fa-exclamation-circle mr-2"></i>
                                        Correction Needed
                                    </h4>
                                    <p class="text-orange-600 text-sm"><?php echo $application['correction_notes']; ?></p>
                                </div>
                            <?php endif; ?>

                            <!-- Progress Steps -->
                            <div class="mt-4 pt-4 border-t border-gray-200">
                                <div class="flex items-center justify-between text-xs text-gray-500">
                                    <div class="text-center <?php echo in_array($application['status'], ['pending', 'for_inspection', 'needs_correction', 'assessed', 'approved']) ? 'text-blue-600 font-semibold' : ''; ?>">
                                        <i class="fas fa-paper-plane block mb-1"></i>
                                        Submitted
                                    </div>
                                    <div class="text-center <?php echo in_array($application['status'], ['for_inspection', 'needs_correction', 'assessed', 'approved']) ? 'text-blue-600 font-semibold' : ''; ?>">
                                        <i class="fas fa-search block mb-1"></i>
                                        Inspection
                                    </div>
                                    <div class="text-center <?php echo in_array($application['status'], ['assessed', 'approved']) ? 'text-blue-600 font-semibold' : ''; ?>">
                                        <i class="fas fa-calculator block mb-1"></i>
                                        Assessment
                                    </div>
                                    <div class="text-center <?php echo $application['status'] == 'approved' ? 'text-blue-600 font-semibold' : ''; ?>">
                                        <i class="fas fa-check-circle block mb-1"></i>
                                        Approved
                                    </div>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>

        <!-- Help Information -->
        <div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 class="font-semibold text-blue-800 mb-2 flex items-center">
                <i class="fas fa-question-circle mr-2"></i>
                Need Help with Your Application?
            </h4>
            <ul class="text-blue-700 text-sm space-y-2">
                <li>• <strong>Pending:</strong> Your application is being reviewed</li>
                <li>• <strong>For Inspection:</strong> Assessor will visit your property</li>
                <li>• <strong>Needs Correction:</strong> Please update your information</li>
                <li>• <strong>Assessed:</strong> Tax calculation is complete</li>
                <li>• <strong>Approved:</strong> Your TDN is ready</li>
            </ul>
        </div>
    </main>
</body>
</html>