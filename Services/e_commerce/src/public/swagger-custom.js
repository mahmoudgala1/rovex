function redirectToLogin() {
  sessionStorage.clear();
  window.location.replace("/login.html");
}

const observer = new MutationObserver(() => {
  // if (sessionStorage.getItem("rovex_admin_authenticated") !== "true") {
  //   redirectToLogin();
  // }
  const topbar = document.querySelector(".swagger-ui .topbar");

  if (topbar) {
    const btn = document.createElement("button");
    btn.innerText = "← Back to Dashboard";
    btn.className = "btn-back-dashboard";

    btn.onclick = () => window.location.replace("https://rovex.click");

    topbar.appendChild(btn);

    observer.disconnect();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
