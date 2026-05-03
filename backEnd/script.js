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

  const faqQuestions = document.querySelectorAll(".faq-question");

  faqQuestions.forEach(question => {

    question.addEventListener("click", () => {

      const faqItem = question.parentElement;

      faqItem.classList.toggle("active");

    });

  });

});
