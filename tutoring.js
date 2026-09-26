document.documentElement.classList.add("js");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const navLinks = [...document.querySelectorAll(".tutor-header nav a")];
const sections = navLinks.map((link) => document.querySelector(link.getAttribute("href")));

document.getElementById("year").textContent = new Date().getFullYear();

function updatePageState() {
  const range = document.documentElement.scrollHeight - innerHeight;
  document.documentElement.style.setProperty("--progress", `${range > 0 ? scrollY / range * 100 : 0}%`);
  let activeIndex = -1;
  sections.forEach((section, index) => {
    if (section && section.getBoundingClientRect().top <= innerHeight * .42) activeIndex = index;
  });
  if (scrollY + innerHeight >= document.documentElement.scrollHeight - 4) activeIndex = sections.length - 1;
  navLinks.forEach((link, index) => link.classList.toggle("active", index === activeIndex));
}

addEventListener("scroll", updatePageState, { passive: true });
updatePageState();

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("visible");
    observer.unobserve(entry.target);
  });
}, { threshold: .12 });
document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

document.querySelectorAll(".subject-summary").forEach((button) => {
  button.addEventListener("click", () => {
    const subject = button.closest(".subject");
    const willOpen = !subject.classList.contains("open");
    document.querySelectorAll(".subject").forEach((item) => {
      item.classList.remove("open");
      const summary = item.querySelector(".subject-summary");
      summary.setAttribute("aria-expanded", "false");
      summary.querySelector("i").textContent = "+";
    });
    if (willOpen) {
      subject.classList.add("open");
      button.setAttribute("aria-expanded", "true");
      button.querySelector("i").textContent = "−";
    }
  });
});

const reviews = [...document.querySelectorAll(".review")];
const reviewDots = [...document.querySelectorAll("[data-review-target]")];
let reviewIndex = 0;

function showReview(index) {
  reviewIndex = (index + reviews.length) % reviews.length;
  reviews.forEach((review, itemIndex) => {
    const active = itemIndex === reviewIndex;
    review.classList.toggle("active", active);
    review.hidden = !active;
    review.setAttribute("aria-hidden", String(!active));
    review.style.display = active ? "grid" : "none";
    review.style.position = active ? "relative" : "absolute";
    review.style.inset = active ? "auto" : "0";
  });
  reviewDots.forEach((dot, itemIndex) => {
    const active = itemIndex === reviewIndex;
    dot.classList.toggle("active", active);
    dot.setAttribute("aria-selected", String(active));
  });
  const activeDot = reviewDots[reviewIndex];
  const reviewerRail = activeDot.parentElement;
  if (reviewerRail.scrollWidth > reviewerRail.clientWidth) {
    reviewerRail.scrollTo({
      left: activeDot.offsetLeft - (reviewerRail.clientWidth - activeDot.offsetWidth) / 2,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }
  document.getElementById("review-current").textContent = String(reviewIndex + 1).padStart(2, "0");
}

document.getElementById("review-prev").addEventListener("click", () => showReview(reviewIndex - 1));
document.getElementById("review-next").addEventListener("click", () => showReview(reviewIndex + 1));
reviewDots.forEach((dot) => dot.addEventListener("click", () => showReview(Number(dot.dataset.reviewTarget))));
showReview(0);

let touchStart = 0;
document.querySelector(".review-stage").addEventListener("touchstart", (event) => { touchStart = event.touches[0].clientX; }, { passive: true });
document.querySelector(".review-stage").addEventListener("touchend", (event) => {
  const distance = event.changedTouches[0].clientX - touchStart;
  if (Math.abs(distance) > 45) showReview(reviewIndex + (distance < 0 ? 1 : -1));
}, { passive: true });

const reviewDialog = document.getElementById("review-dialog");
document.getElementById("open-review").addEventListener("click", () => reviewDialog.showModal());

document.getElementById("review-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const subject = encodeURIComponent(`Tutoring review from ${data.get("name")}`);
  const body = encodeURIComponent(`Rating: ${data.get("rating")}/5\n\n${data.get("review")}\n\nSubmitted for moderation.`);
  location.href = `mailto:m49zhu@uwaterloo.ca?subject=${subject}&body=${body}`;
  reviewDialog.close();
});

document.getElementById("inquiry-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const subject = encodeURIComponent(`${data.get("subject")} tutoring inquiry from ${data.get("name")}`);
  const body = encodeURIComponent(`Hi Matthew,\n\n${data.get("message")}\n\nYou can reply to me at ${data.get("email")}.`);
  location.href = `mailto:m49zhu@uwaterloo.ca?subject=${subject}&body=${body}`;
});

if (!reducedMotion) {
  const hero = document.querySelector(".tutor-hero");
  hero.addEventListener("pointermove", (event) => {
    const x = (event.clientX / innerWidth - .5) * 10;
    const y = (event.clientY / innerHeight - .5) * 8;
    hero.style.setProperty("--mx", `${x}px`);
    hero.style.setProperty("--my", `${y}px`);
  });
}
