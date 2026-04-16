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

**Commit:** `5ae5b0a` — *docs: add README with game rules and online link*

---

### 11. `Utwórz plik historia-zmian.md i zapisuj moje kolejne komendy, tak, by uczniowie mogli prześledzić mój proces vibe-codingu`

Utworzono ten właśnie plik 📄 — dokumentuje cały przebieg sesji:
- Każdą komendę dokładnie tak jak została wypowiedziana
- Co AI zrobiło w odpowiedzi (z detalami technicznymi)
- Numer commita do każdej zmiany
- Szczegółowy opis znalezionego buga (#5) jako przykład debugowania
- Sekcję z wnioskami dydaktycznymi dla uczniów

**Commit:** `61559da` — *docs: add vibe-coding change history for students*

---

### 11. `log zdarzeń zmieńmy na "Przebieg gry", niech każde zdarzenie będzie w jednej linijce i jak najmniej tekstu, typu "Pati +1 (ikonka króliczka)" "Mariusz +1 (ikonka owcy)" itp.`

Zmieniono sekcję logów:
- Nagłówek: `📋 Log zdarzeń` → `🎮 Przebieg gry`
- Każde zdarzenie w jednej linii, tylko imię + liczba + emoji
- Format wpisów: `Pati +2🐰`, `Mariusz 🦊 -3🐰`, `Ania 💱 2🐑→1🐷`, `▶ Pati`
- Separatory tur (`--- Tura: X ---`) zastąpione przez `▶ X`
- Drapieżniki: `🦊 Pati -3🐰`, `🐺 Mariusz -2🐑 -1🐷`
- CSS: mniejsza czcionka, brak zawijania tekstu

**Commit:** → nowy — *ui: compact game log "Przebieg gry" with per-event one-liners*

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

---

### 12. `Utwórz plik readme.md w którym będzie adres do gry online, opis jak grać, profesjonalne readme, link do specyfikacja.md i historia-zmian.md, pamiętaj by trzymać wszystkie pliki aktualnymi`

Utworzono profesjonalne `README.md` z:
- Linkiem do gry online: [schoolhackday.github.io/animal-farm](https://schoolhackday.github.io/animal-farm/)
- Pełnymi zasadami gry (cel, kostki, rozmnażanie, drapieżniki, przeliczniki wymiany)
- Tabelami: kostki K12, pula zwierząt, drapieżniki
- Opisem trybów gry (lokalny i sieciowy)
- Instrukcją uruchomienia lokalnego (`git clone` + `npx serve`)
- Strukturą projektu z opisem każdego pliku
- Tabelą linków do dokumentacji (`specyfikacja.md`, `SUPABASE.md`, `historia-zmian.md`)
- Sekcją o vibe-codingu jako metodzie tworzenia gry

**Commit:** `5ae5b0a` — *docs: add README with game rules and online link*


---

### 13. `kilka drobiazgów w UI - pod kostkami nie musi być napisów co wypadło: same ikonki są OK, Ikona na guziku "wymiana" jest za ciemna, powinna być jaśniejsza i przypominać sklep`

- Napisy pod kostkami ukryte (kontener zostaje dla logiki JS, tekst niewidoczny)
- Przycisk wymiany: ikona `💱` → `🛒`, kolor `#6a3fa0` (fiolet) → `#3a7bd5` (jasny niebieski)

**Commit:** → nowy — *ui: hide dice text labels, trade button shop icon + lighter color*

---

### 14. `przy tworzeniu gry sieciowej kod losuje się 2 razy, ikona wymiany: nie koszyk, tylko sklep`

- Naprawiono podwójne wywołanie `Net.createGame()` przez szybkie/podwójne kliknięcie: przycisk blokuje się natychmiast przy pierwszym kliknięciu
- Ikona wymiany: `🛒` (koszyk) → `🏪` (sklep)

**Commit:** → nowy — *fix: prevent double game code generation; trade icon shop*

---

### 15. `w logu nadal jest za dużo, powinna w danej rundzie być tylko jedna linia (lub 2 jeśli gracz coś wymieniał), ikona wymiany wszędzie taka sama = sklep, ale inna - obecna jest nieładna`

- Log skondensowany: **jedna linia na turę** (np. `Pati 🐰+🐑 +2🐰`) lub dwie jeśli była wymiana
- `handleFox`, `handleWolf`, `applyBreeding` teraz zwracają string zamiast logować
- `_processRoll` skleja całość w jedną linię
- Usunięto separatory `▶ Name` – redundantne przy nowym formacie
- Ikona wymiany: `🏪` → `🛍️` (torby zakupowe) — wszędzie jednolicie (przycisk, modal, log, badge fazy)

**Commit:** → nowy — *ui: single log line per turn; unified shop icon 🛍️*

---

### 16. `zapisuj w local storage dla gry lokalnej: poprzedni wybór imion dla graczy, oraz to czy są AI czy nie`

- Przy starcie gry (`startLocalGame`) zapisuje do `localStorage['localSetup']` tablicę `{name, ai}` dla każdego gracza
- Przy otwarciu ekranu ustawień (`showLocalSetup`) odczytuje i przywraca: liczbę graczy, imiona, przyciski AI/Człowiek
- Przy zmianie liczby graczy (dropdown) zachowuje istniejące wartości z formularza dla wierszy które zostają

**Commit:** → nowy — *feat: persist local game player setup in localStorage*

---

### 17. `mała poprawka CSS - po rzucie pod kośćmi pojawia się dodatkowa linia i ekran skacze, to samo na mniejszym ekranie`

- `dice-labels` zmienione z `display:none` (`.hidden`) na `visibility:hidden` z `min-height:1.1rem` — przestrzeń zawsze zarezerwowana, brak skoku layoutu
- Usunięto całe togglowanie widoczności etykiet z JS — napisy i tak nie są potrzebne (ikonki na kostkach wystarczą)

**Commit:** `381b2bd` — *fix: reserve dice-labels space to prevent layout shift on roll*

---

### 18. `zamknąłem poprzednią grę sieciową, teraz przy próbie utworzenia nowej gry wisi na ekranie tworzenia gry`

- Przycisk "Utwórz grę" był trwale zablokowany po pierwszym użyciu (guard anty-double-click nigdy go nie odblokowywał)
- `showNetworkCreate()` teraz zawsze resetuje stan przycisku i ukrywa stare lobby z poprzedniej sesji

**Commit:** `cf6bed9` — *fix: re-enable create game button when returning to network create screen*

---

### 19. `wymiana nie działa`

- `sed -i` zastosowany wcześniej do naprawy `dice-labels` przez pomyłkę zamienił **wszystkie** `classList.remove('hidden')` w pliku — modal wymiany, modal Supabase i panel lobby przestały działać
- Przywrócono poprawne togglowanie `.hidden` dla wszystkich modali i paneli

**Commit:** `dddcbd0` — *fix: restore hidden/visible class toggling broken by overzealous sed replace*

---

### 20. `2 bugi w grze sieciowej: nie działa guzik utwórz grę, dołączając do gry dołącza się podwójnie`

*(bug w trakcie badania — zgłoszone, wymaga dalszej pracy)*

---

### 21. `AI powinno rzucać od razu, obecnie wyświetlają się 2 emblematy kostek i on chwilkę czeka`

- Wszystkie opóźnienia tury AI ustawione na `0ms`: start tury, wywołanie `aiTurn`, wywołanie `roll`

**Commit:** `ebe018b` — *fix: AI rolls immediately, no delay before turn*

---

### 22. `ważna zmiana - można mieć tylko jednego małego psa i jednego dużego, linia z ikonami wszystkich zwierząt pod inventory jest niepotrzebna`

- `validateTrade`: blokuje wymianę jeśli gracz już ma psa danego rodzaju (`Można mieć tylko 1 Mały pies!`)
- Usunięto `win-progress` (rząd ikon 🐰🐑🐷🐄🐴) z kart graczy

**Commit:** `4136351` — *feat: cap dogs at 1 each; remove win-progress icon row from player cards*

---

### 23. `można w GUI rozróżnić to, że psy są pojedyncze - świecą się jeśli gracz ma psa, wygaszone jeśli nie ma`

- Psy (`🐕` `🦮`) renderują się jako emoji-badge bez licznika
- **Ma psa**: podświetlony kafelek z niebieską poświatą
- **Nie ma psa**: wyszarzony/przezroczysty
- Pozostałe zwierzęta bez zmian (emoji + liczba)

**Commit:** `e819b9a` — *ui: dogs shown as lit/dimmed badge without counter in inventory*

---

### 24. `po rzucie jest jakaś niepotrzebna przerwa`

- Opóźnienie po rzucie dla gracza-człowieka: `900ms` → `0ms`

**Commit:** → nowy — *fix: remove 900ms post-roll pause for human player*

---

### 25. `może dajmy to czekanie po rzucie, ale nie 900ms tylko 200ms, druga rzecz - podczas wymiany pokazuj tylko zwierzęta, które są możliwe`

- Przerwa po rzucie przywrócona: `0ms` → `200ms` (dla człowieka i AI)
- Modal wymiany — „Dostajesz": filtr pokazuje tylko zwierzęta:
  - dostępne w puli
  - o wartości ≤ łączna wartość inwentarza gracza (nie możesz kupić krowy mając 2 króliki)
  - psy: ukryte jeśli gracz już ma

**Commit:** → nowy — *fix: 200ms post-roll pause; smart trade receive filter*

---

### 26. `bug: gra sieciowa, dołączając do gry można dołączyć kilka razy`

- Guard na przycisk „Dołącz do gry" — wyłącza się po pierwszym kliknięciu (zapobiega race condition)
- Walidacja po stronie stanu gry — blokuje dołączenie jeśli gracz o tym samym imieniu już istnieje

**Commit:** → *fix: prevent double-join in network game*

---

### 27. `fix mechaniki: mały pies chroni przed lisem ale tracimy psa, duży podobnie z wilkiem`

- `handleFox`: jeśli gracz ma małego psa → pies odgania lisa, ale sam zostaje stracony (wraca do puli)
- `handleWolf`: jeśli gracz ma dużego psa → pies odgania wilka, ale sam zostaje stracony (wraca do puli)
- Log pokazuje: `🦊🐕odgonił→stracony` / `🐺🦮odgonił→stracony`

**Commit:** → *fix: dog protects but is lost after predator attack*

---

### 28. `ai powinno rozmieniać też zwierzęta` + `komputer nie docenia psów`

- AI zyskało 3 strategie wymiany:
  1. **Kup w górę** — zamień tańsze za brakujące droższe zwierzę (stara strategia)
  2. **Kup psa** — kup małego psa gdy majątek ≥18🐰, dużego gdy ≥72🐰 (nowa)
  3. **Rozmień w dół** — mając ≥2 drogich zamień 1 na brakujące tańsze (nowa)
- AI nie sprzedaje psów żeby kupić inne zwierzęta

**Commit:** → *feat: smarter AI trading - trade down + dog buying*

---

### 29. `poprawki mobile: pula niżej, blokada zoom, mniejsza pula`

- Pula przeniesiona poniżej kart graczy (na mobile gracze → kostki/przyciski → pula)
- Desktop: CSS grid-template-areas (action | players / pool | players)
- Blokada double-tap zoom: `maximum-scale=1.0, user-scalable=no` w viewport
- `touch-action: manipulation` na przyciskach, t-btn, inv-item, pool-item
- Pula mniejsza: padding, font-size, gap zmniejszone

**Commit:** → *fix: mobile layout - pool below players, no zoom, compact pool*

---

### 30. `przerwa po rzucie 200ms -> 400ms -> 500ms`

- Kilkukrotna korekta przerwy po rzucie dla gracza i AI
- Ostateczna wartość: **500ms** dla wszystkich (gracz i AI)

**Commit:** dae759c, 66afc63

---

### 31. `przycisk wymiany aktywny tylko jeśli możemy coś wymienić`

- Nowa funkcja `canTrade(player)` — sprawdza czy wartość inwentarza gracza ≥ wartość najtańszego dostępnego zwierzęcia w puli
- Przycisk 🛍️ Wymiana wyszarzony gdy brak możliwej wymiany

**Commit:** f50eacb

---

### 32. `gracz nieaktywny — wyciemniony`

- Nieaktywne karty graczy: `opacity: 0.45`, `filter: saturate(0.3)`
- Aktywny gracz: pełne kolory + podświetlona ramka
- Płynne przejście CSS

**Commit:** 56830af

---

### 33. `poprawki mobile — pula kompaktowa, flex-wrap`

- Pool items: grid 2-kolumnowy → `display:flex; flex-wrap:wrap` — więcej niż 2 w linii
- Każdy kafelek dopasowany szerokością do zawartości (`white-space: nowrap`)

**Commit:** 8a32721

---

### 34. `mobile: 25% mniejsze kości + mniej miejsca pod nimi`

- Kości na mobile: 80px → 60px, font 2.6rem → 1.9rem
- Mniejszy padding dice-area i dice-labels

**Commit:** 27a6879

---

### 35. `pula nad przebiegiem gry — pełna szerokość`

- Pool-box przeniesiony z game-main do game-layout (po graczy, przed logiem)
- Desktop: pula na pełną szerokość tak jak log
- Mobile: kolejność w DOM: gracze → kostki → pula → log (bez order CSS)
- game-layout: dodano `gap: .6rem`

**Commit:** b40c459, 4266f90

---

### 36. `mobilny log gry przestał być widoczny`

- `game-main` na mobile: `flex: none` — nie rozpycha się na całą wysokość
- `game-log` na mobile: `max-height: 130px`

**Commit:** 4265ae4

---

### 37. `przycisk zakończenia gry w nagłówku`

- Ikona ⏻ po prawej stronie paska statusu
- Pyta o potwierdzenie przed wyjściem
- Odłącza Supabase channel jeśli tryb sieciowy, wraca do ekranu głównego

**Commit:** 86e0076

---

### 38. `psy w linii z imieniem gracza`

- Znaczki 🐕🦮 przeniesione z inventory grid do linii nagłówka (obok imienia i AI badge)
- Świecą gdy gracz posiada psa, wyszarzone gdy brak
- Inventory grid o 2 kafelki węższy — mniej zawijania na mobile

**Commit:** a790b17

---

### 39. `dodaj .gitignore w którym zignorujesz .DS_Store`

- Dodano `.gitignore` z wpisem `.DS_Store`
- Usunięto już śledzony plik `.DS_Store` z repozytorium (`git rm --cached`)

**Commit:** b54e873

---

### 40. `Drobny fix gry sieciowej — ?join= zostaje w URL`

- Po odczytaniu parametru `?join=CODE` z URL, natychmiast czyszczony przez `history.replaceState(null, '', location.pathname)`
- Zapobiega konfliktowi gdy użytkownik wraca do menu i próbuje utworzyć nową grę

**Commit:** fc10ba3

---

### 41. `Usuwamy konfigurację Supabase z UI + link do skopiowania pod QR`

- Usunięto przycisk „⚙️ Konfiguracja Supabase" z ekranu wyboru trybu sieciowego
- Usunięto cały modal konfiguracji Supabase i powiązane funkcje JS
- Pod kodem QR w lobby dodano link do gry z przyciskiem 📋 Kopiuj link

**Commit:** cb1faa1

---

### 42. `Ekrany utwórz grę i dołącz do gry — wyśrodkowane`

- Oba ekrany sieciowe używają `.center-box` zamiast `.screen-inner`
- Wyśrodkowanie w pionie i poziomie, max-width 480px dla formularzy

**Commit:** 5af33b0

---

### 43. `Aktualizacja historia-zmian.md + wymagania niefunkcjonalne`

- Dopisano brakujące wpisy 39–43 w `historia-zmian.md`
- Do `specyfikacja.md` dodano sekcję „Wymagania niefunkcjonalne — proces vibe-codingu" z wymogiem aktualizacji dziennika po każdej zmianie

**Commit:** → bieżący

---

### 44. `bugi UI: logo niewyśrodkowane, ekran lokalny nie centrowany, lobby — ukryj utwórz/pokaż start, usuń licznik graczy`

- `center-box`: dodano `h1` i `.logo` do listy elementów wyśrodkowanych (tekst był left-aligned)
- Ekran „Gra Lokalna": zmieniono `.screen-inner` → `.center-box` (centrowanie góra/dół)
- Lobby sieciowe: po kliknięciu „Utwórz grę" przycisk znika, pojawia się „▶ Start gry" nad listą graczy
- Usunięto napis „X gracz(y) w lobby" (był redundantny)
- Naprawiono selektor przycisku w `createGame()` i `showNetworkCreate()` → używa `#btn-create-game`

**Commit:** → bieżący

---

### 45. `lobby: start wyżej, kopiuj link obok QR, bez treści linku`

- Przycisk „▶ Start gry" przeniesiony na sam góry lobby-panel (pod polem imienia)
- Przycisk „📋 Kopiuj link" umieszczony obok kodu QR w jednym rzędzie
- Usunięto wyświetlanie treści URL (`lobby-link-text`) — link przechowywany w `data-url`

**Commit:** → bieżący

---

### 46. `lobby: QR w bąbelku, "Gracze w lobby" styl field-label, wyrównane marginesy`

- QR kod i przycisk "Kopiuj link" owinięte w card-box (niebieski bąbelek)
- Nagłówek "Gracze w lobby:" używa `field-label` (jak "TWOJE IMIĘ:")
- `#lobby-panel` używa `gap: .75rem` zamiast rozrzuconych `margin-top`

**Commit:** → bieżący

---

### 47. `Dodajemy wymaganie dotyczące licznika rozegranych gier (przez wszystkich użytkowników). Backend - supabase. Wyświetlanie: ekran startowy pod guzikami. Pamiętaj o zaktualizowaniu dokumetacji, historii i obsłudze git.`

- Na ekranie startowym pod przyciskami dodano kartę z globalnym licznikiem ukończonych partii
- Frontend pobiera licznik z Supabase (`app_stats.games_played`) i odświeża go przy wejściu do menu
- Po zakończeniu gry aplikacja wywołuje funkcję `increment_games_played()`, więc licznik rośnie dla wszystkich użytkowników tego samego projektu
- Rozszerzono schemat Supabase o tabelę `app_stats` i funkcję RPC do atomowego zwiększania licznika
- Zaktualizowano `README.md`, `SUPABASE.md` i `specyfikacja.md`

**Commit:** → bieżący
