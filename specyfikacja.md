# 🐾 Animal Farm – Specyfikacja AI

## 🎯 Cel

Zbuduj grę przeglądarkową dla 1–6 graczy z:

* wymiana
* rzuty 2 kostkami (zwierzęta)
* rozmnażanie
* multiplayer (lokalny oraz sieciowy)
* Supabase jako **źródło prawdy** TYLKO dla gry sieciowej

---

# 🧱 Stack

* Frontend: HTML + CSS + Vanilla JS
* Supabase JS client (oficjalny z CDN https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2):
  przechowywanie stanu gry, powiadomienia o turze (tylko tryb sieciowy)
* Brak własnego backendu, tylko Supabase

---

# 🎲 Kostki (K12)

### Różowa kostka

| Pole   | Liczba oczek |
| ------ | ------------ |
| Królik | 6            |
| Owca   | 2            |
| Koń    | 1            |
| Lis    | 1            |
| Świnia | 2            |

### Żółta kostka

| Pole   | Liczba oczek |
| ------ | ------------ |
| Królik | 6            |
| Owca   | 3            |
| Świnia | 1            |
| Wilk   | 1            |
| Krowa  | 1            |

### Przebieg gry

Gra zaczyna się z pustym inwentory każdego gracza.
Zaczyna pierwszy gracz, może wymienić (ale nie ma co, bo pusty inwentarz). 
Rzuca dwiema kostkami, jeśli wylosuje parkę - rozmnażanie, otrzymuje zwierzę.
Potem kolejni gracze.
Gra kończy się gdy którykolwiek z graczy ma co najmniej jednego królika, owcę, świnię, krowę i konia.
W puli jest 60 królików, 24 owce, 20 świń, 12 krów, 4 konie. Psy: 4 małe, 2 duże.
Jeśli w puli nie ma dostatecznej ilości zwierząt - gracz nie może ich rozmnożyć ani wymienić.

Przykład:
Z puli wybranych jest 58 królików, gracz rozmnaża 16 królików, czyli niby 4, ale dostaje tylko 2 - bo jest 60 w puli.

---

# 🧩 Model danych – Gracz

Gracz ma imię, kolor, oraz inwentarz.
W inwentarzu może mieć:
- króliki,
- owce,
- świnie
- krowy
- konie
1 małego psa, oraz 1 dużego psa
Gracz dąży do posiadania co najmniej 1 zwierzęcia każdego rodzaju.

* Kolory graczy: niebieski, czerwony, zielony, żółty, pomarańczowy, fioletowy
* Maksymalnie 6 graczy w lokalnym i sieciowym trybie

---

# 🎮 Dodawanie imienia gracza

### Gra lokalna

* Przed startem gry przy wyborze liczby graczy każdy gracz podaje **swoje imię**
* Kolory przypisywane w kolejności: niebieski, czerwony, zielony, żółty, pomarańczowy, fioletowy

### Gra sieciowa

* Tworzenie gry: gracz podaje swoje imię i tworzy grę
* Dołączanie do gry: każdy gracz podaje swoje imię
* Gracz tworzący grę ma **inicjatywę startu**
* Gra automatycznie startuje, gdy dołączą wszyscy gracze (i tworzący naciśnie start), lub maksymalnie 6 osób (wtedy automatycznie)

---

# 🧠 Zasady gry

1. **Rozmnażanie**

   * dwa takie same zwierzęta na kostkach
   * lub zwierzę z kostki, a druga sztuka w inventory -> rozmnażanie
   * UWAGA: koń, krowa mimo, że są tylko po jednym na kostkach - i tak wymagają pary by się rozmnożyć

Ilość rozmnożonych zwierząt to ilość par danego zwierzęcia wliczając te na kostkach.

Przykład 1:
Gracz ma 3 króliki i 2 świnie, na kostce różowej wypada królik na żółtej owca.
Gracz otrzymuje 2 króliki (bo ma 2 pary królików łącznie z kostkami).

Przykład 2:
Gracz ma 3 króliki i 2 owce, na kostce wypadają świnia i świnia.
Gracz otrzymuje 1 świnię.

Przykład 3:
Gracz ma 6 królików, na kostce wypada świnia i owca.
Gracz nie dostaje nic.

Przykład 4:
Gracz ma krowę, na kostce wypada koń i lis.
Gracz nie dostaje nic, ale też nie traci nic.

2. **Lis (🦊)**

   * mały pies chroni — ale pies zostaje stracony (wraca do puli)
   * brak małego psa → wszystkie króliki giną

3. **Wilk (🐺)**

   * duży pies chroni — ale pies zostaje stracony (wraca do puli)
   * brak dużego psa → wszystkie zwierzęta poza małym psem i koniem giną

4. **Wymiana**

   * 6 królik = 1 owca = 1 mały pies
   * 2 owce = 1 świnia
   * 3 świnie = 1 krowa = 1 duży pies
   * 2 krowy = 1 koń

Gracz może dokonać tylko jednej wymiany na początku rundy z zachowaniem przeliczników.
Może wymienić 1 zwierzę na kilka, lub kilka zwierząt na jedno.

