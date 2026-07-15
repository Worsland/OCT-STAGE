function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

document.getElementById("connexion-form").addEventListener("submit", function (e) {
  e.preventDefault();
  var alertBox = document.getElementById("form-alert");
  var email = document.getElementById("email").value.trim();
  var password = document.getElementById("password").value;

  connecterParEmail(email, password).then(function (result) {
    if (!result.ok) {
      alertBox.className = "alert alert-danger show";
      alertBox.textContent = result.error;
      return;
    }

    var next = getQueryParam("next");
    window.location.href = next && next.length ? next : "offres.html";
  });
});

document.getElementById("google-login").addEventListener("click", function () {
  var alertBox = document.getElementById("form-alert");
  connexionGoogle().then(function (result) {
    if (!result.ok) {
      alertBox.className = "alert alert-danger show";
      alertBox.textContent = result.error;
      return;
    }
    var next = getQueryParam("next");
    window.location.href = next && next.length ? next : "offres.html";
  });
});