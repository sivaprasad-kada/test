import { useEffect, useRef, useCallback } from "react";

// Single shared mouse state — module-level so it survives rerenders
const mouse = { x: -9999, y: -9999 };

const LandingGridBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const CELL = 50;
  const GLOW_R = 220;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas pixel buffer == viewport — NO scaling distortion
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    const mx = mouse.x;
    const my = mouse.y;

    const cols = Math.ceil(W / CELL) + 1;
    const rows = Math.ceil(H / CELL) + 1;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x = c * CELL;
        const y = r * CELL;

        const dx = x - mx;
        const dy = y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const glow = Math.max(0, 1 - dist / GLOW_R);

        if (glow > 0.01) {
          ctx.strokeStyle = `rgba(59,130,246,${0.08 + glow * 0.52})`;
          ctx.lineWidth = 0.5 + glow * 2.0;
          ctx.shadowBlur = glow * 14;
          ctx.shadowColor = `rgba(59,130,246,${glow * 0.7})`;
        } else {
          ctx.strokeStyle = "rgba(59,130,246,0.10)";
          ctx.lineWidth = 0.6;
          ctx.shadowBlur = 0;
          ctx.shadowColor = "transparent";
        }

        // Vertical line
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + CELL);
        ctx.stroke();

        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + CELL, y);
        ctx.stroke();
      }
    }

    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";

    // Radial glow halo around cursor
    if (mx > 0 && my > 0 && mx < W && my < H) {
      const grad = ctx.createRadialGradient(mx, my, 0, mx, my, GLOW_R * 1.3);
      grad.addColorStop(0, "rgba(59,130,246,0.10)");
      grad.addColorStop(0.45, "rgba(37,99,235,0.04)");
      grad.addColorStop(1, "rgba(59,130,246,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mx, my, GLOW_R * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Key fix: pixel buffer = viewport dimensions (not document scroll size)
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    rafRef.current = requestAnimationFrame(draw);

    const onMove = (e: MouseEvent) => {
      // clientX/Y are already viewport-relative — perfect for fixed canvas
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
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
  }, [draw]);

  return (
    <>
      {/* Fixed viewport canvas — pixel buffer matches viewport exactly, no scaling */}
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
      {/* Ambient blue gradient blobs */}
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
