// Gráfico de barras em SVG puro (sem biblioteca externa)
type Point = { label: string; value: number; title: string };

export default function BarChart({ data, format }: { data: Point[]; format: 'money' | 'int' }) {
  const W = 900, H = 280, padL = 64, padB = 34, padT = 20, padR = 10;
  const max = Math.max(1, ...data.map((d) => d.value));
  const nice = (() => {
    const p = Math.pow(10, Math.floor(Math.log10(max)));
    for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= max) return m * p;
    return 10 * p;
  })();
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const bw = plotW / Math.max(1, data.length);
  const fmt = (v: number) => (format === 'money' ? (v >= 1000 ? `R$ ${(v / 1000).toFixed(1).replace('.', ',')} mil` : `R$ ${Math.round(v)}`) : String(Math.round(v)));
  const every = Math.ceil(data.length / 15); // não encavalar os rótulos
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gráfico de vendas">
        {ticks.map((t) => {
          const y = padT + plotH - t * plotH;
          return (
            <g key={t}>
              <line className="grid-line" x1={padL} x2={W - padR} y1={y} y2={y} />
              <text className="axis" x={padL - 8} y={y + 4} textAnchor="end">{fmt(nice * t)}</text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = (d.value / nice) * plotH;
          const x = padL + i * bw + bw * 0.15;
          const y = padT + plotH - h;
          return (
            <g key={d.label + i}>
              <rect className="bar" x={x} y={y} width={bw * 0.7} height={Math.max(h, d.value > 0 ? 2 : 0)} rx={2}><title>{d.title}</title></rect>
              {data.length <= 14 && d.value > 0 && <text className="val" x={x + bw * 0.35} y={y - 5} textAnchor="middle">{fmt(d.value)}</text>}
              {i % every === 0 && <text className="axis" x={x + bw * 0.35} y={H - 12} textAnchor="middle">{d.label}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
