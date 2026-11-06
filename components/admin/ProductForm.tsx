'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { api, toNumber, uploadImages } from './api';

type Category = { id: string; name: string };
export type ProductData = {
  id?: string; name: string; description: string; price: number; promoPrice: number | null; sku: string; stock: number; minStock: number;
  categoryId: string; active: boolean; featured: boolean; bestSeller: boolean; isNew: boolean; images: string[];
};

const fmt = (n: number | null | undefined) => (n == null ? '' : String(n).replace('.', ','));

export default function ProductForm({ categories, product }: { categories: Category[]; product?: ProductData }) {
  const router = useRouter();
  const isEdit = !!product?.id;
  const [f, setF] = useState({
    name: product?.name ?? '', description: product?.description ?? '', price: fmt(product?.price), promoPrice: fmt(product?.promoPrice),
    sku: product?.sku ?? '', stock: String(product?.stock ?? 0), minStock: String(product?.minStock ?? 3),
    categoryId: product?.categoryId ?? categories[0]?.id ?? '', active: product?.active ?? true, featured: product?.featured ?? false,
    bestSeller: product?.bestSeller ?? false, isNew: product?.isNew ?? false,
  });
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [over, setOver] = useState(false);
  const addInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const replaceIndex = useRef(0);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const t = e.target as HTMLInputElement;
    setF((x) => ({ ...x, [k]: t.type === 'checkbox' ? t.checked : t.value }));
  };

  async function addFiles(files: FileList | File[] | null) {
    if (!files || !files.length) return;
    setUploading(true); setMsg(null);
    try { const urls = await uploadImages(files); setImages((prev) => [...prev, ...urls].slice(0, 12)); }
    catch (e) { setMsg({ type: 'error', text: e instanceof Error ? e.message : 'Falha no upload' }); }
    finally { setUploading(false); }
  }
  async function replaceFile(files: FileList | null) {
    if (!files || !files[0]) return;
    setUploading(true);
    try { const [url] = await uploadImages([files[0]]); setImages((prev) => prev.map((u, i) => (i === replaceIndex.current ? url : u))); }
    catch (e) { setMsg({ type: 'error', text: e instanceof Error ? e.message : 'Falha no upload' }); }
    finally { setUploading(false); }
  }
  const makeMain = (i: number) => setImages((prev) => [prev[i], ...prev.filter((_, j) => j !== i)]);
  const removeImg = (i: number) => setImages((prev) => prev.filter((_, j) => j !== i));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const price = toNumber(f.price);
    const promo = f.promoPrice.trim() ? toNumber(f.promoPrice) : null;
    if (!Number.isFinite(price) || price <= 0) { setSaving(false); return setMsg({ type: 'error', text: 'Preço inválido' }); }
    const payload = { ...f, price, promoPrice: promo, stock: Number(f.stock) || 0, minStock: Number(f.minStock) || 0, images };
    try {
      if (isEdit) {
        await api(`/api/admin/products/${product!.id}`, 'PUT', payload);
        setMsg({ type: 'ok', text: 'Produto salvo! As mudanças já estão no site.' });
        router.refresh();
      } else {
        const r = await api<{ id: string }>('/api/admin/products', 'POST', payload);
        router.push(`/admin/produtos/${r.id}?criado=1`);
        router.refresh();
      }
    } catch (err) { setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Erro ao salvar' }); }
    finally { setSaving(false); }
  }

  async function remove() {
    if (!confirm(`Excluir "${f.name}" definitivamente? Os pedidos antigos continuam registrados.`)) return;
    try { await api(`/api/admin/products/${product!.id}`, 'DELETE'); router.push('/admin/produtos'); router.refresh(); }
    catch (err) { setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Erro ao excluir' }); }
  }

  return (
    <form onSubmit={save} className="panel">
      <h2 style={{ marginTop: 0 }}> Fotos</h2>
      <p className="muted small" style={{ marginTop: 0 }}>A primeira foto é a <b>principal</b>. JPG, PNG, WEBP ou GIF até 8 MB.</p>
      <div className="img-grid">
        {images.map((url, i) => (
          <div key={url} className={`img-tile ${i === 0 ? 'main' : ''}`}>
            {i === 0 && <span className="tag">Principal</span>}
            <img src={url} alt="" />
            <div className="img-actions">
              {i !== 0 && <button type="button" onClick={() => makeMain(i)}>★ Principal</button>}
              <button type="button" onClick={() => { replaceIndex.current = i; replaceInput.current?.click(); }}>Alterar</button>
              <button type="button" onClick={() => removeImg(i)}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
      <div
        className={`dropzone ${over ? 'over' : ''}`} role="button" tabIndex={0}
        onClick={() => addInput.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter') addInput.current?.click(); }}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files); }}
      >
        {uploading ? 'Enviando imagem…' : <> <b>Clique para escolher fotos</b> do computador/celular<br /><span className="small muted">ou arraste e solte aqui</span></>}
      </div>
      <input ref={addInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
      <input ref={replaceInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(e) => { replaceFile(e.target.files); e.target.value = ''; }} />

      <h2> Informações</h2>
      <div className="form-grid">
        <div className="field span-2"><label>Nome *</label><input required maxLength={120} value={f.name} onChange={set('name')} /></div>
        <div className="field span-2"><label>Descrição</label><textarea rows={4} maxLength={5000} value={f.description} onChange={set('description')} /></div>
        <div className="field"><label>Preço (R$) *</label><input required inputMode="decimal" placeholder="39,90" value={f.price} onChange={set('price')} /></div>
        <div className="field"><label>Preço promocional (R$)</label><input inputMode="decimal" placeholder="vazio = sem oferta" value={f.promoPrice} onChange={set('promoPrice')} /></div>
        <div className="field">
          <label>Categoria *</label>
          <select required value={f.categoryId} onChange={set('categoryId')}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </div>
        <div className="field"><label>SKU (código) *</label><input required maxLength={60} value={f.sku} onChange={set('sku')} /></div>
        {!isEdit && <div className="field"><label>Estoque inicial</label><input type="number" min={0} value={f.stock} onChange={set('stock')} /></div>}
        <div className="field"><label>Estoque mínimo (alerta)</label><input type="number" min={0} value={f.minStock} onChange={set('minStock')} /></div>
      </div>

      <h2> Vitrine da página inicial</h2>
      <div className="checks">
        <label><input type="checkbox" checked={f.active} onChange={set('active')} /> Ativo (aparece no site)</label>
        <label><input type="checkbox" checked={f.featured} onChange={set('featured')} /> Flores Únicas (destaque)</label>
        <label><input type="checkbox" checked={f.bestSeller} onChange={set('bestSeller')} /> Mais pedidos</label>
        <label><input type="checkbox" checked={f.isNew} onChange={set('isNew')} /> Novidades</label>
      </div>
      <p className="muted small">Promoção: preencha o preço promocional aqui <b>ou</b> crie uma campanha com data em <b>Marketing → Promoções</b>. O site sempre usa o menor preço.</p>

      {msg && <p className={`alert ${msg.type === 'ok' ? 'alert-ok' : 'alert-error'}`}>{msg.text}</p>}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
        <button className="btn" disabled={saving || uploading}>{saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Cadastrar produto'}</button>
        {isEdit && <button type="button" className="btn btn-danger" onClick={remove}>Excluir produto</button>}
      </div>
    </form>
  );
}
