import { useContext, useEffect, useRef } from "react";
import { ThemeContext } from "../features/theme/context";

interface Star {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  driftX: number;
  driftY: number;
  tint: "fg" | "cyan" | "violet";
}

function createStars(width: number, height: number): Star[] {
  const count = Math.min(220, Math.max(70, Math.floor((width * height) / 9000)));
  return Array.from({ length: count }, () => {
    const r = 0.4 + Math.random() * 1.3;
    const roll = Math.random();
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r,
      baseAlpha: 0.35 + Math.random() * 0.55,
      twinkleSpeed: 0.2 + Math.random() * 0.9,
      twinklePhase: Math.random() * Math.PI * 2,
      // Estrelas maiores "mais perto" derivam um pouco mais rápido —
      // dá uma sensação sutil de profundidade/paralaxe, não é um warp real.
      driftX: (Math.random() - 0.5) * 0.05 * r,
      driftY: (Math.random() - 0.5) * 0.05 * r + 0.015 * r,
      tint: roll < 0.1 ? "cyan" : roll < 0.18 ? "violet" : "fg",
    };
  });
}

function starColor(tint: Star["tint"], alpha: number) {
  switch (tint) {
    case "cyan":
      return `rgba(34, 211, 238, ${alpha})`;
    case "violet":
      return `rgba(168, 85, 247, ${alpha})`;
    default:
      return `rgba(244, 244, 246, ${alpha})`;
  }
}

/** Campo de estrelas animado no fundo — só aparece no tema escuro (o
 * metáfora "espaço" não combina com o tema claro, que já tem seu próprio
 * fundo suave via GlowBackground). Desenhado em canvas por performance;
 * respeita prefers-reduced-motion (estrelas estáticas, sem cintilar) e
 * pausa quando a aba não está visível. */
export function Starfield() {
  // Contexto lido diretamente (não via useTheme, que lança fora do
  // ThemeProvider) — GlowBackground é usado em telas de loading que ainda
  // não têm o provider montado, então o fundo deve degradar graciosamente
  // pro tema escuro (padrão do app) em vez de quebrar a renderização.
  const themeCtx = useContext(ThemeContext);
  const theme = themeCtx?.theme ?? "dark";
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (theme !== "dark") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const canvasEl = canvas;
    const context = ctx;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let stars: Star[] = [];
    let width = 0;
    let height = 0;
    let frameId = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvasEl.width = width * dpr;
      canvasEl.height = height * dpr;
      canvasEl.style.width = `${width}px`;
      canvasEl.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = createStars(width, height);
      if (reduceMotion) drawStatic();
    }

    function drawStatic() {
      context.clearRect(0, 0, width, height);
      for (const s of stars) {
        context.beginPath();
        context.fillStyle = starColor(s.tint, s.baseAlpha);
        context.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        context.fill();
      }
    }

    function tick(time: number) {
      context.clearRect(0, 0, width, height);
      for (const s of stars) {
        s.x = (s.x + s.driftX + width) % width;
        s.y = (s.y + s.driftY + height) % height;
        const twinkle =
          0.5 + 0.5 * Math.sin(time * 0.001 * s.twinkleSpeed + s.twinklePhase);
        const alpha = s.baseAlpha * (0.5 + 0.5 * twinkle);
        context.beginPath();
        context.fillStyle = starColor(s.tint, alpha);
        context.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        context.fill();
      }
      frameId = requestAnimationFrame(tick);
    }

    function start() {
      if (!reduceMotion && document.visibilityState === "visible") {
        frameId = requestAnimationFrame(tick);
      }
    }

    function stop() {
      cancelAnimationFrame(frameId);
    }

    function handleVisibility() {
      if (document.hidden) stop();
      else start();
    }

    resize();
    start();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [theme]);

  if (theme !== "dark") return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10"
      aria-hidden="true"
    />
  );
}
