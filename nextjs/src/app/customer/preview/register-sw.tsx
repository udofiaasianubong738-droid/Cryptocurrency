"use client";
import { useEffect } from "react";
export default function RegisterCustomerServiceWorker(){
 useEffect(()=>{
  if("serviceWorker" in navigator){
   navigator.serviceWorker.register("/customer-sw.js",{scope:"/customer/"}).catch(()=>{});
  }
 },[]);
 return null;
}
