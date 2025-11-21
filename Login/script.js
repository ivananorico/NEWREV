// Government Services Management System - Login Page JavaScript
const API_BASE = window.location.origin + '/revenue/Login/api/';

let currentUserId = null;
let otpTimer = null;
let otpTimeLeft = 180;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing app...');
    initializeApp();
});

function initializeApp() {
    console.log('🔧 Initializing app...');
    updateDateTime();
    setInterval(updateDateTime, 1000);
    setupEventListeners();
    setupOTPInputs();
    setupPasswordToggles();
    console.log('✅ App initialized');
}

function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
        console.log('✅ Login form listener added');
    } else {
        console.error('❌ Login form not found!');
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterSubmit);
        console.log('✅ Register form listener added');
    } else {
        console.error('❌ Register form not found!');
    }

    // Show register form
    const showRegister = document.getElementById('showRegister');
    if (showRegister) {
        showRegister.addEventListener('click', showRegisterForm);
        console.log('✅ Show register listener added');
    }

    // Cancel register
    const cancelRegister = document.getElementById('cancelRegister');
    if (cancelRegister) {
        cancelRegister.addEventListener('click', hideRegisterForm);
        console.log('✅ Cancel register listener added');
    }

    // OTP buttons
    const cancelOtp = document.getElementById('cancelOtp');
    const resendOtp = document.getElementById('resendOtp');
    const submitOtp = document.getElementById('submitOtp');
    
    if (cancelOtp) {
        cancelOtp.addEventListener('click', closeOtpModal);
        console.log('✅ Cancel OTP listener added');
    } else {
        console.error('❌ Cancel OTP button not found!');
    }
    
    if (resendOtp) {
        resendOtp.addEventListener('click', handleResendOtp);
        console.log('✅ Resend OTP listener added');
    } else {
        console.error('❌ Resend OTP button not found!');
    }
    
    if (submitOtp) {
        submitOtp.addEventListener('click', handleVerifyOtp);
        console.log('✅ Submit OTP listener added');
    } else {
        console.error('❌ Submit OTP button not found!');
    }

    // OTP form submit
    const otpForm = document.getElementById('otpForm');
    if (otpForm) {
        otpForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleVerifyOtp();
        });
        console.log('✅ OTP form listener added');
    } else {
        console.error('❌ OTP form not found!');
    }

    // Modal background clicks
    const registerModal = document.getElementById('registerFormContainer');
    const otpModal = document.getElementById('otpModal');
    
    if (registerModal) {
        registerModal.addEventListener('click', function(e) {
            if (e.target === this) hideRegisterForm();
        });
    }
    
    if (otpModal) {
        otpModal.addEventListener('click', function(e) {
            if (e.target === this) closeOtpModal();
        });
        console.log('✅ OTP modal listener added');
    } else {
        console.error('❌ OTP modal not found!');
    }

    // Terms and Privacy modals
    setupModalHandlers();

    // No middle name checkbox
    const noMiddleName = document.getElementById('noMiddleName');
    if (noMiddleName) {
        noMiddleName.addEventListener('change', function() {
            const middle = document.getElementById('middleName');
            const asterisk = document.getElementById('middleAsterisk');
            if (middle) {
                middle.disabled = this.checked;
                middle.required = !this.checked;
                if (asterisk) {
                    asterisk.style.display = this.checked ? 'none' : 'inline';
                }
                if (this.checked) middle.value = '';
            }
        });
    }
}

function setupModalHandlers() {
    // Terms modal
    const openTerms = document.getElementById('openTerms');
    const footerTerms = document.getElementById('footerTerms');
    const closeTerms = document.getElementById('closeTerms');
    const closeTermsBottom = document.getElementById('closeTermsBottom');

    if (openTerms) openTerms.addEventListener('click', () => showModal('termsModal'));
    if (footerTerms) footerTerms.addEventListener('click', () => showModal('termsModal'));
    if (closeTerms) closeTerms.addEventListener('click', () => hideModal('termsModal'));
    if (closeTermsBottom) closeTermsBottom.addEventListener('click', () => hideModal('termsModal'));

    // Privacy modal
    const openPrivacy = document.getElementById('openPrivacy');
    const footerPrivacy = document.getElementById('footerPrivacy');
    const closePrivacy = document.getElementById('closePrivacy');
    const closePrivacyBottom = document.getElementById('closePrivacyBottom');

    if (openPrivacy) openPrivacy.addEventListener('click', () => showModal('privacyModal'));
    if (footerPrivacy) footerPrivacy.addEventListener('click', () => showModal('privacyModal'));
    if (closePrivacy) closePrivacy.addEventListener('click', () => hideModal('privacyModal'));
    if (closePrivacyBottom) closePrivacyBottom.addEventListener('click', () => hideModal('privacyModal'));
}

