import { useEffect, useRef, useCallback, useState } from "react";

// Single shared mouse state for easing/lerping
const targetMouse = { x: -9999, y: -9999 };
const currentMouse = { x: -9999, y: -9999 };

const LandingGridBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [isDesktop, setIsDesktop] = useState(false);

  const CELL = 50;
  const GLOW_R = 220;

  // Handle responsive check: only >=1024px is desktop
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Easing / Lerp mouse coordinates
    if (targetMouse.x === -9999) {
      currentMouse.x = -9999;
      currentMouse.y = -9999;
    } else {
      if (currentMouse.x === -9999) {
        currentMouse.x = targetMouse.x;
        currentMouse.y = targetMouse.y;
      } else {
        // Easing factor of 0.08 provides butter-smooth lag
        currentMouse.x += (targetMouse.x - currentMouse.x) * 0.08;
        currentMouse.y += (targetMouse.y - currentMouse.y) * 0.08;
      }
    }

    const mx = currentMouse.x;
    const my = currentMouse.y;

    const cols = Math.ceil(W / CELL) + 1;
    const rows = Math.ceil(H / CELL) + 1;

    // 1. Draw base grid lines in ONE single path (incredibly fast)
    ctx.beginPath();
    ctx.strokeStyle = "rgba(59, 130, 246, 0.05)";
    ctx.lineWidth = 0.6;

    for (let c = 0; c <= cols; c++) {
      const x = c * CELL;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
    }

    for (let r = 0; r <= rows; r++) {
      const y = r * CELL;
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
    }
    ctx.stroke();

    // 2. Draw glowing highlighted segments only near the cursor (highly optimized)
    if (mx !== -9999 && my !== -9999 && mx > 0 && my > 0 && mx < W && my < H) {
      const startCol = Math.max(0, Math.floor((mx - GLOW_R) / CELL));
      const endCol = Math.min(cols, Math.ceil((mx + GLOW_R) / CELL));
      const startRow = Math.max(0, Math.floor((my - GLOW_R) / CELL));
      const endRow = Math.min(rows, Math.ceil((my + GLOW_R) / CELL));

      for (let c = startCol; c <= endCol; c++) {
        for (let r = startRow; r <= endRow; r++) {
          const x = c * CELL;
          const y = r * CELL;

          const dx = x - mx;
          const dy = y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const glow = Math.max(0, 1 - dist / GLOW_R);

          if (glow > 0.01) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(59, 130, 246, ${glow * 0.35})`;
            ctx.lineWidth = 0.6 + glow * 1.5;

            // Vertical segment
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + CELL);

            // Horizontal segment
            ctx.moveTo(x, y);
            ctx.lineTo(x + CELL, y);

            ctx.stroke();
          }
        }
      }

      // 3. Radial spotlight glow overlay
      const grad = ctx.createRadialGradient(mx, my, 0, mx, my, GLOW_R * 1.2);
      grad.addColorStop(0, "rgba(59, 130, 246, 0.12)");
      grad.addColorStop(0.5, "rgba(59, 130, 246, 0.04)");
      grad.addColorStop(1, "rgba(59, 130, 246, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mx, my, GLOW_R * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    rafRef.current = requestAnimationFrame(draw);

    const onMove = (e: MouseEvent) => {
      targetMouse.x = e.clientX;
      targetMouse.y = e.clientY;
    };

    const onLeave = () => {
      targetMouse.x = -9999;
      targetMouse.y = -9999;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", resize);
    };
  }, [draw, isDesktop]);

  if (!isDesktop) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background:
            "radial-gradient(ellipse 55% 38% at 12% 50%, rgba(37,99,235,0.05) 0%, transparent 70%), " +
            "radial-gradient(ellipse 42% 32% at 88% 22%, rgba(59,130,246,0.06) 0%, transparent 60%)",
        }}
      />
    </>
  );
};

export default LandingGridBackground;
