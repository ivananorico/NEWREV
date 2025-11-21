<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Define base path - adjust if needed
define('BASE_PATH', dirname(__DIR__));

$response = ['success' => false, 'message' => ''];

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('No input data received');
    }

    if (!isset($input['action'])) {
        throw new Exception('Action not specified');
    }

    // Load required files
    require_once BASE_PATH . '/config/database.php';
    require_once BASE_PATH . '/models/User.php';
    require_once BASE_PATH . '/models/OTP.php';
    require_once BASE_PATH . '/services/EmailService.php';

    $database = new Database();
    $db = $database->getConnection();

    switch ($input['action']) {
        case 'login':
            handleLogin($db, $input, $response);
            break;
        case 'register':
            handleRegister($db, $input, $response);
            break;
        case 'verify_otp':
            handleOTPVerification($db, $input, $response);
            break;
        case 'resend_otp':
            handleResendOTP($db, $input, $response);
            break;
        default:
            throw new Exception('Invalid action');
    }

} catch (Exception $e) {
    $response['message'] = 'System error. Please try again.';
    error_log("Auth Error: " . $e->getMessage());
}

echo json_encode($response);

function handleLogin($db, $input, &$response) {
    if (!isset($input['email']) || !isset($input['password'])) {
        $response['message'] = 'Email and password are required';
        return;
    }

    $user = new User($db);
    $user->email = $input['email'];

    // Check if email exists
    if (!$user->emailExists()) {
        $response['message'] = 'Invalid email or password';
        return;
    }

    // Verify password
    if (!$user->verifyPassword($input['password'])) {
        $response['message'] = 'Invalid email or password';
        return;
    }

    // Generate and send OTP
    $otp = new OTP($db);
    $otp_code = $otp->generateOTP();
    $otp->user_id = $user->id;
    $otp->otp_code = $otp_code;

    if ($otp->create()) {
        // Send OTP via Brevo
        $emailService = new EmailService();
        $emailSent = $emailService->sendOTP(
            $user->email, 
            $user->first_name . ' ' . $user->last_name, 
            $otp_code
        );

        if ($emailSent) {
            $response['success'] = true;
            $response['message'] = 'OTP sent to your email';
            $response['user_id'] = $user->id;
            $response['requires_otp'] = true;
        } else {
            // Fallback: show OTP if email fails
            $response['success'] = true;
            $response['message'] = 'OTP: ' . $otp_code . ' (Check email failed)';
            $response['user_id'] = $user->id;
            $response['requires_otp'] = true;
            $response['debug_otp'] = $otp_code;
        }
    } else {
        $response['message'] = 'Failed to generate OTP';
    }
}

function handleRegister($db, $input, &$response) {
    $required_fields = ['firstName', 'lastName', 'regEmail', 'regPassword', 'confirmPassword', 'mobile'];
    
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            $response['message'] = 'All required fields must be filled';
            return;
        }
    }

    // Check if passwords match
    if ($input['regPassword'] !== $input['confirmPassword']) {
        $response['message'] = 'Passwords do not match';
        return;
    }

    $user = new User($db);
    $user->email = $input['regEmail'];

    // Check if email already exists
    if ($user->emailExists()) {
        $response['message'] = 'Email already registered';
        return;
    }

    // Set user properties
    $user->first_name = $input['firstName'];
    $user->last_name = $input['lastName'];
    $user->middle_name = isset($input['middleName']) ? $input['middleName'] : null;
    $user->suffix = isset($input['suffix']) ? $input['suffix'] : null;
    $user->birthdate = isset($input['birthdate']) ? $input['birthdate'] : null;
    $user->mobile = $input['mobile'];
    $user->address = isset($input['address']) ? $input['address'] : null;
    $user->house_number = isset($input['houseNumber']) ? $input['houseNumber'] : null;
    $user->street = isset($input['street']) ? $input['street'] : null;
    $user->barangay = isset($input['barangay']) ? $input['barangay'] : null;
    $user->password_hash = $input['regPassword'];

    if ($user->create()) {
        // Generate and send OTP
        $otp = new OTP($db);
        $otp_code = $otp->generateOTP();
        $otp->user_id = $user->id;
        $otp->otp_code = $otp_code;

        if ($otp->create()) {
            // Send OTP via Brevo
            $emailService = new EmailService();
            $emailSent = $emailService->sendOTP(
                $user->email, 
                $user->first_name . ' ' . $user->last_name, 
                $otp_code
            );

            if ($emailSent) {
                $response['success'] = true;
                $response['message'] = 'Registration successful! OTP sent to your email.';
                $response['user_id'] = $user->id;
                $response['requires_otp'] = true;
            } else {
                // Fallback: show OTP if email fails
                $response['success'] = true;
                $response['message'] = 'Registration successful! OTP: ' . $otp_code . ' (Check email failed)';
                $response['user_id'] = $user->id;
                $response['requires_otp'] = true;
                $response['debug_otp'] = $otp_code;
            }
        } else {
            $response['message'] = 'Registration successful but failed to generate OTP';
        }
    } else {
        $response['message'] = 'Registration failed. Please try again.';
    }
}

function handleOTPVerification($db, $input, &$response) {
    if (!isset($input['user_id']) || !isset($input['otp_code'])) {
        $response['message'] = 'User ID and OTP code are required';
        return;
    }

    $otp = new OTP($db);
    
    if ($otp->verify($input['user_id'], $input['otp_code'])) {
        // Activate user account
        $user = new User($db);
        $user->id = $input['user_id'];
        
        if ($user->activateAccount()) {
            $response['success'] = true;
            $response['message'] = 'OTP verified successfully!';
            $response['redirect'] = 'dashboard.php';
        } else {
            $response['message'] = 'Failed to activate account';
        }
    } else {
        $response['message'] = 'Invalid or expired OTP';
    }
}

function handleResendOTP($db, $input, &$response) {
    if (!isset($input['user_id'])) {
        $response['message'] = 'User ID is required';
        return;
    }

    // Get user info
    $user = new User($db);
    if (!$user->getUserById($input['user_id'])) {
        $response['message'] = 'User not found';
        return;
    }

    $otp = new OTP($db);
    $otp_code = $otp->generateOTP();
    $otp->user_id = $input['user_id'];
    $otp->otp_code = $otp_code;

    if ($otp->create()) {
        // Send OTP via Brevo
        $emailService = new EmailService();
        $emailSent = $emailService->sendOTP(
            $user->email, 
            $user->first_name . ' ' . $user->last_name, 
            $otp_code
        );

        if ($emailSent) {
            $response['success'] = true;
            $response['message'] = 'New OTP sent to your email';
        } else {
            // Fallback: show OTP if email fails
            $response['success'] = true;
            $response['message'] = 'New OTP: ' . $otp_code . ' (Check email failed)';
            $response['debug_otp'] = $otp_code;
        }
    } else {
        $response['message'] = 'Failed to generate new OTP';
    }
}
?>