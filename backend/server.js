const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const useragent = require('express-useragent');
const requestIp = require('request-ip');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(useragent.express());
app.use(requestIp.mw());
app.get('/api/products', (req, res) => {
    res.json(products);
});

// --- Firebase Initialization ---
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("🔥 Firebase Admin initialized successfully!");
} else {
    console.log("⚠️  Firebase Service Account key not found. Running with mock data.");
}

// --- Razorpay Initialization ---
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// --- Email Config ---
let transporter;

async function initEmail() {
    // If user hasn't set credentials, create a test account (Ethereal)
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
        console.log("⚠️ No real email credentials found. Generating test account...");
        let testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log(`✅ Test account generated: ${testAccount.user}`);
    } else {
        // Use real credentials from .env
        transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        console.log("📧 Real email transporter initialized.");
    }
}

initEmail();

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

// 1. Get all products (From Firestore if available, else mock)
app.get('/api/products', async (req, res) => {
    if (db) {
        try {
            const snapshot = await db.collection('products').get();
            const productsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (productsList.length > 0) return res.json(productsList);
        } catch (error) {
            console.error("Firestore Error:", error);
        }
    }
    // Fallback to mock data if Firestore is not ready or empty
    res.json(products);
});

// 2. Login & Anomaly Detection
app.post('/api/login', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const clientIp = req.clientIp;
    const device = req.useragent.source;

    let user;
    if (db) {
        const userDoc = await db.collection('users').doc(email).get();
        if (userDoc.exists) {
            user = userDoc.data();
        } else {
            user = { email, lastIp: clientIp, lastDevice: device, otp: null };
            await db.collection('users').doc(email).set(user);
        }
    } else {
        user = users[email];
        if (!user) {
            user = users[email] = { email, lastIp: clientIp, lastDevice: device, otp: null };
        }
    }

    let anomaly = false;
    if (user.lastIp && (user.lastIp !== clientIp || user.lastDevice !== device)) {
        anomaly = true;
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to DB
    if (db) {
        await db.collection('users').doc(email).update({ otp: otp });
    } else {
        user.otp = otp;
    }

    // Send Actual Email
    const mailOptions = {
        from: `"ELUXE Security" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'ELUXE Verification Code',
        html: `
            <div style="font-family: 'Playfair Display', serif; padding: 20px; background-color: #0a0a0a; color: #f8f8f8; text-align: center; border: 1px solid #c5a059;">
                <h1 style="color: #c5a059; letter-spacing: 4px;">ELUXE</h1>
                <p style="font-size: 1.2rem; margin-bottom: 2rem;">Your Luxury Experience Awaits</p>
                <div style="background-color: #1a1a1a; padding: 30px; border: 1px solid rgba(197, 160, 89, 0.2);">
                    <p style="color: #a0a0a0; margin-bottom: 1rem;">Use the code below to complete your login:</p>
                    <h2 style="font-size: 3rem; color: #c5a059; letter-spacing: 10px; margin: 0;">${otp}</h2>
                </div>
                ${anomaly ? `
                <p style="color: #ff6666; margin-top: 2rem; font-size: 0.9rem;">
                    ⚠️ We detected a login attempt from a new device/location. If this wasn't you, please secure your account.
                </p>` : ''}
                <p style="margin-top: 2rem; color: #a0a0a0; font-size: 0.8rem;">&copy; 2026 ELUXE Hookah. All rights reserved.</p>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Email Error:", error);
        } else {
            console.log("Email sent: " + info.response);
            // If using Ethereal, log the preview URL
            const testUrl = nodemailer.getTestMessageUrl(info);
            if (testUrl) {
                console.log(`\n📬 VIEW TEST EMAIL HERE: ${testUrl}\n`);
            }
        }
    });

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
        // otp: otp, // REMOVED FOR SECURITY - Now sent via email only
        anomalyDetected: anomaly
    });
});

// 3. Verify OTP
app.post('/api/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    let user;

    if (db) {
        const userDoc = await db.collection('users').doc(email).get();
        user = userDoc.exists ? userDoc.data() : null;
    } else {
        user = users[email];
    }

    if (user && user.otp === otp) {
        if (db) {
            await db.collection('users').doc(email).update({
                otp: null,
                lastIp: req.clientIp,
                lastDevice: req.useragent.source
            });
        } else {
            user.otp = null;
            user.lastIp = req.clientIp;
            user.lastDevice = req.useragent.source;
        }
        res.json({ success: true, message: "Verification successful" });
    } else {
        res.status(400).json({ success: false, message: "Invalid OTP" });
    }
});

// 4. Create Razorpay Order
app.post('/api/checkout', async (req, res) => {
    const { items, total, customer } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ error: "No items in cart" });
    }

    try {
        // Amount in paise (multiply by 100)
        const amount = Math.round(total * 100);

        const options = {
            amount: amount,
            currency: "INR",
            receipt: 'ELX-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        };

        const rzpOrder = await razorpay.orders.create(options);

        // Store pending order in Firebase if active
        if (db) {
            await db.collection('orders').doc(rzpOrder.id).set({
                orderId: rzpOrder.id,
                receipt: options.receipt,
                items,
                total,
                customer,
                status: 'created',
                createdAt: new Date().toISOString()
            });
        }

        res.json({
            success: true,
            keyId: process.env.RAZORPAY_KEY_ID,
            orderId: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency
        });

    } catch (error) {
        console.error("Razorpay Order Error:", error);
        res.status(500).json({ success: false, message: "Could not initiate payment." });
    }
});

// 5. Verify Payment Signature
app.post('/api/verify-payment', async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (isSignatureValid) {
        // Update order status in Firebase
        if (db) {
            await db.collection('orders').doc(razorpay_order_id).update({
                status: 'paid',
                paymentId: razorpay_payment_id,
                paidAt: new Date().toISOString()
            });
        }

        res.json({ success: true, message: "Payment verified successfully" });
    } else {
        res.status(400).json({ success: false, message: "Invalid payment signature" });
    }
});

app.listen(PORT, () => {
    console.log(`ELUXE Backend running at http://localhost:${PORT}`);
});

module.exports = app;