Przykład 1:
Gracz ma 7 królików, 2 owce, 3 świnie. Może wykonać takie wymiany:
- 6 królików na 1 owcę, lub
- 6 królików + 1 owcę na 1 świnię
- 2 owcę na 1 świnię
- 2 świnie + 1 owcę + 6 królików na 1 krowę
- 3 świnie na 1 krowę
- 1 owcę na małego psa
- 3 świnie na dużego psa
- 1 świnię na 2 owce
- 1 świnię na 1 owcę i 6 królików
- 1 świnię na 1 owcę i małego psa
ale też wiele innych według przeliczników.

Przykład 2:
Gracz ma tylko 1 konia. Może wykonać jedną z 
- 1 konia na 1 krowę, 2 świnie, 1 owcę i 6 królików
- 1 konia na 2 krowy
- 1 konia na 1 krowę i dużego psa
itp.

Podsumowując można "rozmienić" 1 drogie zwierzę na wiele według przeliczników,
oraz zamienić wiele tańszych zwierząt na jedno drogie.

Nie można zamieniać wiele -> wiele!

---

# 🔁 Pętla gry

1. Opcjonalna wymiana wg. przelicznika
2. Gracz rzuca kostki
3. Obsługa lis/wilk
4. Rozmnażanie
5. Tryb lokalny → zapis stanu w JS
6. Tryb sieciowy → zapis stanu w Supabase + powiadomienie kolejnych graczy
7. Gra kończy się gdy aktualny gracz ma conajmniej 1 zwierzę każdego rodzaju

---

# ⚡ Opcje gameplay

## 1️⃣ Gra lokalna

* 1.1 Player vs Computer (AI ruchów)
* 1.2 Wielu graczy na jednym urządzeniu (2–6)

## 2️⃣ Gra sieciowa

* Wielu graczy na osobnych urządzeniach
* Dołączenie do gry przez:
  * QR code (bezpośredni link do ekranu dołączenia do gry)
  * wpisany kod gry
* Supabase przechowuje tury, inventory, logi i inicjatywę startu

---

# 💾 Supabase – operacje (tylko tryb sieciowy)

### Aktualizacja stanu gry

Stan powinien być aktualizowany po każdej turze (turze każdego gracza).

### Odczyt stanu gry (Realtime / snapshot)

Korzystamy z mechanizmu subskrypcji Supabase do powiadamiania graczy o stanie rozgrywki.

---

# 🖥️ UI

* Ekran Startowy
  * wybór trybu gry (lokalny / sieciowy)

* Ekran Startowy (wybrana gra lokalna)
  * możliwość wpisania imion do 6 graczy
  * możliwość wyboru przy każdym graczu: człowiek / AI

* Ekran Startowy (wybrana gra sieciowa) 
  * Wybór "Utwórz grę" / "Dołącz do gry"

* Ekran Startowy (wybrana gra sieciowa -> Utwórz grę)
  * Wyświetlony QR kod (link do dołączenia do TEJ gry), kod tekstowy do dołączenia, przycisk "Start"

* Ekran Startowy (wybrana gra sieciowa -> Dołącz do gry)
  * Pole do wpisania kodu, oraz imienia
  * Przycisk "dołącz"

* Ekran rozgrywki
* przycisk "Roll"
* widok inventory wszystkich graczy
* wynik kostek
* przyciski wymiany
* log zdarzeń
* informacja o aktualnej turze
* wybór trybu gry (lokalny / sieciowy)
* możliwość dołączenia do gry przez QR / kod
* wyświetlanie imienia i koloru gracza

---

# 🧪 Walidacja

* lis/wilk przed rozmnażaniem
* ruch tylko jeśli aktualnie tura gracza
* w trybie sieciowym Supabase = state validator

---

# 🚀 Definition of Done

* 1–6 graczy w każdym trybie
* stan gry synchronizowany w trybie sieciowym przez Supabase
* lis, wilk i koń działają poprawnie
* rozmnażanie i wymiana poprawnie
* log akcji widoczny dla wszystkich graczy
* brak możliwości oszustwa klienta

---

📁 Struktura projektu
/
  index.html
  style.css             // style CSS
  main.js               // cały js w jednym pliku

---

# 💡 Strategia implementacji

1. Lokalna gra (1–6 graczy / player vs komputer) → test zasad
2. Integracja Supabase → zapis stanu po ruchu w trybie sieciowym
3. Realtime → powiadomienie drugiego gracza
4. UI + log zdarzeń
5. Test scenariuszy lis/wilk/rozmnażanie/wymiana
6. Obsługa imion i kolorów graczy w każdym trybie

---

# 🔥 Zasady dla AI

* prosty, czytelny kod
* funkcje zamiast klas
* plain objects
* Supabase = state validator i source of truth tylko w trybie sieciowym
* Realtime = powiadomienia tylko o zmianach tur
* Możliwość wyświetlenia na komórce

---

# 📋 Wymagania niefunkcjonalne — proces vibe-codingu

Ten projekt jest demonstracją vibe-codingu dla uczniów. **Po każdej zmianie** wprowadzonej przez AI obowiązuje:

1. **Aktualizacja `historia-zmian.md`** — każda komenda użytkownika i jej efekt muszą być odnotowane jako kolejny wpis (numer, treść komendy, opis zmian, hash commitu).
2. **Commit i push** — każda zmiana trafia do repozytorium z czytelnym opisem.
3. **Commit trailer** — każdy commit zawiera `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`.

`historia-zmian.md` jest **dziennikiem projektu** — ma dokumentować każdy krok, żeby uczniowie mogli śledzić ewolucję kodu.
