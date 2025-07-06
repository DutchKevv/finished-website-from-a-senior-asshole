const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');
const paypal = require('@paypal/checkout-server-sdk');
require('dotenv').config();

// PayPal environment setup
const paypalClient = new paypal.core.PayPalHttpClient(
    new paypal.core.SandboxEnvironment(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET
    )
);

// Configuratie van de poort en omgeving
const LOCAL_PORT = process.env.LOCAL_PORT;
const PROD_PORT = process.env.PROD_PORT;
const HOST = process.env.HOST;
const ISPROD = process.env.NODE_ENV === 'production';

const app = express();
const db = new sqlite3.Database('./database.sqlite');

// View engine instellen op EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware om JSON en URL-encoded data te parsen
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files middleware for serving CSS, JS, and images
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware configureren
app.use(session({
    secret: 'je_geheime_sleutel',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: ISPROD }
}));

// Database setup voor 'users' tabel
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    password TEXT,
    payment_status TEXT DEFAULT 'unpaid',
    reset_token TEXT
)`);

// Middleware om userId beschikbaar te maken in alle EJS templates
app.use((req, res, next) => {
    res.locals.userId = req.session.userId || null; // Sla de userId op in res.locals als deze aanwezig is in de sessie
    next();
});

// Route voor de indexpagina
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route voor de registratiepagina (voorheen landing)
app.get('/registration', (req, res) => {
    res.render('registration'); // Render registration.ejs voor registratie
});

// Route voor de FAQ pagina
app.get('/faq', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'faq.html'));
});

// Route voor de login pagina
app.get('/login', (req, res) => {
    res.render('login');
});

// Route voor het dashboard
app.get('/dashboard', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login'); // Als de gebruiker niet is ingelogd, ga naar de loginpagina
    }
    res.render('dashboard'); // Render dashboard.ejs
});

// Route voor de checkout pagina (Render checkout.ejs in plaats van een HTML-bestand te serveren)
app.get('/checkout', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.render('checkout'); // Render checkout.ejs voor de checkout pagina
});

// Route voor de betalingspagina (pay.ejs)
// Route voor de betalingspagina (pay.ejs)
app.get('/pay', (req, res) => {
    const { plan, price } = req.query; // Gebruik 'plan' en 'price' variabelen

    if (!req.session.userId) {
        return res.redirect('/login'); // Als de gebruiker niet is ingelogd, ga naar de loginpagina
    }

    if (!plan || !price) {
        return res.status(400).send('Plan en prijs zijn vereist.');
    }

    // Render pay.ejs met het geselecteerde plan en de prijs
    res.render('pay', { plan, price }); // Zorg ervoor dat 'plan' en 'price' naar pay.ejs worden gestuurd
});

// Registratie (POST)
app.post('/register', async (req, res) => {
    const { name, email, phone, password, 'confirm-password': confirmPassword } = req.body;
    if (password !== confirmPassword) {
        return res.status(400).send('Wachtwoorden komen niet overeen.');
    }

    // Controleer of het emailadres al bestaat
    db.get('SELECT email FROM users WHERE email = ?', [email], async (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Er is een fout opgetreden bij het registreren.');
        }
        if (row) {
            return res.status(400).send('Dit emailadres is al in gebruik.');
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            db.run(`INSERT INTO users (name, email, phone, password, payment_status) VALUES (?, ?, ?, ?, 'unpaid')`,
                [name, email, phone, hashedPassword],
                (err) => {
                    if (err) {
                        console.error(err);
                        res.status(500).send('Er is een fout opgetreden bij het registreren.');
                    } else {
                        res.redirect('/login');
                    }
                }
            );
        } catch (error) {
            console.error(error);
            res.status(500).send('Er is een fout opgetreden bij het registreren.');
        }
    });
});

// Verwerken van login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Er is een fout opgetreden bij het inloggen.');
        }
        if (!user) {
            return res.status(400).send('Gebruiker niet gevonden.');
        }
        try {
            if (await bcrypt.compare(password, user.password)) {
                req.session.userId = user.id; // Sla de userId op in de sessie
                res.redirect('/dashboard');
            } else {
                res.status(400).send('Onjuist wachtwoord.');
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Er is een fout opgetreden bij het inloggen.');
        }
    });
});

// Route voor uitloggen
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Er is een fout opgetreden bij het uitloggen.');
        }
        res.redirect('/login');
    });
});

// Route om een PayPal transactie aan te maken
app.post('/create-paypal-transaction', async (req, res) => {
    const { price } = req.body;
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
            amount: {
                currency_code: 'EUR',
                value: price // Gebruik de prijs die via de POST-request is verzonden
            }
        }]
    });

    try {
        const order = await paypalClient.execute(request);
        res.json({ id: order.result.id }); // Stuur het order ID terug naar de frontend
    } catch (error) {
        console.error('Error creating PayPal order:', error);
        res.status(500).send('Fout bij het aanmaken van PayPal order.');
    }
});

// Route om de PayPal betaling te bevestigen
app.post('/capture-paypal-transaction', async (req, res) => {
    const orderID = req.body.orderID;
    const request = new paypal.orders.OrdersCaptureRequest(orderID);

    try {
        const capture = await paypalClient.execute(request);
        res.json({ status: 'success', capture }); // Bevestig de succesvolle betaling
    } catch (error) {
        console.error('Error capturing PayPal payment:', error);
        res.status(500).send('Fout bij het vastleggen van PayPal betaling.');
    }
});

// Start de server met HTTPS in productie of HTTP in ontwikkeling
if (ISPROD) {
    const PATH_CERTS = path.join(__dirname, './ssl');
    const credentials = {
        key: fs.readFileSync(path.join(PATH_CERTS, 'certificate.key'), 'utf8'),
        cert: fs.readFileSync(path.join(PATH_CERTS, 'certificate.crt'), 'utf8'),
    };

    // HTTPS server
    const httpsServer = https.createServer(credentials, app);
    httpsServer.listen(PROD_PORT, HOST, () => {
        console.log(`HTTPS Server is running at https://${HOST}:${PROD_PORT}`);
    });

    // HTTP naar HTTPS redirect server op poort 80
    http.createServer((req, res) => {
        res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
        res.end();
    }).listen(80, () => {
        console.log('HTTP to HTTPS redirect server running on port 80');
    });

} else {
    // HTTP server in ontwikkelomgeving
    const httpServer = http.createServer(app);
    httpServer.listen(3000, () => {
        console.log(`HTTP Server is running at http://${HOST}:${LOCAL_PORT}`);
    });
}
