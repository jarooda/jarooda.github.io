---
title: 'Hello World, Revamp, dan Astro'
description: 'Memutuskan untuk rewrite & revamp web ini dari Vue.js ke Astro dan menambahkan fitur blog.'
pubDate: '12 Oct 2023'
updatedDate: '13 Oct 2023'
heroImage: 'https://cdn.jaluwibowo.id/assets/blog/laptop-top-desk.jpg'
metaImage: 'https://cdn.jaluwibowo.id/assets/blog/laptop-top-desk-300-225.png'
tags: ['web', 'javascript', 'astro']
---

# Hello, World!

Biasanya saat kita memulai belajar *ngoding*, kita akan menemui kalimat tersebut. Hello World biasanya digunakan untuk memastikan bahwa bahasa atau sistem sudah berjalan dengan semestinya. Maka, untuk tulisan pertamaku di web ini, sepertinya lebih lengkap dengan adanya Hello World hehe.

Sebelumnya, aku sudah pernah membuat sebuah web pribadi, masih sama seperti yang sekarang, web tersebut adalah web statis yang dideploy di [Github Pages](https://pages.github.com/) karena kebutuhannya memang hanya sebagai web untuk memajang hasil beberapa portofolio-ku selama bootcamp.

Web tersebut di develop menggunakan teknologi [Vue.js](https://vuejs.org/) versi 2. Tampilan web-nya bisa dilihat dibawah ini dan source code-nya masih ku simpan di branch [v1](https://github.com/jarooda/jarooda.github.io/tree/v1).

<div class=" flex justify-center mb-4">
  <video src="https://cdn.jaluwibowo.id/assets/blog/jaluwibowo-v1.mp4" controls="controls" class=" w-128">
  </video>
</div>

Agak *narsis* memang karena pasang foto *gede* gitu haha, tapi bisa dilihat, ada beberapa masalah yang terlihat dari web lama tersebut. Mulai dari asset yang terlalu besar, load time yang tidak terlalu cepat, dan hasilnya analisis `Lighthouse` tentu saja menjadi kurang.

![jaluwibowo-v1-lighthouse](https://cdn.jaluwibowo.id/assets/blog/jaluwibowo-v1-lighthouse.png)

# Memutuskan Rewrite & Revamp

Maka dari itu aku memutuskan untuk mengupdate web tersebut. Selain dari tampilan yang nanti-nya akan ku revamp, aku juga ingin mengoptimalkan performa web ini, ada beberapa approach yang bisa aku gunakan,

**1. Fix performance dengan refactor codebase lama**

Sempat terpikir jika hanya refactor code lama saja, misal size image lebih dikecilkan, lazy load component-component lain. Tapi ternyata ada beberapa kendala, seperti,

- Vue 2 yang hampir End Of Life (EOL) di [31 Desember 2023](https://v2.vuejs.org/lts/).

- Vue 2 yang hanya bisa menggunakan hingga Node 14 saja, karena saat kucoba di Node 16 dan Node 18 muncul error.

Maka opsi ini tidak ku lanjutkan, ya walaupun Vue 2 bisa dibilang sudah stable, tapi tetap saja sangat merepotkan apabila harus ganti Node.js version yang lebih kecil hanya untuk di project ini saja.

**2. Migrasi dari Vue 2 ke Vue 3**

Migrasi dari Vue 2 ke Vue 3 juga jadi pertimbanganku waktu itu, disamping sudah terdapat [guide dari Evan You](https://github.com/vuejs/vue-hackernews-2.0/compare/migration) untuk cara migrasi dari Vue 2 ke Vue 3, codebase yang sebelumnya juga tidak terlalu besar yang harusnya tidak memerlukan waktu yang cukup lama. Dan yang jelas dengan cara ini, aku bisa mengupgrade dependency yang support dengan Node.js terbaru.

Tapi opsi ini juga tidak kulanjutkan, karena di pekerjaan yang sekarang sedang memakai Vue.js juga, jadi aku ingin mencoba hal lain dan juga framework yang baru.

**3. Rewrite menjadi SSR atau SSG**

Opsi ini muncul karena aku ingin mencoba untuk membuat sebuah blog pribadi, dimana aku ingin membagikan beberapa ilmu-ku kedalam media tulisan. Hal ini juga bertujuan agar aku terbiasa menulis dokumentasi dan sekaligus sebagai catatan untuk diriku sendiri di masa depan.

Beberapa Framework seperti Nuxt, Vitepress, Next, Gatsby, dan Astro menjadi pertimbangan, tetapi akhirnya Astro yang kupilih.

# Mengapa Astro?

Astro kupilih karena beberapa alasan,

**1. Content-first websites**

Karena fokus dari revamp ini adalah blog, maka ini adalah hal pertama yang jadi alasan. Dengan Astro kita bisa menggunakan `Markdown` untuk menulis konten. Dan jika ingin menggunakan [custom komponen di artikel](https://docs.astro.build/en/guides/markdown-content/#using-components-in-mdx) kita, bisa render file tersebut menggunakan file `.mdx` alih-alih file `.md`.

**2. Konsep Island di Astro**

[Astro Island](https://docs.astro.build/en/concepts/islands/) merujuk pada komponen UI interaktif pada halaman `HTML` yang statis. Beberapa Island bisa ada di dalam 1 halaman, dan mereka masing masing te-render terpisah. Di Astro juga, kita bisa menggunakan UI & syntax framework lain (Vue, React, Svelte, atau yang lain) untuk di render di website Astro kita.

**3. Support Github Action dari developer**

Dengan [github action](https://docs.astro.build/en/guides/deploy/github/), memudahkan untuk deploy website, kita hanya perlu push kedalam branch yang ditentukan kemudian akan otomatis build & generate halaman statis yang dibutuhkan. Jadi masih tetap bisa menggunakan github pages yang gratisan.

# Fitur Blog

Dengan Astro, membuat website dengan blog menjadi sangat mudah, kita diberi template contoh blog yang bisa kita rubah sesuai dengan keinginan kita. Di sini aku menggunakan template yang [minimalis](https://github.com/withastro/astro/tree/latest/examples/blog) yang nantinya ku styling menggunakan Tailwind.

Karena minimalis, aku perlu beberapa *improvement*, di bagian blog, improvement ada di fitur dimana setiap heading yang dibuat, akan otomatis menjadi sebuah anchor yang bisa di klik dan di *navigate* ke anchor tersebut menggunakan [rehype-autolink-headings](https://github.com/rehypejs/rehype-autolink-headings). Dengan ini, aku bisa menambahkan section **Contents** yang ada di awal artikel ini.

# Fitur Contact Me

Contact Me kutambahkan dalam revamp ini karena sebelumnya, untuk menghubungi aku, user masih perlu klik link `mailto` yang dimana behaviour dari *syntax* tersebut adalah membuka aplikasi Email default yang ada di komputer.

Dengan form Contact Me ini, user hanya perlu memasukkan Nama, Email dan juga Message yang perlu dikirimkan tanpa perlu membuka email mereka.

Backend-nya sendiri aku buat menggunakan `express.js` dan `nodemailer` dan di deploy di [Railway](https://railway.app/), source code-nya sendiri bisa di lihat di repo [jarooda/contact-me](https://github.com/jarooda/contact-me).

# Hasil Akhir

Setelah selesai, akhirnya ku coba kembali untuk test menggunakan `Lighthouse`,

![Hasil Lighthouse V2](https://cdn.jaluwibowo.id/assets/blog/jaluwibowo-v2-lighthouse.png)

Dan menurutku pribadi, hasilnya sudah sangat memuaskan, kemudian ada beberapa fitur yang mungkin nanti akan aku tambahkan seperti Dark Mode dan juga clickable Article tags.

Menggunakan Astro juga membuatku kembali menggunakan `Javascript DOM` yang tentu saja bisa menambah ilmu fundamental-ku sebagai web developer.

Jika ada masukan atau saran, jangan sungkan untuk hubungi aku langsung, bisa lewat [email](https://www.jaluwibowo.id/#contactme) ataupun [open issue](https://github.com/jarooda/jarooda.github.io/issues) di github repo ini.