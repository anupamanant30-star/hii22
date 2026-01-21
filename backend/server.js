const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const useragent = require('express-useragent');
const requestIp = require('request-ip');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(useragent.express());
app.use(requestIp.mw());
app.use(express.static(path.join(__dirname, '../frontend')));

// --- Mock Data ---
const products = [
    {
        id: 1,
        name: "Noir Elegance",
        price: 3500,
        image: "images/A_premium_luxury_2k_202601202332.jpeg",
        description: "The Noir Elegance is the pinnacle of our collection. Crafted from aviation-grade aluminum and hand-blown Bohemian crystal.",
        features: ["Matte Black Finish", "Quiet Purge System", "Medical Grade Silicone Hose", "Magnetic Connectors"]
    },
    {
        id: 2,
        name: "Emerald Sovereign",
        price: 4500,
        image: "images/A_luxury_hookah_2k_202601202338.jpeg",
        description: "A statement piece that combines traditional aesthetics with modern engineering. Finished with 24K gold plating.",
        features: ["24K Gold Plated", "Crystal Glass Base", "Leather Wrapped Hose", "Adjustable Diffuser"]
    },
    {
        id: 3,
        name: "Arctic Minimalist",
        price: 2200,
        image: "images/A_modern_minimalist_2k_202601202334.jpeg",
        description: "Sleek, clean, and powerful. The Arctic Minimalist is designed for those who appreciate the beauty of simplicity.",
        features: ["Anodized Aluminum", "Hidden Blow-off", "Compact Design", "Universal Bowl Adapter"]
    },
    {
        id: 4,
        name: "Crystal Chrome Luxe",
        price: 4800,
        image: "images/A luxury designer hookah with a crystal-cut glass base and chrome stem, reflections sparkling under studio lights, black background, smooth smoke swirls, elegant and premium look, ultra-detailed, professional luxury product photography.jpeg",
        description: "A masterpiece of reflection and light. This designer hookah features a crystal-cut glass base that sparkles with every draw.",
        features: ["Hand-Cut Crystal", "Chrome Polish Stem", "Smooth Flow Tech", "Studio-Grade Finish"]
    },
    {
        id: 5,
        name: "Stellar Stainless",
        price: 3200,
        image: "images/A_luxury_stainless_2k_202601202345.jpeg",
        description: "Engineered for durability without compromising on style. The Stellar Stainless is proof that industrial design can be luxurious.",
        features: ["V2A Stainless Steel", "Easy-Cleaning Design", "Vertical Purge", "Weighted Base Stability"]
    },
    {
        id: 6,
        name: "Limited Edition Gold",
        price: 5000,
        image: "images/A_limitededition_luxury_2k_202601202348.jpeg",
        description: "A rare treasure for the true collector. Only 50 units produced worldwide, featuring a unique numbered engraving.",
        features: ["Numbered 1-50", "Double-Gold Plated", "Hand-Etched Accents", "Certificate of Authenticity"]
    },
    {
        id: 7,
        name: "Imperial Nomad",
        price: 2800,
        image: "images/A_traditional_arabic_2k_202601202334.jpeg",
        description: "Inspired by nomadic heritage, this hookah features intricate engravings and a solid brass heart for exceptional performance.",
        features: ["Solid Brass Body", "Traditional Port Design", "Premium Clay Bowl", "Suede Carry Bag"]
    },
    {
        id: 8,
        name: "Prism Designer",
        price: 3800,
        image: "images/A_designer_hookah_2k_202601202337.jpeg",
        description: "A collaboration with contemporary artists. Each piece features a unique iridescent finish that changes with the light.",
        features: ["Titanium Coating", "Borosilicate Glass", "Custom Flow Control", "Unique Serial Number"]
    },
    {
        id: 9,
        name: "Eclipse Compact",
        price: 1800,
        image: "images/A_compact_portable_2k_202601202335.jpeg",
        description: "Performance in a portable package. The Eclipse Compact delivers full-size smoke production in a travel-friendly size.",
        features: ["Threaded Base", "Carbon Fiber Accents", "Hard Shell Case", "Anti-kink Hose"]
    },
    {
        id: 10,
        name: "High-End Prestige",
        price: 4200,
        image: "images/A_highend_luxury_2k_202601202339.jpeg",
        description: "The definition of prestige. Each component is precision-machined and inspected for absolute perfection.",
        features: ["Precision Machined", "Silent Draw Technology", "Diamond-Cut Base", "Modular Stem System"]
    },
    {
        id: 11,
        name: "Royal Velvet",
        price: 3100,
        image: "images/A_luxury_designer_2k_202601202348.jpeg",
        description: "Soft to the touch but bold in performance. This luxury designer piece uses velvet-touch coatings for an unmatched tactile experience.",
        features: ["Velvet-Touch Finish", "Ergonomic Grip", "High-Flow Downstem", "Integrated LED Base"]
    },
    {
        id: 12,
        name: "Avant-Garde Stylish",
        price: 3400,
        image: "images/A_stylish_hookah_2k_202601202336.jpeg",
        description: "A bold fashion statement. The Avant-Garde features asymmetric design elements that challenge traditional hookah silhouettes.",
        features: ["Asymmetric Design", "Metallic Pearl Finish", "Custom Glass Tray", "Extended Hose Support"]
    }
];

