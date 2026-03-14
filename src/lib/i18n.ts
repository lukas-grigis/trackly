import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "de" | "en";

export interface Translations {
  // Navigation
  back: string;
  appName: string;
  // Language / theme
  toggleLanguage: string;
  toggleTheme: string;
  // Home page
  sessions: string;
  newSession: string;
  noSessions: string;
  createSession: string;
  sessionName: string;
  sessionDate: string;
  sessionNamePlaceholder: string;
  clearAllData: string;
  clearAllDataConfirm: string;
  clearAllDataDesc: string;
  deleteEverything: string;
  cancel: string;
  exportCsv: string;
  // Session card
  athletes: string;
  results: string;
  editSession: string;
  deleteSession: string;
  deleteSessionConfirm: string;
  deleteSessionDesc: string;
  // Session page
  childrenTab: string;
  resultsTab: string;
  addChild: string;
  noChildren: string;
  childNameLabel: string;
  childYearPlaceholder: string;
  removeChild: string;
  removeChildConfirm: string;
  removeChildDesc: string;
  disciplineLabel: string;
  enterResult: string;
  chooseChild: string;
  save: string;
  saveAll: string;
  startRace: string;
  noResults: string;
  sessionNotFound: string;
  scoreCol: string;
  score: string;
  resetCounts: string;
  noAthletesForCounting: string;
  enterTimeManually: string;
  deleteResult: string;
  teamA: string;
  teamB: string;
  saveScore: string;
  // Athletes page
  athletesNav: string;
  noAthletes: string;
  athleteAdded: string;
  athleteRemoved: string;
  athleteUpdated: string;
  selectAthletes: string;
  noAthletesInSession: string;
  selectAll: string;
  deselectAll: string;
  done: string;
  // Race page
  prepareRace: string;
  selectParticipants: string;
  noChildrenYet: string;
  start: string;
  abort: string;
  raceFinished: string;
  noTimesRecorded: string;
  repeat: string;
  rankCol: string;
  nameCol: string;
  timeCol: string;
  // Disciplines
  disciplines: Record<string, string>;
  // Categories
  categories: {
    running: string;
    jumping: string;
    throwing: string;
    games: string;
  };
  // Custom discipline
  customDisciplinePlaceholder: string;
  unitValue: string;
  notePlaceholder: string;
  noteHeader: string;
  units: {
    s: string;
    ms: string;
    cm: string;
    m: string;
  };
  // Gender
  genderLabels: {
    male: string;
    female: string;
    nonbinary: string;
  };
  // Toasts
  sessionCreated: string;
  sessionDeleted: string;
  sessionUpdated: string;
  childAdded: string;
  childRemoved: string;
  resultSaved: string;
  resultsSaved: string;
  csvExported: string;
  allDataCleared: string;
  // 404
  notFound: string;
  notFoundDesc: string;
  goHome: string;
}

