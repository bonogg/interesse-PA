(function initCalculator(global) {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const DEFAULT_ASSUMPTIONS = [
    "Questo è uno strumento di stima, non una consulenza legale.",
    "Il calcolo riguarda pagamenti dovuti da una pubblica amministrazione al creditore di una fattura commerciale.",
    "Il credito deve derivare da una transazione commerciale: beni o servizi contro prezzo tra impresa/professionista e pubblica amministrazione.",
    "Gli interessi moratori ex D.Lgs. 231/2002 sono calcolati come interessi semplici.",
    "La scadenza deve essere inserita dall'utente: di regola 30 giorni, oppure 60 giorni solo nei casi ammessi e giustificati.",
    "La tabella dei tassi deve essere verificata e mantenuta aggiornata.",
    "L'anatocismo viene calcolato solo se è indicata una data di domanda giudiziale.",
    "L'anatocismo viene calcolato solo sugli interessi moratori residui già maturati da almeno sei mesi alla data della domanda giudiziale.",
    "Nessuna capitalizzazione viene applicata agli interessi anatocistici.",
    "Il forfait di 40 euro ex art. 6 e gli eventuali maggiori costi provati sono inclusi solo se indicati dall'utente.",
    "Il calcolo usa la convenzione giorni effettivi / 365.",
    "I pagamenti parziali sono imputati prima agli interessi maturati e poi al capitale.",
    "L'utente deve verificare termini speciali, eccezioni settoriali e applicabilità concreta del D.Lgs. 231/2002."
  ];
  function roundMoney(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  function parseImportoEuro(value) {
    if (typeof value === "number") {
      if (!Number.isFinite(value) || value < 0) throw new Error("Importo non valido");
      return value;
    }

    const raw = String(value ?? "")
      .trim()
      .replace(/\s/g, "")
      .replace(/€/g, "");

    if (!raw || raw.startsWith("-")) throw new Error("Importo non valido");
    if (!/^[0-9.,]+$/.test(raw)) throw new Error("Importo non valido");

    const lastComma = raw.lastIndexOf(",");
    const lastDot = raw.lastIndexOf(".");
    let normalized = raw;

    if (lastComma > -1 && lastDot > -1) {
      const decimalSeparator = lastComma > lastDot ? "," : ".";
      const thousandsSeparator = decimalSeparator === "," ? "." : ",";
      normalized = raw.split(thousandsSeparator).join("").replace(decimalSeparator, ".");
    } else if (lastComma > -1) {
      normalized = raw.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = raw.replace(/,/g, "");
    }

    if (!/^\d+(\.\d+)?$/.test(normalized)) throw new Error("Importo non valido");
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed) || parsed < 0) throw new Error("Importo non valido");
    return parsed;
  }

  function parseDateISO(value, fieldLabel = "Data") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
      throw new Error(`${fieldLabel}: inserisci una data valida nel formato gg/mm/aaaa`);
    }
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      throw new Error(`${fieldLabel}: inserisci una data valida nel formato gg/mm/aaaa`);
    }
    return date;
  }

  function parseDateInput(value, fieldLabel = "Data") {
    if (value instanceof Date) return value;
    const raw = String(value ?? "").trim();
    if (!raw) throw new Error(`${fieldLabel}: campo obbligatorio`);

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return parseDateISO(raw, fieldLabel);
    }

    if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
      throw new Error(`${fieldLabel}: usa il formato gg/mm/aaaa`);
    }

    const [day, month, year] = raw.split("/").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      throw new Error(`${fieldLabel}: inserisci una data valida`);
    }
    return date;
  }

  function formatDateISO(date) {
    return date.toISOString().slice(0, 10);
  }

  function normalizeDateInput(value, fieldLabel = "Data") {
    return formatDateISO(parseDateInput(value, fieldLabel));
  }

  function normalizeItalianFormDate(value, fieldLabel, options = { required: true }) {
    const raw = String(value ?? "").trim();
    if (!raw) {
      if (options.required) throw new Error(`${fieldLabel}: campo obbligatorio`);
      return "";
    }
    if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
      throw new Error(`${fieldLabel}: usa il formato gg/mm/aaaa`);
    }
    return normalizeDateInput(raw, fieldLabel);
  }

  function formatDateItalian(value) {
    const date = value instanceof Date ? value : parseDateInput(value);
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC"
    }).format(date);
  }

  function addDays(value, days) {
    const date = value instanceof Date ? value : parseDateInput(value);
    return new Date(date.getTime() + days * MS_PER_DAY);
  }

  function addMonths(value, months) {
    const date = value instanceof Date ? value : parseDateInput(value);
    const targetMonth = date.getUTCMonth() + months;
    const target = new Date(Date.UTC(date.getUTCFullYear(), targetMonth, 1));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(date.getUTCDate(), lastDay));
    return target;
  }

  function giorniTra(dataInizio, dataFine) {
    const start = dataInizio instanceof Date ? dataInizio : parseDateInput(dataInizio, "Data iniziale");
    const end = dataFine instanceof Date ? dataFine : parseDateInput(dataFine, "Data finale");
    const days = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
    if (days < 0) throw new Error("La data finale precede la data iniziale");
    return days;
  }

  function normalizeRates(tassi) {
    return [...tassi]
      .map((rate) => ({
        ...rate,
        start: parseDateISO(rate.dataInizio),
        endExclusive: addDays(rate.dataFine, 1)
      }))
      .sort((a, b) => a.start - b.start);
  }

  function trovaTassoAllaData(date, tassi) {
    const day = date instanceof Date ? date : parseDateInput(date);
    return normalizeRates(tassi).find((rate) => rate.start <= day && day < rate.endExclusive) || null;
  }

  function spezzaPeriodoPerTassi(dataInizio, dataFine, tassi) {
    const start = dataInizio instanceof Date ? dataInizio : parseDateInput(dataInizio, "Data iniziale");
    const end = dataFine instanceof Date ? dataFine : parseDateInput(dataFine, "Data finale");
    if (end < start) throw new Error("Il periodo non è valido");
    const normalizedRates = normalizeRates(tassi);
    const segments = [];
    let cursor = start;

    while (cursor < end) {
      const rate = normalizedRates.find((candidate) => candidate.start <= cursor && cursor < candidate.endExclusive);
      if (!rate) {
        const nextRate = normalizedRates.find((candidate) => candidate.start > cursor);
        const nextEnd = nextRate ? new Date(Math.min(nextRate.start.getTime(), end.getTime())) : end;
        segments.push({
          dataInizio: formatDateISO(cursor),
          dataFine: formatDateISO(nextEnd),
          tasso: null
        });
        cursor = nextEnd;
        continue;
      }

      const segmentEnd = new Date(Math.min(rate.endExclusive.getTime(), end.getTime()));
      segments.push({
        dataInizio: formatDateISO(cursor),
        dataFine: formatDateISO(segmentEnd),
        tasso: stripInternalRateFields(rate)
      });
      cursor = segmentEnd;
    }

    return segments;
  }

  function stripInternalRateFields(rate) {
    const { start, endExclusive, ...publicRate } = rate;
    return publicRate;
  }

  function calcolaInteresseSemplice(base, tassoAnnuo, dataInizio, dataFine) {
    const giorni = giorniTra(dataInizio, dataFine);
    return base * tassoAnnuo * giorni / 365;
  }

  function normalizePayments(pagamenti) {
    const grouped = new Map();
    for (const payment of pagamenti || []) {
      if (!payment || !payment.dataPagamento && !payment.data) continue;
      const dataPagamento = payment.dataPagamento || payment.data;
      const amount = parseImportoEuro(payment.importoPagamento ?? payment.importo ?? 0);
      if (amount === 0) continue;
      const normalizedDate = normalizeDateInput(dataPagamento, "Data del pagamento");
      grouped.set(normalizedDate, (grouped.get(normalizedDate) || 0) + amount);
    }
    return [...grouped.entries()]
      .map(([dataPagamento, importoPagamento]) => ({ dataPagamento, importoPagamento }))
      .sort((a, b) => parseDateInput(a.dataPagamento) - parseDateInput(b.dataPagamento));
  }

  function getCommercialSchedule({ capitale, dataScadenza, dataFinale, pagamenti = [], tassi = [] }) {
    const start = addDays(dataScadenza, 1);
    const end = parseDateInput(dataFinale, "Data del pagamento o della stima");
    const dueDate = parseDateInput(dataScadenza, "Scadenza della fattura");
    const warnings = [];

    if (end < dueDate) throw new Error("La data finale non può precedere la scadenza");
    if (end <= start) {
      return {
        capitaleResiduo: capitale,
        totaleInteressiCommerciali: 0,
        interessiLordiMaturati: 0,
        pagamentiTotali: 0,
        righe: [],
        warnings: ["La data finale non genera giorni di mora dopo la scadenza."]
      };
    }

    const validPayments = normalizePayments(pagamenti).filter((payment) => {
      const paymentDate = parseDateInput(payment.dataPagamento, "Data del pagamento");
      if (paymentDate < start || paymentDate > end) {
        warnings.push(`Pagamento del ${formatDateItalian(payment.dataPagamento)} escluso: fuori dal periodo di calcolo.`);
        return false;
      }
      return true;
    });

    const paymentByDate = new Map(validPayments.map((payment) => [payment.dataPagamento, payment.importoPagamento]));
    const rateSegments = spezzaPeriodoPerTassi(start, end, tassi);
    const cutPoints = new Map();
    cutPoints.set(formatDateISO(end), "fine");

    for (const segment of rateSegments) {
      cutPoints.set(segment.dataFine, "tasso");
    }
    for (const payment of validPayments) {
      cutPoints.set(payment.dataPagamento, "pagamento");
    }

    const orderedCutPoints = [...cutPoints.keys()]
      .map((date) => parseDateISO(date))
      .filter((date) => date >= start && date <= end)
      .sort((a, b) => a - b);

    let cursor = start;
    let capitaleResiduo = capitale;
    let interessiNonPagati = 0;
    let interessiLordiMaturati = 0;
    let pagamentiTotali = 0;
    const righe = [];

    for (const cutPoint of orderedCutPoints) {
      const cutPointISO = formatDateISO(cutPoint);
      if (cutPoint < cursor) continue;

      const rate = trovaTassoAllaData(cursor, tassi);
      const giorni = giorniTra(cursor, cutPoint);
      const baseBeforePayment = capitaleResiduo;
      const interest = rate ? calcolaInteresseSemplice(capitaleResiduo, rate.tassoAnnuo, cursor, cutPoint) : 0;
      if (!rate && giorni > 0) {
        warnings.push(`Tasso non disponibile per il periodo ${formatDateItalian(cursor)} - ${formatDateItalian(addDays(cutPoint, -1))}.`);
      }

      interessiNonPagati += interest;
      interessiLordiMaturati += interest;

      const pagamento = paymentByDate.get(cutPointISO) || 0;
      if (pagamento > 0) {
        pagamentiTotali += pagamento;
        const quotaInteressi = Math.min(interessiNonPagati, pagamento);
        interessiNonPagati -= quotaInteressi;
        const residuoPagamento = pagamento - quotaInteressi;
        const quotaCapitale = Math.min(capitaleResiduo, residuoPagamento);
        capitaleResiduo -= quotaCapitale;
        if (residuoPagamento > quotaCapitale) {
          warnings.push(`Pagamento del ${formatDateItalian(cutPointISO)} superiore al debito stimato: eccedenza non imputata.`);
        }
      }

      if (giorni > 0 || pagamento > 0) {
        righe.push({
          dataInizio: formatDateISO(cursor),
          dataFine: giorni > 0 ? formatDateISO(addDays(cutPoint, -1)) : cutPointISO,
          giorni,
          baseCalcolo: roundMoney(baseBeforePayment),
          tassoAnnuo: rate ? rate.tassoAnnuo : null,
          interesseMaturato: roundMoney(interest),
          pagamento: roundMoney(pagamento),
          capitaleResiduo: roundMoney(capitaleResiduo),
          interessiResidui: roundMoney(interessiNonPagati),
          fonteLabel: rate ? rate.fonteLabel : "Tasso non disponibile",
          fonteUrl: rate ? rate.fonteUrl : ""
        });
      }

      cursor = cutPoint;
    }

    return {
      capitaleResiduo: roundMoney(capitaleResiduo),
      totaleInteressiCommerciali: roundMoney(interessiNonPagati),
      interessiLordiMaturati: roundMoney(interessiLordiMaturati),
      pagamentiTotali: roundMoney(pagamentiTotali),
      righe,
      warnings
    };
  }

  function applicaPagamentiParziali(calendario, pagamenti) {
    return getCommercialSchedule({ ...calendario, pagamenti });
  }

  function calcolaInteressiCommerciali({ capitale, dataScadenza, dataFinale, pagamenti, tassi }) {
    return getCommercialSchedule({ capitale, dataScadenza, dataFinale, pagamenti, tassi });
  }

  function calcolaInteressiMaturatiAllaDomandaGiudiziale({ capitale, dataScadenza, dataDomandaGiudiziale, pagamenti, tassi }) {
    if (!dataDomandaGiudiziale) return 0;
    const domanda = parseDateInput(dataDomandaGiudiziale, "Domanda giudiziale");
    const start = addDays(dataScadenza, 1);
    if (domanda <= start) return 0;
    const schedule = getCommercialSchedule({
      capitale,
      dataScadenza,
      dataFinale: dataDomandaGiudiziale,
      pagamenti,
      tassi
    });
    return schedule.totaleInteressiCommerciali;
  }

  function calcolaBaseAnatocismo({ capitale, dataScadenza, dataDomandaGiudiziale, pagamenti, tassi }) {
    const warnings = [];
    if (!dataDomandaGiudiziale) {
      return { baseAnatocismo: 0, dataLimiteSeiMesi: "", warnings };
    }

    const domanda = parseDateInput(dataDomandaGiudiziale, "Domanda giudiziale");
    const start = addDays(dataScadenza, 1);
    const limiteSeiMesi = addMonths(domanda, -6);
    if (limiteSeiMesi <= start) {
      warnings.push("La domanda giudiziale non rispetta il requisito dei sei mesi per l'anatocismo: anatocismo impostato a zero.");
      return {
        baseAnatocismo: 0,
        dataLimiteSeiMesi: formatDateISO(limiteSeiMesi),
        warnings
      };
    }

    const validPayments = normalizePayments(pagamenti).filter((payment) => {
      const paymentDate = parseDateInput(payment.dataPagamento, "Data del pagamento");
      return paymentDate >= start && paymentDate <= domanda;
    });
    const paymentByDate = new Map(validPayments.map((payment) => [payment.dataPagamento, payment.importoPagamento]));
    const rateSegments = spezzaPeriodoPerTassi(start, domanda, tassi);
    const cutPoints = new Map();
    cutPoints.set(formatDateISO(domanda), "domanda");
    cutPoints.set(formatDateISO(limiteSeiMesi), "sei mesi");

    for (const segment of rateSegments) {
      cutPoints.set(segment.dataFine, "tasso");
    }
    for (const payment of validPayments) {
      cutPoints.set(payment.dataPagamento, "pagamento");
    }

    const orderedCutPoints = [...cutPoints.keys()]
      .map((date) => parseDateISO(date))
      .filter((date) => date >= start && date <= domanda)
      .sort((a, b) => a - b);

    let cursor = start;
    let capitaleResiduo = capitale;
    const interestBuckets = [];

    for (const cutPoint of orderedCutPoints) {
      if (cutPoint < cursor) continue;
      const cutPointISO = formatDateISO(cutPoint);
      const rate = trovaTassoAllaData(cursor, tassi);
      const giorni = giorniTra(cursor, cutPoint);
      if (rate && giorni > 0 && capitaleResiduo > 0) {
        interestBuckets.push({
          maturityDate: cutPoint,
          amount: calcolaInteresseSemplice(capitaleResiduo, rate.tassoAnnuo, cursor, cutPoint)
        });
      } else if (!rate && giorni > 0) {
        warnings.push(`Tasso non disponibile per la base anatocismo nel periodo ${formatDateItalian(cursor)} - ${formatDateItalian(addDays(cutPoint, -1))}.`);
      }

      let pagamento = paymentByDate.get(cutPointISO) || 0;
      if (pagamento > 0) {
        for (const bucket of interestBuckets) {
          if (pagamento <= 0) break;
          const quotaInteressi = Math.min(bucket.amount, pagamento);
          bucket.amount -= quotaInteressi;
          pagamento -= quotaInteressi;
        }
        if (pagamento > 0) {
          const quotaCapitale = Math.min(capitaleResiduo, pagamento);
          capitaleResiduo -= quotaCapitale;
        }
      }

      cursor = cutPoint;
    }

    const baseAnatocismo = interestBuckets
      .filter((bucket) => bucket.maturityDate <= limiteSeiMesi)
      .reduce((total, bucket) => total + bucket.amount, 0);

    return {
      baseAnatocismo: roundMoney(baseAnatocismo),
      dataLimiteSeiMesi: formatDateISO(limiteSeiMesi),
      warnings
    };
  }

  function calcolaInteresseVariabile(base, dataInizio, dataFine, tassi) {
    let total = 0;
    let uncovered = false;
    const segments = spezzaPeriodoPerTassi(dataInizio, dataFine, tassi);
    for (const segment of segments) {
      if (!segment.tasso) {
        uncovered = true;
        continue;
      }
      total += calcolaInteresseSemplice(base, segment.tasso.tassoAnnuo, segment.dataInizio, segment.dataFine);
    }
    return { interesse: total, uncovered, segments };
  }

  function descriviTassiApplicati(segments) {
    return segments
      .filter((segment) => segment.tasso)
      .map((segment) => {
        const endInclusive = addDays(segment.dataFine, -1);
        return `${formatDateItalian(segment.dataInizio)}-${formatDateItalian(endInclusive)}: ${formatPercent(segment.tasso.tassoAnnuo)}`;
      });
  }

  function calcolaAnatocismo({ baseAnatocismo, dataDomandaGiudiziale, dataFinale, tassoAnatocismo }) {
    const warnings = [];
    if (!dataDomandaGiudiziale) {
      return {
        anatocismo: 0,
        giorni: 0,
        warnings: ["Nessuna data di domanda giudiziale inserita: anatocismo impostato a zero."]
      };
    }

    const domanda = parseDateInput(dataDomandaGiudiziale, "Domanda giudiziale");
    const fine = parseDateInput(dataFinale, "Data del pagamento o della stima");
    if (fine <= domanda) {
      warnings.push("La data finale non è successiva alla domanda giudiziale: anatocismo impostato a zero.");
      return { anatocismo: 0, giorni: 0, warnings };
    }

    if (baseAnatocismo <= 0) {
      warnings.push("Nessuna base anatocistica ammessa: interessi moratori non maturati da almeno sei mesi o già assorbiti dai pagamenti.");
      return { anatocismo: 0, giorni: 0, warnings };
    }

    const giorni = giorniTra(domanda, fine);
    const anatocismo = baseAnatocismo * tassoAnatocismo * giorni / 365;
    return { anatocismo: roundMoney(anatocismo), giorni, warnings };
  }

  function resolveAnatocismoRate({ tipoTassoAnatocismo, tassoPersonalizzato, dataDomandaGiudiziale, dataFinale, tassiCommerciali, tassiLegali }) {
    if (tipoTassoAnatocismo === "personalizzato") {
      if (!String(tassoPersonalizzato ?? "").trim()) {
        throw new Error("Tasso annuo personalizzato: campo obbligatorio se selezioni il tasso personalizzato");
      }
      return {
        tassoAnatocismo: parseImportoEuro(tassoPersonalizzato || 0) / 100,
        warnings: [],
        label: "tasso annuo personalizzato",
        dettaglioTassi: []
      };
    }

    if (!dataDomandaGiudiziale) {
      return { tassoAnatocismo: 0, warnings: [], label: "nessun tasso applicato", dettaglioTassi: [] };
    }

    if (parseDateInput(dataFinale, "Data del pagamento o della stima") <= parseDateInput(dataDomandaGiudiziale, "Domanda giudiziale")) {
      return { tassoAnatocismo: 0, warnings: [], label: "nessun tasso applicato", dettaglioTassi: [] };
    }

    const table = tipoTassoAnatocismo === "legale" ? tassiLegali : tassiCommerciali;
    const variableRate = calcolaInteresseVariabile(1, dataDomandaGiudiziale, dataFinale, table);
    const giorni = giorniTra(dataDomandaGiudiziale, dataFinale);
    const effectiveAnnualRate = giorni > 0 ? variableRate.interesse * 365 / giorni : 0;
    const label = tipoTassoAnatocismo === "legale" ? "tasso legale automatico per anno" : "tasso commerciale/moratorio automatico per semestre";
    const warnings = variableRate.uncovered
      ? [`Il tasso ${tipoTassoAnatocismo} non copre tutto il periodo dell'anatocismo.`]
      : [];
    return { tassoAnatocismo: effectiveAnnualRate, warnings, label, dettaglioTassi: descriviTassiApplicati(variableRate.segments) };
  }

  function calcolaTotale({
    capitale,
    dataScadenza,
    dataFinale,
    pagamenti = [],
    dataDomandaGiudiziale = "",
    tipoTassoAnatocismo = "commerciale",
    tassoPersonalizzato = "",
    includiForfait40 = false,
    maggioriCostiProvati = "",
    tassi = global.tassiCommercialiPA || [],
    tassiLegali = global.tassiLegaliItalia || []
  }) {
    if (!String(capitale ?? "").trim()) {
      throw new Error("Importo della fattura: campo obbligatorio");
    }
    const capitaleParsed = parseImportoEuro(capitale);
    if (capitaleParsed <= 0) throw new Error("Il capitale deve essere maggiore di zero");

    dataScadenza = normalizeDateInput(dataScadenza, "Scadenza della fattura");
    dataFinale = normalizeDateInput(dataFinale, "Data del pagamento o della stima");
    if (dataDomandaGiudiziale) {
      dataDomandaGiudiziale = normalizeDateInput(dataDomandaGiudiziale, "Domanda giudiziale");
    }

    const commerciali = calcolaInteressiCommerciali({
      capitale: capitaleParsed,
      dataScadenza,
      dataFinale,
      pagamenti,
      tassi
    });

    const domandaEntroPeriodo = dataDomandaGiudiziale && parseDateInput(dataDomandaGiudiziale) <= parseDateInput(dataFinale);
    const interessiMaturatiAllaDomanda = domandaEntroPeriodo ? calcolaInteressiMaturatiAllaDomandaGiudiziale({
      capitale: capitaleParsed,
      dataScadenza,
      dataDomandaGiudiziale,
      pagamenti,
      tassi
    }) : 0;
    const baseAnatocismoResult = domandaEntroPeriodo ? calcolaBaseAnatocismo({
      capitale: capitaleParsed,
      dataScadenza,
      dataDomandaGiudiziale,
      pagamenti,
      tassi
    }) : { baseAnatocismo: 0, dataLimiteSeiMesi: "", warnings: [] };

    const anatocismoRate = resolveAnatocismoRate({
      tipoTassoAnatocismo,
      tassoPersonalizzato,
      dataDomandaGiudiziale,
      dataFinale,
      tassiCommerciali: tassi,
      tassiLegali
    });

    const anatocismo = calcolaAnatocismo({
      baseAnatocismo: baseAnatocismoResult.baseAnatocismo,
      dataDomandaGiudiziale,
      dataFinale,
      tassoAnatocismo: anatocismoRate.tassoAnatocismo
    });

    const forfaitRecuperoCosti = includiForfait40 === true || includiForfait40 === "on" ? 40 : 0;
    const maggioriCosti = String(maggioriCostiProvati ?? "").trim()
      ? parseImportoEuro(maggioriCostiProvati)
      : 0;
    const totale = commerciali.capitaleResiduo + commerciali.totaleInteressiCommerciali + anatocismo.anatocismo + forfaitRecuperoCosti + maggioriCosti;
    return {
      capitaleResiduo: roundMoney(commerciali.capitaleResiduo),
      interessiCommerciali: roundMoney(commerciali.totaleInteressiCommerciali),
      interessiCommercialiLordi: roundMoney(commerciali.interessiLordiMaturati),
      interessiMaturatiAllaDomanda: roundMoney(interessiMaturatiAllaDomanda),
      baseAnatocismo: roundMoney(baseAnatocismoResult.baseAnatocismo),
      anatocismo: roundMoney(anatocismo.anatocismo),
      forfaitRecuperoCosti: roundMoney(forfaitRecuperoCosti),
      maggioriCostiProvati: roundMoney(maggioriCosti),
      totale: roundMoney(totale),
      warning: [...commerciali.warnings, ...baseAnatocismoResult.warnings, ...anatocismoRate.warnings, ...anatocismo.warnings],
      ipotesi: [
        ...DEFAULT_ASSUMPTIONS,
        `Tasso anatocismo applicato: ${anatocismoRate.label}.`,
        ...(baseAnatocismoResult.dataLimiteSeiMesi
          ? [`Base anatocismo: interessi moratori residui maturati fino al ${formatDateItalian(baseAnatocismoResult.dataLimiteSeiMesi)}.`]
          : []),
        ...(anatocismoRate.dettaglioTassi.length
          ? [`Tassi anatocismo applicati automaticamente: ${anatocismoRate.dettaglioTassi.join("; ")}.`]
          : []),
        "La data iniziale del conteggio è inclusa; la data finale è esclusa. Per la mora, la data iniziale è il giorno successivo alla scadenza."
      ],
      righe: commerciali.righe,
      pagamentiTotali: commerciali.pagamentiTotali,
      tassoAnatocismoEffettivo: anatocismoRate.tassoAnatocismo
    };
  }

  function formatEuro(value) {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value || 0);
  }

  function formatPercent(value) {
    if (value == null) return "n.d.";
    return new Intl.NumberFormat("it-IT", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }

  function collectFormData() {
    const payments = [...document.querySelectorAll(".payment-row")].map((row) => ({
      dataPagamento: row.querySelector("[data-payment-date]").value.trim(),
      importoPagamento: row.querySelector("[data-payment-amount]").value.trim()
    })).filter((payment) => payment.dataPagamento || payment.importoPagamento).map((payment) => {
      if (!payment.importoPagamento) {
        throw new Error("Importo pagato: campo obbligatorio se aggiungi un pagamento");
      }
      return {
        dataPagamento: normalizeItalianFormDate(payment.dataPagamento, "Data del pagamento"),
        importoPagamento: payment.importoPagamento
      };
    });

    return {
      capitale: document.querySelector("#capitale").value,
      dataScadenza: normalizeItalianFormDate(document.querySelector("#dataScadenza").value, "Scadenza della fattura"),
      dataFinale: normalizeItalianFormDate(document.querySelector("#dataFinale").value, "Data del pagamento o della stima"),
      pagamenti: payments,
      dataDomandaGiudiziale: normalizeItalianFormDate(document.querySelector("#dataDomandaGiudiziale").value, "Domanda giudiziale", { required: false }),
      tipoTassoAnatocismo: "commerciale",
      tassoPersonalizzato: "",
      includiForfait40: document.querySelector("#includiForfait40").checked,
      maggioriCostiProvati: document.querySelector("#maggioriCostiProvati").value
    };
  }

  function renderResults(result) {
    document.querySelector("#capitaleResiduo").textContent = formatEuro(result.capitaleResiduo);
    document.querySelector("#interessiCommerciali").textContent = formatEuro(result.interessiCommerciali);
    document.querySelector("#anatocismo").textContent = formatEuro(result.anatocismo);
    document.querySelector("#forfaitRecuperoCosti").textContent = formatEuro(result.forfaitRecuperoCosti);
    document.querySelector("#maggioriCostiProvatiRisultato").textContent = formatEuro(result.maggioriCostiProvati);
    document.querySelector("#totaleDovuto").textContent = formatEuro(result.totale);
    document.querySelector("#interessiDomanda").textContent = formatEuro(result.interessiMaturatiAllaDomanda);
    document.querySelector("#baseAnatocismo").textContent = formatEuro(result.baseAnatocismo);
    document.querySelector("#tassoAnatocismoEffettivo").textContent = formatPercent(result.tassoAnatocismoEffettivo);

    const tableBody = document.querySelector("#detailRows");
    tableBody.innerHTML = "";
    if (!result.righe.length) {
      const row = document.createElement("tr");
      row.innerHTML = '<td colspan="7" class="empty-cell">Nessun periodo di mora calcolato.</td>';
      tableBody.appendChild(row);
    } else {
      for (const detail of result.righe) {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td><span>${formatDateItalian(detail.dataInizio)}</span><span class="period-separator">-</span><span>${formatDateItalian(detail.dataFine)}</span></td>
          <td>${detail.giorni}</td>
          <td>${formatEuro(detail.baseCalcolo)}</td>
          <td>${formatPercent(detail.tassoAnnuo)}</td>
          <td>${formatEuro(detail.interesseMaturato)}</td>
          <td>${detail.pagamento ? formatEuro(detail.pagamento) : "-"}</td>
          <td>${formatEuro(detail.capitaleResiduo)}</td>
        `;
        tableBody.appendChild(row);
      }
    }

    renderList("#warningList", result.warning.length ? result.warning : ["Nessun avviso per i dati inseriti."]);
    renderList("#assumptionList", result.ipotesi);
    document.querySelector("#resultsPanel").dataset.state = "ready";
    global.lastCalculationResult = result;
  }

  function renderList(selector, items) {
    const list = document.querySelector(selector);
    list.innerHTML = "";
    for (const item of items) {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    }
  }

  function addPaymentRow(payment = {}) {
    const container = document.querySelector("#paymentsContainer");
    const row = document.createElement("div");
    row.className = "payment-row";
    row.innerHTML = `
      <label>
        <span>Data del pagamento</span>
        <input type="text" inputmode="numeric" data-payment-date placeholder="gg/mm/aaaa" autocomplete="off" value="${payment.dataPagamento || ""}">
      </label>
      <label>
        <span>Importo pagato</span>
        <input type="text" inputmode="decimal" data-payment-amount placeholder="0,00" value="${payment.importoPagamento || ""}">
      </label>
      <button class="icon-button" type="button" aria-label="Rimuovi pagamento" title="Rimuovi pagamento">Rimuovi</button>
    `;
    row.querySelector("button").addEventListener("click", () => row.remove());
    container.appendChild(row);
  }

  function resultToSummary(result) {
    return [
      "Calcolatore interessi commerciali PA",
      `Importo fattura ancora dovuto: ${formatEuro(result.capitaleResiduo)}`,
      `Interessi moratori maturati: ${formatEuro(result.interessiCommerciali)}`,
      `Interessi maturati alla domanda giudiziale: ${formatEuro(result.interessiMaturatiAllaDomanda)}`,
      `Base anatocismo ammessa: ${formatEuro(result.baseAnatocismo)}`,
      `Interessi anatocistici: ${formatEuro(result.anatocismo)}`,
      `Forfait recupero costi: ${formatEuro(result.forfaitRecuperoCosti)}`,
      `Maggiori costi provati: ${formatEuro(result.maggioriCostiProvati)}`,
      `Totale stimato da pagare: ${formatEuro(result.totale)}`,
      "",
      "Ipotesi principali:",
      ...result.ipotesi.map((item) => `- ${item}`)
    ].join("\n");
  }

  function downloadCSV(result) {
    const header = ["periodo", "giorni", "base_calcolo", "tasso_annuo", "interessi", "pagamento", "capitale_residuo"];
    const rows = result.righe.map((row) => [
      `${formatDateItalian(row.dataInizio)} - ${formatDateItalian(row.dataFine)}`,
      row.giorni,
      row.baseCalcolo.toFixed(2),
      row.tassoAnnuo == null ? "" : row.tassoAnnuo,
      row.interesseMaturato.toFixed(2),
      row.pagamento.toFixed(2),
      row.capitaleResiduo.toFixed(2)
    ]);
    const csv = [header, ...rows].map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "calcolo-interessi-commerciali-pa.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function resetUI() {
    document.querySelector("#calculatorForm").reset();
    document.querySelector("#paymentsContainer").innerHTML = "";
    addPaymentRow();
    syncTassoPersonalizzatoState();
    renderResults({
      capitaleResiduo: 0,
      interessiCommerciali: 0,
      interessiMaturatiAllaDomanda: 0,
      baseAnatocismo: 0,
      anatocismo: 0,
      forfaitRecuperoCosti: 0,
      maggioriCostiProvati: 0,
      totale: 0,
      warning: ["Inserisci i dati e premi Calcola."],
      ipotesi: DEFAULT_ASSUMPTIONS,
      righe: [],
      tassoAnatocismoEffettivo: 0
    });
  }

  function syncTassoPersonalizzatoState() {
    if (!document.querySelector("#tipoTassoAnatocismo")) return;
    const rateType = document.querySelector("#tipoTassoAnatocismo").value;
    const customRateInput = document.querySelector("#tassoPersonalizzato");
    const isCustomRate = rateType === "personalizzato";
    customRateInput.disabled = !isCustomRate;
    customRateInput.placeholder = isCustomRate ? "10,15" : "Seleziona tasso fisso personalizzato";
    if (!isCustomRate) customRateInput.value = "";
  }

  function showCalculationError(message) {
    const errorMessage = message || "Errore nel calcolo.";
    renderList("#warningList", [errorMessage]);
    document.querySelector("#errorPopupMessage").textContent = errorMessage;
    document.querySelector("#errorPopup").hidden = false;
    document.querySelector("#errorPopupClose").focus();
  }

  function getFeedbackValue(selector) {
    return document.querySelector(selector).value.trim();
  }

  function submitFeedback(event) {
    event.preventDefault();
    const status = document.querySelector("#feedbackStatus");
    status.hidden = true;
    const subject = getFeedbackValue("#feedbackSubject");
    const description = getFeedbackValue("#feedbackDescription");

    try {
      if (!subject) throw new Error("Oggetto della segnalazione: campo obbligatorio");
      if (!description) throw new Error("Descrizione della segnalazione: campo obbligatorio");
      document.querySelector("#feedbackForm").reset();
      status.textContent = "Grazie per il feedback!";
      status.hidden = false;
    } catch (error) {
      showCalculationError(error.message);
    }
  }

  function setupDom() {
    if (!global.document) return;

    addPaymentRow();
    syncTassoPersonalizzatoState();
    renderList("#assumptionList", DEFAULT_ASSUMPTIONS);
    renderList("#warningList", ["Inserisci i dati e premi Calcola."]);

    document.querySelector("#addPayment").addEventListener("click", () => addPaymentRow());
    if (document.querySelector("#tipoTassoAnatocismo")) {
      document.querySelector("#tipoTassoAnatocismo").addEventListener("change", syncTassoPersonalizzatoState);
    }
    document.querySelector("#errorPopupClose").addEventListener("click", () => {
      document.querySelector("#errorPopup").hidden = true;
    });
    document.querySelector("#calculatorForm").addEventListener("submit", (event) => {
      event.preventDefault();
      try {
        const result = calcolaTotale({
          ...collectFormData(),
          tassi: global.tassiCommercialiPA || [],
          tassiLegali: global.tassiLegaliItalia || []
        });
        renderResults(result);
      } catch (error) {
        showCalculationError(error.message);
      }
    });

    document.querySelector("#feedbackForm").addEventListener("submit", submitFeedback);
    document.querySelector("#resetButton").addEventListener("click", resetUI);
    document.querySelector("#copySummary").addEventListener("click", async () => {
      if (!global.lastCalculationResult) return;
      const text = resultToSummary(global.lastCalculationResult);
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
    });
    document.querySelector("#downloadCsv").addEventListener("click", () => {
      if (global.lastCalculationResult) downloadCSV(global.lastCalculationResult);
    });
    document.querySelector("#printPage").addEventListener("click", () => global.print());
  }

  const api = {
    parseImportoEuro,
    giorniTra,
    spezzaPeriodoPerTassi,
    calcolaInteresseSemplice,
    applicaPagamentiParziali,
    calcolaInteressiCommerciali,
    calcolaInteressiMaturatiAllaDomandaGiudiziale,
    calcolaBaseAnatocismo,
    calcolaAnatocismo,
    calcolaTotale,
    formatDateISO,
    formatDateItalian,
    parseDateInput,
    addDays,
    addMonths
  };

  global.InteressiPACalculator = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (global.document) global.addEventListener("DOMContentLoaded", setupDom);
})(typeof globalThis !== "undefined" ? globalThis : window);
