document.getElementById("admin-login-form").addEventListener("submit", function (e) {
  e.preventDefault();
  var email = document.getElementById("email").value.trim();
  var password = document.getElementById("password").value;
  var alertBox = document.getElementById("form-alert");

  var result = connecterAdmin(email, password);
  if (!result.ok) {
    alertBox.className = "alert alert-danger show";
    alertBox.textContent = result.error;
    return;
  }
  window.location.href = "dashboard.html";
});
