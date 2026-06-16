const assert = require("assert");
const { tassiCommerciali, tassiLegali } = require("../rates.js");
const calc = require("../app.js");

function approx(actual, expected, tolerance = 0.01) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
}

assert.strictEqual(calc.parseImportoEuro("1.234,56"), 1234.56);
assert.strictEqual(calc.parseImportoEuro("1234.56"), 1234.56);
assert.throws(() => calc.parseImportoEuro("-1"), /Importo/);
assert.throws(() => calc.parseImportoEuro("abc"), /Importo/);

assert.strictEqual(calc.giorniTra("2025-01-02", "2025-01-05"), 3);
assert.strictEqual(calc.giorniTra("02/01/2025", "05/01/2025"), 3);
assert.strictEqual(calc.formatDateISO(calc.addDays("2025-01-31", 1)), "2025-02-01");
assert.strictEqual(calc.formatDateISO(calc.addDays("31/01/2025", 1)), "2025-02-01");
assert.strictEqual(calc.formatDateItalian("2025-06-16"), "16/06/2025");

const split = calc.spezzaPeriodoPerTassi("2025-06-29", "2025-07-02", tassiCommerciali);
assert.strictEqual(split.length, 2);
assert.strictEqual(split[0].dataInizio, "2025-06-29");
assert.strictEqual(split[0].dataFine, "2025-07-01");
assert.strictEqual(split[1].dataInizio, "2025-07-01");

const legal2019 = calc.spezzaPeriodoPerTassi("2019-03-01", "2019-03-02", tassiLegali);
assert.strictEqual(legal2019.length, 1);
assert.strictEqual(legal2019[0].tasso.tassoAnnuo, 0.008);

const simpleInterest = calc.calcolaInteresseSemplice(1000, 0.10, "2025-01-01", "2025-01-11");
approx(simpleInterest, 2.7397, 0.0001);

const noPayments = calc.calcolaTotale({
  capitale: "1000",
  dataScadenza: "01/01/2025",
  dataFinale: "12/01/2025",
  pagamenti: [],
  tassi: tassiCommerciali,
  tassiLegali
});
approx(noPayments.capitaleResiduo, 1000);
approx(noPayments.interessiCommerciali, 3.05);
approx(noPayments.totale, 1003.05);

const withPayment = calc.calcolaTotale({
  capitale: "1000",
  dataScadenza: "01/01/2025",
  dataFinale: "12/01/2025",
  pagamenti: [{ dataPagamento: "07/01/2025", importoPagamento: "200" }],
  tassi: tassiCommerciali,
  tassiLegali
});
assert.ok(withPayment.capitaleResiduo < 802);
assert.ok(withPayment.capitaleResiduo > 800);
assert.ok(withPayment.interessiCommerciali > 1);

const anatocism = calc.calcolaTotale({
  capitale: "1000",
  dataScadenza: "2025-01-01",
  dataFinale: "2025-12-31",
  dataDomandaGiudiziale: "2025-07-10",
  tipoTassoAnatocismo: "personalizzato",
  tassoPersonalizzato: "10",
  pagamenti: [],
  tassi: tassiCommerciali,
  tassiLegali
});
assert.ok(anatocism.interessiMaturatiAllaDomanda > 50);
assert.ok(anatocism.anatocismo > 2);

const legalAnatocism = calc.calcolaTotale({
  capitale: "1000",
  dataScadenza: "2025-01-01",
  dataFinale: "16/06/2026",
  dataDomandaGiudiziale: "10/07/2025",
  tipoTassoAnatocismo: "legale",
  pagamenti: [],
  tassi: tassiCommerciali,
  tassiLegali
});
approx(legalAnatocism.tassoAnatocismoEffettivo, 0.02, 0.0001);
assert.ok(legalAnatocism.ipotesi.some((item) => item.includes("Tassi anatocismo applicati automaticamente")));
assert.ok(!legalAnatocism.warning.some((warning) => warning.includes("legale non copre")));

const missingDomanda = calc.calcolaTotale({
  capitale: "1000",
  dataScadenza: "2025-01-01",
  dataFinale: "2025-02-01",
  pagamenti: [],
  tassi: tassiCommerciali,
  tassiLegali
});
assert.strictEqual(missingDomanda.anatocismo, 0);
assert.ok(missingDomanda.warning.some((warning) => warning.includes("Nessuna data")));

const domandaAfterFinal = calc.calcolaTotale({
  capitale: "1000",
  dataScadenza: "2025-01-01",
  dataFinale: "2025-02-01",
  dataDomandaGiudiziale: "2025-03-01",
  tipoTassoAnatocismo: "commerciale",
  pagamenti: [],
  tassi: tassiCommerciali,
  tassiLegali
});
assert.strictEqual(domandaAfterFinal.interessiMaturatiAllaDomanda, 0);
assert.strictEqual(domandaAfterFinal.anatocismo, 0);
assert.ok(domandaAfterFinal.warning.some((warning) => warning.includes("non è successiva")));

console.log("All calculation tests passed.");
