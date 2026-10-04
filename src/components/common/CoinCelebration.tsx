import React, { useEffect, useRef } from 'react';
import { subscribeCoinShower } from '../../lib/celebration';

interface Coin {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  wobble: number;
  wobbleSpeed: number;
  tiltAngle: number;
  tiltAngleSpeed: number;
  opacity: number;
}

interface Sparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  decay: number;
}

export const CoinCelebration: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number | null = null;
    let coins: Coin[] = [];
    let sparkles: Sparkle[] = [];

    const handleResize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const spawnShower = () => {
      const width = window.innerWidth;
      const count = Math.min(48, Math.max(28, Math.floor(width / 12)));

      coins = [];
      sparkles = [];

      for (let i = 0; i < count; i++) {
        coins.push({
          x: Math.random() * width,
          y: -20 - Math.random() * 250, // staggered start above screen
          vx: (Math.random() - 0.5) * 2.2,
          vy: 3.5 + Math.random() * 5.5,
          radius: 12 + Math.random() * 8, // 12px to 20px
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.08 + Math.random() * 0.12,
          tiltAngle: Math.random() * Math.PI,
          tiltAngleSpeed: (Math.random() - 0.5) * 0.04,
          opacity: 1,
        });
      }

      // Sparkles
      for (let j = 0; j < 25; j++) {
        sparkles.push({
          x: Math.random() * width,
          y: Math.random() * (window.innerHeight * 0.4),
          vx: (Math.random() - 0.5) * 1.5,
          vy: -0.5 - Math.random() * 1.5,
          size: 3 + Math.random() * 5,
          opacity: 0.8 + Math.random() * 0.2,
          decay: 0.015 + Math.random() * 0.02,
        });
      }

      if (!animId) {
        runLoop();
      }
    };

    const drawCoin = (c: Coin) => {
      const scaleY = Math.cos(c.wobble);
      if (Math.abs(scaleY) < 0.02) return; // edge-on

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.tiltAngle);
      ctx.scale(1, scaleY);
      ctx.globalAlpha = c.opacity;

      // Outer Rim Shadow / 3D Edge
      ctx.beginPath();
      ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#D97706'; // Dark amber
      ctx.fill();

      // Outer Coin Face (Gold Gradient)
      const grad = ctx.createRadialGradient(
        -c.radius * 0.3,
        -c.radius * 0.3,
        c.radius * 0.1,
        0,
        0,
        c.radius
      );
      grad.addColorStop(0, '#FEF3C7'); // Light yellow highlight
      grad.addColorStop(0.3, '#FBBF24'); // Bright gold
      grad.addColorStop(0.8, '#F59E0B'); // Deep gold
      grad.addColorStop(1, '#B45309'); // Amber shadow rim

      ctx.beginPath();
      ctx.arc(0, 0, c.radius - 1, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Inner Ring
      ctx.beginPath();
      ctx.arc(0, 0, c.radius * 0.72, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Embossed Thai Baht Symbol (฿)
      if (c.radius > 11 && Math.abs(scaleY) > 0.3) {
        ctx.fillStyle = '#78350F'; // Dark amber text
        ctx.font = `bold ${Math.round(c.radius * 0.95)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('฿', 0, 1);
      }

      ctx.restore();
    };

    const drawSparkle = (s: Sparkle) => {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.globalAlpha = Math.max(0, s.opacity);
      ctx.fillStyle = '#FEF08A';

      // 4-pointed star
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.lineTo(s.size, 0);
        ctx.lineTo(s.size * 0.3, s.size * 0.3);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const runLoop = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.clearRect(0, 0, width, height);

      let activeCount = 0;

      // Update & Draw Coins
      for (const coin of coins) {
        coin.x += coin.vx;
        coin.y += coin.vy;
        coin.vy += 0.18; // gravity
        coin.wobble += coin.wobbleSpeed;
        coin.tiltAngle += coin.tiltAngleSpeed;

        if (coin.y < height + 30) {
          activeCount++;
          drawCoin(coin);
        }
      }

      // Update & Draw Sparkles
      for (const sp of sparkles) {
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.opacity -= sp.decay;

        if (sp.opacity > 0) {
          activeCount++;
          drawSparkle(sp);
        }
      }

      if (activeCount > 0) {
        animId = requestAnimationFrame(runLoop);
      } else {
        animId = null;
        ctx.clearRect(0, 0, width, height);
      }
    };

    const unsubscribe = subscribeCoinShower(() => {
      spawnShower();
    });

    return () => {
      unsubscribe();
      window.removeEventListener('resize', handleResize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none"
      style={{ pointerEvents: 'none' }}
    />
  );
};
