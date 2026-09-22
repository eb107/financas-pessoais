import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  format: (value: number) => string;
  className?: string;
  duration?: number;
}

/** Número que "conta" até o valor final quando entra na tela ou quando o
 * valor muda (padrão comum em dashboards financeiros modernos). Com
 * prefers-reduced-motion o valor aparece direto, sem animação. */
export function AnimatedNumber({
  value,
  format,
  className,
  duration = 0.9,
}: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const current = useRef(0);

  useEffect(() => {
    if (reduceMotion) return;

    // Anima a partir do valor exibido no momento (não de zero), pra uma
    // troca de filtro não "resetar" a contagem toda vez.
    const controls = animate(current.current, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => {
        current.current = latest;
        setDisplay(latest);
      },
    });

    return () => controls.stop();
  }, [value, duration, reduceMotion]);

  return (
    <span className={className}>{format(reduceMotion ? value : display)}</span>
  );
}
