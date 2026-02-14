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
    // document.body.innerHTML = "";
    // document.body.style.margin = "0";
    // document.body.style.padding = "0";
    // document.body.style.overflow = "hidden";

    // const img = document.createElement("img");

    // img.src =
    //   "https://imgs.search.brave.com/5m-C8xQrcAqaNEXQcqCI_1iH0FBqJeORNwj7NwGDWCM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/YXBwbGUuY29tL3Yv/aXBob25lL2hvbWUv/Y2kvaW1hZ2VzL292/ZXJ2aWV3L2luY2Vu/dGl2ZS90cmFkZV9p/bl9hbHRfX2V4M2dj/cXJkMDJjMl9sYXJn/ZS5qcGc";
    // img.alt = "My Image";
    // img.style.width = "100vw";
    // img.style.height = "100vh";
    // img.style.objectFit = "cover";
    // img.style.display = "block";

    // document.body.appendChild(img);

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
