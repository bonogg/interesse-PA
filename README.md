# Calcolatore interessi commerciali PA

Calcolatore web statico, client-side e privacy-preserving per stimare importi dovuti da una pubblica amministrazione in ritardo nel pagamento di una fattura commerciale:

- capitale residuo;
- interessi commerciali/moratori ex D.Lgs. 231/2002;
- interessi maturati fino alla data della domanda giudiziale;
- eventuale quota di anatocismo ex art. 1283 c.c.;
- forfait di recupero costi ex art. 6;
- eventuali maggiori costi provati;
- totale stimato dovuto;
- dettaglio del calcolo periodo per periodo.

## Privacy

Il tool non usa backend, database, form submission, API esterne, analytics, tracker, cookie, `localStorage` o `sessionStorage`.

Tutti i calcoli avvengono nel browser dell'utente. I file `rates.js` e `app.js` sono caricati localmente come asset statici.

Il box "Suggerisci una correzione" non salva dati nel sito: prepara una GitHub Issue pubblica con i campi compilati dall'utente e le label `feedback` e `needs-triage`.

## Uso

Apri `index.html` in un browser oppure pubblica il repository su GitHub Pages.

Campi principali:

- capitale dovuto;
- data di scadenza del pagamento;
- data finale del calcolo;
- pagamenti parziali opzionali;
- data della domanda giudiziale opzionale;
- forfait recupero costi opzionale;
- maggiori costi provati opzionali.

Le date vanno inserite nel formato italiano `gg/mm/aaaa`, ad esempio `16/06/2026`.

## Ipotesi di calcolo

- Gli interessi commerciali sono calcolati come interessi semplici.
- La mora decorre dal giorno successivo alla scadenza.
- Il credito deve derivare da una transazione commerciale: beni o servizi contro prezzo tra impresa/professionista e pubblica amministrazione.
- La scadenza deve essere inserita dall'utente: di regola 30 giorni, oppure 60 giorni solo nei casi ammessi e giustificati.
- La data iniziale del conteggio è inclusa; la data finale è esclusa.
- La convenzione è giorni effettivi / 365.
- I pagamenti parziali sono imputati prima agli interessi maturati e poi al capitale.
- L'anatocismo viene calcolato solo se è indicata una data di domanda giudiziale.
- L'anatocismo viene calcolato solo sugli interessi moratori residui già maturati da almeno sei mesi alla data della domanda giudiziale.
- Il tasso dell'anatocismo è il tasso moratorio semestrale applicabile periodo per periodo.
- L'anatocismo non viene ulteriormente capitalizzato.
- Il forfait di 40 euro e gli eventuali maggiori costi provati sono inclusi nel totale solo se indicati dall'utente.

Questo è uno strumento di stima e non costituisce consulenza legale.

## Tassi

Le tabelle dei tassi commerciali e dei tassi legali sono in `rates.js`.

Ogni riga contiene:

- `dataInizio`;
- `dataFine`;
- `tassoRiferimento`;
- `maggiorazione`;
- `tassoAnnuo`;
- `fonteLabel`;
- `fonteUrl`.

I tassi commerciali sono coperti dal `01/01/2019` al `30/06/2026`. I tassi legali sono coperti dal `21/04/1942` al `31/12/2026`.

Le tabelle devono essere verificate e mantenute aggiornate rispetto alle comunicazioni ufficiali MEF/Gazzetta Ufficiale. Le fonti normative principali da controllare sono:

- D.Lgs. 231/2002 su Normattiva;
- comunicati MEF/Gazzetta Ufficiale sui tassi semestrali;
- decreti MEF/Gazzetta Ufficiale sul saggio annuale degli interessi legali;
- art. 1283 c.c. per la valutazione dell'anatocismo.
- art. 6 D.Lgs. 231/2002 per forfait e maggiori costi di recupero.

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
