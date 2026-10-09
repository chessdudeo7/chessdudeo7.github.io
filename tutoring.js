document.documentElement.classList.add("js");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const navLinks = [...document.querySelectorAll(".tutor-header nav a")];
const sections = navLinks.map((link) => document.querySelector(link.getAttribute("href")));

document.getElementById("year").textContent = new Date().getFullYear();

let lastScrollY = scrollY;

function updatePageState() {
  if (Math.abs(scrollY - lastScrollY) > 6) {
    document.documentElement.classList.toggle("nav-collapsed", scrollY > 160 && scrollY > lastScrollY);
    lastScrollY = scrollY;
  }
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

const reviewStage = document.querySelector(".review-stage");
const reviewRail = document.querySelector(".review-dots");
let reviews = [...reviewStage.querySelectorAll(".review")];
let reviewDots = [...reviewRail.querySelectorAll("[data-review-target]")];
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
reviewRail.addEventListener("click", (event) => {
  const dot = event.target.closest("[data-review-target]");
  if (dot) showReview(Number(dot.dataset.reviewTarget));
});
showReview(0);

let touchStart = 0;
document.querySelector(".review-stage").addEventListener("touchstart", (event) => { touchStart = event.touches[0].clientX; }, { passive: true });
document.querySelector(".review-stage").addEventListener("touchend", (event) => {
  const distance = event.changedTouches[0].clientX - touchStart;
  if (Math.abs(distance) > 45) showReview(reviewIndex + (distance < 0 ? 1 : -1));
}, { passive: true });

const reviewDialog = document.getElementById("review-dialog");
document.getElementById("open-review").addEventListener("click", () => reviewDialog.showModal());

// Reviews live in the Firestore "reviews" collection of the personal-website project.
// New submissions are stored with approved: false and only shown once approved in the Firebase console.
const firestoreReviews = "https://firestore.googleapis.com/v1/projects/personal-website-4889a/databases/(default)/documents/reviews";
const firebaseApiKey = "AIzaSyD7WVCD-O23S5g9QZTfPRiUf63tu7bLaCM";

function fieldValue(field) {
  if (!field) return undefined;
  if ("stringValue" in field) return field.stringValue;
  if ("integerValue" in field) return Number(field.integerValue);
  if ("doubleValue" in field) return field.doubleValue;
  if ("booleanValue" in field) return field.booleanValue;
  if ("timestampValue" in field) return field.timestampValue;
  return undefined;
}

function formatReviewDate(date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}.${date.getFullYear()}`;
}

function buildReview(review) {
  const rating = Math.min(5, Math.max(1, Math.round(review.rating) || 5));
  const created = new Date(review.created);
  const article = document.createElement("article");
  article.className = "review";
  article.dataset.reviewId = review.id;
  const meta = document.createElement("div");
  meta.className = "review-meta";
  const stars = document.createElement("span");
  stars.textContent = "★".repeat(rating) + "☆".repeat(5 - rating);
  stars.setAttribute("aria-label", `${rating} out of 5 stars`);
  const time = document.createElement("time");
  time.dateTime = created.toISOString().slice(0, 10);
  time.textContent = formatReviewDate(created);
  meta.append(stars, time);
  const quote = document.createElement("blockquote");
  quote.textContent = `“${review.text}”`;
  const footer = document.createElement("footer");
  const name = document.createElement("strong");
  name.textContent = review.name;
  const label = document.createElement("span");
  label.textContent = review.subject ? `${review.subject} tutoring · ${review.role || "Student"}` : "Tutoring";
  footer.append(name, label);
  article.append(meta, quote, footer);

  const dot = document.createElement("button");
  dot.type = "button";
  dot.setAttribute("aria-label", `Review by ${review.name}`);
  const number = document.createElement("span");
  const dotName = document.createElement("strong");
  dotName.textContent = review.name;
  const dotLabel = document.createElement("small");
  dotLabel.textContent = review.subject ? `${review.subject} · ${review.role || "Student"}` : "Tutoring";
  dot.append(number, dotName, dotLabel);
  return { article, dot, rating, created };
}

function renumberReviews() {
  reviews = [...reviewStage.querySelectorAll(".review")];
  reviewDots = [...reviewRail.querySelectorAll("[data-review-target], button")];
  reviewDots.forEach((dot, index) => {
    dot.dataset.reviewTarget = String(index);
    dot.querySelector("span").textContent = String(index + 1).padStart(2, "0");
  });
  reviews.forEach((review, index) => { review.dataset.review = String(index); });
  document.getElementById("review-total").textContent = String(reviews.length).padStart(2, "0");
}

async function loadLiveReviews() {
  try {
    const response = await fetch(`${firestoreReviews}?pageSize=200&key=${firebaseApiKey}`);
    if (!response.ok) return;
    const { documents = [] } = await response.json();
    const live = documents.map((doc) => {
      const fields = doc.fields || {};
      return {
        id: doc.name.split("/").pop(),
        name: fieldValue(fields.name) || "Anonymous",
        rating: fieldValue(fields.rating),
        text: fieldValue(fields.text) || "",
        subject: fieldValue(fields.subject),
        role: fieldValue(fields.role),
        created: fieldValue(fields.created) || doc.createTime,
        approved: fieldValue(fields.approved),
      };
    }).filter((review) => review.approved !== false && review.text.trim());
    if (!live.length) return;

    const shown = new Set(reviews.map((review) => review.dataset.reviewId));
    const liveIds = new Set(live.map((review) => review.id));
    // Drop hard-coded reviews that were deleted or unapproved in Firestore.
    reviews.forEach((review, index) => {
      if (review.dataset.reviewId && !liveIds.has(review.dataset.reviewId)) {
        review.remove();
        reviewDots[index].remove();
      }
    });
    live.filter((review) => !shown.has(review.id)).forEach((review) => {
      const { article, dot } = buildReview(review);
      reviewStage.append(article);
      reviewRail.append(dot);
    });

    // Newest first, matching the order of the hard-coded reviews.
    const pairs = [...reviewStage.querySelectorAll(".review")].map((article) => {
      const index = [...reviewStage.children].indexOf(article);
      return { article, dot: reviewRail.children[index], time: new Date(article.querySelector("time").dateTime).getTime() };
    }).sort((a, b) => b.time - a.time);
    pairs.forEach(({ article, dot }) => { reviewStage.append(article); reviewRail.append(dot); });

    renumberReviews();
    const average = live.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / live.length;
    document.getElementById("review-average").textContent = average.toFixed(1);
    showReview(0);
  } catch (error) {
    // Keep the hard-coded reviews if Firestore can't be reached.
  }
}

loadLiveReviews();

const reviewForm = document.getElementById("review-form");
const reviewStatus = document.getElementById("review-status");
const reviewStatusDefault = reviewStatus.textContent;

reviewForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(reviewForm);
  const submit = reviewForm.querySelector("button[type=submit]");
  const review = {
    name: String(data.get("name")).trim().slice(0, 60) || "Anonymous",
    rating: Number(data.get("rating")) || 5,
    text: String(data.get("review")).trim().slice(0, 1500),
    subject: String(data.get("subject")),
    role: String(data.get("role")),
  };
  submit.disabled = true;
  reviewStatus.removeAttribute("data-state");
  reviewStatus.textContent = "Submitting…";
  try {
    const response = await fetch(`${firestoreReviews}?key=${firebaseApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          name: { stringValue: review.name },
          rating: { integerValue: String(review.rating) },
          text: { stringValue: review.text },
          subject: { stringValue: review.subject },
          role: { stringValue: review.role },
          created: { timestampValue: new Date().toISOString() },
          approved: { booleanValue: false },
        },
      }),
    });
    if (!response.ok) throw new Error(`Firestore responded ${response.status}`);
    reviewForm.reset();
    reviewStatus.dataset.state = "success";
    reviewStatus.textContent = "Thank you! Your review will appear once it’s approved.";
  } catch (error) {
    const body = encodeURIComponent(`Rating: ${review.rating}/5\nSubject: ${review.subject} (${review.role})\n\n${review.text}`);
    reviewStatus.dataset.state = "error";
    reviewStatus.innerHTML = `Couldn’t submit right now. <a href="mailto:m49zhu@uwaterloo.ca?subject=${encodeURIComponent(`Tutoring review from ${review.name}`)}&body=${body}">Email it instead</a>.`;
  } finally {
    submit.disabled = false;
  }
});

reviewDialog.addEventListener("close", () => {
  if (reviewStatus.dataset.state === "success") {
    reviewStatus.removeAttribute("data-state");
    reviewStatus.textContent = reviewStatusDefault;
  }
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
