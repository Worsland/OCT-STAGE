var token = new URLSearchParams(window.location.search).get("token");
var box = document.getElementById("verif-result");

if (!token) {
  box.className = "alert alert-danger show";
  box.textContent = "Aucun lien de verification fourni.";
} else {
  box.className = "alert show";
  box.textContent = "Verification en cours...";
  verifierEmailAPI(token).then(function (result) {
    if (result.ok) {
      box.className = "alert alert-success show";
      box.textContent = "Adresse " + result.email + " confirmee. Vous pouvez maintenant vous connecter.";
    } else {
      box.className = "alert alert-danger show";
      box.textContent = result.error;
    }
  });
}