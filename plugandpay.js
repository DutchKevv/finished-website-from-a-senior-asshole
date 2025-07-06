// plugandpay.js
const axios = require('axios');

const PLUGANDPAY_API_URL = 'https://admin.plugandpay.io/api/v1/order';
const apiKey = ''; // Zet hier je eigen API-sleutel

/// Functie om een bestelling aan te maken via Plug&Pay API
const createOrder = async (orderData) => {
    try {
        const response = await axios.post(PLUGANDPAY_API_URL, {
            api_token: apiKey,
            order: orderData
        });
        return response.data;
    } catch (error) {
        console.error('Fout bij het aanmaken van de bestelling:', error);
        throw error;
    }
};

// Functie om Plug&Pay webhook meldingen te verwerken
const handleWebhook = (event, data) => {
    switch(event) {
        case 'order.completed':
            console.log('Bestelling voltooid:', data);
            // Verwerk voltooide bestelling, bijv. door de gebruiker in de database bij te werken
            break;
        case 'subscription.cancelled':
            console.log('Abonnement opgezegd:', data);
            // Verwerk de opzegging
            break;
        default:
            console.log('Onbekend event ontvangen:', event);
    }
};

module.exports = {
    createOrder,
    handleWebhook
};