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
    menuCard?.style.removeProperty("--menu-enter-angle");
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
  for (const card of [menuCard, menuInfoCard]) {
    const cardTop = rect.top + (parseFloat(getComputedStyle(card).marginTop) || 0);
    const entrance = card === menuCard
      ? clamp((viewportHeight - cardTop) / (viewportHeight * 0.65), 0, 1)
      : clamp((viewportHeight - cardTop) / (viewportHeight * 0.65), 0, 1);
    const distance = Math.min(window.innerWidth * 0.18, 240);
    const direction = card === menuCard ? -1 : 1;
    if (card === menuCard) {
      card.style.setProperty("--menu-enter-angle", `${8 * Math.pow(1 - entrance, 3)}deg`);
    }
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

// Keep the photos ahead of the menu in the scroll sequence.
const moments = document.querySelector('.moments');
const momentCards = [...document.querySelectorAll('.moment')];
let momentsEntranceStart = Infinity;
const momentScrollRates = [0.23, 0.42, 0.23];
let momentsExitTravel = 0;
const mobileMomentStagger = 0.43;
let mobileMenuStart = 0;
let mobileThirdStart = 0;
function measureMomentsTravel() {
  if (!moments) return;
  if (window.innerWidth <= 700 && !reduceMotion.matches) {
    momentsExitTravel = Math.min(520, window.innerHeight * .65);
    const secondCardHeight = momentCards[2]?.offsetHeight || 0;
    const secondExitDistance = window.innerHeight + secondCardHeight;
    const secondTravelToOneThird = window.innerHeight * .55 + secondCardHeight / 2 - secondCardHeight / 3;
    mobileMenuStart = Math.max(momentsExitTravel * mobileMomentStagger, momentsExitTravel * (mobileMomentStagger + secondTravelToOneThird / secondExitDistance) - 120);
    mobileThirdStart = mobileMenuStart + 90;
    mobileMenuStart = Math.max(0, mobileMenuStart - 40);
    const totalTravel = mobileThirdStart + momentsExitTravel;
    moments.style.setProperty('--moments-scroll-height', `${window.innerHeight + totalTravel}px`);
    menuSection?.style.setProperty('--mobile-menu-advance', `${totalTravel - mobileMenuStart}px`);
    menuSection?.style.removeProperty('--menu-photo-overlap');
    return;
  }
  if (reduceMotion.matches || !wideMenuLayout.matches) {
    moments.style.removeProperty('--moments-scroll-height');
    menuSection?.style.removeProperty('--menu-photo-overlap');
    momentsExitTravel = 0;
    return;
  }
  // Three separate scroll intervals, then the menu follows the cleared stack.
  momentsExitTravel = Math.min(480, window.innerHeight * 0.55);
  moments.style.setProperty('--moments-scroll-height', `${window.innerHeight + momentsExitTravel * 1.6}px`);
  const photoRadius = Math.max(...momentCards.map(card => Math.hypot(card.offsetWidth, card.offsetHeight) / 2));
  const safeAdvance = Math.max(0, window.innerHeight / 2 - photoRadius + momentsExitTravel - 80);
  // On tall screens, bring the menu into view as the final photo starts leaving.
  const tallScreenBlend = clamp((window.innerHeight - 800) / 400, 0, 1);
  const tallScreenAdvance = (momentsExitTravel + 40 + 100) * tallScreenBlend;
  menuSection?.style.setProperty('--menu-photo-overlap', `${Math.min(safeAdvance, tallScreenAdvance)}px`);
}
measureMomentsTravel();
window.addEventListener('resize', measureMomentsTravel);
reduceMotion.addEventListener('change', measureMomentsTravel);
window.addEventListener('load', measureMomentsTravel, { once: true });
if (document.fonts) document.fonts.ready.then(measureMomentsTravel);
const momentSizeObserver = new ResizeObserver(measureMomentsTravel);
momentCards.forEach(card => momentSizeObserver.observe(card));
function updateMoments() {
  if (!moments || reduceMotion.matches || (!wideMenuLayout.matches && window.innerWidth > 700)) return;
  const h = window.innerHeight;
  const scrollTravel = Math.max(0, -moments.getBoundingClientRect().top);
  const interval = momentsExitTravel || Math.min(480, h * .55);
  // The last card and menu share the exact same start in scroll space.
  if (window.innerWidth <= 700) {
    const lastExitStart = mobileMenuStart;
    const beforeLastExit = Math.max(0, lastExitStart - scrollTravel);
    menuSection?.style.setProperty('--mobile-menu-enter-offset', `${beforeLastExit}px`);
  }
  momentCards.forEach((card, index) => {
    const spreadProgress = clamp(scrollTravel / interval, 0, 1);
    const spread = 1 - Math.pow(1 - spreadProgress, 3);
    // Once aligned, match normal page scrolling. After the sticky stage releases,
    // its own movement carries the row so the offset must stop accumulating.
    const stickyTravel = Math.max(0, moments.offsetHeight - h);
    const rowTravel = Math.min(Math.max(0, scrollTravel - interval), Math.max(0, stickyTravel - interval));
    // Deal from the upper left, upper right, then lower left, back to front.
    const dealOrder = [2, 0, 1][index];
    const elapsed = performance.now() - momentsEntranceStart - dealOrder * 140;
    const enter = clamp(elapsed / 750, 0, 1);
    const scrollBlend = 1 - clamp(scrollTravel / interval, 0, 1);
    const landed = 1 - Math.pow(1 - enter, 3);
    const remaining = (1 - landed) * scrollBlend;
    const w = window.innerWidth;
    const reachX = w / 2 + card.offsetWidth;
    const reachY = h / 2 + card.offsetHeight;
    const fromX = [-reachX, -reachX, reachX][index];
    const fromY = [reachY, -reachY, -reachY * .75][index];
    if (window.innerWidth <= 700) {
      const order = [0, 2, 1][index];
      const exitStart = order === 2 ? mobileThirdStart : order * interval * mobileMomentStagger;
      const exit = clamp((scrollTravel - exitStart) / interval, 0, 1);
      card.style.setProperty('--moment-y', `${fromY * remaining - exit * (h + card.offsetHeight)}px`);
      card.style.setProperty('--moment-x', `${fromX * remaining + [-1, 1, 1][index] * exit * 45}px`);
      card.style.setProperty('--moment-scroll-angle', `${[-184, 177, -176][index] * remaining + [-1, 1, 1][index] * exit * 16}deg`);
      card.style.setProperty('--toss-visible', elapsed >= 0 || scrollTravel > 0 ? 1 : 0);
      return;
    }
    const lift = 0;
    card.style.setProperty('--moment-y', `${fromY * remaining - rowTravel}px`);
    const spacing = Math.max(0, Math.min(card.offsetWidth + 24, (w - card.offsetWidth) / 2 - 24));
    card.style.setProperty('--moment-x', `${fromX * remaining + [-1, 1, 0][index] * spacing * spread}px`);
    card.style.setProperty('--moment-scroll-angle', `${[-184, 177, -176][index] * remaining + [-4, -3, 4][index] * landed * (1 - spread) + [7, 2, -7][index] * spread}deg`);
    card.style.setProperty('--moment-scale', 1);
    card.style.setProperty('--toss-visible', elapsed >= 0 || scrollTravel > 0 ? 1 : 0);
    card.style.setProperty('--toss-shadow-y', '0px');
    card.style.setProperty('--toss-shadow-blur', '0px');
  });
}
let momentsTicking = false;
function scheduleMoments() {
  if (momentsTicking) return;
  momentsTicking = true;
  requestAnimationFrame(() => { updateMoments(); momentsTicking = false; });
}
window.addEventListener('scroll', scheduleMoments, { passive: true });
window.addEventListener('resize', scheduleMoments);
reduceMotion.addEventListener('change', scheduleMoments);
updateMoments();

function startMomentsEntrance() {
  momentsEntranceStart = performance.now() + (reduceMotion.matches ? 120 : 1700);
  function animateMoments(now) {
    if (now >= momentsEntranceStart || reduceMotion.matches) document.documentElement.classList.remove("hero-intro-pending");
    updateMoments();
    if (now < momentsEntranceStart + 1400) requestAnimationFrame(animateMoments);
  }
  requestAnimationFrame(animateMoments);
}
if (document.readyState === 'complete') startMomentsEntrance();
else window.addEventListener('load', startMomentsEntrance, { once: true });


// The menu's center sheet stays still while the cover and drinks fan outward.
const menuStack = document.querySelector('.menu-stack');
let menuStackTicking = false;
function measureMenuStack() {
  if (!menuStack) return;
  if (window.innerWidth <= 800) {
    menuStack.style.removeProperty('height');
    return;
  }
  const bottom = Math.max(...[...menuStack.querySelectorAll('.menu-sheet')].map(sheet => {
    const height = sheet.offsetHeight;
    const width = sheet.offsetWidth;
    const angle = sheet.classList.contains('menu-sheet--cover') ? 5
      : sheet.classList.contains('menu-sheet--drinks') ? 4 : 0;
    const radians = angle * Math.PI / 180;
    // Include the enlarged sheets and their top-centered rotation in the clearance.
    const scale = 1.15;
    const rotatedBottom = height * Math.cos(radians) + width * .5 * Math.sin(radians);
    return sheet.offsetTop + scale * Math.max(height, rotatedBottom);
  }));
  menuStack.style.height = `${Math.ceil(bottom)}px`;
}
const menuSheetSizeObserver = new ResizeObserver(measureMenuStack);
menuStack?.querySelectorAll('.menu-sheet').forEach(sheet => menuSheetSizeObserver.observe(sheet));
window.addEventListener('resize', measureMenuStack);
reduceMotion.addEventListener('change', measureMenuStack);
if (document.fonts) document.fonts.ready.then(measureMenuStack);
measureMenuStack();
function updateMenuStack() {
  if (!menuStack) return;
  const active = window.innerWidth > 800 && !reduceMotion.matches;
  const rect = menuStack.getBoundingClientRect();
  const mobileRearTravel = window.innerWidth <= 700 && !reduceMotion.matches
    ? Math.max(0, window.innerHeight - rect.top) * .06 : 0;
  menuStack.style.setProperty('--mobile-rear-y', `${-mobileRearTravel}px`);
  menuStack.style.setProperty('--mobile-rear-turn', `-2deg`);
  // Keep drifting until the complete stack has passed above the viewport.
  const progress = active
    ? clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height + 80), 0, 1)
    : 0;
  const distance = Math.min(160, Math.max(0, (window.innerWidth - 880) / 2));
  const reveal = active
    ? clamp((window.innerHeight - rect.top) / (window.innerHeight * .55), 0, 1)
    : 1;
  const unrevealed = Math.pow(1 - reveal, 3);
  menuStack.style.setProperty('--sheet-tuck-left', `${195 * unrevealed}px`);
  menuStack.style.setProperty('--sheet-tuck-right', `${-195 * unrevealed}px`);
  menuStack.style.setProperty('--sheet-reveal-y', `${-120 * unrevealed}px`);
  menuStack.style.setProperty('--sheet-unturn-left', `${3 * unrevealed}deg`);
  menuStack.style.setProperty('--sheet-unturn-right', `${-2 * unrevealed}deg`);
  menuStack.style.setProperty('--sheet-spread', `${distance * progress}px`);
  menuStack.style.setProperty('--sheet-turn', `${2 * progress}deg`);
  const gift = menuStack.querySelector('.corner-gift-card');
  const giftTop = gift ? rect.top + gift.offsetTop : 0;
  if (window.innerWidth <= 700 && gift) {
    const menuBottom = Math.max(...[...menuStack.querySelectorAll('.menu-sheet--food, .menu-sheet--drinks')].map(sheet => sheet.getBoundingClientRect().bottom));
    const gapAbove = Math.max(0, gift.getBoundingClientRect().top - menuBottom);
    document.documentElement.style.setProperty('--mobile-about-gap', `${gapAbove}px`);
    menuStack.parentElement.style.setProperty('--mobile-card-gap', `${Math.max(0, gapAbove - 15)}px`);
  }

  const mobileGiftProgress = window.innerWidth <= 700 && !reduceMotion.matches && gift
    ? Math.max(0, (window.innerHeight - giftTop) / (window.innerHeight + gift.offsetHeight)) : 0;
  menuStack.style.setProperty('--gift-card-turn', `${window.innerWidth <= 700 ? 14 * mobileGiftProgress : -14 * progress}deg`);
  menuStack.style.setProperty('--mobile-gift-y', `${-60 * mobileGiftProgress}px`);
  menuStack.style.setProperty('--mobile-gift-x', `${24 * mobileGiftProgress}px`);
  menuStack.style.setProperty('--sheet-center-y', `${-90 * progress}px`);
}
function scheduleMenuStack() {
  if (menuStackTicking) return;
  menuStackTicking = true;
  requestAnimationFrame(() => { updateMenuStack(); menuStackTicking = false; });
}
window.addEventListener('scroll', scheduleMenuStack, { passive: true });
window.addEventListener('resize', scheduleMenuStack);
reduceMotion.addEventListener('change', scheduleMenuStack);
updateMenuStack();

