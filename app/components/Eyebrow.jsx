export default function Eyebrow({ num, label }) {
  return (
    <div className="eyebrow">
      <span className="num">{num}</span>
      <span className="label">/ {label}</span>
    </div>
  );
}
