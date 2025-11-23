<?php
// navbar.php

if (!isset($_SESSION['user_id'])) {
    header('Location: ../index.php');
    exit();
}

$user_name = $_SESSION['user_name'] ?? 'Citizen';
$user_email = $_SESSION['user_email'] ?? '';

// Get current page for active state
$current_page = basename($_SERVER['PHP_SELF']);

// Determine base URL dynamically
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
$host = $_SERVER['HTTP_HOST'];
$base_url = $protocol . "://" . $host;

// Get the current directory structure
$script_path = $_SERVER['SCRIPT_NAME'];
$script_dir = dirname($script_path);

// Build the base path for the citizen dashboard
$base_path = rtrim($base_url . $script_dir, '/');
$base_path = str_replace('/rpt', '', $base_path); // Remove any /rpt subdirectory
?>
<style>
:root {
    --primary: #4CAF50;
    --secondary: #4A90E2;
    --accent: #FDA811;
    --background: #FBFBFB;
}

.dropdown-container {
    position: relative;
}

.dropdown-menu {
    position: absolute;
    right: 0;
    top: 100%;
    margin-top: 0.5rem;
    width: 12rem;
    background-color: #ffffff;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border: 1px solid #e5e7eb;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.2s ease-in-out;
    z-index: 50;
}

.dropdown-container:hover .dropdown-menu {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.dropdown-menu::before {
    content: '';
    position: absolute;
    top: -6px;
    right: 12px;
    width: 12px;
    height: 12px;
    background: #ffffff;
    transform: rotate(45deg);
    border-top: 1px solid #e5e7eb;
    border-left: 1px solid #e5e7eb;
}

.dropdown-link {
    display: block;
    padding: 0.75rem 1rem;
    color: #374151;
    text-decoration: none;
    transition: background-color 0.2s ease;
    border-radius: 0.25rem;
    margin: 0.25rem;
}

.dropdown-link:hover {
    background-color: #f3f4f6;
}

.dropdown-link.settings:hover {
    background-color: #eff6ff;
    color: #1e40af;
}

.dropdown-link.logout:hover {
    background-color: #fef2f2;
    color: #dc2626;
}

.divider {
    height: 1px;
    background-color: #e5e7eb;
    margin: 0.25rem 0.5rem;
}
</style>

<!-- Navigation Bar -->
<nav style="background-color: #FBFBFB; border-bottom: 0.2px solid #4A90E2;">
    <div class="container mx-auto px-6">
        <div class="flex justify-between items-center py-4">

            <!-- Logo and Brand -->
            <div class="flex items-center space-x-3">
                <a href="<?php echo $base_path; ?>/citizen_dashboard.php" class="flex items-center space-x-3 no-underline">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background-color: #4A90E2;">
                        <i class="fas fa-user-tie text-white text-sm"></i>
                    </div>
                    <div>
                        <h1 class="text-xl font-bold" style="word-spacing: -0.2em;">
                            <span style="color: #4A90E2;">Go</span><!--
                            --><span style="color: #4CAF50;">Serve</span><!--
                            --><span style="color: #4A90E2;">PH</span>
                        </h1>
                        <p class="text-xs" style="color: #6b7280;">Citizen Dashboard</p>
                    </div>
                </a>
            </div>

            <!-- User Info and Menu -->
            <div class="flex items-center space-x-4">
                <div class="text-right">
                    <p class="text-sm font-semibold" style="color: #1f2937;">
                        Welcome, <?php echo htmlspecialchars($user_name); ?>
                    </p>
                    <p class="text-xs" style="color: #6b7280;">
                        <?php echo htmlspecialchars($user_email); ?>
                    </p>
                </div>

                <div class="dropdown-container">
                    <button class="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-gray-200"
                        style="background-color: #e5e7eb;">
                        <i class="fas fa-user" style="color: #4b5563;"></i>
                    </button>

                    <!-- Dropdown Menu -->
                    <div class="dropdown-menu">
                        <a href="<?php echo $base_path; ?>/settings.php" class="dropdown-link settings">
                            <i class="fas fa-user-cog mr-2"></i>Profile & Settings
                        </a>
                        <div class="divider"></div>
                        <a href="<?php echo $base_path; ?>/logout.php" class="dropdown-link logout">
                            <i class="fas fa-sign-out-alt mr-2"></i>Logout
                        </a>
                    </div>
                </div>
            </div>

        </div>
    </div>
</nav>