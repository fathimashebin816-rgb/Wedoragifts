'use client';
import {create} from 'zustand';
import {persist,createJSONStorage} from 'zustand/middleware';
import type {Product} from './types';
export type CartItem={product:Product;quantity:number};
type State={items:CartItem[];add:(p:Product)=>void;remove:(id:string)=>void;setQuantity:(id:string,n:number)=>void;clear:()=>void};
export const useCart=create<State>()(persist((set)=>({items:[],add:(p)=>set(s=>({items:s.items.some(x=>x.product.ProductID===p.ProductID)?s.items.map(x=>x.product.ProductID===p.ProductID?{...x,quantity:x.quantity+1}:x):[...s.items,{product:p,quantity:1}]})),remove:(id)=>set(s=>({items:s.items.filter(x=>x.product.ProductID!==id)})),setQuantity:(id,n)=>set(s=>({items:s.items.map(x=>x.product.ProductID===id?{...x,quantity:Math.max(1,n)}:x)})),clear:()=>set({items:[]})}),{name:'wedora-cart',storage:createJSONStorage(()=>localStorage)}));
