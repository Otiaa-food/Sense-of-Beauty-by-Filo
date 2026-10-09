# Styleguide Sense of Beauty by Filo

Vorbild: lumoskinlab.de (Aufbau, Bildsprache, Ruhe), übertragen auf Filos warme Farbwelt.

## Was Lumo ausmacht (gelernt aus den Screenshots)

- **Bild zuerst.** Vollbild-Video im Titel, danach immer wieder große Fotos: Bildstreifen mit 3 Hochformaten,
  einzelne Querformate über die volle Breite, Galerie im Mosaik, Instagram-Raster mit kleinen Kacheln.
- **Viel Weißraum, wenig Text.** Kurze Absätze in dünner, kleiner Schrift, große Überschriften in dünner Schrift.
- **Eine Schrift.** Montserrat in dünnen Schnitten. Einzelne Titel weit gesperrt („About me", „Studioadresse").
- **Eckig.** Keine runden Ecken, Knöpfe sind dunkle Rechtecke mit Großbuchstaben.
- **Farbflächen als Ruhepunkte.** Graue Blöcke mit weißer Schrift (Zitat, About me), Foto mit hellem Schleier und
  Text darauf (Studioadresse), dunkle Karten mit Preisen (Behandlungen), heller grauer Footer.
- **Wiederkehrender Schluss.** Jede Seite endet mit Social-Raster, Kontakt und Footer.
- **Menü.** Desktop: Leiste mit Untermenüs. Handy: Vollbild-Menü, große dünne Schrift, Untermenüs zum Aufklappen.

## Übertragen auf Filo

| Token | Wert | Einsatz |
| --- | --- | --- |
| paper | `#FAF7F2` | Seitenhintergrund (Lumo: helles Grau, bei uns warm) |
| white | `#FFFFFF` | Kopfzeile, Formulare |
| stone | `#EDE6DC` | Footer, ruhige Flächen |
| taupe | `#857262` | Farbblöcke mit weißer Schrift (Kontrast 4,6:1) |
| espresso | `#2B2420` | Knöpfe, Behandlungskarten, Überschriften |
| muted | `#5F544C` | Fließtext (Kontrast 6,9:1 auf paper) |

- **Schrift:** Montserrat (lokal eingebunden, kein Google-Server). Titel 300, Text 350–400, Labels 500 in Großbuchstaben, gesperrt.
- **Ecken:** 0 überall.
- **Knopf:** espresso, weiße Großbuchstaben, 48 px hoch. Zweitknopf: Rahmen 1 px.
- **Bilder:** Hochformat 4:5 in Streifen, Querformat 3:2 einzeln, Quadrate im Social-Raster. Alle Fotos sind Platzhalter, bis Filos Fotos da sind.
- **Bewegung:** nur das Titel-Video bzw. ein sanftes Einblenden des Titelbilds.

## Seitenaufbau

- Start: Titelbild/-video, Satz in Farbblock, Über Filo, Studioadresse auf Foto, Korean Skincare mit Bildstreifen,
  So läuft dein Termin, Behandlungen mit Bild, Instagram-Raster, Footer mit Kontakt.
- Über Filo (mit Stimmen), Behandlungen & Preise (dunkle Karten je Kategorie mit Foto), Studio (Mosaik),
  Termine (Buchen, Pflegehinweise, Stornierung), Kontakt.