function setupOTPInputs() {
    const inputs = document.querySelectorAll('.otp-input');
    console.log(`🔧 Setting up ${inputs.length} OTP inputs...`);
    
    inputs.forEach((input, index) => {
        input.addEventListener('input', function(e) {
            const value = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = value;
            
            if (value && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                inputs[index - 1].focus();
            }
        });
        
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
            const digits = pasteData.split('').slice(0, 6);
            
            digits.forEach((digit, i) => {
                if (inputs[i]) {
                    inputs[i].value = digit;
                }
            });
            
            if (digits.length < 6 && inputs[digits.length]) {
                inputs[digits.length].focus();
            }
        });
    });
}

function setupPasswordToggles() {
    const toggles = document.querySelectorAll('.toggle-password');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input) {
                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;
                const icon = this.querySelector('i');
                if (icon) {
                    icon.className = type === 'password' ? 'far fa-eye' : 'far fa-eye-slash';
                }
            }
        });
    });
}

// Main handler functions
async function handleLoginSubmit(e) {
    e.preventDefault();
    console.log('🔐 Login form submitted');
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const submitBtn = document.querySelector('#loginForm button[type="submit"]');

    // Basic validation
    if (!email || !password) {
        showNotification('Please enter both email and password', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    // Show loading state
    setButtonLoading(submitBtn, true, 'Logging in...');

    try {
        console.log('🔐 Attempting login for:', email);
        
        const response = await fetch(API_BASE + 'auth.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'login',
                email: email,
                password: password
            })
        });

        const data = await response.json();
        console.log('📨 Login response:', data);

        if (data.success) {
            console.log('✅ Login successful, opening OTP modal');
            currentUserId = data.user_id;
            showNotification('Login successful! OTP sent to your email.', 'success');
            openOtpModal();
        } else {
            console.log('❌ Login failed:', data.message);
            showNotification(data.message || 'Invalid email or password', 'error');
        }
    } catch (error) {
        console.error('🚨 Login error:', error);
        showNotification('Network error. Please try again.', 'error');
    } finally {
        setButtonLoading(submitBtn, false, 'Login');
    }
}

async function handleRegisterSubmit(e) {
    e.preventDefault();
    console.log('📝 Register form submitted');
    
    const formData = new FormData(document.getElementById('registerForm'));
    const data = Object.fromEntries(formData.entries());
    const submitBtn = document.querySelector('#registerForm button[type="submit"]');

    // Basic validation
    const requiredFields = ['firstName', 'lastName', 'regEmail', 'regPassword', 'confirmPassword', 'birthdate', 'mobile', 'address', 'barangay'];
    for (const field of requiredFields) {
        if (!data[field] || data[field].trim() === '') {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
    }

    if (data.regPassword !== data.confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    if (!isValidEmail(data.regEmail)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    // Check if terms are agreed
    const agreeTerms = document.getElementById('agreeTerms');
    const agreePrivacy = document.getElementById('agreePrivacy');
    if (!agreeTerms || !agreePrivacy || !agreeTerms.checked || !agreePrivacy.checked) {
        showNotification('Please agree to the Terms of Service and Privacy Policy', 'error');
        return;
    }

    setButtonLoading(submitBtn, true, 'Registering...');

    try {
        const response = await fetch(API_BASE + 'auth.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'register',
                ...data
            })
        });

        const result = await response.json();
        console.log('📨 Register response:', result);
        
        if (result.success) {
            currentUserId = result.user_id;
            showNotification('Registration successful! OTP sent to your email.', 'success');
            hideRegisterForm();
            openOtpModal();
        } else {
            showNotification(result.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Network error. Please try again.', 'error');
    } finally {
        setButtonLoading(submitBtn, false, 'Register');
    }
}

async function handleVerifyOtp() {
    console.log('🔑 Verifying OTP...');
    const otpCode = getOtpCode();
    const submitBtn = document.getElementById('submitOtp');
    const errorElement = document.getElementById('otpError');

    if (!otpCode || otpCode.length !== 6) {
        showError('Please enter the complete 6-digit OTP');
        return;
    }

    setButtonLoading(submitBtn, true, 'Verifying...');
    hideError();

    try {
        const response = await fetch(API_BASE + 'auth.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'verify_otp',
                user_id: currentUserId,
                otp_code: otpCode
            })
        });

        const data = await response.json();
        console.log('📨 OTP verification response:', data);
        
        if (data.success) {
            showNotification('OTP verified successfully!', 'success');
            closeOtpModal();
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = data.redirect || 'dashboard.php';
            }, 1500);
        } else {
            showError(data.message || 'Invalid OTP');
        }
    } catch (error) {
        console.error('OTP verification error:', error);
        showError('Network error. Please try again.');
    } finally {
        setButtonLoading(submitBtn, false, 'Verify');
    }
}

