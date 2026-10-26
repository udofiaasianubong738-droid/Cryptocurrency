import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata:Metadata={
 title:{default:"CryptoInvest | Workspace",template:"%s | CryptoInvest"},
 description:"CryptoInvest workspace preview. Financial operations remain disabled until backend and security verification is complete.",
 applicationName:"CryptoInvest",robots:{index:false,follow:false},
 icons:{icon:"/icon.svg",shortcut:"/icon.svg",apple:"/icon.svg"},
};
export const viewport:Viewport={themeColor:"#f3f6fa",width:"device-width",initialScale:1,viewportFit:"cover"};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en"><body>{children}</body></html>;
}
