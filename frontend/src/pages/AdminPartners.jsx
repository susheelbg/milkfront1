import React, { useEffect, useState, useCallback } from 'react';
import { partnersApi } from '../services/api/partnersApi';
import { toastService } from '../services/toastService';
import { Button } from '../components';
import { ProductImage } from '../components/PartnerProductCard';
import { PartnerLogo } from './PartnersPage';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Upload, RefreshCw, X, AlertTriangle, CheckCircle2,
} from 'lucide-react';

const EMPTY = {
  name: '', brand: '', category: '', animal_type: '', milk_production_range: '', milk_production_range_kn: '',
  description_en: '', description_kn: '', recommended_use_en: '', recommended_use_kn: '',
  feeding_instructions_en: '', feeding_instructions_kn: '', nutrition_text: '', source_url: '',
};

const inputCls = 'w-full border border-border-light rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary';
const Field = ({ label, children }) => (
  <label className="block">
    <span className="block text-[11px] font-bold uppercase text-text-light mb-1">{label}</span>
    {children}
  </label>
);

/** Admin → Our Partners → <Partner> → Products. Rendered only inside the (admin-gated) dashboard. */
export const AdminPartners = () => {
  const [partners, setPartners] = useState([]);
  const [partnerId, setPartnerId] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);        // product form state
  const [imageData, setImageData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [newPartner, setNewPartner] = useState(null);

  const loadPartners = useCallback(async () => {
    const list = await partnersApi.adminList();
    setPartners(list);
    setPartnerId((cur) => cur || list[0]?.id || null);
    return list;
  }, []);

  const loadProducts = useCallback(async (id) => {
    if (!id) { setProducts([]); return; }
    setLoading(true);
    try {
      const d = await partnersApi.adminProducts(id);
      setProducts(d?.products || []);
    } catch (e) {
      toastService.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPartners().catch(() => toastService.error('Failed to load partners')).finally(() => setLoading(false)); }, [loadPartners]);
  useEffect(() => { loadProducts(partnerId); }, [partnerId, loadProducts]);

  const openEdit = (p) => {
    setImageData(null);
    setEditing(p ? {
      ...EMPTY, ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v ?? ''])),
      nutrition_text: p.nutrition_data ? JSON.stringify(p.nutrition_data, null, 2) : '',
    } : { ...EMPTY, id: null });
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toastService.error('Image must be under 5 MB');
    const r = new FileReader();
    r.onload = () => setImageData(r.result);
    r.readAsDataURL(f);
  };

  const save = async (e) => {
    e.preventDefault();
    let nutrition = null;
    if (editing.nutrition_text.trim()) {
      try { nutrition = JSON.parse(editing.nutrition_text); } catch { return toastService.error('Nutrition data must be valid JSON'); }
    }
    const nullable = (v) => (typeof v === 'string' && v.trim() === '' ? null : v);
    const body = {
      name: editing.name.trim(), brand: nullable(editing.brand), category: nullable(editing.category),
      animal_type: nullable(editing.animal_type),
      milk_production_range: nullable(editing.milk_production_range), milk_production_range_kn: nullable(editing.milk_production_range_kn),
      description_en: nullable(editing.description_en), description_kn: nullable(editing.description_kn),
      recommended_use_en: nullable(editing.recommended_use_en), recommended_use_kn: nullable(editing.recommended_use_kn),
      feeding_instructions_en: nullable(editing.feeding_instructions_en), feeding_instructions_kn: nullable(editing.feeding_instructions_kn),
      nutrition_data: nutrition, source_url: nullable(editing.source_url),
      needs_review: false, review_note: null,
    };
    if (imageData) body.image = imageData;
    setSaving(true);
    try {
      if (editing.id) await partnersApi.adminUpdateProduct(editing.id, body);
      else await partnersApi.adminCreateProduct({ ...body, partner_id: partnerId, display_order: products.length + 1 });
      toastService.success('Product saved');
      setEditing(null);
      loadProducts(partnerId);
    } catch (err) {
      toastService.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const patch = async (p, body, msg) => {
    try { await partnersApi.adminUpdateProduct(p.id, body); if (msg) toastService.success(msg); loadProducts(partnerId); }
    catch (err) { toastService.error(err.message || 'Update failed'); }
  };

  const move = async (idx, dir) => {
    const a = products[idx], b = products[idx + dir];
    if (!a || !b) return;
    await Promise.all([
      partnersApi.adminUpdateProduct(a.id, { display_order: b.display_order === a.display_order ? b.display_order + dir : b.display_order }),
      partnersApi.adminUpdateProduct(b.id, { display_order: a.display_order }),
    ]).catch(() => toastService.error('Reorder failed'));
    loadProducts(partnerId);
  };

  const remove = async (p) => {
    if (!window.confirm(`Permanently delete "${p.name}"? Consider hiding it instead.`)) return;
    try { await partnersApi.adminDeleteProduct(p.id); toastService.success('Product deleted'); loadProducts(partnerId); }
    catch (err) { toastService.error(err.message || 'Delete failed'); }
  };

  const runImport = async (dry) => {
    let items;
    try { items = JSON.parse(importText); if (!Array.isArray(items)) throw new Error(); }
    catch { return toastService.error('Paste a JSON array of verified products'); }
    try {
      const res = await partnersApi.adminImport(partnerId, items, dry);
      setImportResult(res.data);
      if (!dry) { toastService.success('Update applied — review flagged products'); loadProducts(partnerId); }
    } catch (err) { toastService.error(err.message || 'Import failed'); }
  };

  const createPartner = async (e) => {
    e.preventDefault();
    try {
      const res = await partnersApi.adminCreatePartner(newPartner);
      toastService.success('Partner created');
      setNewPartner(null);
      await loadPartners();
      setPartnerId(res.data.id);
    } catch (err) { toastService.error(err.message || 'Create failed'); }
  };

  const partner = partners.find((p) => p.id === partnerId);
  const reviewCount = products.filter((p) => p.needs_review).length;

  return (
    <div className="space-y-4" id="admin-partners">
      <div className="flex flex-wrap items-center gap-2">
        {partners.map((p) => (
          <button key={p.id} onClick={() => setPartnerId(p.id)}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-bold border transition-colors ${p.id === partnerId ? 'bg-[#0A2E1F] text-amber-300 border-[#0A2E1F]' : 'bg-white text-text-dark border-border-light hover:border-primary'}`}>
            {p.name}{!p.is_active && ' (hidden)'}
          </button>
        ))}
        <button onClick={() => setNewPartner({ name: '', tagline_en: '', tagline_kn: '' })}
          className="px-3 py-1.5 rounded-xl text-sm font-bold border border-dashed border-border-light text-text-light hover:text-primary-dark flex items-center gap-1">
          <Plus size={14} /> Partner
        </button>
      </div>

      {partner && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-border-light rounded-2xl p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <PartnerLogo partner={partner} size="w-12 h-12" />
              <div>
                <h2 className="text-lg font-black text-text-dark">{partner.name} — Products</h2>
                {reviewCount > 0 && (
                  <p className="text-xs font-bold text-amber-700 flex items-center gap-1"><AlertTriangle size={13} /> {reviewCount} need review</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setImportResult(null); setShowImport(true); }}>
                <RefreshCw size={14} className="inline mr-1" /> Update Products
              </Button>
              <Button variant="primary" size="sm" onClick={() => openEdit(null)}>
                <Plus size={14} className="inline mr-1" /> Add Product
              </Button>
              <button
                onClick={() => partnersApi.adminUpdatePartner(partner.id, { is_active: !partner.is_active }).then(loadPartners)}
                className="text-xs font-bold text-text-light underline"
              >{partner.is_active ? 'Hide partner' : 'Show partner'}</button>
            </div>
          </div>

          {loading ? <p className="text-sm text-text-light py-6">Loading…</p> : (
            <div className="bg-white rounded-2xl border border-border-light overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-bg-light text-[11px] uppercase text-text-light">
                  <tr><th className="p-3">Product</th><th className="p-3">Image</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {products.map((p, i) => (
                    <tr key={p.id} className={!p.is_active ? 'opacity-60' : ''}>
                      <td className="p-3">
                        <p className="font-black text-text-dark">{p.name}</p>
                        <p className="text-xs text-text-light">{p.milk_production_range || '—'}</p>
                        {p.needs_review && <p className="text-[11px] text-amber-700 font-semibold mt-0.5">⚠ {p.review_note || 'Needs review'}</p>}
                      </td>
                      <td className="p-3">
                        <ProductImage src={p.image_url} alt={p.name} iconSize={18} className="w-14 h-14 rounded-lg border border-border-light [&_span]:hidden" />
                        {p.image_status !== 'approved' && <p className="text-[10px] font-bold text-amber-700 mt-1">Needs image</p>}
                      </td>
                      <td className="p-3 text-xs font-bold">
                        {p.is_active ? <span className="text-emerald-700 flex items-center gap-1"><CheckCircle2 size={13} /> Visible</span> : <span className="text-text-light">Hidden</span>}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <button title="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="p-1.5 rounded hover:bg-bg-light disabled:opacity-30"><ArrowUp size={15} /></button>
                          <button title="Move down" disabled={i === products.length - 1} onClick={() => move(i, 1)} className="p-1.5 rounded hover:bg-bg-light disabled:opacity-30"><ArrowDown size={15} /></button>
                          <button title={p.is_active ? 'Hide' : 'Restore'} onClick={() => patch(p, { is_active: !p.is_active }, p.is_active ? 'Hidden' : 'Restored')} className="p-1.5 rounded hover:bg-bg-light">{p.is_active ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                          <button title="Edit" onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-bg-light"><Pencil size={15} /></button>
                          <button title="Delete" onClick={() => remove(p)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-text-light">No products yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Product editor */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form onSubmit={save} className="bg-white w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black">{editing.id ? 'Edit product' : 'Add product'}</h3>
              <button type="button" onClick={() => setEditing(null)}><X /></button>
            </div>
            <div className="flex items-center gap-3">
              <ProductImage src={imageData || editing.image_url} alt="" className="w-24 h-24 rounded-xl border border-border-light" iconSize={26} />
              <label className="cursor-pointer text-sm font-bold text-primary-dark flex items-center gap-1.5">
                <Upload size={15} /> Upload / replace image
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFile} />
              </label>
            </div>
            <p className="text-[11px] text-text-light -mt-1">Only upload images MilkMaatu has permission to use. Stored in Supabase Storage (partners/{partner?.slug}/products).</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Name (never translated)"><input required className={inputCls} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
              <Field label="Brand"><input className={inputCls} value={editing.brand} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} /></Field>
              <Field label="Category"><input className={inputCls} value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></Field>
              <Field label="Animal type (cow / buffalo / cow_buffalo)"><input className={inputCls} value={editing.animal_type} onChange={(e) => setEditing({ ...editing, animal_type: e.target.value })} /></Field>
              <Field label="Milk range (EN)"><input className={inputCls} value={editing.milk_production_range} onChange={(e) => setEditing({ ...editing, milk_production_range: e.target.value })} /></Field>
              <Field label="Milk range (ಕನ್ನಡ)"><input className={inputCls} value={editing.milk_production_range_kn} onChange={(e) => setEditing({ ...editing, milk_production_range_kn: e.target.value })} /></Field>
            </div>
            {[['description', 'Description'], ['recommended_use', 'Recommended use'], ['feeding_instructions', 'Feeding instructions']].map(([k, label]) => (
              <div key={k} className="grid sm:grid-cols-2 gap-3">
                <Field label={`${label} (EN)`}><textarea rows={2} className={inputCls} value={editing[`${k}_en`]} onChange={(e) => setEditing({ ...editing, [`${k}_en`]: e.target.value })} /></Field>
                <Field label={`${label} (ಕನ್ನಡ)`}><textarea rows={2} className={inputCls} value={editing[`${k}_kn`]} onChange={(e) => setEditing({ ...editing, [`${k}_kn`]: e.target.value })} /></Field>
              </div>
            ))}
            <Field label="Nutrition data (JSON)">
              <textarea rows={6} className={`${inputCls} font-mono text-xs`} value={editing.nutrition_text} onChange={(e) => setEditing({ ...editing, nutrition_text: e.target.value })} />
            </Field>
            <Field label="Source URL (internal)"><input className={inputCls} value={editing.source_url} onChange={(e) => setEditing({ ...editing, source_url: e.target.value })} /></Field>
            <div className="flex gap-2 pt-1">
              <Button type="submit" variant="primary" disabled={saving} className="flex-1">{saving ? 'Saving…' : 'Save'}</Button>
              <Button type="button" variant="secondary" onClick={() => setEditing(null)} className="flex-1">Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Update Products (verified data → diff) */}
      {showImport && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black">Update {partner?.name} Products</h3>
              <button onClick={() => setShowImport(false)}><X /></button>
            </div>
            <p className="text-xs text-text-light">
              Paste a JSON array of products you verified against the official source. It is compared with the database:
              new products are added hidden, changed ones are updated and flagged, missing ones are flagged — nothing is deleted.
              MilkMaatu never fetches the partner website.
            </p>
            <textarea rows={9} className={`${inputCls} font-mono text-xs`} value={importText} onChange={(e) => setImportText(e.target.value)}
              placeholder='[{"name":"Milkgen8000","feeding_instructions_en":"…"}]' />
            {importResult && (
              <div className="bg-bg-light rounded-xl p-3 text-xs space-y-1">
                <p className="font-black">{importResult.dry_run ? 'Preview (nothing saved)' : 'Applied'}</p>
                <p>Added: {importResult.added.join(', ') || '—'}</p>
                <p>Updated: {importResult.updated.join(', ') || '—'}</p>
                <p>Unchanged: {importResult.unchanged.join(', ') || '—'}</p>
                <p className="text-amber-700">Missing → flagged for review: {importResult.missing_flagged_for_review.join(', ') || '—'}</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => runImport(true)} className="flex-1">Preview changes</Button>
              <Button variant="primary" onClick={() => runImport(false)} className="flex-1">Apply</Button>
            </div>
          </div>
        </div>
      )}

      {newPartner && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={createPartner} className="bg-white w-full max-w-md rounded-3xl p-5 space-y-3">
            <div className="flex justify-between items-center"><h3 className="text-lg font-black">New partner</h3><button type="button" onClick={() => setNewPartner(null)}><X /></button></div>
            <Field label="Name"><input required className={inputCls} value={newPartner.name} onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })} /></Field>
            <Field label="Tagline (EN)"><input className={inputCls} value={newPartner.tagline_en} onChange={(e) => setNewPartner({ ...newPartner, tagline_en: e.target.value })} /></Field>
            <Field label="Tagline (ಕನ್ನಡ)"><input className={inputCls} value={newPartner.tagline_kn} onChange={(e) => setNewPartner({ ...newPartner, tagline_kn: e.target.value })} /></Field>
            <Button type="submit" variant="primary" className="w-full">Create partner</Button>
          </form>
        </div>
      )}
    </div>
  );
};
export default AdminPartners;
