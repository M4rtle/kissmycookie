// Run locally once. Never write a production key into the published site/ folder.
import {randomBytes} from 'node:crypto';
import {writeFileSync} from 'node:fs';
const origin = new URL(process.argv[2] || 'https://kissmycookie.be');
if (origin.protocol !== 'https:') throw new Error('Gebruik het https-adres van je website.');
const key = randomBytes(32).toString('base64url');
const path = new URL('../wishlist-access.txt',import.meta.url);
writeFileSync(path,
  'PRIVE — niet delen of uploaden naar GitHub.\n\n' +
  'Cloudflare Pages > Settings > Variables and Secrets > Add (Secret)\n' +
  'Naam: WISHLIST_ADMIN_KEY\nWaarde: ' + key + '\n\n' +
  'Persoonlijke toegangslink:\n' + origin.origin + '/opvolging#key=' + key + '\n\n' +
  'Open deze link eenmalig op elk toestel. Installeer daarna de opvolgmodule.\n' +
  'Een nieuwe sleutel instellen maakt alle oude toegangslinks ongeldig na herpublicatie.\n',
  {encoding:'utf8',flag:'wx'});
console.log('Persoonlijke sleutel en link opgeslagen in wishlist-access.txt (uitgesloten van Git).');
