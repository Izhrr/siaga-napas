/* Thematic ornaments (lungs, hospital, particles, calendar, chimney, sensor tower, wind), drawn faintly behind cards. */
export function OrnamentDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <symbol id="o-lung" viewBox="0 0 64 64"><g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M32 8v22M32 30c-3 3-6 4-9 4M32 30c3 3 6 4 9 4" /><path d="M24 20c-9 2-15 14-15 27 0 6 4 9 9 8 6-1 9-5 9-12V25c0-3-1-5-3-5z" /><path d="M40 20c9 2 15 14 15 27 0 6-4 9-9 8-6-1-9-5-9-12V25c0-3 1-5 3-5z" /></g></symbol>
        <symbol id="o-hosp" viewBox="0 0 64 64"><g fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"><path d="M8 56V24h48v32M4 56h56M22 24V10h20v14" /><path d="M32 13v8M28 17h8" strokeLinecap="round" /><path d="M16 32h6v6h-6zM42 32h6v6h-6zM16 44h6v6h-6zM42 44h6v6h-6zM28 40h8v16h-8z" /></g></symbol>
        <symbol id="o-part" viewBox="0 0 64 64"><g fill="currentColor"><circle cx="14" cy="18" r="5" /><circle cx="30" cy="12" r="3" /><circle cx="46" cy="20" r="7" /><circle cx="22" cy="34" r="8" /><circle cx="42" cy="40" r="4" /><circle cx="54" cy="34" r="3" /><circle cx="12" cy="50" r="3" /><circle cx="30" cy="52" r="5" /><circle cx="50" cy="54" r="6" /></g></symbol>
        <symbol id="o-cal" viewBox="0 0 64 64"><g fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"><rect x="8" y="12" width="48" height="44" rx="5" /><path d="M8 24h48M20 6v12M44 6v12" strokeLinecap="round" /><path d="M16 32h8v7h-8zM28 32h8v7h-8zM40 32h8v7h-8zM16 44h8v7h-8zM28 44h8v7h-8z" /></g></symbol>
        <symbol id="o-fact" viewBox="0 0 64 64"><g fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"><path d="M6 58V34l14 8v-8l14 8v-8l14 8V18h10v40z" /><path d="M50 12c0-4 4-4 4-8M56 12c0-3 3-3 3-6" strokeLinecap="round" /></g></symbol>
        <symbol id="o-tower" viewBox="0 0 64 64"><g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M32 22 20 58M32 22l12 36M24 44h16M22 52h20" /><circle cx="32" cy="18" r="4" /><path d="M22 10a14 14 0 0 0 0 16M42 10a14 14 0 0 1 0 16M16 5a22 22 0 0 0 0 26M48 5a22 22 0 0 1 0 26" /></g></symbol>
        <symbol id="o-wind" viewBox="0 0 64 64"><g fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><path d="M6 24h34a8 8 0 1 0-8-8M6 36h44a8 8 0 1 1-8 8M6 48h22" /></g></symbol>
      </defs>
    </svg>
  );
}
export const Orn = ({ id }: { id: string }) => <svg className="orn" aria-hidden="true"><use href={`#o-${id}`} /></svg>;
