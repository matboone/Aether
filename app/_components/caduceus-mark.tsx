"use client";

interface CaduceusMarkProps {
  readonly size?: number;
  readonly className?: string;
}

/**
 * Flaticon ID 12481775 (`/icons/caduceus-12481775.png`); Settings + `public/icons/ATTRIBUTION.txt`.
 * Primary green via CSS mask; upright, spins on Y (turntable-style with perspective).
 */
export function CaduceusMark({ size = 48, className }: CaduceusMarkProps) {
  const s = size;
  return (
    <div
      className={`caduceus-mark ${className ?? ""}`}
      style={{ width: s, height: s }}
      role="img"
      aria-label="Caduceus"
    >
      <div className="caduceus-mark__axis">
        <div className="caduceus-mark__spin">
          <div className="caduceus-mark__silhouette" aria-hidden />
        </div>
      </div>
    </div>
  );
}
