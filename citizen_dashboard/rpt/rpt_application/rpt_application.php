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

// Include database connection
require_once '../../../db/RPT/rpt_db.php';

// Get user's property applications with detailed tax data
$applications = [];
try {
    $stmt = $pdo->prepare("
        SELECT 
            pr.id as registration_id,
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
            pi.status as inspection_status,
            
            -- Tax data for approved properties
            pt.total_annual_tax,
            pt.land_annual_tax,
            pt.total_building_annual_tax,
            pt.approval_date,
            
            -- Land property details
            lp.tdn as land_tdn,
            lp.land_area_sqm,
            lp.land_market_value,
            lp.land_assessed_value,
            lp.basic_tax_amount as land_basic_tax,
            lp.sef_tax_amount as land_sef_tax,
            
            -- Building property details
            bp.tdn as building_tdn,
            bp.floor_area_sqm,
            bp.building_market_value,
            bp.building_assessed_value,
            bp.basic_tax_amount as building_basic_tax,
            bp.sef_tax_amount as building_sef_tax,
            
            -- Quarterly taxes
            qt.quarter,
            qt.year,
            qt.due_date,
            qt.total_quarterly_tax,
            qt.penalty_amount,
            qt.payment_status
            
        FROM property_registrations pr
        LEFT JOIN property_owners po ON pr.owner_id = po.id
        LEFT JOIN property_inspections pi ON pr.id = pi.registration_id
        LEFT JOIN property_totals pt ON pr.id = pt.registration_id AND pt.status = 'active'
        LEFT JOIN land_properties lp ON pr.id = lp.registration_id
        LEFT JOIN building_properties bp ON lp.id = bp.land_id AND bp.status = 'active'
        LEFT JOIN quarterly_taxes qt ON pt.id = qt.property_total_id
        WHERE po.id = ?
        ORDER BY pr.created_at DESC, qt.quarter ASC
    ");
    $stmt->execute([$user_id]);
    $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    $error = "Error fetching applications: " . $e->getMessage();
}

// Group applications by registration_id for better organization
$grouped_applications = [];
foreach ($applications as $app) {
    $reg_id = $app['registration_id'];
    if (!isset($grouped_applications[$reg_id])) {
        $grouped_applications[$reg_id] = $app;
        $grouped_applications[$reg_id]['quarterly_taxes'] = [];
    }
    
    // Collect quarterly taxes if they exist
    if ($app['quarter'] && $app['total_quarterly_tax']) {
        $grouped_applications[$reg_id]['quarterly_taxes'][] = [
            'quarter' => $app['quarter'],
            'year' => $app['year'],
            'due_date' => $app['due_date'],
            'total_quarterly_tax' => $app['total_quarterly_tax'],
            'penalty_amount' => $app['penalty_amount'],
            'payment_status' => $app['payment_status']
        ];
    }
}

// Function to format currency
function formatCurrency($amount) {
    if ($amount === null) return '₱0.00';
    return '₱' . number_format($amount, 2);
}

// Function to format date
function formatDate($date) {
    if (!$date) return 'N/A';
    return date('M j, Y', strtotime($date));
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
                    <p class="text-gray-600">Track your property registration applications and view tax bills</p>
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

            <?php if (empty($grouped_applications)): ?>
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
                    <h2 class="text-xl font-semibold text-gray-800 mb-4">Your Applications (<?php echo count($grouped_applications); ?>)</h2>
                    
                    <?php foreach ($grouped_applications as $application): ?>
                        <div class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-300">
                            <!-- Application Header -->
                            <div class="flex justify-between items-start mb-4">
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-800">Reference: <?php echo $application['reference_number']; ?></h3>
                                    <p class="text-gray-600 text-sm">Submitted: <?php echo formatDate($application['created_at']); ?></p>
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
                            <?php if ($application['status'] == 'for_inspection' && $application['scheduled_date']): ?>
                                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                    <h4 class="font-medium text-blue-700 mb-2 flex items-center">
                                        <i class="fas fa-calendar-alt mr-2"></i>
                                        Inspection Scheduled
                                    </h4>
                                    <p class="text-blue-600 text-sm">
                                        Date: <?php echo formatDate($application['scheduled_date']); ?>
                                        <?php if ($application['assessor_name'] && $application['assessor_name'] != 'To be assigned'): ?>
                                            | Assessor: <?php echo $application['assessor_name']; ?>
                                        <?php endif; ?>
                                    </p>
                                </div>
                            <?php endif; ?>

                            <!-- BILLING SECTION - Only show when status is 'approved' -->
                            <?php if ($application['status'] == 'approved'): ?>
                                <div class="bg-green-50 border-2 border-green-300 rounded-lg p-6 mb-4">
                                    <div class="flex justify-between items-center mb-4">
                                        <h4 class="text-xl font-bold text-green-800 flex items-center">
                                            <i class="fas fa-file-invoice-dollar mr-3"></i>
                                            TAX BILL & ASSESSMENT
                                        </h4>
                                        <span class="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                                            Approved: <?php echo formatDate($application['approval_date']); ?>
                                        </span>
                                    </div>

                                    <!-- Tax Declaration Numbers -->
                                    <div class="mb-6 p-4 bg-white rounded-lg border border-green-200">
                                        <h5 class="font-semibold text-green-800 mb-3 text-lg">Tax Declaration Numbers</h5>
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div class="flex items-center justify-between p-3 bg-green-50 rounded">
                                                <div class="flex items-center">
                                                    <i class="fas fa-map-marker-alt text-green-600 mr-3 text-lg"></i>
                                                    <div>
                                                        <p class="font-semibold text-green-700">Land TDN</p>
                                                        <p class="text-green-600 text-sm">Land Tax Declaration</p>
                                                    </div>
                                                </div>
                                                <span class="font-mono font-bold text-green-800 text-lg"><?php echo $application['land_tdn'] ?: 'TDN-L-PENDING'; ?></span>
                                            </div>
                                            <?php if ($application['has_building'] == 'yes'): ?>
                                                <div class="flex items-center justify-between p-3 bg-green-50 rounded">
                                                    <div class="flex items-center">
                                                        <i class="fas fa-home text-green-600 mr-3 text-lg"></i>
                                                        <div>
                                                            <p class="font-semibold text-green-700">Building TDN</p>
                                                            <p class="text-green-600 text-sm">Building Tax Declaration</p>
                                                        </div>
                                                    </div>
                                                    <span class="font-mono font-bold text-green-800 text-lg"><?php echo $application['building_tdn'] ?: 'TDN-B-PENDING'; ?></span>
                                                </div>
                                            <?php endif; ?>
                                        </div>
                                    </div>

                                    <!-- Tax Calculation Breakdown -->
                                    <div class="mb-6">
                                        <h5 class="font-semibold text-green-800 mb-4 text-lg">Tax Calculation Breakdown</h5>
                                        
                                        <!-- Land Tax Breakdown -->
                                        <div class="mb-4 p-4 bg-white rounded-lg border border-green-200">
                                            <h6 class="font-semibold text-green-700 mb-3 flex items-center">
                                                <i class="fas fa-map mr-2"></i>
                                                LAND ASSESSMENT
                                            </h6>
                                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div class="text-center">
                                                    <p class="text-green-600">Area</p>
                                                    <p class="font-semibold"><?php echo number_format($application['land_area_sqm'], 2); ?> sqm</p>
                                                </div>
                                                <div class="text-center">
                                                    <p class="text-green-600">Market Value</p>
                                                    <p class="font-semibold"><?php echo formatCurrency($application['land_market_value']); ?></p>
                                                </div>
                                                <div class="text-center">
                                                    <p class="text-green-600">Assessed Value</p>
                                                    <p class="font-semibold"><?php echo formatCurrency($application['land_assessed_value']); ?></p>
                                                </div>
                                                <div class="text-center">
                                                    <p class="text-green-600">Land Tax</p>
                                                    <p class="font-semibold text-green-800"><?php echo formatCurrency($application['land_annual_tax']); ?></p>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Building Tax Breakdown -->
                                        <?php if ($application['has_building'] == 'yes' && $application['building_market_value']): ?>
                                            <div class="mb-4 p-4 bg-white rounded-lg border border-green-200">
                                                <h6 class="font-semibold text-green-700 mb-3 flex items-center">
                                                    <i class="fas fa-home mr-2"></i>
                                                    BUILDING ASSESSMENT
                                                </h6>
                                                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div class="text-center">
                                                        <p class="text-green-600">Floor Area</p>
                                                        <p class="font-semibold"><?php echo number_format($application['floor_area_sqm'], 2); ?> sqm</p>
                                                    </div>
                                                    <div class="text-center">
                                                        <p class="text-green-600">Market Value</p>
                                                        <p class="font-semibold"><?php echo formatCurrency($application['building_market_value']); ?></p>
                                                    </div>
                                                    <div class="text-center">
                                                        <p class="text-green-600">Assessed Value</p>
                                                        <p class="font-semibold"><?php echo formatCurrency($application['building_assessed_value']); ?></p>
                                                    </div>
                                                    <div class="text-center">
                                                        <p class="text-green-600">Building Tax</p>
                                                        <p class="font-semibold text-green-800"><?php echo formatCurrency($application['total_building_annual_tax']); ?></p>
                                                    </div>
                                                </div>
                                            </div>
                                        <?php endif; ?>

                                        <!-- Total Tax Summary -->
                                        <div class="p-4 bg-green-100 rounded-lg border-2 border-green-300">
                                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div class="text-center">
                                                    <p class="text-green-700 font-semibold">Land Tax</p>
                                                    <p class="text-2xl font-bold text-green-900"><?php echo formatCurrency($application['land_annual_tax']); ?></p>
                                                </div>
                                                <?php if ($application['has_building'] == 'yes' && $application['total_building_annual_tax'] > 0): ?>
                                                    <div class="text-center">
                                                        <p class="text-green-700 font-semibold">Building Tax</p>
                                                        <p class="text-2xl font-bold text-green-900"><?php echo formatCurrency($application['total_building_annual_tax']); ?></p>
                                                    </div>
                                                <?php endif; ?>
                                                <div class="text-center">
                                                    <p class="text-green-700 font-semibold">Total Annual Tax</p>
                                                    <p class="text-3xl font-bold text-green-900"><?php echo formatCurrency($application['total_annual_tax']); ?></p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Quarterly Payment Schedule -->
                                    <div class="mb-4">
                                        <h5 class="font-semibold text-green-800 mb-3 text-lg">Quarterly Payment Schedule</h5>
                                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <?php
                                            $quarterly_tax = $application['total_annual_tax'] / 4;
                                            $quarters = [
                                                'Q1' => ['Mar 31', 'bg-blue-100 border-blue-300'],
                                                'Q2' => ['Jun 30', 'bg-green-100 border-green-300'],
                                                'Q3' => ['Sep 30', 'bg-yellow-100 border-yellow-300'],
                                                'Q4' => ['Dec 31', 'bg-red-100 border-red-300']
                                            ];
                                            
                                            foreach ($quarters as $quarter => $data): 
                                                list($due_date, $color_class) = $data;
                                                $current_quarter_data = array_filter($application['quarterly_taxes'], function($qt) use ($quarter) {
                                                    return $qt['quarter'] === $quarter;
                                                });
                                                $current_quarter_data = reset($current_quarter_data);
                                                $payment_status = $current_quarter_data['payment_status'] ?? 'pending';
                                            ?>
                                                <div class="border-2 <?php echo $color_class; ?> rounded-lg p-4 text-center">
                                                    <div class="font-bold text-lg text-gray-800 mb-1"><?php echo $quarter; ?></div>
                                                    <div class="text-sm text-gray-600 mb-2">Due: <?php echo $due_date; ?></div>
                                                    <div class="text-xl font-bold text-gray-900 mb-2"><?php echo formatCurrency($quarterly_tax); ?></div>
                                                    <span class="inline-block px-2 py-1 text-xs rounded-full 
                                                        <?php echo $payment_status == 'paid' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'; ?>">
                                                        <?php echo ucfirst($payment_status); ?>
                                                    </span>
                                                </div>
                                            <?php endforeach; ?>
                                        </div>
                                    </div>

                                    <!-- Payment Instructions -->
                                    <div class="bg-white p-4 rounded-lg border border-green-200">
                                        <h6 class="font-semibold text-green-700 mb-2">Payment Instructions:</h6>
                                        <ul class="text-sm text-green-600 space-y-1">
                                            <li>• Present this billing statement when paying at the Treasurer's Office</li>
                                            <li>• Bring valid ID for verification</li>
                                            <li>• Keep the official receipt as proof of payment</li>
                                            <li>• Late payments may incur penalties</li>
                                        </ul>
                                    </div>
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
                <li>• <strong>Approved:</strong> Your TDN and tax billing are ready</li>
            </ul>
        </div>
    </main>
</body>
</html>