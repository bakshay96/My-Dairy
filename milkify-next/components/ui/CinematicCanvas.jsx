"use client";

import { useEffect, useRef } from "react";

/**
 * CinematicCanvas - 60fps generative visual engine for Milkify Hero
 * Creates actual cinematic, living digital operations footage without relying
 * on brittle third-party stock photos or blocked video CDNs.
 */
export default function CinematicCanvas({ scene = 0, isPlaying = true, className = "" }) {
  const canvasRef = useRef(null);
  const animFrameId = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio || 1200);
    let height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio || 600);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
      height = canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
    };

    window.addEventListener("resize", handleResize);

    // Particle system for ambient cinematic atmosphere
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.3 - Math.random() * 0.4,
      size: 1.5 + Math.random() * 2.5,
      alpha: 0.15 + Math.random() * 0.45,
    }));

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // ── BACKGROUND GRADIENT PER SCENE ──
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.4,
        width * 0.1,
        width * 0.5,
        height * 0.5,
        width * 0.8
      );

      if (scene === 0) {
        // Scene 0: Morning Golden-Hour Dairy Collection (Warm blue & sunrise amber)
        bgGrad.addColorStop(0, "#0c1e38");
        bgGrad.addColorStop(0.5, "#071324");
        bgGrad.addColorStop(1, "#030811");
      } else if (scene === 1) {
        // Scene 1: Farmer Mobile Passbook (Rich violet / indigo fintech glow)
        bgGrad.addColorStop(0, "#1d1135");
        bgGrad.addColorStop(0.5, "#0d091e");
        bgGrad.addColorStop(1, "#040209");
      } else if (scene === 2) {
        // Scene 2: Village E-Commerce & Geofence (Emerald farm & amber village warmth)
        bgGrad.addColorStop(0, "#0b261e");
        bgGrad.addColorStop(0.5, "#061511");
        bgGrad.addColorStop(1, "#020705");
      } else {
        // Scene 3: Pan-India Connected Cooperative Network (Deep midnight & cyan constellations)
        bgGrad.addColorStop(0, "#0f2338");
        bgGrad.addColorStop(0.5, "#071220");
        bgGrad.addColorStop(1, "#02060c");
      }

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // ── CINEMATIC DYNAMIC LIGHT RAYS ──
      const rayGrad = ctx.createLinearGradient(0, 0, width, height);
      rayGrad.addColorStop(0, "rgba(56, 189, 248, 0.08)");
      rayGrad.addColorStop(0.5, "rgba(168, 85, 247, 0.04)");
      rayGrad.addColorStop(1, "rgba(16, 185, 129, 0.06)");
      ctx.fillStyle = rayGrad;
      ctx.fillRect(0, 0, width, height);

      // ── AMBIENT FLOATING DUST & LIGHT MOTES ──
      ctx.save();
      for (const p of particles) {
        if (isPlaying) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y < 0) p.y = height + 10;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * (0.8 + 0.2 * Math.sin(frame * 0.03 + p.x))})`;
        ctx.shadowColor = "rgba(125, 211, 252, 0.5)";
        ctx.shadowBlur = 8;
        ctx.fill();
      }
      ctx.restore();

      // ── SCENE SPECIFIC LIVE GRAPHICS ──
      const t = frame * 0.02;

      if (scene === 0) {
        // Scene 0: Collection Desk - Animated Precision Weigh Scale & Rate Meter
        const cx = width * 0.72;
        const cy = height * 0.48;
        const r = Math.min(width, height) * 0.28;

        // Outer pulsing ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r + Math.sin(t) * 6, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 12]);
        ctx.stroke();

        // Inner glowing rate dial
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.75, -Math.PI * 0.75, Math.PI * 0.75);
        ctx.strokeStyle = "rgba(14, 165, 233, 0.6)";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.setLineDash([]);
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 18;
        ctx.stroke();

        // Active sweep arc
        const sweepAngle = -Math.PI * 0.75 + (Math.PI * 1.5) * (0.65 + 0.1 * Math.sin(t * 1.5));
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.75, -Math.PI * 0.75, sweepAngle);
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 7;
        ctx.stroke();
        ctx.restore();

      } else if (scene === 1) {
        // Scene 1: Farmer Mobile Passbook - Cashless Ripple & Ledger Pulse
        const cx = width * 0.72;
        const cy = height * 0.5;

        ctx.save();
        for (let i = 0; i < 4; i++) {
          const waveR = ((frame * 1.2 + i * 50) % 180) + 30;
          const alpha = Math.max(0, 1 - waveR / 210) * 0.35;
          ctx.beginPath();
          ctx.arc(cx, cy, waveR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.shadowColor = "#c084fc";
          ctx.shadowBlur = 12;
          ctx.stroke();
        }
        ctx.restore();

      } else if (scene === 2) {
        // Scene 2: Village E-Commerce - 15km Radar Delivery Field
        const cx = width * 0.72;
        const cy = height * 0.5;
        const maxR = Math.min(width, height) * 0.32;

        ctx.save();
        // Radar boundary rings (3km, 8km, 15km)
        [0.35, 0.65, 1.0].forEach((ratio, idx) => {
          ctx.beginPath();
          ctx.arc(cx, cy, maxR * ratio, 0, Math.PI * 2);
          ctx.strokeStyle = idx === 2 ? "rgba(16, 185, 129, 0.5)" : "rgba(16, 185, 129, 0.2)";
          ctx.lineWidth = idx === 2 ? 2.5 : 1.5;
          ctx.setLineDash(idx === 2 ? [] : [4, 6]);
          ctx.stroke();
        });

        // Rotating radar sweep
        const sweep = (t * 1.2) % (Math.PI * 2);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, maxR, sweep, sweep + 0.45);
        ctx.closePath();
        const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
        sweepGrad.addColorStop(0, "rgba(52, 211, 153, 0.3)");
        sweepGrad.addColorStop(1, "rgba(16, 185, 129, 0.0)");
        ctx.fillStyle = sweepGrad;
        ctx.fill();
        ctx.restore();

      } else {
        // Scene 3: Pan-India Connected Cooperative Network
        const nodes = [
          { x: width * 0.62, y: height * 0.35, label: "Punjab" },
          { x: width * 0.70, y: height * 0.38, label: "Haryana" },
          { x: width * 0.64, y: height * 0.50, label: "Gujarat" },
          { x: width * 0.75, y: height * 0.58, label: "Maharashtra" },
          { x: width * 0.71, y: height * 0.72, label: "Karnataka" },
        ];

        ctx.save();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
        ctx.setLineDash([4, 6]);

        // Draw connections between nodes
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }

        // Draw pulsing hubs
        ctx.setLineDash([]);
        nodes.forEach((n, idx) => {
          const pulse = Math.sin(t * 2 + idx) * 3;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 6 + pulse, 0, Math.PI * 2);
          ctx.fillStyle = "#38bdf8";
          ctx.shadowColor = "#0284c7";
          ctx.shadowBlur = 14;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(n.x, n.y, 14 + pulse * 2, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
        ctx.restore();
      }

      // Film vignette on outer edge
      const vig = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        Math.min(width, height) * 0.35,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75
      );
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(2, 6, 12, 0.75)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);

      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [scene, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-700 ${className}`}
    />
  );
}
