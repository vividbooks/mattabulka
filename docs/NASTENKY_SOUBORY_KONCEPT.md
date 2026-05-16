# Koncept: nástěnky jako soubory (uložit / nový / otevřít)

## 1. Výchozí stav v aplikaci

- **Plátno** (`FreeformBoard`): objekty na nástěnce a viewport (pan/zoom) jsou v paměti; **undo/redo** drží lokální historii snímků (`Snapshot`: `objects`).
- **Úkol** (aritmetika / domino / řada): nastavení generování jde sdílet přes **`#task=…`** v URL (`encodeAssignmentToUrlPayload` / `decodeAssignmentFromUrlPayload` v `taskAssignments.ts`).
- **Jiné preference**: např. styl matematických glyphů (`localStorage`), pozice knihovny.

→ Uživatel zatím **nemá jeden „projekt“**, který by šel pojmenovat, uložit na disk a znovu otevřít včetně všeho na plátně.

---

## 2. Co je „soubor nástěnky“

Jeden logický dokument = **jedna souborová položka** (textový JSON nebo ZIP), která obsahuje:

| Část | Popis |
|------|--------|
| **Metadata** | Název zobrazený v UI, volitelně `createdAt` / `modifiedAt`, verze formátu (`formatVersion`). |
| **Viewport** | `x`, `y`, `scale` — stejné jako `Viewport` v `FreeformBoard`. |
| **Objekty** | Pole `BoardObject` — **stejná data** jako ve `Snapshot.objects` po serializovatelné úpravě (viz body níže). |
| **Úkol (volitelně)** | Buď celý `TaskAssignmentSettings`, nebo jen odkaz: „aktuální hash z URL“ pro reprodukovatelnost. |
| **UI preference (volitelně)** | Např. `libraryDock` pro konzistenci mezi zařízeními. |

### Doporučený formát souboru

- **Primárně**: jeden soubor **`*.mnboard`** (nebo `.json` s jasným MIME), UTF-8 JSON.
- **Přípona** odděluje nástěnku od obecného JSONu a umožní asociaci s aplikací později (PWA / „Open with“).

### Serializace objektů

- Typy jako tahy, obrázky (často **data URL** nebo blob URL), build dlaždice, stroje, příklady — musí mít **stabilní schema** s polem `v` nebo `type` + verze dokumentu.
- **Externí URL** (stickery ze Supabase) lze ukládat jako reference; **uživatelské uploady** jako `data:` nebo do přílohy ZIP ve druhé fázi.

### Příklad tvaru (concept-level)

```json
{
  "formatVersion": 1,
  "title": "Hodina 3 — zlomky",
  "modifiedAt": "2026-05-12T10:00:00.000Z",
  "viewport": { "x": 0, "y": 0, "scale": 1 },
  "objects": [],
  "task": null,
  "ui": { "libraryDock": "bottom" }
}
```

Konkrétní typy `objects[]` se stanoví při implementaci podle skutečných TypeScript typů v kódu (včetně migrace při změně modelu).

---

## 3. Akce v UI (koncept chování)

| Akce | Chování |
|------|---------|
| **Nový** | Pokud jsou neuložené změny → dialog „Uložit změny?“. Pak prázdná nástěnka (výchozí viewport + prázdné `objects`), nový dokument bez cesty k souboru. |
| **Otevřít…** | Výběr souboru (see §4). Načtení, validace verze, nahrazení stavu plátna (+ volitelně úkolu). Historie undo lze resetovat nebo zredukovat na jeden snímek po načtení. |
| **Uložit** | Pokud dokument už má přiřazený soubor (File System Access handle nebo známá cesta) → přepsat. Jinak stejné jako **Uložit jako…**. |
| **Uložit jako…** | Uživatel vybere místo a jméno; uloží se JSON. Aplikace si zapamatuje handle pro další **Uložit**. |
| **Neuložené změny** | Indikace v záhlaví (např. tečka nebo „Bez názvu •“); při zavření záložky `beforeunload` pokud je „dirty“. |

Zkratky podle platformy: **Cmd/Ctrl+S** = Uložit, **Cmd/Ctrl+O** = Otevřít, **Cmd/Ctrl+N** = Nový (volitelně).

---

## 4. Kam se soubor ukládá (technologie)

| Varianta | Výhody | Nevýhody |
|----------|--------|----------|
| **Stažení blobu** (`<a download>`) | Funguje všude. | Každé „Uložit“ bere nový soubor, nepřepisuje bez File System Access API. |
| **File System Access API** (`showSaveFilePicker` / `showOpenFilePicker`, WritableStream) | Přirozené **Uložit** na stejné místo v Chrome/Edge. | Nutný fallback; na Safari omezenější. |
| **IndexedDB / OPFS** (cache posledního souboru) | Rychlé obnovení relace. | Není náhrada za uživatelský soubor na disku; spíš doplněk. |

**Doporučení pro 1. fázi**: JSON download + import file input; **2. fáze**: File System Access pro přepis stejného souboru kde to prohlížeč dovolí.

---

## 5. Verze formátu a migrace

- Při každém rozšíření modelu objektů zvednout **`formatVersion`** a v kódu držet funkci **`migrateBoardDocument(raw, fromVersion)`**.
- Neúspěšná migrace → hláška uživateli + možnost otevřít v „ nouzovém “ režimu jen metadata (nebo export starých dat).

---

## 6. Bezpečnost a limity

- JSON z nedůvěryhodného zdroje: **strict validace** struktury, limity velikosti (např. max počet objektů / délka řetězců), nepouštět `eval`.
- Velké obrázky v `data:` — upozornění na velikost souboru; volitelně komprese nebo ZIP s oddělenými binárními částmi ve v2.

---

## 7. Implementační kroky (návrh)

1. **Export/import JSON** z jednoho místa v kódu: `serializeBoardState()` / `parseBoardDocument()` + testy na kulatý trip.
2. **Menu nebo panel**: Nový, Otevřít, Uložit, Uložit jako + stav „dirty“.
3. **Integrace úkolu**: uložit/načíst `TaskAssignmentSettings` vedle objektů nebo synchronizovat s `#task` při načtení.
4. **File System Access** jako vylepšení při dostupnosti API.
5. (Volitelně) **Seznam posledních souborů** jen v rámci relace nebo indexované cache — ne jako náhrada souboru na disku.

---

## 8. Shrnutí

Nástěnka jako soubor = **verzovaný JSON dokument** s viewportem, objekty a volitelně úlohou a drobnými UI nastaveními. Uživatelské akce **Nový / Otevřít / Uložit / Uložit jako** kopírují očekávání z desktopových aplikací; technicky začít stažením a výběrem souboru, později doplnit přímý zápis na disk tam, kde to API umožní.
