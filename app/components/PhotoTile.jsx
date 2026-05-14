export default function PhotoTile({ seed = 0, aspect = '4/5', style = {}, children }) {
  const palettes = [
    ['#1a1410', '#2d1d12', '#5a3220'],
    ['#1d1612', '#3a2418', '#7a4422'],
    ['#0e0c0a', '#241a14', '#4a2818'],
    ['#181410', '#2a1f18', '#a04f07'],
    ['#1a1612', '#332218', '#8a5028'],
    ['#0a0908', '#1a1410', '#3a2a20'],
  ];
  const p = palettes[seed % palettes.length];
  const angle = (seed * 37) % 360;
  return (
    <div style={{
      aspectRatio: aspect,
      background: `linear-gradient(${angle}deg, ${p[0]} 0%, ${p[1]} 55%, ${p[2]} 100%)`,
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle at 50% 50%, transparent 60%, rgba(0,0,0,0.45) 100%)',
        mixBlendMode: 'multiply',
      }}/>
      {children}
    </div>
  );
}