const de: Translations = {
  // Navigation
  back: "Zurück",
  appName: "Trackly",
  // Language / theme
  toggleLanguage: "EN",
  toggleTheme: "Design wechseln",
  // Home page
  sessions: "Sessions",
  newSession: "Neue Session",
  noSessions: "Noch keine Sessions. Erstelle eine neue Session, um anzufangen.",
  createSession: "Session erstellen",
  sessionName: "Name",
  sessionDate: "Datum",
  sessionNamePlaceholder: "z.B. Frühjahrssportfest 2026",
  clearAllData: "Alle Daten löschen",
  clearAllDataConfirm: "Alle Daten löschen?",
  clearAllDataDesc:
    "Dies löscht alle Sessions, Athleten und Ergebnisse unwiderruflich.",
  deleteEverything: "Alles löschen",
  cancel: "Abbrechen",
  exportCsv: "CSV",
  // Session card
  athletes: "Athleten",
  results: "Ergebnisse",
  editSession: "Session bearbeiten",
  deleteSession: "Session löschen",
  deleteSessionConfirm: "Session löschen?",
  deleteSessionDesc:
    "Dies löscht die Session und alle zugehörigen Athleten und Ergebnisse unwiderruflich.",
  // Session page
  childrenTab: "Athleten",
  resultsTab: "Ergebnisse",
  addChild: "Athlet hinzufügen",
  noChildren: "Noch keine Athleten hinzugefügt.",
  childNameLabel: "Name",
  childYearPlaceholder: "Jahrgang",
  removeChild: "Athlet entfernen",
  removeChildConfirm: "Athlet entfernen?",
  removeChildDesc: "Athlet aus der Athletenliste entfernen. Ergebnisse bleiben erhalten.",
  disciplineLabel: "Disziplin",
  enterResult: "Ergebnis eintragen",
  chooseChild: "Athlet wählen",
  save: "Speichern",
  saveAll: "Alle speichern",
  startRace: "Rennen starten",
  noResults: "Noch keine Ergebnisse für diese Disziplin.",
  sessionNotFound: "Session nicht gefunden.",
  scoreCol: "Punkte",
  score: "Punkte",
  resetCounts: "Zurücksetzen",
  noAthletesForCounting: "Füge zuerst Athleten zur Session hinzu.",
  enterTimeManually: "Zeit manuell eintragen",
  deleteResult: "Ergebnis löschen",
  teamA: "Team A",
  teamB: "Team B",
  saveScore: "Ergebnis speichern",
  // Athletes page
  athletesNav: "Athleten",
  noAthletes: "Noch keine Athleten. Füge Athleten hinzu, um sie in Sessions zu verwenden.",
  athleteAdded: "Athlet hinzugefügt",
  athleteRemoved: "Athlet entfernt",
  athleteUpdated: "Athlet aktualisiert",
  selectAthletes: "Athleten für Session wählen",
  noAthletesInSession: "Keine Athleten ausgewählt. Wähle Athleten aus der globalen Liste.",
  selectAll: "Alle auswählen",
  deselectAll: "Alle abwählen",
  done: "Fertig",
  // Race page
  prepareRace: "Rennen vorbereiten",
  selectParticipants: "Athleten auswählen",
  noChildrenYet: "Füge zuerst Athleten zur Session hinzu.",
  start: "Start",
  abort: "Abbrechen",
  raceFinished: "Rennen beendet!",
  noTimesRecorded: "Keine Zeiten aufgezeichnet.",
  repeat: "Wiederholen",
  rankCol: "#",
  nameCol: "Name",
  timeCol: "Zeit",
  // Disciplines
  disciplines: {
    sprint_40: "40m Sprint",
    sprint_50: "50m Sprint",
    sprint_60: "60m Sprint",
    sprint_80: "80m Sprint",
    sprint_100: "100m Sprint",
    sprint_200: "200m Sprint",
    run_400: "400m Lauf",
    run_800: "800m Lauf",
    run_1000: "1000m Lauf",
    hurdles: "Hürdenlauf",
    relay: "Staffellauf",
    long_jump: "Weitsprung",
    high_jump: "Hochsprung",
    ball_throw: "Ballwurf",
    shot_put: "Kugelstossen",
    sling_ball: "Schlagball",
    football: "Fussball",
    basketball: "Basketball",
    handball: "Handball",
    unihockey: "Unihockey",
    volleyball: "Volleyball",
    dodgeball: "Völkerball",
    brennball: "Brennball",
    jump_rope: "Seilspringen",
    custom: "Eigene / Andere",
  },
  // Categories
  categories: {
    running: "Laufen",
    jumping: "Sprung",
    throwing: "Wurf",
    games: "Spiele",
  },
  // Custom discipline
  customDisciplinePlaceholder: "Disziplinname eingeben",
  unitValue: "Wert",
  notePlaceholder: "Optionale Notiz",
  noteHeader: "Notiz",
  units: {
    s: "s",
    ms: "ms",
    cm: "cm",
    m: "m",
  },
  // Gender
  genderLabels: {
    male: "Männlich",
    female: "Weiblich",
    nonbinary: "Non-binär",
  },
  // Toasts
  sessionCreated: "Session erstellt",
  sessionDeleted: "Session gelöscht",
  sessionUpdated: "Session aktualisiert",
  childAdded: "Athlet hinzugefügt",
  childRemoved: "Athlet entfernt",
  resultSaved: "Ergebnis gespeichert",
  resultsSaved: "Ergebnisse gespeichert",
  csvExported: "CSV exportiert",
  allDataCleared: "Alle Daten gelöscht",
  // 404
  notFound: "Seite nicht gefunden",
  notFoundDesc: "Diese Seite existiert leider nicht.",
  goHome: "Zur Startseite",
};

