import type {Metadata} from 'next';
import './globals.css';
import {Header,Footer} from '@/components/storefront';
export const metadata:Metadata={title:'Wedora Gifts – Luxury Hampers',description:'Bespoke luxury wedding hampers and heirloom gifting.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/></head><body suppressHydrationWarning><Header/><main>{children}</main><Footer/></body></html>}
