# Konfigurasi Dinamis Team Drawer

Aplikasi Team Drawer sekarang mendukung konfigurasi dinamis melalui file `config.json`. Anda dapat mengubah player list dan jumlah tim tanpa perlu build ulang aplikasi.

## Struktur File config.json

```json
{
  "jumlah_tim": 3,
  "pots": [
    {
      "name": "Pot 1",
      "players": {
        "#CLR": ["1. Badak Putih", "2. Badak Hijau", "3. Badak Merah"],
        "#GK": ["1. Asep", "2. Onana", "3. Markus"],
        "#DEF": ["1. pa aldo", "2. Reno", "3. Sde"],
        "#MID": ["1. Abah", "2. Rangga", "3. Osan"],
        "#FW": ["1. Budi", "2. Wawan", "3. Abdul Rohman"]
      }
    },
    {
      "name": "Pot 2",
      "players": {
        "#DEF": ["5. Opik", "6. Eko", "7. Jarwo"],
        "#MID": ["5. Marsel", "6. Ijay", "7. Helmi"],
        "#FW": ["5. Afri", "6. Rama", "7. Tomminay"]
      }
    }
  ]
}
```

## Parameter Konfigurasi

### jumlah_tim
- **Tipe**: Integer
- **Deskripsi**: Jumlah tim yang akan dibuat
- **Contoh**: `3`

### pots
- **Tipe**: Array of Objects
- **Deskripsi**: Array berisi pot-pot pemain

### Pot Object
- **name**: Nama pot (contoh: "Pot 1", "Pot 2")
- **players**: Object yang berisi pemain berdasarkan posisi

### Position Codes
- `#CLR`: WARNA (Color)
- `#GK`: KIPER (Goalkeeper)  
- `#DEF`: Defender
- `#MID`: Midfield
- `#FW`: Forward

## Cara Menggunakan

1. **Edit file `config.json`** sesuai kebutuhan
2. **Jalankan aplikasi** dengan `go run main.go`
3. **Aplikasi akan otomatis membaca** konfigurasi terbaru

## Contoh Perubahan

### Menambah Tim
```json
{
  "jumlah_tim": 4,  // Ubah dari 3 ke 4
  "pots": [...]
}
```

### Menambah Pemain
```json
{
  "name": "Pot 1",
  "players": {
    "#GK": [
      "1. Asep",
      "2. Onana", 
      "3. Markus",
      "4. Pemain Baru"  // Tambahkan pemain baru
    ]
  }
}
```

### Menambah Pot Baru
```json
{
  "pots": [
    {...}, // Pot 1
    {...}, // Pot 2
    {
      "name": "Pot 3",
      "players": {
        "#MID": ["20. Pemain Baru", "21. Pemain Lain"]
      }
    }
  ]
}
```

## Validasi

Aplikasi akan memvalidasi:
- File `config.json` harus ada dan dapat dibaca
- `jumlah_tim` harus lebih dari 0
- Minimal ada 1 pot yang didefinisikan
- Format JSON harus valid

Jika ada error, aplikasi akan menampilkan pesan error dan berhenti.

## File Output

Aplikasi akan menghasilkan:
- `hasil_random.txt`: File log hasil drawing
- `team1.txt`, `team2.txt`, `team3.txt`, dll: File tim berdasarkan jumlah tim
