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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'game_sessions'
      AND policyname = 'game_sessions_allow_all'
  ) THEN
    CREATE POLICY "game_sessions_allow_all" ON game_sessions
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'game_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS app_stats (
  key TEXT PRIMARY KEY,
  value BIGINT NOT NULL DEFAULT 0 CHECK (value >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_stats (key, value)
VALUES ('games_played', 0)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE app_stats ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'app_stats'
      AND policyname = 'app_stats_allow_all'
  ) THEN
    CREATE POLICY "app_stats_allow_all" ON app_stats
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION increment_games_played()
RETURNS BIGINT
LANGUAGE SQL
AS $$
  UPDATE app_stats
  SET value = value + 1,
      updated_at = NOW()
  WHERE key = 'games_played'
  RETURNING value;
$$;
```

To tworzy:

- `game_sessions` — stan aktywnych gier sieciowych
- `app_stats` — globalny licznik ukończonych partii
- `increment_games_played()` — atomowe zwiększanie licznika po końcu gry

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

Po zakończeniu partii frontend wywołuje `increment_games_played()`, więc licznik na ekranie startowym pokazuje sumę gier rozegranych przez wszystkich użytkowników korzystających z tego samego projektu Supabase.

---

## Rozwiązywanie problemów

| Problem | Rozwiązanie |
|---|---|
| „Nie znaleziono gry" | Sprawdź czy kod jest poprawny (wielkość liter nie ma znaczenia) |
| Błąd tworzenia gry | Sprawdź URL i klucz w `config.js` |
| Licznik gier pokazuje „—" | Upewnij się, że wykonałeś cały SQL z kroku 2 (`app_stats` + `increment_games_played`) |
| Gracze nie widzą ruchów | Upewnij się że Realtime jest włączony (krok 2) |
| Błąd 401 / 403 | Użyj klucza **anon/public**, nie **service_role** |
