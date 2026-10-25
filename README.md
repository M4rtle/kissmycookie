# Kiss My Cookie

Statische website voor Kiss My Cookie. De publiceerbare bestanden staan in `site/`.
De publieke website heeft geen buildstap nodig. De wishlist gebruikt Cloudflare
Pages Functions en D1; de overige pagina's en bestanden blijven statisch.

## Talen en lokale controle

De website en privacypagina zijn beschikbaar in Nederlands, Engels en Frans.
Bij het eerste bezoek wordt de eerste ondersteunde taal uit de browservoorkeuren
gebruikt; zonder ondersteunde taal wordt Nederlands gekozen. De knoppen NL / EN /
FR wisselen direct van taal. Een expliciete keuze wordt lokaal bewaard onder
`kissmycookie.language` en krijgt bij volgende bezoeken voorrang. Als de browser
opslag blokkeert, blijft wisselen op de huidige pagina mogelijk.

Alle teksten, productgegevens, afbeeldingsbeschrijvingen, toegankelijkheidslabels
en paginametadata staan in `site/i18n-data.js`; de wishlist vult de catalogus aan
via `site/wishlist-copy.js`. De gemarkeerde HTML-elementen
worden vertaald door `site/i18n.js`; de interactieve onderdelen gebruiken dezelfde
catalogus. Nieuwe teksten moeten in alle drie de talen worden toegevoegd.
Merk- en collectienamen blijven herkenbaar. De site gebruikt hiervoor geen externe
vertaaldienst. Zonder JavaScript blijft de Nederlandse basispagina beschikbaar.

Start de lokale website met `Start preview.cmd` of met `node preview.cjs` vanuit
de repositoryroot en bezoek `http://127.0.0.1:4173`. Deze preview bevat ook de
lokale wishlist-API, zodat de bakrondebalk zichtbaar is. Gebruik de tijdelijke
beheerlink uit de terminal om lokale bakrondes aan te passen. De scripts voor lokale
browsercontroles staan buiten de gepubliceerde `site/`-map.

## Cloudflare Pages via GitHub

- GitHub-plan: Free; gebruik een privérepository.
- Cloudflare Pages-plan: Free.
- Production branch: `main`.
- Framework preset: `None`.
- Build command: leeg laten.
- Build output directory: `site`.
- Root directory: standaardwaarde (repositoryroot).

Wijzigingen op de productiebranch worden automatisch gepubliceerd door de
Cloudflare Pages Git-integratie. GitHub Actions is hiervoor niet nodig.

Test eerst op het toegewezen `pages.dev`-adres. Koppel daarna `kissmycookie.be`
en `www.kissmycookie.be`. Controleer en behoud bestaande e-mailrecords voordat
de nameservers bij GoDaddy worden gewijzigd.

Bronmateriaal, lokale previews, archieven en controlebeelden worden via
`.gitignore` buiten de repository gehouden.

## Wishlist en opvolgmodule

Bezoekers kunnen per product hun interesse voor de volgende bakronde aangeven.
Macarons en sweets tellen afzonderlijk mee, ook als ze dezelfde smaaknaam hebben.
Een browser telt per product en bakronde eenmaal mee. Opnieuw klikken trekt de
voorkeur in. Dit zijn interessecijfers, geen bestellingen of productieaantallen.
Andere toestellen, gewiste browseropslag of geautomatiseerd stemmen kunnen opnieuw
meetellen: dit is geen fraudebestendige stemming.

De module op `/opvolging` beheert bakrondes, productvoorkeuren, selecties en voorraad.
Je kunt meerdere toekomstige rondes aanmaken met een naam, begindatum en inclusieve
einddatum. Iedere ronde bewaart eigen stemmen, selectie en voorraad. Een nieuwe
ronde aanmaken sluit andere rondes niet af. Datums en de aankondiging op de website
komen nu uit dit beheer; aanpassen van JavaScript is niet meer nodig.

De statussen zijn **Gepland**, **Aan het bakken**, **Bakken klaar / voorraadverkoop**
en **Afgesloten**. De kalender bepaalt wanneer de bakweek loopt en wanneer de
bakperiode afgelopen is; dit zegt niet welke producten daadwerkelijk gebakken zijn.
Na de einddatum blijft alleen expliciet gemarkeerde voorraad beschikbaar. Met de
status voorraadverkoop kun je het bakken ook eerder beëindigen. Afsluiten verbergt
die ronde en haar voorraad op de website, maar bewaart de gegevens in het beheer.
De status kan later opnieuw worden aangepast.

