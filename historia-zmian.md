# 📖 Historia zmian — Animal Farm (Vibe Coding)

Plik dokumentuje kolejne komendy wydane przez prowadzącego podczas sesji
**vibe-codingu** — procesu tworzenia gry wyłącznie przez wydawanie poleceń
w języku naturalnym, bez pisania kodu ręcznie.

> **Vibe coding** polega na opisaniu tego, czego chcesz, zamiast pisania tego samego.
> AI tłumaczy intencję na działający kod.

---

## Środowisko pracy

- **Narzędzie:** GitHub Copilot CLI (agent w terminalu)
- **Model AI:** Claude Sonnet 4.6
- **Repo:** `SchoolHackDay/animal-farm`
- **Stack:** HTML + CSS + Vanilla JS + Supabase

---

## Komendy i efekty

### 1. `zaimplementuj proszę, grę opisaną w instrukcji`

AI przeczytało plik `Instrukcja rozwoju gry.md` i wygenerowało całą grę od zera:

- `index.html` — 7 ekranów (start, ustawienia lokalne, lobby sieciowe, gra, koniec) + 2 modale (wymiana, Supabase)
- `style.css` — ciemny motyw farmowy (zielony), responsywny layout CSS Grid/Flex
- `main.js` — ~850 linii: pełna logika gry, AI gracz, integracja Supabase, animacje

**Zaimplementowane reguły:**
- Dwie kostki K12 (różowa i żółta) z poprawnymi rozkładami
- Rozmnażanie: `⌊(inwentarz + kostki) / 2⌋` par
- Ograniczenia puli (60🐰, 24🐑, 20🐷, 12🐄, 4🐴…)
- 🦊 Lis (traci króliki, mały pies chroni) i 🐺 Wilk (traci wszystko, duży pies chroni)
- Wymiana: jeden→wiele, wiele→jeden; zakaz wiele↔wiele
- Warunek wygranej: co najmniej 1 każdego zwierzęcia
- Tryb lokalny 1–6 graczy + AI
- Tryb sieciowy (Supabase Realtime + kod gry + QR code)

**Commit:** `1c85c55` — *feat: implement Animal Farm browser game*

---

### 2. `obsługuj git za mnie - po każdej zmianie opatruj ją komentarzem, commituj i wypychaj do repo`

Od tego momentu AI automatycznie:
- dodaje pliki (`git add`)
- tworzy opisowy commit z treścią po angielsku
- wypcycha do `origin/main` (`git push`)

**Commit:** `1c85c55` (retroaktywny commit całej gry)

---

### 3. `spraw by kostki były bardziej "prawdziwe" - żeby było widać w trakcie rzutu że zwierzaki się zmieniają`

AI dodało animację **slot-maszyny**:

- Kostki losowo przełączają emoji zwierząt przez 14 klatek
- Prędkość maleje (55ms → 310ms) — efekt "zwalniania"
- Podczas rzutu: jitter CSS + kolorowa poświata (różowa/żółta)
- Po wyniku: animacja "odbicia" (bounce)
- Przyciski zablokowane podczas animacji

**Commit:** `0a2c0c0` — *feat: animate dice roll with slot-machine effect*

---

### 4. `usuń te planszę "czas na turę"`

Usunięto ekran pośredni, który pojawiał się między turami w trybie lokalnym
wieloosobowym i prosił o przekazanie urządzenia. Gra teraz płynnie przechodzi
między graczami.

**Usunięto:** HTML overlay + CSS `.handoff-*` + funkcje JS `showHandoff` / `dismissHandoff`

**Commit:** `c64b6ab` — *feat: remove turn handoff screen*

---

### 5. `nie mogę wymieniać zwierząt, mimo, że mam je w inwentarzu, pojawia się komunikat, że brak`

**Bug:** W JavaScript `!0 === true` — gdy gracz kliknął `−` i wrócił do zera,
warunek `!trade.giving[a]` był `true` dla wartości `0` (nie tylko `undefined`),
przez co zwierzę znikało z listy wymiany mimo obecności w inwentarzu.

**Fix:** Przepisano `_buildTradeModal()` — zamiast `map().join() || fallback`
użyto jawnego `.filter(a => inv[a] > 0 || trade.giving[a] > 0)`.

**Commit:** `a5736a4` — *fix: trade modal not showing animals from inventory*

