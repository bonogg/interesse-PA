(function initCalculator(global) {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const DEFAULT_ASSUMPTIONS = [
    "Questo è uno strumento di stima, non una consulenza legale.",
    "Gli interessi commerciali sono calcolati come interessi semplici.",
    "La tabella dei tassi deve essere verificata e mantenuta aggiornata.",
    "L'anatocismo viene calcolato solo se è indicata una data di domanda giudiziale.",
    "L'anatocismo viene calcolato solo sugli interessi già maturati alla data della domanda giudiziale.",
    "Il calcolo usa la convenzione giorni effettivi / 365.",
    "I pagamenti parziali sono imputati prima agli interessi maturati e poi al capitale.",
    "L'utente deve verificare se il tasso scelto per l'anatocismo è giuridicamente corretto nel caso concreto."
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

  function parseDateISO(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
      throw new Error("Data non valida");
    }
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      throw new Error("Data non valida");
    }
    return date;
  }

  function formatDateISO(date) {
    return date.toISOString().slice(0, 10);
  }

  function addDays(value, days) {
    const date = value instanceof Date ? value : parseDateISO(value);
    return new Date(date.getTime() + days * MS_PER_DAY);
  }

  function giorniTra(dataInizio, dataFine) {
    const start = dataInizio instanceof Date ? dataInizio : parseDateISO(dataInizio);
    const end = dataFine instanceof Date ? dataFine : parseDateISO(dataFine);
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
    const day = date instanceof Date ? date : parseDateISO(date);
    return normalizeRates(tassi).find((rate) => rate.start <= day && day < rate.endExclusive) || null;
  }

  function spezzaPeriodoPerTassi(dataInizio, dataFine, tassi) {
    const start = dataInizio instanceof Date ? dataInizio : parseDateISO(dataInizio);
    const end = dataFine instanceof Date ? dataFine : parseDateISO(dataFine);
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
      parseDateISO(dataPagamento);
      grouped.set(dataPagamento, (grouped.get(dataPagamento) || 0) + amount);
    }
    return [...grouped.entries()]
      .map(([dataPagamento, importoPagamento]) => ({ dataPagamento, importoPagamento }))
      .sort((a, b) => parseDateISO(a.dataPagamento) - parseDateISO(b.dataPagamento));
  }

  function getCommercialSchedule({ capitale, dataScadenza, dataFinale, pagamenti = [], tassi = [] }) {
    const start = addDays(dataScadenza, 1);
    const end = parseDateISO(dataFinale);
    const dueDate = parseDateISO(dataScadenza);
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
      const paymentDate = parseDateISO(payment.dataPagamento);
      if (paymentDate < start || paymentDate > end) {
        warnings.push(`Pagamento del ${payment.dataPagamento} escluso: fuori dal periodo di calcolo.`);
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
        warnings.push(`Tasso non disponibile per il periodo ${formatDateISO(cursor)} - ${formatDateISO(addDays(cutPoint, -1))}.`);
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
          warnings.push(`Pagamento del ${cutPointISO} superiore al debito stimato: eccedenza non imputata.`);
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
    const domanda = parseDateISO(dataDomandaGiudiziale);
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
    return { interesse: roundMoney(total), uncovered };
  }

  function calcolaAnatocismo({ interessiMaturatiAllaDomanda, dataDomandaGiudiziale, dataFinale, tassoAnatocismo, dataScadenza }) {
    const warnings = [];
    if (!dataDomandaGiudiziale) {
      return {
        anatocismo: 0,
        giorni: 0,
        warnings: ["Nessuna data di domanda giudiziale inserita: anatocismo impostato a zero."]
      };
    }

    const domanda = parseDateISO(dataDomandaGiudiziale);
    const fine = parseDateISO(dataFinale);
    if (fine <= domanda) {
      warnings.push("La data finale non è successiva alla domanda giudiziale: anatocismo impostato a zero.");
      return { anatocismo: 0, giorni: 0, warnings };
    }

    const giorniDaScadenzaADomanda = giorniTra(parseDateISO(dataScadenza), domanda);
    if (giorniDaScadenzaADomanda < 183) {
      warnings.push("La data della domanda giudiziale sembra anteriore al requisito dei sei mesi: verificare l'art. 1283 c.c.");
    }

    const giorni = giorniTra(domanda, fine);
    const anatocismo = interessiMaturatiAllaDomanda * tassoAnatocismo * giorni / 365;
    return { anatocismo: roundMoney(anatocismo), giorni, warnings };
  }

  function resolveAnatocismoRate({ tipoTassoAnatocismo, tassoPersonalizzato, dataDomandaGiudiziale, dataFinale, tassiCommerciali, tassiLegali }) {
    if (tipoTassoAnatocismo === "personalizzato") {
      return {
        tassoAnatocismo: parseImportoEuro(tassoPersonalizzato || 0) / 100,
        warnings: [],
        label: "tasso annuo personalizzato"
      };
    }

    if (!dataDomandaGiudiziale) {
      return { tassoAnatocismo: 0, warnings: [], label: "nessun tasso applicato" };
    }

    if (parseDateISO(dataFinale) <= parseDateISO(dataDomandaGiudiziale)) {
      return { tassoAnatocismo: 0, warnings: [], label: "nessun tasso applicato" };
    }

    const table = tipoTassoAnatocismo === "legale" ? tassiLegali : tassiCommerciali;
    const variableRate = calcolaInteresseVariabile(1, dataDomandaGiudiziale, dataFinale, table);
    const giorni = giorniTra(dataDomandaGiudiziale, dataFinale);
    const effectiveAnnualRate = giorni > 0 ? variableRate.interesse * 365 / giorni : 0;
    const label = tipoTassoAnatocismo === "legale" ? "tasso legale variabile" : "tasso commerciale/moratorio variabile";
    const warnings = variableRate.uncovered
      ? [`Il tasso ${tipoTassoAnatocismo} non copre tutto il periodo dell'anatocismo.`]
      : [];
    return { tassoAnatocismo: effectiveAnnualRate, warnings, label };
  }

  function calcolaTotale({
    capitale,
    dataScadenza,
    dataFinale,
    pagamenti = [],
    dataDomandaGiudiziale = "",
    tipoTassoAnatocismo = "commerciale",
    tassoPersonalizzato = "",
    tassi = global.tassiCommercialiPA || [],
    tassiLegali = global.tassiLegaliItalia || []
  }) {
    const capitaleParsed = parseImportoEuro(capitale);
    if (capitaleParsed <= 0) throw new Error("Il capitale deve essere maggiore di zero");

    parseDateISO(dataScadenza);
    parseDateISO(dataFinale);
    if (dataDomandaGiudiziale) parseDateISO(dataDomandaGiudiziale);

    const commerciali = calcolaInteressiCommerciali({
      capitale: capitaleParsed,
      dataScadenza,
      dataFinale,
      pagamenti,
      tassi
    });

    const domandaEntroPeriodo = dataDomandaGiudiziale && parseDateISO(dataDomandaGiudiziale) <= parseDateISO(dataFinale);
    const interessiMaturatiAllaDomanda = domandaEntroPeriodo ? calcolaInteressiMaturatiAllaDomandaGiudiziale({
      capitale: capitaleParsed,
      dataScadenza,
      dataDomandaGiudiziale,
      pagamenti,
      tassi
    }) : 0;

    const anatocismoRate = resolveAnatocismoRate({
      tipoTassoAnatocismo,
      tassoPersonalizzato,
      dataDomandaGiudiziale,
      dataFinale,
      tassiCommerciali: tassi,
      tassiLegali
    });

    const anatocismo = calcolaAnatocismo({
      interessiMaturatiAllaDomanda,
      dataDomandaGiudiziale,
      dataFinale,
      tassoAnatocismo: anatocismoRate.tassoAnatocismo,
      dataScadenza
    });

    const totale = commerciali.capitaleResiduo + commerciali.totaleInteressiCommerciali + anatocismo.anatocismo;
    return {
      capitaleResiduo: roundMoney(commerciali.capitaleResiduo),
      interessiCommerciali: roundMoney(commerciali.totaleInteressiCommerciali),
      interessiCommercialiLordi: roundMoney(commerciali.interessiLordiMaturati),
      interessiMaturatiAllaDomanda: roundMoney(interessiMaturatiAllaDomanda),
      anatocismo: roundMoney(anatocismo.anatocismo),
      totale: roundMoney(totale),
      warning: [...commerciali.warnings, ...anatocismoRate.warnings, ...anatocismo.warnings],
      ipotesi: [
        ...DEFAULT_ASSUMPTIONS,
        `Tasso anatocismo selezionato: ${anatocismoRate.label}.`,
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
      dataPagamento: row.querySelector("[data-payment-date]").value,
      importoPagamento: row.querySelector("[data-payment-amount]").value
    })).filter((payment) => payment.dataPagamento || payment.importoPagamento);

    return {
      capitale: document.querySelector("#capitale").value,
      dataScadenza: document.querySelector("#dataScadenza").value,
      dataFinale: document.querySelector("#dataFinale").value,
      pagamenti: payments,
      dataDomandaGiudiziale: document.querySelector("#dataDomandaGiudiziale").value,
      tipoTassoAnatocismo: document.querySelector("#tipoTassoAnatocismo").value,
      tassoPersonalizzato: document.querySelector("#tassoPersonalizzato").value
    };
  }

  function renderResults(result) {
    document.querySelector("#capitaleResiduo").textContent = formatEuro(result.capitaleResiduo);
    document.querySelector("#interessiCommerciali").textContent = formatEuro(result.interessiCommerciali);
    document.querySelector("#anatocismo").textContent = formatEuro(result.anatocismo);
    document.querySelector("#totaleDovuto").textContent = formatEuro(result.totale);
    document.querySelector("#interessiDomanda").textContent = formatEuro(result.interessiMaturatiAllaDomanda);
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
          <td><span>${detail.dataInizio}</span><span class="period-separator">-</span><span>${detail.dataFine}</span></td>
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
        <span>Data pagamento</span>
        <input type="date" data-payment-date value="${payment.dataPagamento || ""}">
      </label>
      <label>
        <span>Importo</span>
        <input type="text" inputmode="decimal" data-payment-amount placeholder="0,00" value="${payment.importoPagamento || ""}">
      </label>
      <button class="icon-button" type="button" aria-label="Rimuovi pagamento" title="Rimuovi pagamento">x</button>
    `;
    row.querySelector("button").addEventListener("click", () => row.remove());
    container.appendChild(row);
  }

  function resultToSummary(result) {
    return [
      "Calcolatore interessi commerciali PA",
      `Capitale residuo: ${formatEuro(result.capitaleResiduo)}`,
      `Interessi commerciali residui: ${formatEuro(result.interessiCommerciali)}`,
      `Interessi maturati alla domanda giudiziale: ${formatEuro(result.interessiMaturatiAllaDomanda)}`,
      `Anatocismo: ${formatEuro(result.anatocismo)}`,
      `Totale stimato dovuto: ${formatEuro(result.totale)}`,
      "",
      "Ipotesi principali:",
      ...result.ipotesi.map((item) => `- ${item}`)
    ].join("\n");
  }

  function downloadCSV(result) {
    const header = ["periodo", "giorni", "base_calcolo", "tasso_annuo", "interessi", "pagamento", "capitale_residuo"];
    const rows = result.righe.map((row) => [
      `${row.dataInizio} - ${row.dataFine}`,
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
    renderResults({
      capitaleResiduo: 0,
      interessiCommerciali: 0,
      interessiMaturatiAllaDomanda: 0,
      anatocismo: 0,
      totale: 0,
      warning: ["Inserisci i dati e premi Calcola."],
      ipotesi: DEFAULT_ASSUMPTIONS,
      righe: [],
      tassoAnatocismoEffettivo: 0
    });
  }

  function setupDom() {
    if (!global.document) return;

    addPaymentRow();
    renderList("#assumptionList", DEFAULT_ASSUMPTIONS);
    renderList("#warningList", ["Inserisci i dati e premi Calcola."]);

    document.querySelector("#addPayment").addEventListener("click", () => addPaymentRow());
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
        renderList("#warningList", [error.message || "Errore nel calcolo."]);
      }
    });

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
    calcolaAnatocismo,
    calcolaTotale,
    formatDateISO,
    addDays
  };

  global.InteressiPACalculator = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (global.document) global.addEventListener("DOMContentLoaded", setupDom);
})(typeof globalThis !== "undefined" ? globalThis : window);
