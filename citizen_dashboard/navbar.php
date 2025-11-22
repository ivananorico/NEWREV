<?php
// navbar.php - REMOVE session_start() from here
// session_start(); // DELETE THIS LINE

if (!isset($_SESSION['user_id'])) {
    header('Location: ../index.php');
    exit();
}

$user_name = $_SESSION['user_name'] ?? 'Citizen';
$user_email = $_SESSION['user_email'] ?? '';
?>
<!-- Navigation Bar -->
<nav class="bg-blue-600 text-white shadow-lg">
    <div class="container mx-auto px-6">
        <div class="flex justify-between items-center py-4">
            <!-- Logo and Brand -->
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <i class="fas fa-user-tie text-blue-600"></i>
                </div>
                <div>
                    <h1 class="text-xl font-bold">
                        <span class="text-white">Go</span><span class="text-green-300">Serve</span><span class="text-white">PH</span>
                    </h1>
                    <p class="text-xs text-blue-200">Citizen Dashboard</p>
                </div>
            </div>

            <!-- User Info and Menu -->
            <div class="flex items-center space-x-4">
                <div class="text-right">
                    <p class="text-sm font-semibold">Welcome, <?php echo htmlspecialchars($user_name); ?></p>
                    <p class="text-xs text-blue-200"><?php echo htmlspecialchars($user_email); ?></p>
                </div>
                <div class="relative group">
                    <button class="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors">
                        <i class="fas fa-user"></i>
                    </button>
                    <!-- Dropdown Menu -->
                    <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 hidden group-hover:block z-50">
                        <a href="profile.php" class="block px-4 py-2 text-gray-800 hover:bg-blue-50">
                            <i class="fas fa-user-edit mr-2"></i>My Profile
                        </a>
                        <a href="settings.php" class="block px-4 py-2 text-gray-800 hover:bg-blue-50">
                            <i class="fas fa-cog mr-2"></i>Settings
                        </a>
                        <div class="border-t my-1"></div>
                        <a href="logout.php" class="block px-4 py-2 text-red-600 hover:bg-red-50">
                            <i class="fas fa-sign-out-alt mr-2"></i>Logout
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</nav>

<!-- Main Navigation Tabs -->
<div class="bg-white shadow-sm border-b">
    <div class="container mx-auto px-6">
        <div class="flex space-x-8">
            <a href="citizen_dashboard.php" class="py-4 px-2 border-b-2 border-blue-600 text-blue-600 font-semibold">
                <i class="fas fa-tachometer-alt mr-2"></i>Dashboard
            </a>
            <a href="services.php" class="py-4 px-2 text-gray-600 hover:text-blue-600 font-medium">
                <i class="fas fa-concierge-bell mr-2"></i>Services
            </a>
            <a href="applications.php" class="py-4 px-2 text-gray-600 hover:text-blue-600 font-medium">
                <i class="fas fa-file-alt mr-2"></i>My Applications
            </a>
            <a href="documents.php" class="py-4 px-2 text-gray-600 hover:text-blue-600 font-medium">
                <i class="fas fa-folder mr-2"></i>Documents
            </a>
        </div>
    </div>
</div>