const visitCards = document.querySelector('.visit-cards');
let visitCardsTicking = false;
function updateVisitCards() {
  if (!visitCards) return;
  const active = window.innerWidth > 800 && !reduceMotion.matches;
  const rect = visitCards.getBoundingClientRect();
  const h = window.innerHeight;
  const travel = Math.max(0, h - rect.top);
  visitCards.querySelectorAll('.visit-card').forEach((card, index) => {
    // A subtle, consistent speed difference keeps the cards together.
    const drift = travel * (index === 0 ? .02 : .08);
    card.style.setProperty('--visit-y', `${active ? drift : 0}px`);
    const progress = travel / Math.max(1, h + rect.height);
    const direction = index === 0 ? -1 : 1;
    card.style.setProperty('--visit-x', `${active ? direction * 40 * progress : 0}px`);
    const mobileHours = false;
    card.style.setProperty('--visit-turn', `${active || mobileHours ? direction * 7 * progress : 0}deg`);
  });
}
function scheduleVisitCards() {
  if (visitCardsTicking) return;
  visitCardsTicking = true;
  requestAnimationFrame(() => { updateVisitCards(); visitCardsTicking = false; });
}
window.addEventListener('scroll', scheduleVisitCards, { passive: true });
window.addEventListener('resize', scheduleVisitCards);
reduceMotion.addEventListener('change', scheduleVisitCards);
updateVisitCards();

