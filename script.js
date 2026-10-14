import LocomotiveScroll from "locomotive-scroll";
import "locomotive-scroll/dist/locomotive-scroll.css";

let locomotiveInstance = null;
let menuParallaxUpdate = null;

function initLocomotive() {
  if (locomotiveInstance) return;
  locomotiveInstance = new LocomotiveScroll({
    lenisOptions: {
      overscroll: false,
    },
  });

  if (typeof locomotiveInstance.on === "function" && menuParallaxUpdate) {
    locomotiveInstance.on("scroll", menuParallaxUpdate);
  }
}

async function bootstrapLocomotive() {
  if (document.readyState !== "complete") {
    await new Promise((resolve) =>
      window.addEventListener("load", resolve, { once: true })
    );
  }
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  initLocomotive();
}

bootstrapLocomotive();

const bookingModal = document.querySelector(".booking-modal");
const bookingOpen = document.querySelectorAll("[data-booking-open]");
const bookingClose = document.querySelector("[data-booking-close]");

bookingOpen.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    bookingModal?.showModal();
  });
});

bookingClose?.addEventListener("click", () => {
  bookingModal?.close();
});

const menuSection = document.querySelector(".menu-section");
const menuOpen = document.querySelectorAll("[data-menu-open]");
const hoursOpen = document.querySelectorAll("[data-hours-open]");

menuOpen.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    if (locomotiveInstance) {
      locomotiveInstance.scrollTo(menuSection);
    } else {
      menuSection?.scrollIntoView({ behavior: "smooth" });
    }
  });
});

const menuCard = document.querySelector(".menu-section__inner");
const menuInfoCard = document.querySelector(".menu-info-card");
const menuLayout = document.querySelector(".menu-section__layout");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const wideMenuLayout = window.matchMedia("(min-width: 981px)");

function getCenteredScrollOffset(element) {
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const elementHeight = element.getBoundingClientRect().height;
  return (elementHeight - viewportHeight) / 2;
}

function scrollToCenteredElement(element) {
  if (!element) return;

  const centerOffset = getCenteredScrollOffset(element);
  if (locomotiveInstance) {
    locomotiveInstance.scrollTo(element, { offset: centerOffset });
    return;
  }

  const targetTop = window.scrollY + element.getBoundingClientRect().top + centerOffset;
  window.scrollTo({ top: targetTop, behavior: "smooth" });
}

hoursOpen.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    scrollToCenteredElement(menuInfoCard);
  });
});

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateMenuParallax() {
  if (
    !menuSection ||
    !menuCard ||
    !menuInfoCard ||
    !menuLayout ||
    reduceMotion.matches ||
    !wideMenuLayout.matches
  ) {
    menuCard?.style.removeProperty("--menu-card-parallax");
    menuInfoCard?.style.removeProperty("--menu-info-parallax");
    menuCard?.style.removeProperty("--menu-enter-x");
    menuInfoCard?.style.removeProperty("--menu-enter-x");
    return;
  }

  const rect = menuLayout.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const progress = clamp(
    (viewportHeight - rect.top) / (viewportHeight + rect.height),
    0,
    1
  );
  const centeredProgress = progress - 0.5;

  // Each card settles into its original position as it enters the viewport.
  for (const [card, verticalProperty] of [
    [menuCard, "--menu-card-parallax"],
    [menuInfoCard, "--menu-info-parallax"],
  ]) {
    const currentY = parseFloat(card.style.getPropertyValue(verticalProperty)) || 0;
    const cardTop = card.getBoundingClientRect().top - currentY;
    const entrance = clamp((viewportHeight - cardTop) / (viewportHeight * 0.65), 0, 1);
    const distance = Math.min(window.innerWidth * 0.18, 240);
    const direction = card === menuCard ? -1 : 1;
    card.style.setProperty("--menu-enter-x", `${direction * distance * Math.pow(1 - entrance, 3)}px`);
  }


  menuCard.style.setProperty(
    "--menu-card-parallax",
    `${centeredProgress * -48}px`
  );
  menuInfoCard.style.setProperty(
    "--menu-info-parallax",
    `${centeredProgress * 104}px`
  );
}

function initMenuParallax() {
  if (!menuSection || !menuCard || !menuInfoCard || !menuLayout) return;

  let isTicking = false;
  menuParallaxUpdate = () => {
    if (isTicking) return;
    isTicking = true;
    requestAnimationFrame(() => {
      updateMenuParallax();
      isTicking = false;
    });
  };

  updateMenuParallax();
  window.addEventListener("scroll", menuParallaxUpdate, { passive: true });
  window.addEventListener("resize", menuParallaxUpdate);
  wideMenuLayout.addEventListener("change", menuParallaxUpdate);

  reduceMotion.addEventListener("change", () => {
    menuParallaxUpdate();
  });
}

initMenuParallax();
