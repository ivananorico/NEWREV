<?php
// payment_verification.php

// Get payment data from URL parameter
$encodedData = $_GET['data'] ?? '';
if (empty($encodedData)) {
    die("Invalid payment data");
}

$paymentData = json_decode(base64_decode($encodedData), true);
if (!$paymentData) {
    die("Invalid payment data");
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enter Phone Number - GoServePH</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    </style>
</head>
<body>
    <div class="w-full max-w-md mx-4">
        <!-- Header -->
        <div class="bg-white rounded-xl shadow-2xl p-6">
            <div class="flex items-center mb-4">
                <button onclick="goBack()" class="text-blue-600 hover:text-blue-800 mr-4">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <div>
                    <h1 class="text-2xl font-bold text-gray-800 mb-2">Enter Phone Number</h1>
                    <p class="text-gray-600">We'll send an OTP to verify your payment</p>
                </div>
            </div>
            
            <!-- Payment Summary -->
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-gray-600">Amount:</span>
                    <span class="font-semibold text-lg text-blue-600">₱<?php echo number_format($paymentData['amount'], 2); ?></span>
                </div>
                <div class="flex justify-between items-center mb-2">
                    <span class="text-gray-600">Method:</span>
                    <span class="font-semibold capitalize"><?php echo htmlspecialchars($paymentData['payment_method']); ?></span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">Purpose:</span>
                    <span class="font-semibold text-sm text-right"><?php echo htmlspecialchars($paymentData['purpose']); ?></span>
                </div>
            </div>

            <!-- Phone Form -->
            <form id="phoneForm" class="space-y-6">
                <!-- Phone Number -->
                <div>
                    <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
                        Mobile Number <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span class="text-gray-500">+63</span>
                        </div>
                        <input 
                            type="tel" 
                            id="phone" 
                            name="phone" 
                            class="pl-12 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-blue-500" 
                            placeholder="912 345 6789" 
                            pattern="[0-9]{10}" 
                            maxlength="10"
                            required
                            autofocus
                        >
                    </div>
                    <p class="mt-1 text-sm text-gray-500">Enter your 10-digit mobile number</p>
                </div>

                <!-- Submit Button -->
                <button 
                    type="submit" 
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center shadow-lg"
                >
                    <i class="fas fa-sms mr-3"></i>
                    Send OTP Code
                </button>
            </form>

            <!-- Loading Overlay -->
            <div id="loadingOverlay" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-xl p-6 text-center">
                    <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-spinner fa-spin text-blue-600 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">Processing</h3>
                    <p class="text-gray-600">Sending OTP to your phone...</p>
                </div>
            </div>
        </div>
    </div>

    <script>
    function goBack() {
        window.history.back();
    }

    document.getElementById('phoneForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const phone = document.getElementById('phone').value;
        if (!phone || phone.length !== 10) {
            alert('Please enter a valid 10-digit mobile number');
            return;
        }

        // Show loading overlay
        document.getElementById('loadingOverlay').classList.remove('hidden');

        // Prepare data
        const paymentData = <?php echo json_encode($paymentData); ?>;
        paymentData.phone = '0' + phone;

        console.log('Sending payment data:', paymentData);

        // Generate OTP
        fetch('generate_otp.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData)
        })
        .then(response => {
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return response.text().then(text => {
                    throw new Error('Server returned: ' + text.substring(0, 200));
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Response data:', data);
            
            if (data.status === 'success') {
                // Redirect to OTP verification
                window.location.href = 'verify_otp.php?payment_id=' + data.payment_id;
            } else {
                throw new Error(data.message || 'Unknown error occurred');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error: ' + error.message);
            document.getElementById('loadingOverlay').classList.add('hidden');
        });
    });

    // Format phone number input
    document.getElementById('phone').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 10) value = value.substring(0, 10);
        e.target.value = value;
    });

    // Auto-submit when Enter is pressed
    document.getElementById('phone').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('phoneForm').dispatchEvent(new Event('submit'));
        }
    });
    </script>
</body>
</html>