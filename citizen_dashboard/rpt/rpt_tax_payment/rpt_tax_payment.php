<?php
// rpt_tax_payment.php
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: ../index.php');
    exit();
}

$user_id = $_SESSION['user_id'];
$user_name = $_SESSION['user_name'] ?? 'Citizen';

// Include database connection
include_once '../../../db/RPT/rpt_db.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RPT Tax Payment - GoServePH</title>
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
                    <h1 class="text-3xl font-bold text-gray-800 mb-2">RPT Tax Payment</h1>
                    <p class="text-gray-600">View and pay your quarterly property taxes</p>
                </div>
            </div>
        </div>

        <!-- Tax Payment Content -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <?php
            try {
                // Get approved properties for this user with their quarterly taxes
                $query = "
                    SELECT 
                        pr.id,
                        pr.reference_number,
                        pr.lot_location,
                        pr.barangay,
                        pt.total_annual_tax,
                        (SELECT COUNT(*) FROM quarterly_taxes qt 
                         JOIN property_totals pt2 ON qt.property_total_id = pt2.id 
                         WHERE pt2.registration_id = pr.id AND qt.payment_status = 'paid') as paid_quarters,
                        (SELECT COUNT(*) FROM quarterly_taxes qt 
                         JOIN property_totals pt2 ON qt.property_total_id = pt2.id 
                         WHERE pt2.registration_id = pr.id AND qt.payment_status = 'overdue') as overdue_quarters
                    FROM property_registrations pr
                    LEFT JOIN property_totals pt ON pr.id = pt.registration_id
                    WHERE pr.owner_id = :user_id AND pr.status = 'approved'
                    ORDER BY pr.created_at DESC
                ";
                
                $stmt = $pdo->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                $properties = $stmt->fetchAll(PDO::FETCH_ASSOC);

                if (count($properties) === 0) {
                    echo '
                    <div class="lg:col-span-4">
                        <div class="bg-white rounded-xl shadow-lg p-8 text-center">
                            <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-home text-gray-400 text-2xl"></i>
                            </div>
                            <h3 class="text-xl font-semibold text-gray-800 mb-2">No Properties Found</h3>
                            <p class="text-gray-600 mb-4">You don\'t have any approved properties yet.</p>
                            <a href="rpt_registration/rpt_registration.php" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                                Register Property
                            </a>
                        </div>
                    </div>';
                } else {
                    foreach ($properties as $property) {
                        // Get quarterly taxes for this property
                        $taxQuery = "
                            SELECT 
                                qt.*,
                                CASE 
                                    WHEN qt.payment_status = 'paid' THEN 'paid'
                                    WHEN qt.due_date < CURDATE() AND qt.payment_status = 'pending' THEN 'overdue'
                                    ELSE 'pending'
                                END as actual_status
                            FROM quarterly_taxes qt
                            JOIN property_totals pt ON qt.property_total_id = pt.id
                            WHERE pt.registration_id = :property_id
                            ORDER BY qt.year DESC, 
                                CASE qt.quarter 
                                    WHEN 'Q1' THEN 1
                                    WHEN 'Q2' THEN 2
                                    WHEN 'Q3' THEN 3
                                    WHEN 'Q4' THEN 4
                                END DESC
                        ";
                        
                        $taxStmt = $pdo->prepare($taxQuery);
                        $taxStmt->bindParam(':property_id', $property['id']);
                        $taxStmt->execute();
                        $quarterlyTaxes = $taxStmt->fetchAll(PDO::FETCH_ASSOC);
                        
                        echo '
                        <div class="lg:col-span-4">
                            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                                    <div>
                                        <h3 class="text-xl font-semibold text-gray-800">' . htmlspecialchars($property['reference_number']) . '</h3>
                                        <p class="text-gray-600">' . htmlspecialchars($property['lot_location']) . ', ' . htmlspecialchars($property['barangay']) . '</p>
                                    </div>
                                    <div class="flex items-center space-x-4 mt-2 lg:mt-0">
                                        <div class="text-center">
                                            <div class="text-2xl font-bold text-blue-600">₱' . number_format($property['total_annual_tax'], 2) . '</div>
                                            <div class="text-sm text-gray-500">Annual Tax</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">';
                        
                        foreach ($quarterlyTaxes as $tax) {
                            $status = $tax['actual_status'];
                            $statusConfig = [
                                'paid' => ['color' => 'bg-green-100 text-green-800 border-green-200', 'label' => 'Paid', 'icon' => 'fa-check'],
                                'overdue' => ['color' => 'bg-red-100 text-red-800 border-red-200', 'label' => 'Overdue', 'icon' => 'fa-exclamation-triangle'],
                                'pending' => ['color' => 'bg-yellow-100 text-yellow-800 border-yellow-200', 'label' => 'Pending', 'icon' => 'fa-clock']
                            ];
                            $config = $statusConfig[$status] ?? $statusConfig['pending'];
                            
                            $dueDate = new DateTime($tax['due_date']);
                            $currentDate = new DateTime();
                            $isOverdue = $dueDate < $currentDate && $status !== 'paid';
                            
                            echo '
                                    <div class="border-2 rounded-xl p-4 ' . ($isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200') . '">
                                        <div class="flex items-center justify-between mb-3">
                                            <span class="text-lg font-semibold text-gray-800">' . htmlspecialchars($tax['quarter']) . '</span>
                                            <span class="' . $config['color'] . ' px-2 py-1 rounded-full text-xs font-medium border">
                                                <i class="fas ' . $config['icon'] . ' mr-1"></i>' . $config['label'] . '
                                            </span>
                                        </div>
                                        
                                        <div class="space-y-2">
                                            <div class="flex justify-between text-sm">
                                                <span class="text-gray-500">Year:</span>
                                                <span class="font-medium">' . htmlspecialchars($tax['year']) . '</span>
                                            </div>
                                            <div class="flex justify-between text-sm">
                                                <span class="text-gray-500">Due Date:</span>
                                                <span class="font-medium ' . ($isOverdue ? 'text-red-600' : 'text-gray-700') . '">' . $dueDate->format('M d, Y') . '</span>
                                            </div>
                                            <div class="flex justify-between text-sm">
                                                <span class="text-gray-500">Amount:</span>
                                                <span class="font-semibold">₱' . number_format($tax['total_quarterly_tax'], 2) . '</span>
                                            </div>';
                                            
                                            if ($tax['penalty_amount'] > 0) {
                                                echo '
                                            <div class="flex justify-between text-sm">
                                                <span class="text-gray-500">Penalty:</span>
                                                <span class="font-semibold text-red-600">+₱' . number_format($tax['penalty_amount'], 2) . '</span>
                                            </div>';
                                            }
                                            
                                            echo '
                                        </div>
                                        
                                        <div class="mt-4">';
                                        
                                            if ($status === 'paid') {
                                                echo '
                                            <button class="w-full bg-green-600 text-white py-2 rounded-lg font-medium cursor-not-allowed" disabled>
                                                <i class="fas fa-check mr-2"></i>Paid
                                            </button>';
                                            } else {
                                                $totalAmount = $tax['total_quarterly_tax'] + $tax['penalty_amount'];
                                                echo '
                                            <button onclick="openPaymentModal(' . $tax['id'] . ', ' . $totalAmount . ', \'' . $tax['quarter'] . ' ' . $tax['year'] . '\')" 
                                                    class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors">
                                                <i class="fas fa-credit-card mr-2"></i>Pay ₱' . number_format($totalAmount, 2) . '
                                            </button>';
                                            }
                                            
                                            echo '
                                        </div>
                                    </div>';
                        }
                        
                        echo '
                                </div>
                            </div>
                        </div>';
                    }
                }
            } catch (PDOException $e) {
                echo '
                <div class="lg:col-span-4">
                    <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                        </div>
                        <h3 class="text-xl font-semibold text-red-800 mb-2">Error Loading Taxes</h3>
                        <p class="text-red-600">Unable to load your tax information. Please try again later.</p>
                    </div>
                </div>';
            }
            ?>
        </div>
    </main>

    <!-- Payment Modal -->
    <div id="paymentModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50">
        <div class="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-semibold text-gray-800">Confirm Payment</h3>
                <button onclick="closePaymentModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="space-y-4">
                <div class="bg-blue-50 rounded-lg p-4">
                    <div class="text-center">
                        <div id="paymentQuarter" class="text-lg font-semibold text-blue-800 mb-1"></div>
                        <div id="paymentAmount" class="text-2xl font-bold text-blue-600"></div>
                    </div>
                </div>
                
                <div class="space-y-3">
                    <h4 class="font-semibold text-gray-700">Payment Method</h4>
                    <div class="space-y-2">
                        <label class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="radio" name="paymentMethod" value="gcash" class="mr-3" checked>
                            <i class="fab fa-google-wallet text-green-600 text-xl mr-2"></i>
                            <span class="font-medium">GCash</span>
                        </label>
                        <label class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="radio" name="paymentMethod" value="paymaya" class="mr-3">
                            <i class="fas fa-mobile-alt text-blue-600 text-xl mr-2"></i>
                            <span class="font-medium">PayMaya</span>
                        </label>
                        <label class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="radio" name="paymentMethod" value="bank" class="mr-3">
                            <i class="fas fa-university text-purple-600 text-xl mr-2"></i>
                            <span class="font-medium">Bank Transfer</span>
                        </label>
                    </div>
                </div>
                
                <div class="flex space-x-3 pt-4">
                    <button onclick="closePaymentModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-medium transition-colors">
                        Cancel
                    </button>
                    <button onclick="processPayment()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors">
                        <i class="fas fa-lock mr-2"></i>Pay Now
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
        let currentTaxId = null;
        
        function openPaymentModal(taxId, amount, quarter) {
            currentTaxId = taxId;
            document.getElementById('paymentQuarter').textContent = quarter;
            document.getElementById('paymentAmount').textContent = '₱' + amount.toLocaleString('en-PH', {minimumFractionDigits: 2});
            document.getElementById('paymentModal').classList.remove('hidden');
        }
        
        function closePaymentModal() {
            document.getElementById('paymentModal').classList.add('hidden');
            currentTaxId = null;
        }
        
        function processPayment() {
            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
            
            // Show loading state
            const payButton = document.querySelector('#paymentModal button:last-child');
            payButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
            payButton.disabled = true;
            
            // Simulate payment processing
            setTimeout(() => {
                alert('Payment processed successfully!');
                closePaymentModal();
                location.reload(); // Refresh to update payment status
            }, 2000);
        }
        
        // Close modal when clicking outside
        document.getElementById('paymentModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closePaymentModal();
            }
        });
    </script>
</body>
</html>