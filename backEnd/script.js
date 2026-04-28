document.addEventListener("DOMContentLoaded", () => {

  const toggle = document.getElementById("menu-toggle");
  const nav = document.querySelector(".nav-center");
  const overlay = document.getElementById("nav-overlay");
  const links = document.querySelectorAll(".nav-center a");

  toggle.addEventListener("click", () => {
    nav.classList.toggle("active");
    overlay.classList.toggle("active");

    toggle.textContent = nav.classList.contains("active") ? "✖" : "☰";
  });

  overlay.addEventListener("click", () => {
    nav.classList.remove("active");
    overlay.classList.remove("active");
    toggle.textContent = "☰";
  });

  links.forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("active");
      overlay.classList.remove("active");
      toggle.textContent = "☰";
    });
  });

});