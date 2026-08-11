export default function LocalFinanceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>
    <style>{`.topbar a[href*="callbackUrl=/import-demo"]{display:none!important}`}</style>
    {children}
  </>;
}
