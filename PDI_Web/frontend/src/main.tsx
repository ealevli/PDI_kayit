import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // Vite handles .tsx automatically
import './index.css'

console.log("!!! Main.tsx Yükleniyor !!!");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("!!! 'root' element bulunamadı !!!");
} else {
  console.log("!!! 'root' element bulundu, render başlıyor !!!");

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
