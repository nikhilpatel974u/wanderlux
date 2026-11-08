"use strict";

document.documentElement.classList.add("js");

/* Mobile navigation */
const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector("#primary-nav");

if (menuToggle && primaryNav) {
  const closeMenu = () => {
    primaryNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";

    primaryNav.classList.toggle("is-open", !isOpen);
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Open navigation" : "Close navigation",
    );
  });

  primaryNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  document.addEventListener("click", (event) => {
    if (
      primaryNav.classList.contains("is-open") &&
      !primaryNav.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      closeMenu();
    }
  });
}

/* Featured destination carousel */
const carousel = document.querySelector("[data-carousel]");

if (carousel) {
  const slides = Array.from(carousel.querySelectorAll(".hero-slide"));
  const dots = Array.from(carousel.querySelectorAll("[data-carousel-dot]"));
  const previousButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const toggleButton = carousel.querySelector("[data-carousel-toggle]");
  const counter = carousel.querySelector("[data-carousel-count]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let activeIndex = 0;
  let timerId = null;
  let userPaused = reducedMotion.matches;
  let pointerPaused = false;
  let focusPaused = false;

  const paddedNumber = (number) => String(number).padStart(2, "0");

  const updateToggleButton = () => {
    if (!toggleButton) return;

    toggleButton.setAttribute("aria-pressed", String(userPaused));
    toggleButton.setAttribute(
      "aria-label",
      userPaused
        ? "Resume automatic slide rotation"
        : "Pause automatic slide rotation",
    );
    toggleButton.textContent = userPaused ? "Play" : "Pause";
  };

  const showSlide = (requestedIndex) => {
    activeIndex = (requestedIndex + slides.length) % slides.length;

    slides.forEach((slide, index) => {
      const isActive = index === activeIndex;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
      slide.inert = !isActive;
    });

    dots.forEach((dot, index) => {
      dot.setAttribute("aria-current", String(index === activeIndex));
    });

    if (counter) {
      counter.textContent = `${paddedNumber(activeIndex + 1)} / ${paddedNumber(slides.length)}`;
    }
  };

  const stopRotation = () => {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
  };

  const startRotation = () => {
    stopRotation();

    if (
      slides.length < 2 ||
      userPaused ||
      pointerPaused ||
      focusPaused ||
      document.hidden ||
      reducedMotion.matches
    ) {
      return;
    }

    timerId = window.setInterval(() => {
      showSlide(activeIndex + 1);
    }, 6500);
  };

  previousButton?.addEventListener("click", () => {
    showSlide(activeIndex - 1);
    startRotation();
  });

  nextButton?.addEventListener("click", () => {
    showSlide(activeIndex + 1);
    startRotation();
  });

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      showSlide(Number(dot.dataset.carouselDot));
      startRotation();
    });
  });

  toggleButton?.addEventListener("click", () => {
    userPaused = !userPaused;
    updateToggleButton();
    startRotation();
  });

  carousel.addEventListener("mouseenter", () => {
    pointerPaused = true;
    stopRotation();
  });

  carousel.addEventListener("mouseleave", () => {
    pointerPaused = false;
    startRotation();
  });

  carousel.addEventListener("focusin", () => {
    focusPaused = true;
    stopRotation();
  });

  carousel.addEventListener("focusout", () => {
    window.setTimeout(() => {
      focusPaused = carousel.contains(document.activeElement);
      startRotation();
    }, 0);
  });

  document.addEventListener("visibilitychange", startRotation);
  reducedMotion.addEventListener?.("change", (event) => {
    if (event.matches) userPaused = true;
    updateToggleButton();
    startRotation();
  });

  showSlide(0);
  updateToggleButton();
  startRotation();
}

/* Trip cost calculator */
const calculatorForm = document.querySelector("#trip-calculator");

if (calculatorForm) {
  const destinationRates = {
    bali: {
      name: "Bali, Indonesia",
      daily: 68,
      roomNight: 125,
      travel: 650,
    },
    kyoto: {
      name: "Kyoto, Japan",
      daily: 90,
      roomNight: 160,
      travel: 1100,
    },
    amalfi: {
      name: "Amalfi Coast, Italy",
      daily: 125,
      roomNight: 245,
      travel: 1400,
    },
    queenstown: {
      name: "Queenstown, New Zealand",
      daily: 100,
      roomNight: 190,
      travel: 850,
    },
  };

  const travelStyles = {
    budget: { label: "Budget", multiplier: 0.8 },
    standard: { label: "Standard", multiplier: 1 },
    luxury: { label: "Luxury", multiplier: 1.6 },
  };

  const emptyResult = document.querySelector("#estimate-empty");
  const resultPanel = document.querySelector("#estimate-result");
  const totalOutput = document.querySelector("#estimate-total");
  const summaryOutput = document.querySelector("#estimate-summary");
  const groundOutput = document.querySelector("#estimate-ground");
  const stayOutput = document.querySelector("#estimate-stay");
  const travelOutput = document.querySelector("#estimate-travel");

  const currency = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });

  calculatorForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!calculatorForm.reportValidity()) return;

    const formData = new FormData(calculatorForm);
    const destination = destinationRates.get
      ? destinationRates.get(formData.get("destination"))
      : destinationRates[formData.get("destination")];

    const style = travelStyles[formData.get("travel_style")];
    const travellers = Number(formData.get("travellers"));
    const days = Number(formData.get("days"));

    if (
      !destination ||
      !style ||
      !Number.isFinite(travellers) ||
      !Number.isFinite(days)
    ) {
      return;
    }

    const rooms = Math.ceil(travellers / 2);
    const nights = Math.max(days - 1, 0);

    const groundCost = Math.round(
      destination.daily * travellers * days * style.multiplier,
    );
    const accommodationCost = Math.round(
      destination.roomNight * rooms * nights * style.multiplier,
    );
    const travelCost = Math.round(
      destination.travel * travellers * style.multiplier,
    );
    const total = groundCost + accommodationCost + travelCost;

    totalOutput.textContent = currency.format(total);
    summaryOutput.textContent =
      `Estimated cost for ${travellers} ${travellers === 1 ? "traveller" : "travellers"} ` +
      `to ${destination.name} for ${days} days: ${currency.format(total)} — ` +
      `${style.label} Travel Package.`;

    groundOutput.textContent = currency.format(groundCost);
    stayOutput.textContent = `${currency.format(accommodationCost)} (${nights} ${nights === 1 ? "night" : "nights"}, ${rooms} ${rooms === 1 ? "room" : "rooms"})`;
    travelOutput.textContent = currency.format(travelCost);

    emptyResult.hidden = true;
    resultPanel.hidden = false;
  });
}

/* Set the earliest appointment date to today, using the visitor's local date. */
const preferredDate = document.querySelector("#preferred-date");

if (preferredDate) {
  const localDate = new Date();
  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
  preferredDate.min = localDate.toISOString().slice(0, 10);
}

/* Basic enhancement for the email submission forms */
document.querySelectorAll("[data-email-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    if (!form.checkValidity()) {
      event.preventDefault();
      form.reportValidity();
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending…";
      form.setAttribute("aria-busy", "true");
    }
  });
});

/* Reveal content as it enters the viewport */
const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && !reducedMotionPreference()) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

function reducedMotionPreference() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* Keep the footer year current. */
document.querySelectorAll("[data-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});
