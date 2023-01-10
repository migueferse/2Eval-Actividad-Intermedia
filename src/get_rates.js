import fetch from 'node-fetch';
const URL = 'https://api.frankfurter.app';

async function getCurrencies() {
  let url = `${URL}/currencies`;
    let response = await fetch(url);
    if (response.status !== 200) {
      throw 'No se han podido obtener las divisas'
    }

    let data = await response.json();
    return data;
}

async function getCurrencyRates(date, currency) {
  let url = `${URL}/${date}?from=${currency}`;
  let response = await fetch(url);
  if (response.status !== 200) {
    throw `No se ha podido obtener el cambio para la divisa ${currency} el dia ${date} :`
  }

  let data = await response.json();
  return data;
}

async function getCurrencyRateToEur(date, currency) {
  let url = `${URL}/${date}?from=${currency}&to=EUR`;
  let response = await fetch(url);
  if (response.status !== 200) {
    throw `No se ha podido obtener el cambio para la divisa ${currency} el dia ${date} :`
  }
  
  let data = await response.json();
  return data;
}

function getCurrencyName(currencies, currency) {
  for (const key in currencies) {
    if((currencies[key].toLowerCase()).includes(currency.toLowerCase())) {
      return key;
    }
  }

  throw 'No se ha encontrado ninguna divisa con el nombre ' + currency;
}

function getCurrencyMinRate(currencyRates) {
  let minRate = 1000;
  let minCurrency;
  for (const key in currencyRates) {
    const element = currencyRates[key];
    if (element < minRate) {
      minRate = element;
      minCurrency = key;
     }
  }

  return minCurrency;
}

function substractDays(date, days) {
  let newDate = new Date(date);
  newDate.setDate(newDate.getDate() - days);
  newDate = newDate.toISOString().slice(0,10);
  return newDate;
}

function getDateWeeks(date, weeks) {
  let arrayDateWeeks = [];
  let days = 0;
  for (let i = 0; i < weeks; i++) {
    let longDate = substractDays(date, days);
    arrayDateWeeks.push(longDate);
    days = days + 7;    
  }

  return arrayDateWeeks;
}

function validateDates(dateWeek, dateFromAPI, currency, date) {
  let newDate = new Date(dateWeek);
  let newDateFromApi = new Date(dateFromAPI);
  let daysDiff = (newDate - newDateFromApi)/(1000*60*60*24);
  let isValidDate = daysDiff <= 2 ? true : false;
  if (!isValidDate) {
    throw `No se ha podido obtener el cambio para la divisa ${currency} el dia ${date} : El cambio no pertenece a la fecha solicitada`
  } else {
    return isValidDate;
  }
}

async function getMinRates(date, currency, weeks) {
    let currencies = await getCurrencies();
    let currencyName = getCurrencyName(currencies, currency);
    let arrayDateWeeks = getDateWeeks(date, weeks);
    let arrayCurrencyRates = await Promise.all(
      arrayDateWeeks.map(async (dateWeek) =>  {
        let currencyRates = await getCurrencyRates(dateWeek, currencyName);
        validateDates(dateWeek, currencyRates.date, currencyName, date);          
        let currencyMinRate = getCurrencyMinRate(currencyRates.rates);
        let dateMinusOne = substractDays(dateWeek, 1);
        let currencyRateToEur = await getCurrencyRateToEur(dateMinusOne, currencyMinRate);        
        validateDates(dateMinusOne, currencyRateToEur.date, currencyName, date)
        let objectRatesLine = {};
        let objectMinLine = {};
        objectRatesLine.day = dateWeek;
        objectMinLine.currency = currencyMinRate;
        objectMinLine.EUR = currencyRateToEur.rates.EUR
        objectRatesLine.min = objectMinLine;
        return objectRatesLine;
      })
    );

    let arrayRatesSorted = arrayCurrencyRates.reverse((data) => data.day);
    let response = {
      currency: currencyName,
      rates: arrayRatesSorted
    }

    return response;
}

export {
  getMinRates
}
