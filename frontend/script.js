let products = []; // Now fetched from backend
let cart = JSON.parse(localStorage.getItem('eluxe_cart')) || [];

// DOM Elements
const productGrid = document.getElementById('product-grid');
const cartBtn = document.getElementById('cart-btn');
const cartSidebar = document.getElementById('cart-sidebar');
const closeCart = document.querySelector('.close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalPrice = document.getElementById('cart-total-price');
const cartCount = document.querySelector('.cart-count');
const productModal = document.getElementById('product-modal');
const closeModal = document.querySelector('.close-modal');
const modalBody = document.getElementById('modal-body');
const checkoutBtn = document.querySelector('.cart-footer .btn-gold');
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

// Auth DOM Elements
const loginBtn = document.getElementById('login-btn');
const authModal = document.getElementById('auth-modal');
const closeAuthModal = document.querySelector('.close-auth-modal');
const authStep1 = document.getElementById('auth-step-1');
const authStep2 = document.getElementById('auth-step-2');
const authSuccess = document.getElementById('auth-success');
const sendOtpBtn = document.getElementById('send-otp-btn');
const verifyOtpBtn = document.getElementById('verify-otp-btn');
const authEmailInput = document.getElementById('auth-email');
const authOtpInput = document.getElementById('auth-otp');
const anomalyAlert = document.getElementById('anomaly-alert');
const userDisplayName = document.getElementById('user-display-name');
const finishAuthBtn = document.getElementById('finish-auth-btn');

let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateCartUI();
});

// Fetch Products from Backend
async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        products = await response.json();
        renderProducts();
    } catch (error) {
        console.error("Error fetching products:", error);
        productGrid.innerHTML = '<p style="text-align: center; color: red;">Error loading collection. Please check if the server is running.</p>';
    }
}

// Handle Checkout with Razorpay
async function processCheckout() {
    if (cart.length === 0) {
        alert("Your selection is empty.");
        return;
    }

    // Get Form Data
    const name = document.getElementById('full-name').value;
    const email = document.getElementById('email').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const zip = document.getElementById('zip').value;

    if (!name || !email || !address || !city || !zip) {
        alert("Please complete all delivery details.");
        return;
    }

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const customer = { name, email, address, city, zip };

    checkoutBtn.textContent = "Processing...";
    checkoutBtn.disabled = true;

    try {
        // 1. Create Order on Server
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: cart,
                total: total,
                customer: customer
            })
        });

        const order = await response.json();

        if (!order.success) {
            throw new Error(order.message || "Failed to create order");
        }

        // 2. Open Razorpay Checkout
        const options = {
            key: order.keyId,
            amount: order.amount,
            currency: order.currency,
            name: "ELUXE Hookah",
            description: "Premium Purchase",
            order_id: order.orderId,
            handler: async function (response) {
                // 3. Verify Payment on Server
                const verifyRes = await fetch('/api/verify-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature
                    })
                });

                const verifyResult = await verifyRes.json();

                if (verifyResult.success) {
                    alert("PAYMENT SUCCESSFUL! Welcome to the ELUXE family.");
                    document.getElementById('checkout-form').reset();
                    cart = [];
                    saveCart();
                    updateCartUI();
                    closeCartSidebar();
                } else {
                    alert("Payment verification failed. Please contact support.");
                }
            },
            prefill: {
                name: name,
                email: email
            },
            theme: {
                color: "#c5a059" // ELUXE Gold
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();

    } catch (error) {
        console.error("Checkout error:", error);
        alert("Checkout failed: " + error.message);
    } finally {
        checkoutBtn.textContent = "Checkout";
        checkoutBtn.disabled = false;
    }
}


// Render Product Grid
function renderProducts() {
    if (!productGrid) return;
    productGrid.innerHTML = products.map(product => `
        <div class="product-card" onclick="openProductDetail(${product.id})">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
                <div class="add-to-cart-overlay">
                    <button class="btn btn-gold btn-block" onclick="event.stopPropagation(); addToCart(${product.id})">
                        Add To Cart
                    </button>
                </div>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <span class="product-price">₹${product.price.toLocaleString()}</span>
            </div>
        </div>
    `).join('');
}

// Cart Functions
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    updateCartUI();
    openCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
}

function updateQuantity(productId, delta) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
            updateCartUI();
        }
    }
}

function saveCart() {
    localStorage.setItem('eluxe_cart', JSON.stringify(cart));
}

