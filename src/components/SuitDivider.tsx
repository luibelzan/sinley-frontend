import { Suit } from "../game/types";

/**
 * Formas propias (interpretaciones geométricas originales, no reproducen
 * ninguna baraja existente) para los cuatro palos españoles. Se exportan como
 * fragmentos de <path>, para poder anidarlas dentro de cualquier <svg>
 * contenedor (el divisor, o cada carta completa) a través de <SuitGlyph>.
 */
function OroShape() {
  return (
    <>
      <circle cx="12" cy="12" r="9" fill="currentColor" />
      <circle cx="12" cy="12" r="9" fill="none" stroke="#00000030" strokeWidth="0.75" />
      <circle cx="12" cy="12" r="5.2" fill="none" stroke="#00000040" strokeWidth="1" />
    </>
  );
}

function CopaShape() {
  return (
    <>
      <path
        d="M5 3.5h14l-1.3 8.2a5.7 5.7 0 0 1-11.4 0L5 3.5Z"
        fill="currentColor"
        stroke="#00000030"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      <path d="M12 15.5v4M8 19.5h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </>
  );
}

function EspadaShape() {
  return (
    <>
      <path
        d="M11.15 2 12 3.4 12.85 2 14 2.7l-1.1 2 1.1 15.6-2 1.7-2-1.7 1.1-15.6-1.1-2 1.15-.7Z"
        fill="currentColor"
        stroke="#00000030"
        strokeWidth="0.4"
        strokeLinejoin="round"
      />
      <path d="M7.5 7.2h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </>
  );
}

function BastoShape() {
  return (
    <>
      <path
        d="M9.6 3.4c1-1.3 3.8-1.3 4.8 0 .9 1.1.6 2.5-.5 3.4l-1.4 17.1v.1h-1l-1.4-17.2c-1.1-.9-1.4-2.3-.5-3.4Z"
        fill="currentColor"
        stroke="#00000030"
        strokeWidth="0.4"
        strokeLinejoin="round"
      />
      <path d="M7.8 11.5h8.4M8.2 15.2h7.6" stroke="#00000035" strokeWidth="0.8" strokeLinecap="round" fill="none" />
    </>
  );
}

const SUIT_SHAPES: Record<Suit, () => JSX.Element> = {
  oros: OroShape,
  copas: CopaShape,
  espadas: EspadaShape,
  bastos: BastoShape,
};

export const SUIT_COLOR_VAR: Record<Suit, string> = {
  oros: "var(--suit-oros)",
  copas: "var(--suit-copas)",
  espadas: "var(--suit-espadas)",
  bastos: "var(--suit-bastos)",
};

/**
 * Símbolo de un palo, listo para usarse suelto (con width/height normales) o
 * anidado dentro de otro <svg> (pasando x/y para posicionarlo ahí dentro).
 */
export function SuitGlyph({
  suit,
  size = 20,
  x = 0,
  y = 0,
}: {
  suit: Suit;
  size?: number;
  x?: number;
  y?: number;
}) {
  const Shape = SUIT_SHAPES[suit];
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 24 24" style={{ color: SUIT_COLOR_VAR[suit] }}>
      <Shape />
    </svg>
  );
}

export function SuitDivider() {
  return (
    <div className="suit-divider" aria-hidden="true">
      <span className="rule" />
      <SuitGlyph suit="oros" size={16} />
      <SuitGlyph suit="copas" size={16} />
      <SuitGlyph suit="espadas" size={16} />
      <SuitGlyph suit="bastos" size={16} />
      <span className="rule" />
    </div>
  );
}
