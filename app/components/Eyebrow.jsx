// Section label above headings. `num` is accepted for backwards compatibility
// but no longer rendered: the numbered "01 / About" style was dropped.
export default function Eyebrow({ label }) {
  return (
    <div className="eyebrow">
      <span className="label">{label}</span>
    </div>
  );
}