const aboutPhotos = [...document.querySelectorAll('.about-polaroid--left, .about-polaroid--right')];
let aboutPhotosTicking = false;
function updateAboutPhotos() {
  aboutPhotos.forEach(photo => {
    const section = photo.closest('.about-composition');
    const rect = section.getBoundingClientRect();
    const h = window.innerHeight;
    const progress = clamp((h - rect.top) / (h + rect.height), 0, 1);
    const reveal = clamp((h * .92 - rect.top) / (h * .55), 0, 1);
    const easedReveal = 1 - Math.pow(1 - reveal, 3);
    const active = !reduceMotion.matches && window.innerWidth > 800;
    // Continue drifting outward with the rotation after the reveal.
    const outwardTravel = Math.max(0, h * .92 - rect.top);
    photo.style.setProperty('--about-photo-spread', `${active ? -65 * (1 - easedReveal) + outwardTravel * .08 : 0}px`);
    photo.style.setProperty('--about-photo-reveal-turn', `${active ? easedReveal : 1}`);
    // Continue rotating with scroll even after the initial reveal has finished.
    const rotationTravel = Math.max(0, h * .92 - rect.top);
    photo.style.setProperty('--about-photo-turn', `${active ? rotationTravel * .015 : 0}deg`);
  });
}

function scheduleAboutPhotos() {
  if (aboutPhotosTicking) return;
  aboutPhotosTicking = true;
  requestAnimationFrame(() => { updateAboutPhotos(); aboutPhotosTicking = false; });
}
window.addEventListener('scroll', scheduleAboutPhotos, { passive: true });
window.addEventListener('resize', scheduleAboutPhotos);
reduceMotion.addEventListener('change', scheduleAboutPhotos);
updateAboutPhotos();

