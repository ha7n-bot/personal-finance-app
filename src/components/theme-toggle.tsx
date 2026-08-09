"use client";
import { useTheme } from "next-themes";
export function ThemeToggle(){ const {theme,setTheme}=useTheme(); return <button className="btn" onClick={()=>setTheme(theme==="dark"?"light":"dark")}>تبديل المظهر</button> }
