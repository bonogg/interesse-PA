# Calcolatore interessi commerciali PA

Calcolatore web statico, client-side e privacy-preserving per stimare:

- capitale residuo;
- interessi commerciali/moratori ex D.Lgs. 231/2002;
- interessi maturati fino alla data della domanda giudiziale;
- eventuale quota di anatocismo ex art. 1283 c.c.;
- totale stimato dovuto;
- dettaglio del calcolo periodo per periodo.

## Privacy

Il tool non usa backend, database, form submission, API esterne, analytics, tracker, cookie, `localStorage` o `sessionStorage`.

Tutti i calcoli avvengono nel browser dell'utente. I file `rates.js` e `app.js` sono caricati localmente come asset statici.

## Uso

Apri `index.html` in un browser oppure pubblica il repository su GitHub Pages.

Campi principali:

- capitale dovuto;
- data di scadenza del pagamento;
- data finale del calcolo;
- pagamenti parziali opzionali;
- data della domanda giudiziale opzionale;
- tasso anatocismo: commerciale/moratorio, legale o personalizzato.

## Ipotesi di calcolo

- Gli interessi commerciali sono calcolati come interessi semplici.
- La mora decorre dal giorno successivo alla scadenza.
- La data iniziale del conteggio e inclusa; la data finale e esclusa.
- La convenzione e giorni effettivi / 365.
- I pagamenti parziali sono imputati prima agli interessi maturati e poi al capitale.
- L'anatocismo viene calcolato solo se e indicata una data di domanda giudiziale.
- L'anatocismo viene calcolato sugli interessi residui gia maturati alla data della domanda giudiziale.
- L'anatocismo non viene ulteriormente capitalizzato.

Questo e uno strumento di stima e non costituisce consulenza legale.

## Tassi

La tabella dei tassi commerciali e in `rates.js`.

Ogni riga contiene:

- `dataInizio`;
- `dataFine`;
- `tassoRiferimento`;
- `maggiorazione`;
- `tassoAnnuo`;
- `fonteLabel`;
- `fonteUrl`.

La tabella deve essere verificata e mantenuta aggiornata rispetto alle comunicazioni ufficiali MEF/Gazzetta Ufficiale. Le fonti normative principali da controllare sono:

- D.Lgs. 231/2002 su Normattiva;
- comunicati MEF/Gazzetta Ufficiale sui tassi semestrali;
- art. 1283 c.c. per la valutazione dell'anatocismo.

## Test

Esegui:

```bash
node tests/calculation-tests.js
```

I test non richiedono dipendenze esterne.

## File

- `index.html`: interfaccia statica;
- `styles.css`: stile responsive;
- `app.js`: funzioni pure e wiring UI;
- `rates.js`: tabelle statiche dei tassi;
- `tests/calculation-tests.js`: test della logica di calcolo;
- `LICENSE`: licenza MIT.
