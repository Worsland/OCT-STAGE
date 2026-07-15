document.getElementById("inscription-form").addEventListener("submit", function (e) {
  e.preventDefault();
  var alertBox = document.getElementById("form-alert");

  fetch('../api/auth/register.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nom: document.getElementById("nom").value.trim(),
      prenom: document.getElementById("prenom").value.trim(),
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value,
      telephone: document.getElementById("telephone").value.trim(),
      etablissement: document.getElementById("etablissement").value.trim(),
    })
  })
    .then(function (res) { return res.json().then(function (data) { return { status: res.status, data: data }; }); })
    .then(function (result) {
      var data = result.data;
      if (result.status !== 200 || !data.success) {
        alertBox.className = "alert alert-danger show";
        alertBox.textContent = data.error || "Erreur d'inscription";
        return;
      }

      alertBox.className = "alert alert-success show";
      alertBox.textContent = data.message || "Compte cree. Verifiez votre boite mail.";

      var lienComplet = window.location.origin + data.verification_link;
      envoyerEmail({
        to_email: document.getElementById("email").value.trim(),
        to_name: document.getElementById("prenom").value.trim(),
        verification_link: lienComplet,
        subject: "Confirmez votre adresse email - Stages OCT",
        message: "Cliquez sur ce lien pour activer votre compte : " + lienComplet,
      }).then(function (res) {
        if (res && res.skipped) {
          alertBox.innerHTML += ' <a href="' + data.verification_link + '">Confirmer mon adresse email (lien de demo)</a>.';
        }
      }).catch(function (err) {
        console.error("Envoi EmailJS echoue :", err);
        alertBox.innerHTML += ' <a href="' + data.verification_link + '">Confirmer mon adresse email (lien de secours)</a>.';
      });

      e.target.reset();
    })
    .catch(function () {
      alertBox.className = "alert alert-danger show";
      alertBox.textContent = "Impossible de contacter le serveur.";
    });
});

document.getElementById("google-signup").addEventListener("click", function () {
  var alertBox = document.getElementById("form-alert");
  connexionGoogle().then(function (result) {
    if (!result.ok) {
      alertBox.className = "alert alert-danger show";
      alertBox.textContent = result.error;
      return;
    }
    window.location.href = "offres.html";
  });
});