import Link from 'next/link';

type B = { id: string; title: string; subtitle: string; buttonText: string; link: string; imageUrl: string };

// Banner do meio da página, de ponta a ponta
export default function Strip({ b }: { b: B }) {
  const btn = b.buttonText && b.link
    ? b.link.startsWith('/') ? <Link href={b.link} className="btn btn-light">{b.buttonText}</Link>
      : <a href={b.link} className="btn btn-light" target="_blank" rel="noopener noreferrer">{b.buttonText}</a>
    : null;
  return (
    <section className="strip" style={{ backgroundImage: `url(${b.imageUrl})` }}>
      <div>
        {b.title && <h2>{b.title}</h2>}
        {b.subtitle && <p>{b.subtitle}</p>}
        {btn}
      </div>
    </section>
  );
}
