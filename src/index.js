import { getMinRates } from './get_rates.js';
import util from 'util';

try {
  let result = await getMinRates('2022-12-04', 'Dollar', 5);
  console.log(util.inspect(result, {showHidden: false, depth: null, colors: true}))
  
} catch (error) {
  console.log(error);
}