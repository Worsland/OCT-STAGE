/*
 * auth.js
 * Authentification reelle (candidats) branchee sur les API PHP + MySQL :
 *   - /api/auth/register.php  -> inscription par email (INSERT CANDIDAT,
 *     email_verifie = 0, vrai jeton de verification stocke en base)
 *   - /api/auth/verify.php    -> confirmation d'email via ce jeton
 *   - /api/auth/login.php     -> connexion par email/mot de passe
 *   - /api/auth/google.php    -> creation/recuperation du compte apres un
 *     signInWithPopup Firebase reussi cote client
 *
 * Emails : aucun service SMTP n'est encore configure cote serveur, donc
 * l'envoi reste simule (toast + lien affiche a l'ecran), mais le jeton de
 * verification, lui, est reel et stocke en base (table CANDIDAT). Des que
 * PHPMailer/SendGrid/SES est branche dans register.php, l'envoi deviendra
 * reel sans rien changer ici.
 *
 * Connexion Google : remplacer FIREBASE_CONFIG ci-dessous par la config de
 * votre projet Firebase (Console Firebase > Parametres du projet > Vos
 * applications > SDK), et charger le SDK Firebase (compat) dans les pages
 * inscription.html / connexion.html :
 *
 *   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
 *   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
 *
 * Tant que FIREBASE_CONFIG n'est pas rempli, connexionGoogle() affiche un
 * message clair au lieu d'essayer une vraie connexion.
 */

var SS_SESSION = "oct_session";
var SS_ADMIN_SESSION = "oct_admin_session";

// TODO (Firebase) : remplacer ces valeurs par celles de votre projet.
var FIREBASE_CONFIG = {
  apiKey: "AIzaSyBOKDMWWuCalx1uIr878NNY3ZIO4HgvAxI",
  authDomain: "oct-stage.firebaseapp.com",
  projectId: "oct-stage",
  storageBucket: "oct-stage.firebasestorage.app",
  messagingSenderId: "1073681258417",
  appId: "1:1073681258417:web:c27f894a3e0783897b8f90",
  measurementId: "G-4XEBDGEE3Q"
};

function firebaseEstConfigure() {
  return FIREBASE_CONFIG.apiKey.indexOf("TODO_") !== 0;
}

/* ---------- Simulation d'envoi d'email (tant qu'aucun SMTP n'est branche) ---------- */
/* Le vrai enregistrement de l'envoi se fait desormais cote serveur, dans la
 * table NOTIFICATION (canal = 'email'), au moment de l'INSERT en base.
 * Cette fonction ne fait plus qu'un affichage local (toast) pour la demo. */

function simulerEnvoiEmail(destinataire, sujet, corps) {
  if (typeof showToast === "function") {
    showToast("Email envoye a " + destinataire + " : " + sujet);
  }
}

/* ---------- Verification d'email (vrai jeton, stocke en base) ---------- */

function verifierEmailAPI(token) {
  return fetch("../api/auth/verify.php?token=" + encodeURIComponent(token))
    .then(function (res) {
      return res.json().then(function (data) {
        return { ok: res.ok && data.success, error: data.error, email: data.email };
      });
    })
    .catch(function () {
      return { ok: false, error: "Impossible de contacter le serveur." };
    });
}

/* ---------- Connexion par email (vraie API, mot de passe verifie en base) ---------- */

function connecterParEmail(email, password) {
  return fetch("../api/auth/login.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email, password: password }),
  })
    .then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok || !data.success) {
          return { ok: false, error: data.error || "Email ou mot de passe incorrect." };
        }
        ouvrirSession(data.user);
        return { ok: true };
      });
    })
    .catch(function () {
      return { ok: false, error: "Impossible de contacter le serveur." };
    });
}

/* ---------- Connexion / inscription Google (vrai Firebase Authentication) ---------- */

function connexionGoogle() {
  if (!firebaseEstConfigure()) {
    return Promise.resolve({
      ok: false,
      error: "Connexion Google pas encore configuree (cles Firebase manquantes dans auth.js).",
    });
  }
  if (typeof firebase === "undefined") {
    return Promise.resolve({
      ok: false,
      error: "Le SDK Firebase n'est pas charge sur cette page.",
    });
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }

  var provider = new firebase.auth.GoogleAuthProvider();
  return firebase.auth().signInWithPopup(provider)
    .then(function (result) {
      var googleUser = result.user;
      return fetch("../api/auth/google.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: googleUser.email,
          displayName: googleUser.displayName || "",
          google_uid: googleUser.uid,
        }),
      });
    })
    .then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok || !data.success) {
          return { ok: false, error: data.error || "Connexion Google impossible." };
        }
        ouvrirSession(data.user);
        return { ok: true };
      });
    })
    .catch(function (err) {
      return { ok: false, error: "Connexion Google annulee ou impossible (" + (err && err.message ? err.message : "erreur") + ")." };
    });
}

