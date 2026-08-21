if (window.lucide) {
  lucide.createIcons();
}

const cleanUrlMap = {
  "/index.html": "/",
  "/contacto.html": "/contacto/",
  "/faq.html": "/faq/"
};

const currentPath = window.location.pathname;
const cleanPath = Object.keys(cleanUrlMap).find(path => currentPath.endsWith(path));

if (cleanPath) {
  const basePath = currentPath.slice(0, -cleanPath.length);
  window.history.replaceState(null, "", `${basePath}${cleanUrlMap[cleanPath]}${window.location.search}${window.location.hash}`);
}

if (!document.querySelector(".whatsapp-btn")) {
  const whatsappButton = document.createElement("a");
  whatsappButton.href = "https://wa.me/5492236908197?text=Hola%20sCode%20Digital%20Solutions%2C%20quiero%20hacer%20una%20consulta.";
  whatsappButton.className = "whatsapp-btn";
  whatsappButton.target = "_blank";
  whatsappButton.rel = "noopener noreferrer";
  whatsappButton.setAttribute("aria-label", "Enviar mensaje por WhatsApp a sCode Digital Solutions");
  whatsappButton.innerHTML = `
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M16.04 3.2c-7.02 0-12.72 5.7-12.72 12.72 0 2.24.58 4.43 1.69 6.36L3.2 28.8l6.68-1.75a12.69 12.69 0 0 0 6.16 1.57h.01c7.01 0 12.72-5.7 12.72-12.72S23.06 3.2 16.04 3.2Zm0 23.28h-.01c-1.94 0-3.84-.52-5.5-1.51l-.39-.23-3.96 1.04 1.06-3.86-.25-.4a10.48 10.48 0 0 1-1.61-5.6c0-5.84 4.76-10.59 10.61-10.59 2.83 0 5.5 1.1 7.5 3.11a10.52 10.52 0 0 1 3.11 7.49c0 5.84-4.76 10.59-10.56 10.59Zm5.81-7.93c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1.01 1.24-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.15-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.98-2.35-.26-.62-.52-.54-.71-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.65s1.14 3.07 1.3 3.28c.16.21 2.25 3.43 5.45 4.81.76.33 1.35.52 1.82.67.76.24 1.46.21 2.01.13.61-.09 1.88-.77 2.14-1.51.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37Z"/>
    </svg>
    <span>WhatsApp</span>
  `;
  document.body.appendChild(whatsappButton);
}

const cards = document.querySelectorAll(".tarjetas");
const projectCards = document.querySelectorAll(".proyecto-card");
const processCards = document.querySelectorAll(".tarjetaProceso");
const processBanner = document.querySelector(".process-banner");
const funcionaTexto = document.querySelector(".texto");

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

processCards.forEach((card) => {
  observer.observe(card);
});

if (processBanner) {
  observer.observe(processBanner);
}

if (funcionaTexto) {
  observer.observe(funcionaTexto);
}


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
