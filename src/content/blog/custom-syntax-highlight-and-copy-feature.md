---
title: 'Kustom Sintaks Highlight dan Fitur Salin Kode Pada Astro'
description: 'Menambahkan fitur melihat bahasa apa yang digunakan dalam sintaks highlight dan fitur salin kodingan menggunakan javascript dan css.'
pubDate: '27 Oct 2023'
heroImage: 'https://cdn.jaluwibowo.id/assets/blog/syntax-highlight.webp'
metaImage: 'https://cdn.jaluwibowo.id/assets/blog/syntax-highlight-300-255.png'
tags: ['web', 'javascript', 'astro', 'css']
enVersion: true
---

# Syntax Highlighting

Sintaks highlighting adalah adalah sebuah fitur yang berguna untuk menampilkan teks terutama kode, dalam berbagai warna maupun *font* yang sesuai dengan kode tersebut. Fitur ini sangat membantu untuk menambah *readibility* pada sebuah kode yang kita tulis. Programmer bisa terbantu saat *debugging* karena dengan warna yang berbeda, akan lebih memudahkan untuk mencari irisan kode yang dia inginkan.

Saat menggunakan markdown, kita bisa menggunakan fitur sintaks highlight dengan menambahkan bahasa yang dipakai di akhir *backtick* di awal [fenced code blocks](https://www.markdownguide.org/extended-syntax/#fenced-code-blocks). Sebagai contoh, kita bisa melihat sintaks javascript dibawah ini.

````
```js
function countSheep (maxSheep) {
  let count = 0
  while (count < maxSheep) {
    count++
    console.log(count + ' sheep 🐑')
  }
}
countSheep(100)
// 1 sheep 🐑
// ...
// 100 sheep 🐑
```
````

Jika markdown tersebut di preview, akan menjadi seperti tampilan dibawah ini.

```js
function countSheep (maxSheep) {
  let count = 0
  while (count < maxSheep) {
    count++
    console.log(count + ' sheep 🐑')
  }
}
countSheep(100)
// 1 sheep 🐑
// ...
// 100 sheep 🐑
```

Bisa dilihat, akan lebih mudah kita mencari mana yang berupa `string`, `number`, `function` maupun `comment` karena warna-warna tersebut sudah mempresentasikan tiap kode tersebut.

# Penggunaan di Astro

Secara default, [Astro](https://astro.build/) sudah memberikan [built-in support](https://docs.astro.build/en/guides/markdown-content/#syntax-highlighting) sintaks highlighting untuk [Shiki](https://shiki.matsu.io/) dan [Prism](https://prismjs.com/) dengan Shiki sebagai opsi defaultnya. Dengan begitu kita bisa men-*highlight* kode-kode yang terdapat di  `fenced code (```)` yang digunakan di dalam file markdown atau `MDX`.

Contoh saat kita menggunakan Shiki pada markdown yang kita buat adalah seperti ini.

![syntax highlight using shiki](https://cdn.jaluwibowo.id/assets/blog/syntax-highlight-shiki.png)

Jika dilihat, kode-nya sudah terhighlight sehingga memudahkan bagi kita untuk membacanya, tetapi masih ada yang kurang, yaitu pembaca yang awam mungkin tidak tahu, bahasa pemrograman apa yang sudah ditulis di baris kode tersebut.

Kita bisa saja membuat sebuah baris komentar yang menunjukan bahasa apa yang kita tulis seperti `// javascript` di awal kode, tetapi hal tersebut mungkin bagi sebagian orang agak merepotkan karena sebetulnya kita sudah menulisnya saat membuat `fenced code`.

# Menampilkan Bahasa Pemrograman

Untuk menampilkan bahasa pemrograman yang dipakai di `fenced code`, kita bisa meng-kustom konfigurasi sintaks highlight yang ada di Astro dan menambah beberapa sintaks javascript dan css.

Hal pertama yang kita lakukan adalah merubah opsi sintaks highlight dari Shiki menjadi Prism.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  markdown: {
    syntaxHighlight: 'prism',
  }
});
```

Setelah mengganti opsi tersebut menjadi `prism` kita perlu menambahkan `CSS` milik kita sendiri, untungnya kita bisa menggunakan tema yang telah tersedia di [github PrismJS](https://github.com/PrismJS/prism-themes).

Salin kode tersebut dan tambahkan ke dalam file `public/themes/prism.css`. Kemudian panggil `style` tersebut kedalam tag `head` di file `HTML`.

```html
<head>
  <link href="/themes/prism.css" rel="stylesheet" />
</head>
```

Dengan menggunakan `prism` elemen yang akan tergenerate akan menjadi seperti ini,

```html
<pre class="language-js">
  <code is:raw class="language-js">
    <!-- some span -->
  </code>
</pre>
```

Maka setelah itu kita bisa mencari dulu, semua elemen `pre` yang ada di dalam page tersebut, kemudian kita akan iterasi dan merender masing-masing bahasa di elemen tersebut. Kita juga perlu untuk memberikan style relative kepada elemen `pre`, ini akan kita gunakan nantinya untuk *styling*.

```js
const preBlocks = Array.from(document.querySelectorAll("pre"));

for (const preBlock of preBlocks) {
  preBlock.style.position = "relative";

  renderCodeLang(preBlock);
}
```

Di dalam elemen `pre`, kita sudah mendapati nama bahasa yang perlu kita gunakan, maka dari itu, kita akan memisahkan nama *class* tersebut agar kita bisa gunakan. Kemudian kita akan membuat sebuah elemen `div` yang perlu kita taruh di dalam elemen `pre`.

```js
function renderCodeLang(preBlock) {
  const classLang = preBlock.className;
  const lang = classLang.split('-')[1];

  if (lang !== 'plaintext') {
    // add lang section on top left
    const langSection = document.createElement("div");
    langSection.className = "code-lang";
    langSection.innerHTML = lang;
  
    preBlock.prepend(langSection);
  }
}
```

Jika kita tidak memberi sintaks highlight pada `fenced block`, maka nama *class* nya akan menjadi `language-plaintext`, maka dari itu, kita perlu untuk mem-validasi agar tulisan `plaintext`-nya tidak muncul.

Kemudian, kita perlu menambahkan *styling* pada kode yang kita buat,

```css
.code-lang {
  position: absolute;
  top: 0;
  left: 10px;
  background-color: #fff;
  color: #000;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1rem;
  border-radius: 0 0 0.25rem 0.25rem;
}
```

Hasilnya akan seperti ini.

![syntax highlight using custom prism](https://cdn.jaluwibowo.id/assets/blog/syntax-highlight-prism-custom.png)

# Fitur Copy Code

Agar memudahkan user yang ingin menggunakan sintaks yang ada di website, lebih baik ditambahkan sebuah fitur untuk menyalin kode tersebut.

Flow-nya sama seperti diatas, kita perlu untuk mencari elemen pre yang ada di halaman milik kita, lalu render tombol salin.

```js
const copyImg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M9 18q-.825 0-1.413-.588T7 16V4q0-.825.588-1.413T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.588 1.413T18 18H9Zm0-2h9V4H9v12Zm-4 6q-.825 0-1.413-.588T3 20V7q0-.425.288-.713T4 6q.425 0 .713.288T5 7v13h10q.425 0 .713.288T16 21q0 .425-.288.713T15 22H5Zm4-6V4v12Z"/></svg>`
const checkMarkImg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m10.6 16.2l7.05-7.05l-1.4-1.4l-5.65 5.65l-2.85-2.85l-1.4 1.4l4.25 4.25ZM5 21q-.825 0-1.413-.588T3 19V5q0-.825.588-1.413T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.588 1.413T19 21H5Z"/></svg>`
const preBlocks = Array.from(document.querySelectorAll("pre"));

for (const preBlock of preBlocks) {
  preBlock.style.position = "relative";

  renderCodeLang(preBlock);
  renderCopyBtn(preBlock);
}

function renderCopyBtn(preBlock) {
  const copyButton = document.createElement("button");

  copyButton.className = "copy-code";
  copyButton.setAttribute("aria-label", "Copy code to clipboard");
  copyButton.setAttribute("title", "Copy code to clipboard");
  copyButton.innerHTML = copyImg;

  preBlock.setAttribute("tabindex", "0");
  preBlock.appendChild(copyButton);

  copyButton.addEventListener("click", async () => {
    await copyCode(preBlock, copyButton);
  });
}
```

Fungsi salin akan mencari elemen `code` lalu menyalin teks yang ada di dalamnya.

```js
async function copyCode(block, button) {
  const code = block.querySelector("code");
  const text = code?.innerText || "";

  try {
    await navigator.clipboard.writeText(text);

    // Visual feedback that the task is completed
    button.innerHTML = checkMarkImg;

    setTimeout(() => {
      button.innerHTML = copyImg;
    }, 700);
  } catch (error) {
    console.error("Failed to copy code: ", error);
  }
}
```

Kemudian kita akan *styling* kode ini agar berada di kanan atas setiap elemen `kode`.

```css
.copy-code {
  border: none;
  padding: 0;
  cursor: pointer;
  outline: inherit;
  position: absolute;
  top: 10px;
  right: 0;
  background-color: #fff;
  color: #000;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1rem;
  border-radius: 0.25rem 0 0 0.25rem;
}
```

Tampilan hasil akhirnya adalah sebagai berikut.

![syntax highlight using shiki](https://cdn.jaluwibowo.id/assets/blog/syntax-highlight-copy.png)

# Penutup

Kita sudah berhasil membuat sebuah kustomisasi untuk sintaks highlight yang ada di Astro, dengan begini user yang melihat potongan kode yang ada di website kita akan lebih terbantu jika ingin menyalinnya.

*Feel free* untuk memberi masukan atau jangan malu bertanya jika ada hal yang masih belum paham ya 😉.