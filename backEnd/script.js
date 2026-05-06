if (window.lucide) {
  lucide.createIcons();
}

const cards = document.querySelectorAll(".tarjetas");
const projectCards = document.querySelectorAll(".proyecto-card");

const observer = new IntersectionObserver((entries) => {

  entries.forEach((entry) => {

    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    }

  });

}, {
  threshold: 0.2
});

cards.forEach((card) => {
  observer.observe(card);
});

projectCards.forEach((card) => {
  observer.observe(card);
});


const nosotrosSection = document.querySelector("#nosotros");
const nosotrosContent = document.querySelector(".nosotros-content");
const nosotrosImage = document.querySelector(".nosotros-image");

if (nosotrosSection && nosotrosContent && nosotrosImage) {
  const observerNosotros = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

      if (entry.isIntersecting) {

        nosotrosContent.classList.add("show");

        setTimeout(() => {
          nosotrosImage.classList.add("show");
        }, 300);

      }

    });

  }, {
    threshold: 0.3
  });

  observerNosotros.observe(nosotrosSection);
}


document.addEventListener("DOMContentLoaded", () => {

  const modalBienvenida = document.querySelector("#modal-bienvenida");
  const botonCerrarModal = document.querySelector(".boton-cerrar-modal");
  const botonAccionModal = document.querySelector(".boton-modal-bienvenida");

  if (modalBienvenida && botonCerrarModal) {
    document.body.classList.add("modal-bienvenida-abierto");

    // Cierra el modal y devuelve el scroll normal de la pagina.
    const cerrarModalBienvenida = () => {
      modalBienvenida.classList.add("oculto");
      document.body.classList.remove("modal-bienvenida-abierto");
    };

    botonCerrarModal.addEventListener("click", cerrarModalBienvenida);

    modalBienvenida.addEventListener("click", (evento) => {
      if (evento.target === modalBienvenida) {
        cerrarModalBienvenida();
      }
    });

    if (botonAccionModal) {
      botonAccionModal.addEventListener("click", cerrarModalBienvenida);
    }

    document.addEventListener("keydown", (evento) => {
      if (evento.key === "Escape") {
        cerrarModalBienvenida();
      }
    });
  }

  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  const navOverlay = document.querySelector(".nav-overlay");

  if (menuToggle && mobileMenu && navOverlay) {
    const closeMenu = () => {
      menuToggle.classList.remove("active");
      mobileMenu.classList.remove("active");
      navOverlay.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
    };

    menuToggle.addEventListener("click", () => {
      const isOpen = menuToggle.classList.toggle("active");

      mobileMenu.classList.toggle("active", isOpen);
      navOverlay.classList.toggle("active", isOpen);
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navOverlay.addEventListener("click", closeMenu);

    mobileMenu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", closeMenu);
    });
  }

  const faqQuestions = document.querySelectorAll(".faq-question");

  faqQuestions.forEach(question => {

    question.addEventListener("click", () => {

      const faqItem = question.parentElement;

      faqItem.classList.toggle("active");

    });

  });

});
