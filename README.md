# CAM-Frontend (Cah Apik Messenger)

<p align="center">
  <a href="https://shields.io/">
    <img src="https://img.shields.io/badge/React-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" style="margin-right: 8px;" alt="React"/>
  </a>
  <a href="https://shields.io/">
    <img src="https://img.shields.io/badge/Vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" style="margin-right: 8px;" alt="Vite"/>
  </a>
    <a href="https://shields.io/">
    <img src="https://img.shields.io/badge/TypeScript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" style="margin-right: 8px;" alt="TypeScript"/>
  </a>
  <a href="https://shields.io/">
    <img src="https://img.shields.io/badge/Socket.io-%23010101.svg?style=for-the-badge&logo=socket.io&logoColor=white" style="margin-right: 8px;" alt="Socket.IO"/>
  </a>
  <a href="https://shields.io/">
    <img src="https://img.shields.io/badge/Tailwind_CSS-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" style="margin-right: 8px;" alt="Tailwind CSS"/>
  </a>
</p>

CAM-Frontend adalah antarmuka pengguna untuk aplikasi pesan real-time. Dibangun dengan React, Vite, dan TypeScript, aplikasi ini menyediakan UI yang modern dan responsif untuk berkomunikasi secara langsung dengan **CAM-Backend**.

## ✨ Fitur

* **Antarmuka Login & Registrasi**: Halaman untuk pengguna masuk atau mendaftar akun baru dengan aman.
* **Chat Real-Time**: Mengirim dan menerima pesan secara instan menggunakan WebSockets melalui `Socket.IO`.
* **Tampilan Pesan Dinamis**: Antarmuka obrolan yang memisahkan pesan dari pengguna yang sedang login dan pengguna lain.
* **UI Modern & Animasi**: Dibangun dengan komponen dari **shadcn/ui**, **Tailwind CSS**, dan dianimasikan menggunakan **Framer Motion**.
* **Latar Belakang Interaktif**: Latar belakang dinamis dengan partikel dan bintang yang merespons gerakan mouse.
* **Desain Responsif**: Tampilan yang optimal di berbagai perangkat, dari desktop hingga mobile.

## 🛠️ Teknologi yang Digunakan

* **Framework**: React.js
* **Bahasa**: TypeScript
* **Build Tool**: Vite
* **Styling**: Tailwind CSS
* **Komponen UI**: shadcn/ui (menggunakan Radix UI, clsx, tailwind-merge)
* **Komunikasi Real-Time**: Socket.IO Client
* **Animasi**: Framer Motion
* **Ikon**: Lucide React
* **Linting**: ESLint

## 🚀 Memulai

### Prasyarat

Pastikan Anda telah menginstal perangkat lunak berikut:
* [Node.js](https://nodejs.org/) (versi 18 atau lebih tinggi direkomendasikan)
* [npm](https://www.npmjs.com/get-npm) (biasanya terinstal bersama Node.js)
* Pastikan **CAM-Backend** sudah berjalan dan dapat diakses.

### Instalasi & Konfigurasi

1.  **Clone repositori ini:**
    ```bash
    git clone <URL_REPOSITORI_ANDA>
    cd cam-frontend
    ```

2.  **Instal dependensi proyek:**
    ```bash
    npm install
    ```

3.  **Buat file `.env`:**
    Buat file bernama `.env` di direktori utama proyek dan salin konten dari contoh di bawah. File ini digunakan untuk menghubungkan frontend dengan backend dan untuk otentikasi.

    ```dotenv
    # .env.example

    # URL untuk API Server (Contoh: http://localhost:3001)
    VITE_API_BASE_URL=http://localhost:3001

    # URL untuk Socket.IO Server (Contoh: ws://localhost:3001)
    VITE_SOCKET_SERVER_URL=ws://localhost:3001
    
    # Kode otentikasi untuk registrasi (harus sama dengan AUTH_CODE di backend)
    VITE_AUTH_CODE=kode_rahasia_anda
    ```

### Menjalankan Aplikasi

* **Mode Pengembangan (dengan hot-reload):**
    Script ini akan menjalankan aplikasi menggunakan server pengembangan Vite.
    ```bash
    npm run dev
    ```

* **Build untuk Produksi:**
    Perintah ini akan membuat folder `dist` yang berisi file statis untuk production.
    ```bash
    npm run build
    ```

* **Preview Build Produksi:**
    Menjalankan server lokal untuk meninjau hasil build dari folder `dist`.
    ```bash
    npm run preview
    ```

Setelah menjalankan `npm run dev`, aplikasi frontend akan tersedia di `http://localhost:5173` atau port lain yang tersedia.
