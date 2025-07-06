const nodemailer = require('nodemailer');

// Maak een transporter voor Nodemailer
const transporter = nodemailer.createTransport({
    host: 'smtp.transip.email', // Vervang dit door de juiste SMTP-server van TransIP
    port: 587,                  // Gebruik de juiste poort, meestal 587 voor TLS
    secure: false,              // Gebruik true voor 465, false voor andere poorten
    auth: {
        user: 'info@temp-replaced.com', // Jouw TransIP emailadres
        pass: 'jouw-email-wachtwoord' // Wachtwoord voor jouw TransIP emailadres
    },
    tls: {
        rejectUnauthorized: false // Optioneel voor TLS
    }
});

module.exports = transporter;
