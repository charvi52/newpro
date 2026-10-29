import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={
 title:'Carely — Medicine details, together',
 description:'India-first medicine information and personal cabinet. Scan printed codes, check official CDSCO alerts, and share only with permission.',
 icons:{icon:'/favicon.svg'},
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
