// Título no estilo da logo: palavra em CAIXA ALTA espaçada + palavra manuscrita por cima
export default function SectionTitle({ caps, script, sub, as = 'h2' }: { caps: string; script?: string; sub?: string; as?: 'h1' | 'h2' }) {
  const Tag = as;
  return (
    <Tag className="title">
      <span className="caps">{caps}</span>
      {script ? <span className="script">{script}</span> : <span className="rule" />}
      {sub && <span className="sub">{sub}</span>}
    </Tag>
  );
}
