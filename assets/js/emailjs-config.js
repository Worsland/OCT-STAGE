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
  if (typeof emailjs === "undefined") {
    return Promise.reject(new Error("EmailJS n'est pas charge (verifiez le script CDN dans le HTML)."));
  }
  if (EMAILJS_PUBLIC_KEY.indexOf("REMPLACER") === 0) {
    console.warn("EmailJS n'est pas configure (voir assets/js/emailjs-config.js). Email non envoye :", params);
    return Promise.resolve({ skipped: true });
  }
  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params);
}