import Link from 'next/link';
import {getActiveProducts} from '@/lib/sheets';
import {ProductCard} from '@/components/storefront';
import {SafeImage} from '@/components/safe-image';

export default async function Home(){
 const all=await getActiveProducts();
 const products=all;
 const categories=[...new Set(all.map(p=>p.Category).filter(Boolean))];
 return <div className="page">
  <section className="hero"><div className="hero-content"><span className="eyebrow">Wedora Gifts &middot; Heirloom Gifting</span><h1>Beautiful Hampers for Your <i>Special Moments</i></h1><p>Thoughtfully Curated Gifts, Wrapped with Love &amp; Champagne Ribbons. Hand-tied botanicals, embossed gold foil seals, and artisanal confectionery.</p><Link className="button" href="/collection/all">Explore Hampers</Link><a className="eyebrow" style={{display:'block',marginTop:16}} href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER||''}`}>Book Wedding Concierge &rarr;</a></div><img className="hero-image" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAA-53U0kZOrMLdJ9ffIdbQyJM2VST_6DT2Vz3anHCdRX0f5kx54fCnyHM-SXOrQr9yGLaCX7h1EqYhVHuKmhYS0ZMGLxb6KLVMjHo0biQ1JfTg-kEXkP0ZimC4OdkT9UbZ1y6k7iw973b8dHKMVpn9MhM76i2vlBexWj2i-484YzJhne3wpZxHYYSQWOFB_GASFmaF1Wh5yNb0dbFtuxRg5BsB1dU13cO-k2K79LDvfu7Yqxi66hcanA" alt="An open bespoke ivory wedding trunk with ribbons, confections and roses"/></section>
  <section className="section"><div className="section-heading"><span className="eyebrow">Curate by matrimonial ceremony</span><h2>Explore by Occasion</h2></div><div className="category-list">{categories.map(x=><Link key={x} href={`/collection/${encodeURIComponent(x)}`}>{x}</Link>)}</div></section>
  <section className="section"><div className="section-heading"><span className="eyebrow">The Wedora edit</span><h2>Bestselling Gift Hampers</h2></div><div className="product-grid">{products.map(p=><ProductCard key={p.ProductID} product={p}/>)}</div></section>
  <section className="story-band section"><span className="eyebrow">Made personal, made memorable</span><h2 className="serif">Build Your Bespoke Wedding Hamper</h2><p>Four simple steps to design an unforgettable unboxing for your special day.</p><Link className="button" href="/collection/all">Begin your curation</Link></section>
  <section className="section"><div className="section-heading"><span className="eyebrow">Wedding Gifts</span><h2>Gifting for every chapter</h2></div><div className="product-grid">{categories.map((name,index)=>{const p=all.find(item=>item.Category===name);return <Link className="product-card" key={name} href={`/collection/${encodeURIComponent(name)}`}><div className="product-photo"><SafeImage src={p?.ImageURL} alt={name}/></div><div className="product-copy"><h3>{name}</h3><span className="eyebrow">Explore the edit &rarr;</span></div></Link>})}</div></section>
  <section className="story-band section"><span className="eyebrow">Tied with love</span><h2 className="serif">Wedora Wedding Stories</h2><p>Real experiences from brides, grooms, and luxury wedding planners across India.</p><blockquote>&ldquo;Wedora creates pieces that last long after the pheras are over.&rdquo;</blockquote></section>
 </div>
}