De website toont eerst een lopende ronde, anders de eerstvolgende geplande ronde.
Bij overlappende rondes heeft de vroegste begindatum voorrang. Beschikbare voorraad
uit andere rondes wordt daarnaast getoond. Zonder lopende/toekomstige
ronde wordt een ronde met resterende voorraad aangekondigd. De wishlist telt
voor de aangekondigde lopende/toekomstige ronde; tijdens alleen voorraadverkoop
is stemmen uitgeschakeld.

In het productoverzicht vink je de definitieve **bakselectie** aan en kies je
**Selectie publiceren**. Pas dan krijgen de gekozen macarons en sweets op de
website en in de productdetails het label **Geselecteerd voor de volgende bakronde**,
of **Geselecteerd voor deze bakronde** tijdens de bakweek. De aankondiging
toont automatisch dat de selectie bepaald is. De website haalt wijzigingen bij
openen, terugkeren en elke minuut op. Publiceer een lege selectie om de beslissing
in te trekken. Ongepubliceerde wijzigingen blijven tijdens automatische verversing
staan; gelijktijdige wijzigingen op een ander toestel worden niet overschreven.
Nieuwe rondes starten zonder selectie. De selectie kan voor toekomstige en lopende
rondes aangepast worden; na beëindiging blijft deze ter inzage bewaard.

Onder **Voorraad beheren** kun je per geselecteerd product beschikbaarheid en
optioneel een geheel aantal (0–100000) invoeren. Leeg betekent onbekend, 0 is
uitverkocht. Een positief aantal maakt een product nooit automatisch beschikbaar.
Vink **Gebakken en beschikbaar** pas aan als dat product werkelijk klaar is voor
verkoop. Dit kan per product tijdens de bakweek: andere producten blijven alleen
geselecteerd. Zelfs een toekomstige datum, het begin/einde van de bakweek of de
status voorraadverkoop zetten deze aanduiding nooit vanzelf aan. Het vinkje maakt
het product expliciet beschikbaar, ook als het al vóór de geplande datum klaar is.
Aantallen blijven privé; de website toont alleen **Nog op voorraad**. Het vinkje
uitzetten verbergt beschikbaarheid maar bewaart de interne telling; 0 schakelt
beschikbaarheid uit.
Een product met geregistreerde voorraad blijft beheerbaar als je het later uit de
selectie haalt. Het zijn handmatige tellingen: er worden geen bestellingen of
reserveringen aangemaakt en aantallen verminderen niet automatisch.

Sla iedere sectie op voordat je een andere bewerkt. Niet-opgeslagen wijzigingen
blokkeren verversen en wisselen van ronde; gelijktijdige wijzigingen vanaf een
ander toestel geven een conflict in plaats van stilzwijgend tellingen te vervangen.

Voer bij een bestaande database vóór het publiceren van deze uitbreiding ook uit:

```powershell
npx wrangler d1 execute kissmycookie-wishlist --remote --file=migrations/0002_bake_selection.sql
npx wrangler d1 execute kissmycookie-wishlist --remote --file=migrations/0003_round_management.sql
```

### Eenmalige Cloudflare-configuratie

Behoud het bestaande Pages-project, de Git-koppeling, de lege build command en
outputmap `site`. Er is geen nieuw hostingplatform of betaald plan nodig.
Zolang de binding ontbreekt, toont de wishlist een melding en blijft stemmen
uitgeschakeld; voorkeuren worden niet als succesvol opgeslagen voorgesteld.

1. Maak in Cloudflare **Storage & databases > D1** een database
   `kissmycookie-wishlist` aan op het Free-plan. Kies bij voorkeur een Europese
   locatie. Dit kan ook via `npx wrangler d1 create kissmycookie-wishlist`.
2. Voer vanuit de repository de migratie uit na `npx wrangler login`:

   ```powershell
   npx wrangler d1 execute kissmycookie-wishlist --remote --file=migrations/0001_wishlist.sql
   npx wrangler d1 execute kissmycookie-wishlist --remote --file=migrations/0002_bake_selection.sql
   npx wrangler d1 execute kissmycookie-wishlist --remote --file=migrations/0003_round_management.sql
   ```

   Voer migraties één keer uit, in deze volgorde. De derde migratie bewaart de
   oorspronkelijke decemberdatums voor de nog open eerste ronde. De SQL kan ook
   via de D1-console worden uitgevoerd. Gebruik voor previews
   een afzonderlijke database om teststemmen uit productie te houden.
