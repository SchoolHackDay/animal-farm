# 🌐 Podłączenie Supabase do Animal Farm

Tryb sieciowy wymaga własnego projektu Supabase (darmowy plan w zupełności wystarczy).

---

## Krok 1 — Załóż projekt Supabase

1. Wejdź na [https://supabase.com](https://supabase.com) i zaloguj się.
2. Kliknij **"New project"**.
3. Podaj nazwę projektu (np. `animal-farm`), hasło do bazy i wybierz region.
4. Poczekaj ~2 minuty na uruchomienie projektu.

---

## Krok 2 — Utwórz tabelę w bazie danych

1. W menu po lewej kliknij **"SQL Editor"**.
2. Kliknij **"New query"**.
3. Wklej poniższy kod i kliknij **"Run"**:

```sql
CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  state JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON game_sessions
  FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
```

---

## Krok 3 — Znajdź URL i klucz API

1. W menu po lewej kliknij **"Project Settings"** (ikona zębatki na dole).
2. Przejdź do zakładki **"API"**.
3. Skopiuj:
   - **Project URL** — wygląda tak: `https://abcdefghijkl.supabase.co`
   - **anon / public key** — długi ciąg zaczynający się od `eyJ...`

---

## Krok 4 — Wpisz dane w pliku `config.js`

Otwórz plik **`config.js`** (w katalogu gry) i wklej skopiowane wartości:

```js
const SUPABASE_CONFIG = {
  url: 'https://TWOJ-PROJEKT.supabase.co',   // ← tutaj
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'  // ← tutaj
};
```

Zapisz plik. Gotowe — tryb sieciowy jest teraz aktywny.

---

## Alternatywa — przez UI w grze

Zamiast edytować `config.js`, możesz też wpisać dane bezpośrednio w grze:

1. Na ekranie **"Gra Sieciowa"** kliknij przycisk **⚙️ Konfiguracja Supabase**.
2. Wklej URL i klucz, kliknij **💾 Zapisz**.
3. Dane są zapisywane w `localStorage` przeglądarki (tylko na tym urządzeniu).

> **Uwaga:** metoda przez `config.js` działa na wszystkich urządzeniach bez konfiguracji.  
> Metoda przez UI wymaga ręcznego wpisania na każdym urządzeniu.

---

## Jak działa tryb sieciowy?

```
Gracz A (Utwórz grę)
  → zapisuje stan gry w Supabase
  → wyświetla kod gry + QR code

Gracz B (Dołącz przez kod lub QR)
  → dołącza do gry w Supabase
  → subskrybuje zmiany (Realtime)

Każdy ruch → aktualizuje stan w Supabase → pozostali gracze
  otrzymują powiadomienie w czasie rzeczywistym
```

---

## Rozwiązywanie problemów

| Problem | Rozwiązanie |
|---|---|
| „Nie znaleziono gry" | Sprawdź czy kod jest poprawny (wielkość liter nie ma znaczenia) |
| Błąd tworzenia gry | Sprawdź URL i klucz w `config.js` |
| Gracze nie widzą ruchów | Upewnij się że Realtime jest włączony (krok 2) |
| Błąd 401 / 403 | Użyj klucza **anon/public**, nie **service_role** |
