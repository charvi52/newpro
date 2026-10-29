import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Carely — A little closer. A lot more care.',description:'Keep medicine details together. A thoughtful personal cabinet with sample QR scanning and family-consent previews.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