---

### 6. `krótsza animacja, a dla AI jeszcze krótsza (prawie niewidoczna)`

Dodano parametr `fast` do `animateDice()`:

| | Klatki | Czas animacji | Pauza | Łącznie |
|---|---|---|---|---|
| Gracz | 8 | ~930ms | 1800ms | ~2.7s |
| AI | 3 | ~150ms | 400ms | ~0.7s |

AI rzuca z `fast=true` — tylko mignięcie emoji.

**Commit:** `45be1cb` — *feat: shorten dice animation, AI rolls near-instantly*

---

### 7. `jeszcze o połowę szybsza`

Wszystkie interwały podzielone przez ~2:

| | Czas animacji | Pauza | Łącznie |
|---|---|---|---|
| Gracz | ~467ms | 900ms | ~1.6s |
| AI | ~75ms | 200ms | ~0.35s |

**Commit:** `0396d61` — *feat: halve animation - player ~0.7s, AI ~0.4s*

---

### 8. `proszę zapisz instrukcje dla mnie podłączenia do supabase w oddzielnym pliku, wskaż mi też gdzie mam wpisać adres i klucz do supabase`

Utworzono:
- `config.js` — plik konfiguracyjny z miejscem na `url` i `key`
- `SUPABASE.md` — instrukcja krok po kroku (po polsku): zakładanie projektu,
  SQL schema, gdzie znaleźć klucze, jak wkleić do `config.js`

`Net.init()` czyta teraz z `SUPABASE_CONFIG` (config.js) jako pierwsze źródło,
potem fallback do `localStorage` (ustawienia wpisane w UI).

**Commit:** `af62ece` — *docs: add Supabase setup guide and config.js*

---

### 9. `zmień kolory na bardziej niebieskie`

Zmieniono paletę kolorów z zielonej (motyw farmowy) na granatowo-niebieską:

| Element | Przed | Po |
|---|---|---|
| Tło | `#1b2e1b` (ciemna zieleń) | `#0d1b2e` (granat) |
| Powierzchnie | zielono-szare | `#132340` / `#1a2f52` |
| Tekst muted | `#8aaf8a` | `#7a9cc8` |
| Podświetlenia | zielone | niebieskie |

Złoty akcent (`#f4c430`) i pomarańczowy przycisk Roll zachowane.

**Commit:** `bfa00dc` — *style: change theme from green to deep blue*

---

### 10. `Utwórz plik readme.md w którym będzie adres do gry online: https://schoolhackday.github.io/animal-farm/, opis jak grać, czyli takie profesjonalne readme, powinien być też link do wstępnej specyfikacja.md i do historia-zmian.md, pamiętaj by trzymać wszystkie pliki aktualnymi`

Utworzono profesjonalne `README.md` z:
- Linkiem do gry online: [schoolhackday.github.io/animal-farm](https://schoolhackday.github.io/animal-farm/)
- Zasadami gry (cel, kostki, rozmnażanie, drapieżniki, wymiana)
- Tabelą puli zwierząt
- Opisem trybów gry (lokalny i sieciowy)
- Instrukcją uruchomienia lokalnego
- Strukturą projektu
- Tabelą linków do dokumentacji (`specyfikacja.md`, `SUPABASE.md`, `historia-zmian.md`)
- Informacją o vibe-codingu

`historia-zmian.md` zaktualizowany o tę komendę.

**Commit:** `61559da` → nowy — *docs: add README with game rules and online link*

---

## Wnioski dla uczniów

### Co pokazuje ten proces?

1. **Nie trzeba pisać kodu** — wystarczy opisać co chcesz zrobić
2. **Iteracja jest szybka** — każda zmiana to 1 zdanie, commit za kilka sekund
3. **Bugi też naprawia AI** — ale trzeba umieć je opisać ("brak zwierząt mimo że mam")
4. **Styl = jedno zdanie** — "zmień kolory na niebieskie" → kompletna zmiana palety
5. **Git działa automatycznie** — historia zmian jest zawsze spójna

### Czego AI nie zrobi za Ciebie?

- Nie wyczuje intencji której nie powiedziałeś
- Nie przetestuje gry zamiast Ciebie (to Ty musisz zagrać i zgłosić bug)
- Nie zdecyduje o UX — musisz mu powiedzieć co Ci się nie podoba
