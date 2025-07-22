import React, { useRef } from 'react';
import './InterestsCarousel.css';

const interests = [
  {
    title: '🎧 Music Production',
    desc: 'I enjoy creating beats, mixing tracks, and learning sound design in FL Studio.'
  },
  {
    title: '🧗 Hiking & Outdoors',
    desc: 'I love hiking trails, exploring nature, and disconnecting from screens during weekends.'
  },
  {
    title: '🕹️ Indie Games',
    desc: 'I’m passionate about game mechanics, pixel art, and unique indie titles.'
  },
  {
    title: '📚 Reading Sci-Fi',
    desc: 'Big fan of Asimov and Liu Cixin — I love philosophical sci-fi stories.'
  },
  {
    title: '💻 Building Projects',
    desc: 'Turning ideas into tools, bots, or apps is my favorite kind of learning.'
  },
  {
    title: '🌐 Learning Languages',
    desc: 'I’ve studied Japanese, French, and am dabbling in Korean now.'
  },
];

export default function InterestsCarousel() {
  const sliderRef = useRef();

  const scroll = (dir) => {
    const width = sliderRef.current.offsetWidth;
    sliderRef.current.scrollBy({ left: dir * width * 0.8, behavior: 'smooth' });
  };

  return (
    <section className="carousel-section">
      <h2>My Interests</h2>
      <div className="carousel-container">
        <button className="carousel-btn left" onClick={() => scroll(-1)}>&#10094;</button>
        
        <div className="carousel" ref={sliderRef}>
          {interests.map((item, idx) => (
            <div className="carousel-card" key={idx}>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>

        <button className="carousel-btn right" onClick={() => scroll(1)}>&#10095;</button>
      </div>
    </section>
  );
}