function updateCartUI() {
    // Update count
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    cartCount.textContent = totalItems;

    // Update items list
    cartItemsContainer.innerHTML = cart.length === 0
        ? '<p style="text-align: center; margin-top: 2rem; color: #a0a0a0;">Your cart is empty</p>'
        : cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <span class="cart-item-price">₹${item.price.toLocaleString()}</span>
                    <div class="quantity-controls">
                        <button onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                    <span class="remove-item" onclick="removeFromCart(${item.id})">Remove</span>
                </div>
            </div>
        `).join('');

    // Update total
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    cartTotalPrice.textContent = `₹${total.toLocaleString()}`;
}

// Modal Functions
function openProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    modalBody.innerHTML = `
        <div class="modal-left">
            <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="modal-right">
            <h2>${product.name}</h2>
            <span class="product-price" style="font-size: 2rem;">₹${product.price.toLocaleString()}</span>
            <p class="modal-desc">${product.description}</p>
            <div class="features">
                <h4 style="margin-bottom: 1rem; color: var(--gold);">Key Features</h4>
                <ul class="features-list">
                    ${product.features.map(f => `<li><i class="fa-solid fa-check"></i> ${f}</li>`).join('')}
                </ul>
            </div>
            <button class="btn btn-gold btn-block" onclick="addToCart(${product.id}); closeProductModal();">Add to Cart</button>
        </div>
    `;
    productModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    productModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Sidebar Functions
function openCart() {
    cartSidebar.classList.add('open');
}

function closeCartSidebar() {
    cartSidebar.classList.remove('open');
}

// Event Listeners
cartBtn.addEventListener('click', openCart);
closeCart.addEventListener('click', closeCartSidebar);
closeModal.addEventListener('click', closeProductModal);
if (checkoutBtn) checkoutBtn.addEventListener('click', processCheckout);

// Mobile Menu Toggle
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        // Change icon between bars and xmark
        const icon = mobileMenuBtn.querySelector('i');
        if (icon.classList.contains('fa-bars')) {
            icon.classList.replace('fa-bars', 'fa-xmark');
        } else {
            icon.classList.replace('fa-xmark', 'fa-bars');
        }
    });
}

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const icon = mobileMenuBtn.querySelector('i');
        if (icon) icon.classList.replace('fa-xmark', 'fa-bars');
    });
});

window.addEventListener('click', (e) => {
    if (e.target === productModal) closeProductModal();
    if (e.target === cartSidebar) closeCartSidebar();
    if (e.target === authModal) closeAuthModalWindow();
});

// --- AUTH FUNCTIONS ---

function openAuthModal() {
    authModal.style.display = 'block';
    authStep1.style.display = 'block';
    authStep2.style.display = 'none';
    authSuccess.style.display = 'none';
    document.body.style.overflow = 'hidden';
}

function closeAuthModalWindow() {
    authModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function sendOtp() {
    const email = authEmailInput.value;
    if (!email) {
        alert("Please enter your email.");
        return;
    }

    sendOtpBtn.textContent = "Sending...";
    sendOtpBtn.disabled = true;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const result = await response.json();

        if (result.success) {
            authStep1.style.display = 'none';
            authStep2.style.display = 'block';

            console.log("OTP Sent!");
            if (result.anomalyDetected) {
                anomalyAlert.style.display = 'block';
            } else {
                anomalyAlert.style.display = 'none';
            }
        } else {
            alert(result.error || "Failed to send OTP.");
        }
    } catch (error) {
        console.error("Auth error:", error);
        alert("Authentication failed. Is the server running?");
    } finally {
        sendOtpBtn.textContent = "Get Verification Code";
        sendOtpBtn.disabled = false;
    }
}

async function verifyOtp() {
    const email = authEmailInput.value;
    const otp = authOtpInput.value;
    if (otp.length !== 6) {
        alert("Please enter the 6-digit code.");
        return;
    }

    verifyOtpBtn.textContent = "Verifying...";
    verifyOtpBtn.disabled = true;

    try {
        const response = await fetch('/api/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });
        const result = await response.json();

        if (result.success) {
            currentUser = email;
            authStep2.style.display = 'none';
            authSuccess.style.display = 'block';
            userDisplayName.textContent = email;
            loginBtn.innerHTML = `<i class="fa-solid fa-circle-user" style="color: var(--gold);"></i>`;
        } else {
            alert(result.message || "Invalid code.");
        }
    } catch (error) {
        console.error("Verification error:", error);
        alert("Verification failed.");
    } finally {
        verifyOtpBtn.textContent = "Verify & Login";
        verifyOtpBtn.disabled = false;
    }
}

// Auth Event Listeners
if (loginBtn) loginBtn.addEventListener('click', openAuthModal);
if (closeAuthModal) closeAuthModal.addEventListener('click', closeAuthModalWindow);
if (sendOtpBtn) sendOtpBtn.addEventListener('click', sendOtp);
if (verifyOtpBtn) verifyOtpBtn.addEventListener('click', verifyOtp);
if (finishAuthBtn) finishAuthBtn.addEventListener('click', closeAuthModalWindow);

// --- LUXURY PARALLAX EFFECT FOR HERO VIDEO ---
const heroVideo = document.querySelector('.hero-video');
let mouseX = 0;
let mouseY = 0;
let currentX = 0;
let currentY = 0;

// Configuration
const movementRange = 40; // Increased for better visibility (±40px)
const lerpFactor = 0.08;   // Slightly increased for a more "active" response

// Track mouse position
window.addEventListener('mousemove', (e) => {
    // Calculate position from center (-1 to 1)
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

function animateParallax() {
    // Only apply on screens wider than 1024px (Disable on mobile)
    if (window.innerWidth > 1024) {
        // Interpolate (Lerp) values for buttery smooth movement
        currentX += (mouseX - currentX) * lerpFactor;
        currentY += (mouseY - currentY) * lerpFactor;

        // Calculate final translation
        const translateX = currentX * movementRange;
        const translateY = currentY * movementRange;

        // Apply transform using translate3d for GPU acceleration
        // Includes initial scale(1.1) to avoid black edges
        if (heroVideo) {
            heroVideo.style.transform = `scale(1.1) translate3d(${translateX}px, ${translateY}px, 0)`;
        }
    } else {
        // Reset transform on mobile
        if (heroVideo) heroVideo.style.transform = `scale(1.1) translate3d(0, 0, 0)`;
    }

    requestAnimationFrame(animateParallax);
}

// Start the animation loop
animateParallax();

