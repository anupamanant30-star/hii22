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

// Handle Checkout
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

    try {
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: cart,
                total: total,
                customer: customer
            })
        });

        const result = await response.json();

        if (result.success) {
            alert(`SUCCESS!\nOrder ID: ${result.orderId}\n${result.message}`);
            // Clear form
            document.getElementById('checkout-form').reset();
            cart = [];
            saveCart();
            updateCartUI();
            closeCartSidebar();
        }
    } catch (error) {
        console.error("Checkout error:", error);
        alert("Checkout failed. Is the backend server running?");
    }
}


// Render Product Grid with Animated Reveal
function renderProducts() {
    if (!productGrid) return;
    productGrid.innerHTML = products.map((product, index) => `
        <div class="product-card" id="card-${product.id}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="product-price">₹${product.price.toLocaleString()}</div>
                <p class="product-description">${product.description}</p>
                <ul class="features-mini">
                    ${product.features.slice(0, 3).map(f => `<li><i class="fa-solid fa-circle"></i> ${f}</li>`).join('')}
                </ul>
                <button class="btn btn-gold" onclick="addToCart(${product.id})">
                    Pre-Order Now
                </button>
            </div>
        </div>
    `).join('');

    // Setup Scroll Reveal
    setupScrollReveal();
}

function setupScrollReveal() {
    const cards = document.querySelectorAll('.product-card');
    const observerOptions = {
        threshold: 0.2,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target); // Reveal once
            }
        });
    }, observerOptions);

    cards.forEach(card => observer.observe(card));
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