// Mock database for users and OTPs
const users = {
    "guest@eluxe.com": {
        email: "guest@eluxe.com",
        lastIp: null,
        lastDevice: null,
        otp: null
    }
};

// --- Routes ---

// 1. Get all products
app.get('/api/products', (req, res) => {
    res.json(products);
});

// 2. Login & Anomaly Detection
app.post('/api/login', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const clientIp = req.clientIp;
    const device = req.useragent.source;

    let user = users[email];
    if (!user) {
        // Create new user for demo purposes
        user = users[email] = { email, lastIp: clientIp, lastDevice: device, otp: null };
    }

    let anomaly = false;
    if (user.lastIp && (user.lastIp !== clientIp || user.lastDevice !== device)) {
        anomaly = true;
        console.log(`[SECURITY ALERT] Anomaly detected for ${email}`);
        console.log(`Expected: ${user.lastIp} on ${user.lastDevice}`);
        console.log(`Detected: ${clientIp} on ${device}`);
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;

    // Simulate sending email/OTP
    console.log(`\n\n\n*****************************************`);
    console.log(`🚀 VERIFICATION CODE FOR: ${email}`);
    console.log(`🔑 YOUR OTP IS: [ ${otp} ]`);
    console.log(`*****************************************`);
    if (anomaly) {
        console.log(`⚠️  SECURITY ALERT: New device detected!`);
    }
    console.log(`*****************************************\n\n\n`);

    res.json({
        success: true,
        message: "OTP sent to your email",
        otp: otp, // Temporarily sending back for diagnostic visibility
        anomalyDetected: anomaly
    });
});

// 3. Verify OTP
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    const user = users[email];

    if (user && user.otp === otp) {
        user.otp = null; // Clear OTP after verification
        user.lastIp = req.clientIp; // Update last known good login
        user.lastDevice = req.useragent.source;
        res.json({ success: true, message: "Verification successful" });
    } else {
        res.status(400).json({ success: false, message: "Invalid OTP" });
    }
});

// 4. Mock Checkout Process
app.post('/api/checkout', (req, res) => {
    const { items, total, customer } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ error: "No items in cart" });
    }

    console.log("=== NEW ORDER RECEIVED ===");
    if (customer) {
        console.log(`Customer: ${customer.name} (${customer.email})`);
        console.log(`Address: ${customer.address}, ${customer.city} (${customer.zip})`);
    }
    console.log(`Total Value: $${total}`);
    console.log("Items:", items.map(i => `${i.name} (x${i.quantity})`).join(', '));
    console.log("==========================");

    const orderId = 'ELX-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    res.json({
        success: true,
        orderId: orderId,
        message: "Order placed successfully! Welcome to the ELUXE family."
    });
});

app.listen(PORT, () => {
    console.log(`ELUXE Backend running at http://localhost:${PORT}`);
});

module.exports = app;