3. Open het bestaande **Workers & Pages > Pages-project > Settings > Bindings**.
   Voeg een D1-binding toe met naam **WISHLIST_DB**, gekoppeld aan die database.
4. Genereer lokaal één persoonlijke sleutel:

   ```powershell
   node scripts/create-wishlist-access.mjs https://kissmycookie.be
   ```

   Het script maakt `wishlist-access.txt` buiten `site/`; dit bestand is door
   `.gitignore` uitgesloten. Het overschrijft nooit een bestaand bestand.
   Voeg de waarde uit dit bestand in Cloudflare Pages **Settings > Variables
   and Secrets** toe als **Secret** met naam **WISHLIST_ADMIN_KEY**. Sla de
   sleutel nooit op in Git, HTML, een manifest of een URL-queryparameter.
5. Publiceer de wijzigingen via de bestaande Git-integratie en herpubliceer na
   wijzigingen aan bindings/secrets. De rootmap `functions/`, `migrations/` en
   de nieuwe bestanden in `site/` moeten worden meegepubliceerd in Git.
6. Open de persoonlijke link uit `wishlist-access.txt` op desktop en gsm. De
   sleutel staat achter `#key=` en wordt dus niet in het paginaverzoek naar de
   host verzonden. De pagina bewaart hem lokaal, verwijdert het fragment uit de
   adresbalk en stuurt de sleutel alleen in de Authorization-header naar de API.
   Zonder sleutel blijven beheerdata en beheeracties ontoegankelijk.
7. Desktop: installeer de module via Chrome/Edge; gsm: voeg toe aan beginscherm.
   Installatie en overdracht van browseropslag verschillen per toestel. Als de
   geïnstalleerde app om de persoonlijke link vraagt, open die link in de app.
   Internet is nodig; er worden geen beheerdata offline gecachet en er zijn
   geen pushmeldingen. Blokkeert het toestel lokale opslag, dan moet de link
   bij een volgend bezoek opnieuw worden geopend.

Wie de link bezit kan de module beheren. Om een gedeelde of verloren link in te
trekken: genereer een nieuwe willekeurige sleutel, vervang het Cloudflare Secret
en herpubliceer. Open de nieuwe link op je eigen toestellen; oude sleutels werken
dan niet meer. Maak geen openbare link naar de opvolgmodule of de geheime link.

### Controle en lokaal testen

Node 24 of nieuwer is nodig voor de lokale SQL-tests en preview; productie draait
op Cloudflare Pages Functions met D1 en heeft geen Node-installatie nodig.

```powershell
node --test tests/wishlist.test.mjs
node scripts/preview-wishlist.mjs
```

De preview draait op `http://127.0.0.1:4174` met een tijdelijke database en toont
een tijdelijke lokale beheerlink in de terminal. Dit is alleen een demo: de
stemmen en wijzigingen verdwijnen bij stoppen. `Start preview.cmd` en
`node preview.cjs` starten dezelfde volledige demo op poort 4173. Lokale
bakrondes staan los van de live website. Een toekomstige bakronde toont de
aftelling; tijdens het bakken toont de balk **De bakronde is bezig!**.

De browserregressie `node tests/round-management-ui.mjs` gebruikt Playwright en
Chrome met een tijdelijke database en onderschepte lokale requests. Ze controleert
plannen, selecteren, voorraad met en zonder telling, beëindigen, uitverkopen,
archiveren, talen en mobiele weergave. Playwright moet via de Node-modulezoekpaden
beschikbaar zijn. Screenshots worden onder `research/round-management-*.png` gezet.

Controleer na livegang met twee browsers: een voorkeur toevoegen, vernieuwen,
opnieuw klikken, het beheertotaal bekijken en een testronde afsluiten. Controleer
ook dat `/api/wishlist/admin` zonder geldige sleutel HTTP 401 geeft.

De gratis quota worden gedeeld met eventueel ander Cloudflare-gebruik op het
account. Beperkingen zijn geen garantie voor onbeperkt gratis gebruik; bij het
bereiken van het Free-planlimiet kan de API tijdelijk niet beschikbaar zijn.
Er worden geen IP-adressen, namen of contactgegevens in de wishlist-database
opgeslagen. Een willekeurige browsersleutel wordt per ronde gehasht voor
ontdubbeling; beheerders ontvangen uitsluitend totalen.
