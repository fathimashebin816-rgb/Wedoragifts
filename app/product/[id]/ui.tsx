'use client';import {useCart} from '@/lib/store';import type {Product} from '@/lib/types';
export function AddButton({product}:{product:Product}){const add=useCart(s=>s.add);const stock=Number(product.CurrentStock)||0;return <button className="button" disabled={!stock} onClick={()=>add(product)}>{stock?'Add to Bag':'Sold Out'}</button>}
