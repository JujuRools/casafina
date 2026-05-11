import LocomotiveScroll from "locomotive-scroll";
import "locomotive-scroll/dist/locomotive-scroll.css";

let locomotiveInstance = null;

function initLocomotive() {
  if (locomotiveInstance) return;
  locomotiveInstance = new LocomotiveScroll({
    lenisOptions: {
      overscroll: false,
    },
  });
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
