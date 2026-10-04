# Kiss My Cookie

Statische website voor Kiss My Cookie. De publiceerbare bestanden staan in `site/`.
De website heeft geen database, serverfuncties of buildstap nodig.

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