const en: Translations = {
  // Navigation
  back: "Back",
  appName: "Trackly",
  // Language / theme
  toggleLanguage: "DE",
  toggleTheme: "Toggle theme",
  // Home page
  sessions: "Sessions",
  newSession: "New Session",
  noSessions: "No sessions yet. Create a new session to get started.",
  createSession: "Create Session",
  sessionName: "Name",
  sessionDate: "Date",
  sessionNamePlaceholder: "e.g. Spring Meet 2026",
  clearAllData: "Clear All Data",
  clearAllDataConfirm: "Clear all data?",
  clearAllDataDesc:
    "This will permanently delete all sessions, athletes, and results.",
  deleteEverything: "Delete Everything",
  cancel: "Cancel",
  exportCsv: "CSV",
  // Session card
  athletes: "Athletes",
  results: "Results",
  editSession: "Edit session",
  deleteSession: "Delete session",
  deleteSessionConfirm: "Delete session?",
  deleteSessionDesc:
    "This will permanently delete the session and all associated athletes and results.",
  // Session page
  childrenTab: "Athletes",
  resultsTab: "Results",
  addChild: "Add athlete",
  noChildren: "No athletes added yet.",
  childNameLabel: "Name",
  childYearPlaceholder: "Birth year",
  removeChild: "Remove athlete",
  removeChildConfirm: "Remove athlete?",
  removeChildDesc: "Remove athlete from the roster. Their results are kept.",
  disciplineLabel: "Discipline",
  enterResult: "Enter result",
  chooseChild: "Choose athlete",
  save: "Save",
  saveAll: "Save All",
  startRace: "Start race",
  noResults: "No results for this discipline yet.",
  sessionNotFound: "Session not found.",
  scoreCol: "Score",
  score: "Score",
  resetCounts: "Reset",
  noAthletesForCounting: "Add athletes to the session first.",
  enterTimeManually: "Enter time manually",
  deleteResult: "Delete result",
  teamA: "Team A",
  teamB: "Team B",
  saveScore: "Save score",
  // Athletes page
  athletesNav: "Athletes",
  noAthletes: "No athletes yet. Add athletes to reuse them across sessions.",
  athleteAdded: "Athlete added",
  athleteRemoved: "Athlete removed",
  athleteUpdated: "Athlete updated",
  selectAthletes: "Select athletes for session",
  noAthletesInSession: "No athletes selected. Pick athletes from the global roster.",
  selectAll: "Select all",
  deselectAll: "Deselect all",
  done: "Done",
  // Race page
  prepareRace: "Prepare race",
  selectParticipants: "Select participants",
  noChildrenYet: "Add athletes to the session first.",
  start: "Start",
  abort: "Cancel",
  raceFinished: "Race finished!",
  noTimesRecorded: "No times recorded.",
  repeat: "Repeat",
  rankCol: "#",
  nameCol: "Name",
  timeCol: "Time",
  // Disciplines
  disciplines: {
    sprint_40: "40m Sprint",
    sprint_50: "50m Sprint",
    sprint_60: "60m Sprint",
    sprint_80: "80m Sprint",
    sprint_100: "100m Sprint",
    sprint_200: "200m Sprint",
    run_400: "400m Run",
    run_800: "800m Run",
    run_1000: "1000m Run",
    hurdles: "Hurdles",
    relay: "Relay",
    long_jump: "Long Jump",
    high_jump: "High Jump",
    ball_throw: "Ball Throw",
    shot_put: "Shot Put",
    sling_ball: "Sling Ball",
    football: "Football",
    basketball: "Basketball",
    handball: "Handball",
    unihockey: "Unihockey",
    volleyball: "Volleyball",
    dodgeball: "Dodgeball",
    brennball: "Brennball",
    jump_rope: "Jump Rope",
    custom: "Custom / Other",
  },
  // Categories
  categories: {
    running: "Running",
    jumping: "Jumping",
    throwing: "Throwing",
    games: "Games",
  },
  // Custom discipline
  customDisciplinePlaceholder: "Enter discipline name",
  unitValue: "Value",
  notePlaceholder: "Optional note",
  noteHeader: "Note",
  units: {
    s: "s",
    ms: "ms",
    cm: "cm",
    m: "m",
  },
  // Gender
  genderLabels: {
    male: "Male",
    female: "Female",
    nonbinary: "Non-binary",
  },
  // Toasts
  sessionCreated: "Session created",
  sessionDeleted: "Session deleted",
  sessionUpdated: "Session updated",
  childAdded: "Athlete added",
  childRemoved: "Athlete removed",
  resultSaved: "Result saved",
  resultsSaved: "Results saved",
  csvExported: "CSV exported",
  allDataCleared: "All data cleared",
  // 404
  notFound: "Page not found",
  notFoundDesc: "This page does not exist.",
  goHome: "Go home",
};

const translations: Record<Language, Translations> = { de, en };

// ---------------------------------------------------------------------------
// Language store
// ---------------------------------------------------------------------------

function detectLang(): Language {
  try {
    const saved = localStorage.getItem("trackly-lang");
    if (saved === "de" || saved === "en") return saved;
  } catch {
    // ignore
  }
  return navigator.language.startsWith("de") ? "de" : "en";
}

interface LangState {
  lang: Language;
  setLang: (lang: Language) => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: detectLang(),
      setLang: (lang) => set({ lang }),
    }),
    { name: "trackly-lang" },
  ),
);

export function useTranslation() {
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  return { t: translations[lang], lang, setLang };
}