/* ---------- Session candidat ---------- */

function ouvrirSession(user) {
  sessionStorage.setItem(SS_SESSION, JSON.stringify({
    id: user.id, nom: user.nom, prenom: user.prenom, email: user.email,
    telephone: user.telephone, etablissement: user.etablissement,
    startedAt: Date.now(),
  }));
}
function getSession() {
  var raw = sessionStorage.getItem(SS_SESSION);
  return raw ? JSON.parse(raw) : null;
}
function deconnecter() {
  sessionStorage.removeItem(SS_SESSION);
  window.location.href = "connexion.html";
}
function requireAuth(nextPage) {
  var session = getSession();
  if (!session) {
    window.location.replace("connexion.html?next=" + encodeURIComponent(nextPage || ""));
    return null;
  }
  if (session.startedAt && Date.now() - session.startedAt > 8 * 60 * 60 * 1000) {
    deconnecter();
    return null;
  }
  return session;
}

/* ---------- Session administrateur ---------- */
/* Identifiants de demonstration : admin@oct.tn / admin123 */
/* (hors perimetre de cette tache : voir TODO.md, point "Remplacer les
 * identifiants admin en dur par une vraie authentification securisee") */

function connecterAdmin(email, password) {
  if (email === "admin@oct.tn" && password === "admin123") {
    sessionStorage.setItem(SS_ADMIN_SESSION, JSON.stringify({ email: email, startedAt: Date.now() }));
    document.cookie = "oct_admin_auth=1; path=/; max-age=28800; SameSite=Lax";
    document.cookie = "oct_admin_email=" + encodeURIComponent(email) + "; path=/; max-age=28800; SameSite=Lax";
    return { ok: true };
  }
  return { ok: false, error: "Identifiants administrateur incorrects." };
}
function getAdminSession() {
  var raw = sessionStorage.getItem(SS_ADMIN_SESSION);
  return raw ? JSON.parse(raw) : null;
}
function deconnecterAdmin() {
  sessionStorage.removeItem(SS_ADMIN_SESSION);
  document.cookie = "oct_admin_auth=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "oct_admin_email=; path=/; max-age=0; SameSite=Lax";
  window.location.href = "login.html";
}
function requireAdmin() {
  var adminSession = getAdminSession();
  var hasAdminCookie = document.cookie.split(';').some(function (part) {
    return part.trim().indexOf('oct_admin_auth=1') === 0;
  });
  if (!adminSession && !hasAdminCookie) {
    window.location.replace("login.html");
    return false;
  }
  if (adminSession && adminSession.startedAt && Date.now() - adminSession.startedAt > 8 * 60 * 60 * 1000) {
    deconnecterAdmin();
    return false;
  }
  return true;
}

function updateAuthNav() {
  var nav = document.querySelector(".nav-links");
  if (!nav) return;

  var session = getSession();
  var adminSession = getAdminSession();
  if (adminSession) return;

  var loginLink = nav.querySelector('a[href="connexion.html"]') || Array.from(nav.querySelectorAll('a')).find(function (a) {
    return a.textContent.trim().toLowerCase().indexOf('se connecter') !== -1;
  });
  var signupLink = nav.querySelector('a[href="inscription.html"]') || Array.from(nav.querySelectorAll('a')).find(function (a) {
    return a.textContent.trim().toLowerCase().indexOf('creer un compte') !== -1;
  });

  if (session) {
    if (loginLink) {
      var logoutLink = document.createElement("a");
      logoutLink.href = "#";
      logoutLink.textContent = "Deconnexion";
      logoutLink.addEventListener("click", function (e) {
        e.preventDefault();
        deconnecter();
      });
      loginLink.parentNode.replaceChild(logoutLink, loginLink);
    }
    if (signupLink) {
      signupLink.remove();
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", updateAuthNav);
} else {
  updateAuthNav();
}

/* ---------- Toast (retour visuel des envois d'email, etc.) ---------- */

function showToast(message) {
  var existing = document.getElementById("oct-toast");
  if (existing) existing.remove();

  var toast = document.createElement("div");
  toast.id = "oct-toast";
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(function () { toast.classList.add("show"); });
  setTimeout(function () {
    toast.classList.remove("show");
    setTimeout(function () { toast.remove(); }, 300);
  }, 3500);
}