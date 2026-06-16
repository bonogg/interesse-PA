/*
 * Static rate tables for the calculator.
 *
 * Values are expressed as decimals: 0.08 = 8%.
 * Keep this file local and update it when official MEF/Gazzetta Ufficiale
 * notices publish new half-year commercial rates or annual legal rates.
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
    { dataInizio: "1942-04-21", dataFine: "1990-12-15", tassoAnnuo: 0.05, fonteLabel: "Codice civile, art. 1284", fonteUrl: "https://www.gazzettaufficiale.it/atto/codici/caricaArticolo?art.codiceRedazionale=042U0262&art.idArticolo=1284" },
    { dataInizio: "1990-12-16", dataFine: "1996-12-31", tassoAnnuo: 0.10, fonteLabel: "Legge 26/11/1990 n. 353", fonteUrl: "https://www.gazzettaufficiale.it/" },
    { dataInizio: "1997-01-01", dataFine: "1998-12-31", tassoAnnuo: 0.05, fonteLabel: "Legge 23/12/1996 n. 662", fonteUrl: "https://www.gazzettaufficiale.it/" },
    { dataInizio: "1999-01-01", dataFine: "2000-12-31", tassoAnnuo: 0.025, fonteLabel: "MEF / Gazzetta Ufficiale", fonteUrl: "https://www.gazzettaufficiale.it/" },
    { dataInizio: "2001-01-01", dataFine: "2001-12-31", tassoAnnuo: 0.035, fonteLabel: "MEF / Gazzetta Ufficiale", fonteUrl: "https://www.gazzettaufficiale.it/" },
    { dataInizio: "2002-01-01", dataFine: "2003-12-31", tassoAnnuo: 0.03, fonteLabel: "MEF / Gazzetta Ufficiale", fonteUrl: "https://www.gazzettaufficiale.it/" },
    { dataInizio: "2004-01-01", dataFine: "2007-12-31", tassoAnnuo: 0.025, fonteLabel: "MEF / Gazzetta Ufficiale", fonteUrl: "https://www.gazzettaufficiale.it/" },
    { dataInizio: "2008-01-01", dataFine: "2009-12-31", tassoAnnuo: 0.03, fonteLabel: "MEF / Gazzetta Ufficiale", fonteUrl: "https://www.gazzettaufficiale.it/" },
    { dataInizio: "2010-01-01", dataFine: "2010-12-31", tassoAnnuo: 0.01, fonteLabel: "MEF / Gazzetta Ufficiale", fonteUrl: "https://www.gazzettaufficiale.it/" },
    { dataInizio: "2011-01-01", dataFine: "2011-12-31", tassoAnnuo: 0.015, fonteLabel: "MEF / Gazzetta Ufficiale", fonteUrl: "https://www.gazzettaufficiale.it/" },
    { dataInizio: "2012-01-01", dataFine: "2013-12-31", tassoAnnuo: 0.025, fonteLabel: "MEF / Gazzetta Ufficiale", fonteUrl: "https://www.gazzettaufficiale.it/" },
    { dataInizio: "2014-01-01", dataFine: "2014-12-31", tassoAnnuo: 0.01, fonteLabel: "MEF / Gazzetta Ufficiale", fonteUrl: "https://www.gazzettaufficiale.it/" },
    { dataInizio: "2015-01-01", dataFine: "2015-12-31", tassoAnnuo: 0.005, fonteLabel: "MEF / Gazzetta Ufficiale", fonteUrl: "https://www.gazzettaufficiale.it/" },
    { dataInizio: "2016-01-01", dataFine: "2016-12-31", tassoAnnuo: 0.002, fonteLabel: "MEF / Gazzetta Ufficiale", fonteUrl: "https://www.gazzettaufficiale.it/" },
    { dataInizio: "2017-01-01", dataFine: "2017-12-31", tassoAnnuo: 0.001, fonteLabel: "MEF / Gazzetta Ufficiale", fonteUrl: "https://www.gazzettaufficiale.it/" },
    { dataInizio: "2018-01-01", dataFine: "2018-12-31", tassoAnnuo: 0.003, fonteLabel: "MEF / Gazzetta Ufficiale", fonteUrl: "https://www.gazzettaufficiale.it/" },
    { dataInizio: "2019-01-01", dataFine: "2019-12-31", tassoAnnuo: 0.008, fonteLabel: "MEF / Gazzetta Ufficiale", fonteUrl: "https://www.gazzettaufficiale.it/" },
    { dataInizio: "2020-01-01", dataFine: "2020-12-31", tassoAnnuo: 0.0005, fonteLabel: "MEF / Gazzetta Ufficiale", fonteUrl: "https://www.gazzettaufficiale.it/" },
    { dataInizio: "2021-01-01", dataFine: "2021-12-31", tassoAnnuo: 0.0001, fonteLabel: "MEF / Gazzetta Ufficiale", fonteUrl: "https://www.gazzettaufficiale.it/" },
    { dataInizio: "2022-01-01", dataFine: "2022-12-31", tassoAnnuo: 0.0125, fonteLabel: "MEF / Gazzetta Ufficiale", fonteUrl: "https://www.gazzettaufficiale.it/" },
    { dataInizio: "2023-01-01", dataFine: "2023-12-31", tassoAnnuo: 0.05, fonteLabel: "MEF / Gazzetta Ufficiale", fonteUrl: "https://www.gazzettaufficiale.it/" },
    { dataInizio: "2024-01-01", dataFine: "2024-12-31", tassoAnnuo: 0.025, fonteLabel: "MEF / Gazzetta Ufficiale", fonteUrl: "https://www.gazzettaufficiale.it/" },
    {
      dataInizio: "2025-01-01",
      dataFine: "2025-12-31",
      tassoAnnuo: 0.02,
      fonteLabel: "MEF / Gazzetta Ufficiale, D.M. 10/12/2024",
      fonteUrl: "https://www.gazzettaufficiale.it/atto/serie_generale/caricaDettaglioAtto/originario?atto.dataPubblicazioneGazzetta=2024-12-16&atto.codiceRedazionale=24A06721&elenco30giorni=false"
    },
    {
      dataInizio: "2026-01-01",
      dataFine: "2026-12-31",
      tassoAnnuo: 0.02,
      fonteLabel: "Art. 1284 c.c. / tasso 2025 confermato salvo modifica",
      fonteUrl: "https://www.gazzettaufficiale.it/atto/codici/caricaArticolo?art.codiceRedazionale=042U0262&art.idArticolo=1284"
    }
  ];

  global.tassiCommercialiPA = tassiCommerciali;
  global.tassiLegaliItalia = tassiLegali;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { tassiCommerciali, tassiLegali };
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
