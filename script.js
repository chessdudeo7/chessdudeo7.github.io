const faders = document.querySelectorAll('.fade-in');

const appearOptions = {
  threshold: 0.2,
};

const appearOnScroll = new IntersectionObserver(function(entries, observer) {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('show');
    observer.unobserve(entry.target);
  });
}, appearOptions);

faders.forEach(fader => {
  appearOnScroll.observe(fader);
});

const slider = document.getElementById('slider');
const btnLeft = document.querySelector('.slide-btn.left');
const btnRight = document.querySelector('.slide-btn.right');

let scrollAmount = 0;
const scrollStep = 270;

btnLeft.addEventListener('click', () => {
  scrollAmount = Math.max(0, scrollAmount - scrollStep);
  slider.style.transform = `translateX(-${scrollAmount}px)`;
});

btnRight.addEventListener('click', () => {
  const maxScroll = slider.scrollWidth - slider.clientWidth;
  scrollAmount = Math.min(maxScroll, scrollAmount + scrollStep);
  slider.style.transform = `translateX(-${scrollAmount}px)`;
});