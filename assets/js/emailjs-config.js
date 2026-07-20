/*
 * emailjs-config.js
 * Configuration EmailJS (https://www.emailjs.com/) pour l'envoi d'emails
 * cote client, sans serveur SMTP.
 *
 * A FAIRE (compte EmailJS) :
 *   1. Creer un compte sur https://www.emailjs.com/
 *   2. Ajouter un "Email Service" (ex. Gmail, Outlook...) -> recupere EMAILJS_SERVICE_ID
 *   3. Creer un "Email Template" avec les variables {{to_email}}, {{to_name}},
 *      {{verification_link}}, {{subject}}, {{message}} -> recupere EMAILJS_TEMPLATE_ID
 *   4. Dans Account > General, recupere la "Public Key" -> EMAILJS_PUBLIC_KEY
 *   5. Remplacer les 3 valeurs ci-dessous.
 */
var EMAILJS_PUBLIC_KEY = "YXURmjIG4dRxrx9Vk";
var EMAILJS_SERVICE_ID = "service_g2gt91t";
var EMAILJS_TEMPLATE_ID = "template_hqlzq5x";

if (typeof emailjs !== "undefined") {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

function envoyerEmail(params) {
  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params)
    .then(res => {
      console.log('EmailJS SUCCESS', res.status, res.text);
      return res;
    })
    .catch(err => {
      console.error('EmailJS FAILED - Status:', err.status);
      console.error('EmailJS FAILED - Text:', err.text);
      throw err; // très important pour que le catch du dessus le récupère
    });
}