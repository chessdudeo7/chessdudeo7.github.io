import React, { useRef } from 'react';
import './InterestsCarousel.css';

const interests = [
  {
    title: '🎧 Music Production',
    desc: 'I enjoy playing and listening to many genres of music.',
  },
  {
    title: '🧗 Sports',
    desc: 'I love playing hockey, running, swimming, table tennis and I watch pretty much all sports.',
  },
  {
    title: '🕹️ Mobile Games',
    desc: "I love playing games in my free time, it's a very fun grind.",
  },
  {
    title: '📚 Math Enthusiast',
    desc: 'Love investigating and solving all types of math problems.',
  },
  {
    title: '💻 Building Projects',
    desc: 'I like coding and designing my own personal projects.',
  },
  {
    title: '🌐 Traveling',
    desc: 'I want to visit and explore countries all around the world.',
  },
];

export default function InterestsCarousel() {
  const sliderRef = useRef();

  const scrollCard = (direction) => {
    const slider = sliderRef.current;
    const card = slider.querySelector('.carousel-card');
    const cardWidth = card.offsetWidth + 16; // card width + margin
    slider.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
  };

  return (
    <section className="carousel-section">
      <h2>My Interests</h2>
      <div className="carousel-container">
        <button className="carousel-btn left" onClick={() => scrollCard(-1)}>&#10094;</button>

        <div className="carousel" ref={sliderRef}>
          {interests.map((item, idx) => (
            <div className="carousel-card" key={idx}>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>

        <button className="carousel-btn right" onClick={() => scrollCard(1)}>&#10095;</button>
      </div>
    </section>
  );
}