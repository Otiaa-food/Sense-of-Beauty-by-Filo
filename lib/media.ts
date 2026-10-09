/**
 * Alle Fotos und Videos der Website an EINER Stelle.
 *
 * Fast alles hier sind PLATZHALTER (Google-Profil, Instagram-Screenshots, Unsplash),
 * bis Filos Fotos in guter Qualität da sind. Tauschen = Datei nach public/media legen,
 * hier Pfad und Maße anpassen. Der restliche Code bleibt gleich.
 *
 * Wichtig: Kundinnen-Gesichter und Vorher-nachher-Bilder nur mit schriftlicher Einwilligung.
 */

export type Photo = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Welcher Bildausschnitt beim Zuschneiden sichtbar bleibt (CSS object-position) */
  focus?: string;
};

export type HeroMedia =
  | ({ kind: "image" } & Photo)
  /** Kurzes, stummes Video (mp4, am besten unter 4 MB). poster = Standbild, bis das Video lädt. */
  | { kind: "video"; src: string; poster: Photo };

const photo = (p: Photo) => p;

export const photos = {
  filoNeon: photo({
    src: "/media/filo-neon.webp",
    alt: "Filo vor der Holzwand mit dem Neon-Schriftzug „Hello Beautiful“",
    width: 1080,
    height: 1542,
    focus: "50% 22%",
  }),
  filoPortrait: photo({
    src: "/media/filo-portrait.webp",
    alt: "Filo, Inhaberin von Sense of Beauty, im schwarzen Blazer",
    width: 768,
    height: 737,
    focus: "50% 20%",
  }),
  studioFlur: photo({
    src: "/media/studio-flur.webp",
    alt: "Eingangsbereich des Studios mit beleuchteter Holzwand",
    width: 768,
    height: 576,
  }),
  studioRaum: photo({
    src: "/media/studio-raum.webp",
    alt: "Behandlungsraum mit Empfangstheke „Sense of Beauty“ und Behandlungsliege",
    width: 768,
    height: 432,
  }),
  lashes: photo({
    src: "/media/lashes.webp",
    alt: "Wimpern nach einem Lashlifting",
    width: 768,
    height: 235,
  }),
  schulungZertifikat: photo({
    src: "/media/schulung-zertifikat.webp",
    alt: "Filo mit ihrer Trainerin und dem Zertifikat der K-Beauty-Schulung",
    width: 1080,
    height: 1380,
    focus: "50% 30%",
  }),
  schulungTrainerin: photo({
    src: "/media/schulung-trainerin.webp",
    alt: "Filo mit ihrer Trainerin in Frankfurt",
    width: 1080,
    height: 1280,
    focus: "50% 35%",
  }),
  glowMood: photo({
    src: "/media/hero-unsplash.webp",
    alt: "Frau im Profil mit natürlich strahlender Haut",
    width: 1600,
    height: 2400,
    focus: "60% 40%",
  }),
};

/**
 * Titelbereich der Startseite: Video von Filos Instagram (10 Sek., ohne Ton).
 * ACHTUNG: zeigt Kundinnen. Vor dem Livegang muss Filo bestätigen, dass die Kundinnen
 * der Nutzung auf der Website zugestimmt haben. Sonst Ersatz: { kind: "image", ...photos.glowMood }
 */
export const heroMedia: HeroMedia = {
  kind: "video",
  src: "/media/hero.mp4",
  poster: photo({
    src: "/media/hero-poster.webp",
    alt: "",
    width: 1080,
    height: 1258,
  }),
};

/** Ein Foto je Behandlungs-Kategorie (Schlüssel = slug aus der Datenbank). */
export const categoryPhotos: Record<string, Photo> = {
  "korean-facials": photos.glowMood,
  "laser-damen": photos.studioFlur,
  // Platzhalter: das vorhandene Wimpern-Foto ist zu klein für ein Hochformat. Bitte ein Lashes-Foto nachreichen.
  lashes: photos.studioRaum,
};

/** Bildstreifen auf der Startseite (3 Hochformate) */
export const homeStrip: Photo[] = [photos.studioRaum, photos.glowMood, photos.studioFlur];

/** Studio-Galerie (Mosaik) */
export const studioGallery: Photo[] = [photos.studioFlur, photos.filoNeon, photos.studioRaum];

/** Ausgewählte Fotos für das Instagram-Raster (kein Live-Feed, datenschutzfreundlich) */
export const socialGrid: Photo[] = [
  photos.filoNeon,
  photos.studioRaum,
  photos.schulungZertifikat,
  photos.studioFlur,
  photos.filoPortrait,
  photos.glowMood,
  photos.schulungTrainerin,
];
