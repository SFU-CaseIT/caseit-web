import Script from "next/script";

export default function TawkTo() {
  return (
    <Script id="tawk" strategy="lazyOnload">
      {`
          var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
          (function(){
          var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
          s1.async=true;
          s1.src='https://embed.tawk.to/63cbb4eec2f1ac1e202edb8e/1gn9rlhh8';
          s1.charset='UTF-8';
          s1.setAttribute('crossorigin','*');
          s0.parentNode.insertBefore(s1,s0);
          })();
          `}
    </Script>
  );
}
