import { revalidateTag } from 'next/cache';
import type { Product, Purchase } from './types';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzeK0avN16WZM6IDMh_TTI7xyn9dFfOSzgt1cVDm2RqS7gzV7U9b7SFE9dPXDRY9ErF/exec';

const mockProducts: Product[] = [
 {ProductID:'WH-6255B948',ProductName:'Test Watch Updated',Category:'Accessories',Description:'',SellingPrice:1099,PurchaseCost:500,OpeningStock:10,CurrentStock:12,MinimumStock:2,SupplierName:'Test Supplier',ImageURL:'',Status:'In Stock',UpdatedAt:'10/14/2026 12:57:24'},
 {ProductID:'WH-6AA9D813',ProductName:'Test Watch',Category:'Accessories',Description:'',SellingPrice:999,PurchaseCost:500,OpeningStock:10,CurrentStock:10,MinimumStock:2,SupplierName:'Test Supplier',ImageURL:'',Status:'In Stock',UpdatedAt:'10/14/2026 12:53:00'},
 {ProductID:'WH001',ProductName:'luxury hamper',Category:'Accessories',Description:'',SellingPrice:1499,OpeningStock:50,CurrentStock:50,ImageURL:'',Status:'In Stock'},
 {ProductID:'WH002',ProductName:'choclate hamper',Category:'Accessories',Description:'',SellingPrice:799,OpeningStock:30,CurrentStock:30,ImageURL:'',Status:'In Stock'},
 {ProductID:'WH003',ProductName:'dry fruit hamper',Category:'Accessories',Description:'',SellingPrice:999,OpeningStock:20,CurrentStock:20,ImageURL:'',Status:'In Stock'}
];
const mockPurchases: Purchase[] = [{PurchaseID:'PUR-A125A6A2',PurchaseDate:'10/14/2026 12:55:04',ProductID:'WH-6255B948',ProductName:'Test Watch',SupplierName:'Test Supplier',Quantity:2,UnitCost:500,TotalCost:1000,PaymentStatus:'Partial',AmountPaid:500,BalanceAmount:500,Notes:'Purchase API test',CreatedAt:'10/14/2026 12:55:04'}];

// Fetch a field value tolerating column-name variants: different capitalisation,
// extra spaces, underscores or "Image URL"-style names all resolve (e.g. "imageurl", "IMAGE URL ", "image_url").
function pickField(row: Record<string, unknown>, ...aliases: string[]): string {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const wanted = alias.replace(/[\s_-]/g, '').toLowerCase();
    const key = keys.find(k => k.replace(/[\s_-]/g, '').toLowerCase() === wanted);
    if (key !== undefined) {
      const value = row[key];
      if (value !== null && value !== undefined && String(value).trim() !== '') return String(value).trim();
    }
  }
  return '';
}

// Normalise raw sheet rows: blank/whitespace ImageURL and "nil" descriptions.
// Logs a temporary diagnostic when a row has an ImageURL column that can't be used.
function normalizeProduct(p: Product): Product {
  const raw = p as unknown as Record<string, unknown>;
  const ImageURL = pickField(raw, 'ImageURL', 'Image URL', 'Image', 'ImageLink', 'PhotoURL');
  const Description = pickField(raw, 'Description', 'Product Description');
  const hasImageColumn = Object.keys(raw).some(k => k.replace(/[\s_-]/g, '').toLowerCase() === 'imageurl');
  if (!ImageURL) {
    console.warn(`[sheets] product "${pickField(raw, 'ProductName') || p.ProductID}": no usable ImageURL value in sheet row (${hasImageColumn ? 'column present but blank/whitespace' : 'ImageURL column not found in API response'})`);
  } else if (!/^https?:\/\//i.test(ImageURL)) {
    console.warn(`[sheets] product "${p.ProductID}": ImageURL is not an http(s) URL: "${ImageURL}"`);
  }
  return {
    ...p,
    ProductName: pickField(raw, 'ProductName', 'Product Name') || (p.ProductName || '').trim(),
    Category: pickField(raw, 'Category') || (p.Category || '').trim(),
    ImageURL,
    Description: /^(nil|n\/?a|null|-)$/i.test(Description) ? '' : Description,
  };
}

