/* Database Array Tarif */
let tarif = [
    ['Surabaya', 7000],
    ['Mojokerto', 7000],
    ['Jombang', 5000],
    ['Kertosono', 5000],
    ['Nganjuk', 5000],
    ['Ngawi', 14000],
    ['Sragen', 9000],
    ['Solo', 6000],
    ['Salatiga', 10000],
    ['Semarang', 9000]
]

/* Fungsi Mendapatkan Tarif */
function cekTarif(asal,akhir) {
    let flag = 0
    let totalBayar = 0
    let bayarMinimal = 0
    for (let i = 0; i < tarif.length; i++) {
        let city = tarif[i][0]
        let harga = tarif[i][1]
        if (flag === 1) {
            totalBayar += harga
        }
        if (city === asal || city === akhir) {
            flag++
            bayarMinimal = harga
        }
    }
    if (flag === 2) {
        return totalBayar
    }
    if (flag === 1) {
        return bayarMinimal
    }
}

/* Mendapatkan Tanggal Hari Ini */
let today = new Date();
let dd = String(today.getDate()).padStart(2, '0');
let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
let yyyy = today.getFullYear();
today = yyyy + '-' + mm + '-' + dd;

/* Fungsi Merubah Tanggal Agar Enak Dibaca */
function tanggalIndo(input) {
    let array = input.split("-")
    let day = array[2]
    let month = ''
    let year = array[0]
    switch (array[1]) {
        case '1':
            month = 'Januari'
        break;
        case '2':
            month = 'Januari'
        break;
        case '3':
            month = 'Januari'
        break;
        case '4':
            month = 'Januari'
        break;
        case '5':
            month = 'Januari'
        break;
        case '6':
            month = 'Januari'
        break;
        case '7':
            month = 'Januari'
        break;
        case '8':
            month = 'Januari'
        break;
        case '9':
            month = 'Januari'
        break;
        case '10':
            month = 'Oktober'
        break;
        case '11':
            month = 'Oktober'
        break;
        case '12':
            month = 'Oktober'
        break;
    }
    return `${day} ${month} ${year}`
}

/* Result setelah dipencet Pesan Kursi */
let kotaAwal = document.getElementById("kota_asal")
let kotaTujuan = document.getElementById("kota_tujuan")
let tanggal_berangkat = document.getElementById("tanggal")
let popup = document.getElementById("popup")

function check() {
    if (!tanggal_berangkat.value || tanggal_berangkat.value < today) {
        alert('Tanggal invalid!');
    } else {
        let bayar = cekTarif(kotaAwal.value, kotaTujuan.value)
        let result = document.getElementById("result")
        result.innerHTML = `Tarif : Rp. ${bayar},- untuk tanggal ${tanggalIndo(tanggal_berangkat.value)}`
        popup.style.display = "block"
    }
}

function read1() {
    let placeholder = document.getElementById("ph1")
    let readmore = document.getElementById("read1")
    readmore.style.display = "inline"
    placeholder.style.display = "none"
}

function read2() {
    let placeholder = document.getElementById("ph2")
    let readmore = document.getElementById("read2")
    readmore.style.display = "inline"
    placeholder.style.display = "none"
}

function read3() {
    let placeholder = document.getElementById("ph3")
    let readmore = document.getElementById("read3")
    readmore.style.display = "inline"
    placeholder.style.display = "none"
}

function read4() {
    let placeholder = document.getElementById("ph4")
    let readmore = document.getElementById("read4")
    readmore.style.display = "inline"
    placeholder.style.display = "none"
}