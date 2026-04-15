## Twain Vakantieplanner

Gedeelde teamplanner voor:

- Jens
- Stijn
- Hermann

## Wat dit project doet

- vakantie en thuiswerk registreren
- dagen rechtstreeks aanklikken in de kalender
- dezelfde planning delen tussen meerdere collega's
- overzicht per maand en per persoon
- komende registraties en recente toevoegingen tonen

## Structuur

- `index.html`: de volledige frontend
- `api/planner.js`: Vercel Function voor gedeelde opslag
- `package.json`: dependency voor Vercel Blob

## Deploy op Vercel

1. Zet deze map in een GitHub-repo of deploy ze rechtstreeks als Vercel-project.
2. Koppel een **private Vercel Blob store** aan het project.
3. Vercel voegt dan automatisch `BLOB_READ_WRITE_TOKEN` toe aan het project.
4. Open na deploy de site-url van het project.

## Belangrijke noot

Zonder Vercel Blob werkt dit niet als gedeelde planning. Dan kan de frontend de backend wel laden, maar is er geen centrale opslag beschikbaar voor het team.
