# 🐾 Animal Farm

> Przeglądarkowa gra planszowa inspirowana klasyczną grą **Superfarmer**
> — dla 1–6 graczy, z trybem lokalnym i sieciowym.

## 🎮 Graj online

**▶ [schoolhackday.github.io/animal-farm](https://schoolhackday.github.io/animal-farm/)**

Nie wymaga instalacji — działa w każdej przeglądarce na komputerze i telefonie.

---

## 📋 Jak grać

### Cel gry

Jako pierwszy zgromadź **co najmniej jednego** królika 🐰, owcę 🐑, świnię 🐷, krowę 🐄 i konia 🐴.

### Przebieg tury

Każda tura składa się z dwóch kroków:

1. **Wymiana** *(opcjonalna)* — możesz wymienić zwierzęta według przelicznika przed rzutem
2. **Rzut kostkami** — rzucasz dwiema kostkami K12 i rozmnażasz zwierzęta

### Kostki

| Kostka różowa 🎲 | Kostka żółta 🎲 |
|---|---|
| 🐰 Królik ×6 | 🐰 Królik ×6 |
| 🐑 Owca ×2 | 🐑 Owca ×3 |
| 🐷 Świnia ×2 | 🐷 Świnia ×1 |
| 🐴 Koń ×1 | 🐄 Krowa ×1 |
| 🦊 Lis ×1 | 🐺 Wilk ×1 |

### Rozmnażanie

Rozmnażanie następuje gdy:
- obie kostki pokażą **to samo zwierzę**, lub
- kostka pokaże zwierzę, które **masz już w inwentarzu**

Liczba rozmnożonych zwierząt = **⌊(inwentarz + wynik kostek) / 2⌋**

> **Przykład:** masz 3 🐰, pada 🐰 + 🐑 → dostajesz **2** króliki (bo ⌊(3+1)/2⌋ = 2)

### Pula zwierząt

W grze jest skończona liczba zwierząt — jeśli pula jest wyczerpana, nie dostaniesz więcej.

| Zwierzę | Pula |
|---|---|
| 🐰 Królik | 60 |
| 🐑 Owca | 24 |
| 🐷 Świnia | 20 |
| 🐄 Krowa | 12 |
| 🐴 Koń | 4 |
| 🐕 Mały pies | 4 |
| 🦮 Duży pies | 2 |

### Drapieżniki

| Zdarzenie | Efekt | Ochrona |
|---|---|---|
| 🦊 **Lis** | Tracisz wszystkie 🐰 króliki | 🐕 Mały pies (zostaje) |
| 🐺 **Wilk** | Tracisz wszystko oprócz 🐴 konia i 🐕 małego psa | 🦮 Duży pies (zostaje) |

### Wymiana

Jedna wymiana na turę. Możesz wymieniać wiele→jedno lub jedno→wiele (ale **nie** wiele↔wiele).

| Przelicznik | |
|---|---|
| 6 🐰 = 1 🐑 = 1 🐕 | owca lub mały pies |
| 2 🐑 = 1 🐷 | świnia |
| 3 🐷 = 1 🐄 = 1 🦮 | krowa lub duży pies |
| 2 🐄 = 1 🐴 | koń |

---

## 🕹️ Tryby gry

### 🏠 Gra lokalna

- **1–6 graczy** na jednym urządzeniu
- Każdy gracz może być **człowiekiem lub AI**
- Tury następują automatycznie po sobie

### 🌐 Gra sieciowa

- **1–6 graczy** na osobnych urządzeniach
- Tworzysz grę → dostajesz **kod** i **QR code**
- Inni dołączają przez kod lub skanując QR
- Stan gry synchronizowany przez **Supabase Realtime**
- Wymaga własnego projektu Supabase → [instrukcja konfiguracji](SUPABASE.md)

---

## 🚀 Uruchomienie lokalnie

```bash
git clone https://github.com/SchoolHackDay/animal-farm.git
cd animal-farm
# otwórz index.html w przeglądarce lub uruchom lokalny serwer:
npx serve .
```

Dla trybu sieciowego skonfiguruj Supabase → [SUPABASE.md](SUPABASE.md)

---

## 🗂️ Struktura projektu

```
animal-farm/
├── index.html          # struktura UI (ekrany, modale)
├── style.css           # motyw graficzny (granatowy, responsywny)
├── main.js             # logika gry, AI, Supabase, animacje
├── config.js           # 👈 wpisz tu URL i klucz Supabase
├── SUPABASE.md         # instrukcja podłączenia trybu sieciowego
├── specyfikacja.md     # pełna specyfikacja gry (dla AI i developerów)
└── historia-zmian.md   # dziennik vibe-codingu – jak powstawała gra
```

---

## 📖 Dokumentacja

| Plik | Opis |
|---|---|
| [specyfikacja.md](specyfikacja.md) | Pełna specyfikacja gry — zasady, reguły, architektura |
| [SUPABASE.md](SUPABASE.md) | Instrukcja konfiguracji trybu sieciowego |
| [historia-zmian.md](historia-zmian.md) | Dziennik vibe-codingu — jak gra powstawała komendami |

---

## 🧑‍💻 Tech stack

- **Frontend:** HTML + CSS + Vanilla JavaScript (bez frameworków)
- **Backend:** brak — tylko [Supabase](https://supabase.com) dla trybu sieciowego
- **Realtime:** Supabase Postgres Changes (WebSocket)
- **QR code:** [qrcodejs](https://github.com/davidshimjs/qrcodejs)

---

## 🎓 Historia powstawania

Ta gra powstała w całości metodą **vibe-codingu** — bez pisania kodu ręcznie,
wyłącznie przez wydawanie poleceń w języku naturalnym do GitHub Copilot CLI.

Pełny dziennik procesu z komentarzami dydaktycznymi:
→ **[historia-zmian.md](historia-zmian.md)**