// Copy the Hours card email without launching a mail application.
document.querySelectorAll('[data-copy-email]').forEach(button => {
  let feedbackTimer;
  button.addEventListener('click', async () => {
    const status = button.parentElement.querySelector('.copy-email-status');
    clearTimeout(feedbackTimer);
    try {
      await navigator.clipboard.writeText(button.dataset.copyEmail);
      status.textContent = 'Email copied';
    } catch {
      status.textContent = 'Could not copy. Please select the address.';
    }
    feedbackTimer = setTimeout(() => { status.textContent = ''; }, 3000);
  });
});

// Mobile menu deck: only the foreground sheet participates in focus and reading order.
const mobileMenuQuery = matchMedia('(max-width: 700px)');
let selectedMobileMenu = 'food';
function syncMobileMenu() {
  menuStack.dataset.mobileMenu = selectedMobileMenu;
  for (const kind of ['food', 'drinks']) {
    const sheet = menuStack.querySelector(`.menu-sheet--${kind}`);
    const inactive = mobileMenuQuery.matches && kind !== selectedMobileMenu;
    sheet.inert = false;
    sheet.removeAttribute('aria-hidden');
    sheet.dataset.mobileInactive = String(inactive);
    [...sheet.children].filter(child => !child.classList.contains('menu-sheet-heading')).forEach(child => {
      child.inert = inactive;
      if (inactive) child.setAttribute('aria-hidden', 'true');
      else child.removeAttribute('aria-hidden');
    });
    menuStack.querySelector(`[data-menu-select="${kind}"]`).setAttribute('aria-pressed', String(kind === selectedMobileMenu));
  }
}
menuStack.querySelectorAll('[data-menu-select]').forEach(button => {
  button.addEventListener('click', () => { selectedMobileMenu = button.dataset.menuSelect; syncMobileMenu(); });
});
mobileMenuQuery.addEventListener('change', syncMobileMenu);
syncMobileMenu();

// Keep the animation viewport-sized while matching the original final wordmark width.
function sizeAnimatedLogo() {
  const logo = document.querySelector('svg.frame-logo');
  if (!logo) return;
  const width = document.documentElement.clientWidth;
  const height = window.innerHeight;
  const oldFrameWidth = Math.min(504, Math.max(380, width * .42));
  const finalWidth = width <= 1100
    ? Math.min(width - 48, 850)
    : (oldFrameWidth - 32 + 30 / 1.536) * 1.536 * 1.44;
  const viewWidth = 1908 * width / finalWidth;
  const viewHeight = viewWidth * height / width;
  logo.setAttribute('viewBox', `${954 - viewWidth / 2} ${402 - viewHeight / 2} ${viewWidth} ${viewHeight}`);
}
sizeAnimatedLogo();
window.addEventListener('resize', sizeAnimatedLogo);
