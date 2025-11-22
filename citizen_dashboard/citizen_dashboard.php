<?php
// citizen_dashboard.php
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: ../index.php');
    exit();
}

$user_name = $_SESSION['user_name'] ?? 'Citizen';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Citizen Dashboard - GoServePH</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
    <!-- Include Navbar -->
    <?php include 'navbar.php'; ?>
    
    <!-- Rest of your dashboard content -->
    <!-- Main Content -->
    <main class="container mx-auto px-6 py-8">
        <!-- Welcome Section -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-2">Welcome back, <?php echo htmlspecialchars($user_name); ?>! 👋</h2>
            <p class="text-gray-600">Here's an overview of your available services and recent activities.</p>
        </div>

        <!-- Services Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <!-- RPT Card -->
            <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border-l-4 border-blue-500">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <i class="fas fa-home text-blue-600 text-xl"></i>
                    </div>
                    <span class="bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-1 rounded">Real Property</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Real Property Tax (RPT)</h3>
                <p class="text-gray-600 text-sm mb-4">Manage your property taxes, view assessments, and make payments online.</p>
                <div class="flex space-x-2">
                    <a href="rpt_services.php" class="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                        View Services
                    </a>
                    <button class="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition-colors">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            </div>

            <!-- Business Card -->
            <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border-l-4 border-green-500">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <i class="fas fa-briefcase text-green-600 text-xl"></i>
                    </div>
                    <span class="bg-green-100 text-green-600 text-xs font-semibold px-2 py-1 rounded">Business</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Business Permits & Licensing</h3>
                <p class="text-gray-600 text-sm mb-4">Apply for business permits, renew licenses, and manage your business registrations.</p>
                <div class="flex space-x-2">
                    <a href="business_services.php" class="flex-1 bg-green-600 text-white text-center py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                        View Services
                    </a>
                    <button class="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition-colors">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            </div>

            <!-- Market Card -->
            <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border-l-4 border-orange-500">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <i class="fas fa-store text-orange-600 text-xl"></i>
                    </div>
                    <span class="bg-orange-100 text-orange-600 text-xs font-semibold px-2 py-1 rounded">Market</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Market Vendor Services</h3>
                <p class="text-gray-600 text-sm mb-4">Manage market stall permits, vendor registrations, and market-related transactions.</p>
                <div class="flex space-x-2">
                    <a href="market_services.php" class="flex-1 bg-orange-600 text-white text-center py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
                        View Services
                    </a>
                    <button class="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition-colors">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Recent Activity Section -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
            <div class="space-y-3">
                <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-file-invoice text-blue-600 text-sm"></i>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-800">RPT Assessment Viewed</p>
                            <p class="text-xs text-gray-500">2 hours ago</p>
                        </div>
                    </div>
                    <span class="bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-1 rounded">Completed</span>
                </div>
                
                <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-briefcase text-green-600 text-sm"></i>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-800">Business Permit Application</p>
                            <p class="text-xs text-gray-500">1 day ago</p>
                        </div>
                    </div>
                    <span class="bg-yellow-100 text-yellow-600 text-xs font-semibold px-2 py-1 rounded">Pending</span>
                </div>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-6 mt-12">
        <div class="container mx-auto px-6">
            <div class="flex flex-col lg:flex-row justify-between items-center">
                <div class="text-center lg:text-left mb-4 lg:mb-0">
                    <h3 class="text-lg font-bold mb-2">GoServePH Citizen Portal</h3>
                    <p class="text-sm opacity-90">
                        Streamlining government services for Filipino citizens
                    </p>
                </div>
                <div class="flex space-x-4 text-sm">
                    <a href="#" class="hover:underline">Help Center</a>
                    <span>|</span>
                    <a href="#" class="hover:underline">Privacy Policy</a>
                    <span>|</span>
                    <a href="#" class="hover:underline">Terms of Service</a>
                </div>
            </div>
        </div>
    </footer>
</body>
</html>