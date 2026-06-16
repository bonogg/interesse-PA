/*
 * Static rate tables for the calculator.
 *
 * Values are expressed as decimals: 0.08 = 8%.
 * Keep this file local and update it when official MEF/Gazzetta Ufficiale
 * notices publish new half-year rates.
 */
(function attachRates(global) {
  const tassiCommerciali = [
    {
      dataInizio: "2020-01-01",
      dataFine: "2020-06-30",
      tassoRiferimento: 0,
      maggiorazione: 0.08,
      tassoAnnuo: 0.08,
      fonteLabel: "MEF / Gazzetta Ufficiale",
      fonteUrl: "https://www.mef.gov.it/"
    },
    {
      dataInizio: "2020-07-01",
      dataFine: "2020-12-31",
      tassoRiferimento: 0,
      maggiorazione: 0.08,
      tassoAnnuo: 0.08,
      fonteLabel: "MEF / Gazzetta Ufficiale",
      fonteUrl: "https://www.mef.gov.it/"
    },
    {
      dataInizio: "2021-01-01",
      dataFine: "2021-06-30",
      tassoRiferimento: 0,
      maggiorazione: 0.08,
      tassoAnnuo: 0.08,
      fonteLabel: "MEF / Gazzetta Ufficiale",
      fonteUrl: "https://www.mef.gov.it/"
    },
    {
      dataInizio: "2021-07-01",
      dataFine: "2021-12-31",
      tassoRiferimento: 0,
      maggiorazione: 0.08,
      tassoAnnuo: 0.08,
      fonteLabel: "MEF / Gazzetta Ufficiale",
      fonteUrl: "https://www.mef.gov.it/"
    },
    {
      dataInizio: "2022-01-01",
      dataFine: "2022-06-30",
      tassoRiferimento: 0,
      maggiorazione: 0.08,
      tassoAnnuo: 0.08,
      fonteLabel: "MEF / Gazzetta Ufficiale",
      fonteUrl: "https://www.mef.gov.it/"
    },
    {
      dataInizio: "2022-07-01",
      dataFine: "2022-12-31",
      tassoRiferimento: 0,
      maggiorazione: 0.08,
      tassoAnnuo: 0.08,
      fonteLabel: "MEF / Gazzetta Ufficiale",
      fonteUrl: "https://www.mef.gov.it/"
    },
    {
      dataInizio: "2023-01-01",
      dataFine: "2023-06-30",
      tassoRiferimento: 0.025,
      maggiorazione: 0.08,
      tassoAnnuo: 0.105,
      fonteLabel: "MEF / Gazzetta Ufficiale",
      fonteUrl: "https://www.mef.gov.it/"
    },
    {
      dataInizio: "2023-07-01",
      dataFine: "2023-12-31",
      tassoRiferimento: 0.04,
      maggiorazione: 0.08,
      tassoAnnuo: 0.12,
      fonteLabel: "MEF / Gazzetta Ufficiale",
      fonteUrl: "https://www.mef.gov.it/"
    },
    {
      dataInizio: "2024-01-01",
      dataFine: "2024-06-30",
      tassoRiferimento: 0.045,
      maggiorazione: 0.08,
      tassoAnnuo: 0.125,
      fonteLabel: "MEF / Gazzetta Ufficiale",
      fonteUrl: "https://www.mef.gov.it/"
    },
    {
      dataInizio: "2024-07-01",
      dataFine: "2024-12-31",
      tassoRiferimento: 0.0425,
      maggiorazione: 0.08,
      tassoAnnuo: 0.1225,
      fonteLabel: "MEF / Gazzetta Ufficiale",
      fonteUrl: "https://www.mef.gov.it/"
    },
    {
      dataInizio: "2025-01-01",
      dataFine: "2025-06-30",
      tassoRiferimento: 0.0315,
      maggiorazione: 0.08,
      tassoAnnuo: 0.1115,
      fonteLabel: "MEF / Gazzetta Ufficiale",
      fonteUrl: "https://www.mef.gov.it/"
    },
    {
      dataInizio: "2025-07-01",
      dataFine: "2025-12-31",
      tassoRiferimento: 0.0215,
      maggiorazione: 0.08,
      tassoAnnuo: 0.1015,
      fonteLabel: "MEF / Gazzetta Ufficiale",
      fonteUrl: "https://www.mef.gov.it/"
    },
    {
      dataInizio: "2026-01-01",
      dataFine: "2026-06-30",
      tassoRiferimento: 0.0215,
      maggiorazione: 0.08,
      tassoAnnuo: 0.1015,
      fonteLabel: "MEF / Gazzetta Ufficiale",
      fonteUrl: "https://www.mef.gov.it/"
    }
  ];

  const tassiLegali = [
    { dataInizio: "2020-01-01", dataFine: "2020-12-31", tassoAnnuo: 0.0005, fonteLabel: "MEF / Gazzetta Ufficiale", fonteUrl: "https://www.mef.gov.it/" },
    { dataInizio: "2021-01-01", dataFine: "2021-12-31", tassoAnnuo: 0.0001, fonteLabel: "MEF / Gazzetta Ufficiale", fonteUrl: "https://www.mef.gov.it/" },
    { dataInizio: "2022-01-01", dataFine: "2022-12-31", tassoAnnuo: 0.0125, fonteLabel: "MEF / Gazzetta Ufficiale", fonteUrl: "https://www.mef.gov.it/" },
    { dataInizio: "2023-01-01", dataFine: "2023-12-31", tassoAnnuo: 0.05, fonteLabel: "MEF / Gazzetta Ufficiale", fonteUrl: "https://www.mef.gov.it/" },
    { dataInizio: "2024-01-01", dataFine: "2024-12-31", tassoAnnuo: 0.025, fonteLabel: "MEF / Gazzetta Ufficiale", fonteUrl: "https://www.mef.gov.it/" },
    { dataInizio: "2025-01-01", dataFine: "2025-12-31", tassoAnnuo: 0.02, fonteLabel: "MEF / Gazzetta Ufficiale", fonteUrl: "https://www.mef.gov.it/" }
  ];

  global.tassiCommercialiPA = tassiCommerciali;
  global.tassiLegaliItalia = tassiLegali;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { tassiCommerciali, tassiLegali };
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