// GET: ?action=getProducts / ?action=getPurchases — same as the working curl requests
async function request<T>(action: string, method: 'GET' | 'POST' = 'GET', body?: unknown): Promise<T> {
  const base = process.env.APPS_SCRIPT_URL || APPS_SCRIPT_URL;
  const url = new URL(base);
  if (method === 'GET') url.searchParams.set('action', action);
  const res = await fetch(url, {
    method,
    ...(method === 'GET'
      ? { next: { revalidate: 60, tags: [action] } }
      : { cache: 'no-store' as const, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`Sheets API returned ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Sheets request failed');
  return json.data as T;
}

// Maps the site's internal actions to the Apps Script envelope:
// { sheet: "Products" | "Purchases", action: "create" | "update" | "delete", data: {...} }
const SHEET_ACTIONS: Record<string, { sheet: 'Products' | 'Purchases'; action: 'create' | 'update' | 'delete' }> = {
  addProduct:    { sheet: 'Products',  action: 'create' },
  updateProduct: { sheet: 'Products',  action: 'update' },
  deleteProduct: { sheet: 'Products',  action: 'delete' },
  addPurchase:   { sheet: 'Purchases', action: 'create' },
  updatePurchase:{ sheet: 'Purchases', action: 'update' },
  deletePurchase:{ sheet: 'Purchases', action: 'delete' },
};

export async function getProducts(): Promise<Product[]> {
  try {
    const rows = await request<Product[]>('getProducts');
    return (rows || []).map(normalizeProduct);
  } catch (e) {
    console.error('getProducts failed, serving fallback:', e);
    return mockProducts.map(p => ({ ...p }));
  }
}

export async function getPurchases(): Promise<Purchase[]> {
  try {
    return await request<Purchase[]>('getPurchases');
  } catch (e) {
    console.error('getPurchases failed, serving fallback:', e);
    return mockPurchases.map(p => ({ ...p }));
  }
}

export async function writeSheet(action: string, data: Record<string, unknown>) {
  const map = SHEET_ACTIONS[action];
  if (!map) throw new Error(`Unsupported action: ${action}`);

  // Trim string values and drop blank fields (e.g. auto-generated IDs on create)
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const v = typeof value === 'string' ? value.trim() : value;
    if (v === '' || v === null || v === undefined) continue;
    payload[key] = v;
  }

  if (!process.env.APPS_SCRIPT_URL) {
    // Offline fallback against the in-memory mock rows
    const products = action.toLowerCase().includes('product');
    const rows = (products ? mockProducts : mockPurchases) as unknown as Array<Record<string, unknown>>;
    const key = products ? 'ProductID' : 'PurchaseID';
    const id = String(data[key] ?? '');
    if (action.startsWith('add')) rows.push({ ...data });
    else if (action.startsWith('update')) {
      const index = rows.findIndex(row => String(row[key]) === id);
      if (index >= 0) rows[index] = { ...rows[index], ...data };
    } else if (action.startsWith('delete')) {
      const index = rows.findIndex(row => String(row[key]) === id);
      if (index >= 0) rows.splice(index, 1);
    }
    revalidateTag('getProducts');
    revalidateTag('getPurchases');
    return { success: true, data };
  }

  // POST { sheet, action, data } — exactly the envelope the Apps Script expects
  const result = await request<unknown>(map.action, 'POST', { sheet: map.sheet, action: map.action, data: payload });
  revalidateTag('getProducts');
  revalidateTag('getPurchases');
  return result ?? { success: true, data: payload };
}

export async function getActiveProducts() {
  return (await getProducts()).filter(p => p.Status?.toLowerCase() !== 'inactive');
}

export async function getProduct(id: string) {
  return (await getActiveProducts()).find(p => p.ProductID === id) || null;
}
