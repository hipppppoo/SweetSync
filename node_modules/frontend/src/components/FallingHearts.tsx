import React, { useEffect, useState } from 'react';

interface Heart {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  emoji: string;
}

const FallingHearts: React.FC = () => {
  const [hearts, setHearts] = useState<Heart[]>([]);
  const NUM_HEARTS = 35; // Increased from 20 to 35

  useEffect(() => {
    const emojis = ['❤️', '💖', '💝', '💕', '💗']; // Added variety of heart emojis

    const createHeart = (): Heart => ({
      id: Math.random(),
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * 100, // Stagger initial positions
      size: Math.random() * 25 + 10, // Random size between 10-35px
      speed: Math.random() * 2.5 + 0.8, // Random speed between 0.8-3.3
      opacity: Math.random() * 0.6 + 0.2, // Random opacity between 0.2-0.8
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 2, // Random rotation speed, can go clockwise or counter-clockwise
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    });

    // Create initial hearts
    const initialHearts = Array.from({ length: NUM_HEARTS }, createHeart);
    setHearts(initialHearts);

    const animationFrame = setInterval(() => {
      setHearts(prevHearts => {
        const updatedHearts = prevHearts.map(heart => ({
          ...heart,
          y: heart.y + heart.speed,
          rotation: heart.rotation + heart.rotationSpeed,
        }));

        // Remove hearts that have fallen off screen and add new ones
        const filteredHearts = updatedHearts.filter(
          heart => heart.y < window.innerHeight + 20
        );

        while (filteredHearts.length < NUM_HEARTS) {
          filteredHearts.push(createHeart());
        }

        return filteredHearts;
      });
    }, 16); // ~60fps

    const handleResize = () => {
      setHearts(prevHearts =>
        prevHearts.map(heart => ({
          ...heart,
          x: Math.min(heart.x, window.innerWidth),
        }))
      );
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(animationFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {hearts.map(heart => (
        <div
          key={heart.id}
          className="absolute"
          style={{
            left: `${heart.x}px`,
            top: `${heart.y}px`,
            transform: `rotate(${heart.rotation}deg)`,
            opacity: heart.opacity,
            transition: 'transform 0.2s ease',
          }}
        >
          <div
            style={{
              width: `${heart.size}px`,
              height: `${heart.size}px`,
              fontSize: `${heart.size}px`,
              lineHeight: 1,
            }}
          >
            {heart.emoji}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FallingHearts; 