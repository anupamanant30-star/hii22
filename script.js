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
                <span class="product-price">$${product.price.toLocaleString()}</span>
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
                    <span class="cart-item-price">$${item.price.toLocaleString()}</span>
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
    cartTotalPrice.textContent = `$${total.toLocaleString()}`;
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
            <span class="product-price" style="font-size: 2rem;">$${product.price.toLocaleString()}</span>
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
});

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

