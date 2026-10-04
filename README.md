# Kiss My Cookie

Statische website voor Kiss My Cookie. De publiceerbare bestanden staan in `site/`.
De website heeft geen database, serverfuncties of buildstap nodig.

## Talen en lokale controle

De website en privacypagina zijn beschikbaar in Nederlands, Engels en Frans.
Bij het eerste bezoek wordt de eerste ondersteunde taal uit de browservoorkeuren
gebruikt; zonder ondersteunde taal wordt Nederlands gekozen. De knoppen NL / EN /
FR wisselen direct van taal. Een expliciete keuze wordt lokaal bewaard onder
`kissmycookie.language` en krijgt bij volgende bezoeken voorrang. Als de browser
opslag blokkeert, blijft wisselen op de huidige pagina mogelijk.

Alle teksten, productgegevens, afbeeldingsbeschrijvingen, toegankelijkheidslabels
en paginametadata staan in `site/i18n-data.js`. De gemarkeerde HTML-elementen
worden vertaald door `site/i18n.js`; de interactieve onderdelen gebruiken dezelfde
catalogus. Nieuwe teksten moeten in alle drie de talen worden toegevoegd.
Merk- en collectienamen blijven herkenbaar. De site gebruikt hiervoor geen externe
vertaaldienst. Zonder JavaScript blijft de Nederlandse basispagina beschikbaar.

Start de lokale website met `Start preview.cmd` of met `node preview.cjs` vanuit
de repositoryroot en bezoek `http://127.0.0.1:4173`. De scripts voor lokale
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