async function handleResendOtp() {
    console.log('🔄 Resending OTP...');
    const resendBtn = document.getElementById('resendOtp');
    
    setButtonLoading(resendBtn, true, 'Sending...');

    try {
        const response = await fetch(API_BASE + 'auth.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'resend_otp',
                user_id: currentUserId
            })
        });

        const data = await response.json();
        console.log('📨 Resend OTP response:', data);
        
        if (data.success) {
            showNotification('New OTP sent to your email', 'success');
            startOtpTimer();
        } else {
            showNotification(data.message || 'Failed to resend OTP', 'error');
        }
    } catch (error) {
        console.error('Resend OTP error:', error);
        showNotification('Network error. Please try again.', 'error');
    } finally {
        setButtonLoading(resendBtn, false, 'Resend OTP');
        resendBtn.disabled = true;
    }
}

// UI Functions
function showRegisterForm() {
    console.log('📝 Showing register form');
    const container = document.getElementById('registerFormContainer');
    if (container) {
        container.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function hideRegisterForm() {
    console.log('📝 Hiding register form');
    const container = document.getElementById('registerFormContainer');
    if (container) {
        container.classList.add('hidden');
        document.body.style.overflow = 'auto';
        container.querySelector('form').reset();
    }
}

function openOtpModal() {
    console.log('🔑 Opening OTP modal');
    const modal = document.getElementById('otpModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
        resetOtpInputs();
        startOtpTimer();
        hideError();
        console.log('✅ OTP modal opened successfully');
    } else {
        console.error('❌ OTP modal element not found!');
    }
}

function closeOtpModal() {
    console.log('🔑 Closing OTP modal');
    const modal = document.getElementById('otpModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = 'auto';
        stopOtpTimer();
        hideError();
    }
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = 'auto';
    }
}

// OTP Functions
function getOtpCode() {
    const inputs = document.querySelectorAll('.otp-input');
    const code = Array.from(inputs).map(input => input.value).join('');
    console.log('🔑 OTP code entered:', code);
    return code;
}

function resetOtpInputs() {
    const inputs = document.querySelectorAll('.otp-input');
    inputs.forEach(input => input.value = '');
    if (inputs[0]) inputs[0].focus();
}

function startOtpTimer() {
    otpTimeLeft = 180;
    const timerElement = document.getElementById('otpTimer');
    const resendButton = document.getElementById('resendOtp');
    
    if (resendButton) {
        resendButton.disabled = true;
    }
    
    updateTimerDisplay();
    
    if (otpTimer) {
        clearInterval(otpTimer);
    }
    
    otpTimer = setInterval(() => {
        otpTimeLeft--;
        updateTimerDisplay();
        
        if (otpTimeLeft <= 0) {
            stopOtpTimer();
            if (resendButton) {
                resendButton.disabled = false;
            }
        }
    }, 1000);
}

function stopOtpTimer() {
    if (otpTimer) {
        clearInterval(otpTimer);
        otpTimer = null;
    }
}

function updateTimerDisplay() {
    const timerElement = document.getElementById('otpTimer');
    if (timerElement) {
        const minutes = Math.floor(otpTimeLeft / 60);
        const seconds = otpTimeLeft % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Utility Functions
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true 
    };
    
    const dateTimeString = now.toLocaleDateString('en-US', options).toUpperCase();
    const dateTimeElement = document.getElementById('currentDateTime');
    
    if (dateTimeElement) {
        dateTimeElement.textContent = dateTimeString;
    }
}

function setButtonLoading(button, isLoading, text = '') {
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> ${text}`;
    } else {
        button.disabled = false;
        button.textContent = text;
    }
}

function showNotification(message, type = 'info') {
    console.log(`📢 Notification: ${message} (${type})`);
    // Remove existing notifications
    const existing = document.querySelectorAll('.notification');
    existing.forEach(notif => {
        if (notif.parentNode) {
            notif.remove();
        }
    });

    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg text-white transform transition-all duration-300 translate-x-full ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
    }`;
    
    const icon = type === 'success' ? 'fa-check-circle' :
                 type === 'error' ? 'fa-exclamation-circle' :
                 type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
    
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas ${icon}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 hover:opacity-70">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

function showError(message) {
    const errorElement = document.getElementById('otpError');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
}

function hideError() {
    const errorElement = document.getElementById('otpError');
    if (errorElement) {
        errorElement.classList.add('hidden');
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Make functions globally available
window.showNotification = showNotification;
window.handleSocialLogin = function(provider) {
    showNotification(`${provider} login is currently unavailable`, 'warning');
};