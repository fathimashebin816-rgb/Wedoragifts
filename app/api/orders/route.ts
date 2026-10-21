import { NextResponse } from 'next/server';
import { writeSheet } from '@/lib/sheets';

// Records a cart checkout as purchases in the Google Sheet (Purchases tab),
// using the same envelope as the Apps Script curl example:
//   { sheet: "Purchases", action: "create", data: { ProductID, Quantity, UnitCost, AmountPaid, Notes } }
type Item = { ProductID?: unknown; ProductName?: unknown; Quantity?: unknown; SellingPrice?: unknown; PurchaseCost?: unknown };

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const items: Item[] = Array.isArray(body?.items) ? body.items : [];
    const valid = items.filter(i => i && String(i.ProductID ?? '').trim() && Number(i.Quantity) > 0);
    if (!valid.length) return NextResponse.json({ error: 'Cart is empty or has invalid items' }, { status: 400 });

    let created = 0;
    for (const item of valid) {
      const productID = String(item.ProductID).trim();
      const quantity = Number(item.Quantity);
      const productName = String(item.ProductName ?? '').trim();
      // Unit price recorded is what the customer pays (selling price); payment pending (0) until settled on WhatsApp.
      const unitCost = Number(item.SellingPrice) || Number(item.PurchaseCost) || 0;
      await writeSheet('addPurchase', {
        ProductID: productID,
        Quantity: quantity,
        UnitCost: unitCost,
        AmountPaid: 0,
        Notes: productName ? `Website order: ${productName} x${quantity}` : `Website order x${quantity}`,
      });
      created++;
    }
    return NextResponse.json({ success: true, count: created });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not record the order' }, { status: 502 });
  }
}
