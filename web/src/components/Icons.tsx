/* Ikon SVG kecil dengan viewBox persegi agar selalu tepat di tengah tombol (karakter teks seperti "×" tidak presisi). */
export const XIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
);
const ROT = { right: undefined, left: "scaleX(-1)", down: "rotate(90deg)", up: "rotate(-90deg)" };
export const ChevronIcon = ({ size = 10, dir = "right" }: { size?: number; dir?: keyof typeof ROT }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true" style={{ transform: ROT[dir] }}><path d="M3.5 1.5L7 5l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const InfoIcon = ({ size = 10 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="2" r="1.1" fill="currentColor" /><path d="M5 4.3v4.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
);
export const PlusIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
);
export const ClockIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M6 3.4V6l1.8 1.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export function CloseButton({ onClick, label = "Tutup" }: { onClick: () => void; label?: string }) {
  return <button className="x" type="button" aria-label={label} onClick={onClick}><XIcon /></button>;
}
