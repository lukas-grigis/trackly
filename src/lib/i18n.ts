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
  exportPdf: string;
  // PDF table headers
  pdfRank: string;
  pdfName: string;
  pdfAgeGroup: string;
  pdfResult: string;
  pdfHeat: string;
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
  deleteResultDesc: string;
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
  presenceLabel: string;
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
    sprint: string;
    endurance: string;
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
  // Avatar
  addPhoto: string;
  changePhoto: string;
  removePhoto: string;
  photoStorageFailed: string;
  // Gender
  genderLabels: {
    male: string;
    female: string;
    nonbinary: string;
  };
  // Countdown
  countdownLabel: string;
  countdownNone: string;
  countdownGo: string;
  countdownPaused: string;
  countdownTapResume: string;
  // Field entry
  fieldEntry: string;
  foul: string;
  undoFoul: string;
  best: string;
  addAttempt: string;
  unitLabel: string;
  fieldSaveWarning: string;
  favorites: string;
  addFavorite: string;
  removeFavorite: string;
  // Toasts
  sessionCreated: string;
  sessionDeleted: string;
  sessionUpdated: string;
  childAdded: string;
  childRemoved: string;
  resultSaved: string;
  resultsSaved: string;
  csvExported: string;
  pdfExported: string;
  allDataCleared: string;
  // Leaderboard
  leaderboard: string;
  leaderboardDiscipline: string;
  leaderboardBest: string;
  leaderboardNoResults: string;
  leaderboardNoDisciplineResults: string;
  leaderboardNoFilterResults: string;
  leaderboardAgeGroupFilter: string;
  leaderboardAllAgeGroups: string;
  leaderboardHeatFilter: string;
  leaderboardAllHeats: string;
  leaderboardHeatLabel: string;
  // Save indicator
  savedAgo: string;
  saveError: string;
  autoSaveTooltip: string;
  // TV Mode
  tvToggle: string;
  tvWaiting: string;
  tvExitHint: string;
  // Landing page
  landingHero: string;
  landingHeroSub: string;
  landingOpenApp: string;
  landingHowTitle: string;
  landingStep1: string;
  landingStep2: string;
  landingStep3: string;
  landingFeaturesTitle: string;
  landingFeatureFree: string;
  landingFeatureOffline: string;
  landingFeatureNoAccount: string;
  landingFeatureOpenSource: string;
  landingFeatureExport: string;
  landingFeatureLeaderboard: string;
  landingWhoTitle: string;
  landingWhoDesc: string;
  landingViewGithub: string;
  landingOpenSourceBadge: string;
  landingFooterPrivacy: string;
  // How-to guide
  howToTitle: string;
  howToSubtitle: string;
  howToStep1Title: string;
  howToStep1Desc: string;
  howToStep2Title: string;
  howToStep2Desc: string;
  howToStep3Title: string;
  howToStep3Desc: string;
  howToStep4Title: string;
  howToStep4Desc: string;
  howToStep5Title: string;
  howToStep5Desc: string;
  // 404
  notFound: string;
  notFoundDesc: string;
  goHome: string;
  // Athlete profile
  athleteNotFound: string;
  personalBests: string;
  sessionHistory: string;
  noResultsAthlete: string;
  pbAchievedIn: string;
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
  exportPdf: "PDF",
  pdfRank: "Rang",
  pdfName: "Name",
  pdfAgeGroup: "Altersklasse",
  pdfResult: "Ergebnis",
  pdfHeat: "Lauf",
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
  deleteResultDesc: "Dieses Ergebnis wird unwiderruflich gelöscht.",
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
  presenceLabel: "Wer ist dabei?",
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
    run_1500: "1500m Lauf",
    run_2000: "2000m Lauf",
    run_3000: "3000m Lauf",
    run_5000: "5000m Lauf",
    cooper_test: "Cooper-Test",
    shuttle_run: "Pendellauf",
    hurdles: "Hürdenlauf",
    relay: "Staffellauf",
    long_jump: "Weitsprung",
    high_jump: "Hochsprung",
    triple_jump: "Dreisprung",
    standing_jump: "Standweitsprung",
    pole_vault: "Stabhochsprung",
    ball_throw: "Ballwurf",
    shot_put: "Kugelstossen",
    sling_ball: "Schlagball",
    discus: "Diskuswurf",
    javelin: "Speerwurf",
    vortex: "Vortexwurf",
    football: "Fussball",
    basketball: "Basketball",
    handball: "Handball",
    unihockey: "Unihockey",
    volleyball: "Volleyball",
    dodgeball: "Völkerball",
    brennball: "Brennball",
    jump_rope: "Seilspringen",
    capture_flag: "Capture the Flag",
    tug_of_war: "Seilziehen",
    obstacle_run: "Hindernislauf",
    custom: "Eigene / Andere",
  },
  // Categories
  categories: {
    sprint: "Sprint",
    endurance: "Ausdauer",
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
  // Avatar
  addPhoto: "Foto hinzufügen",
  changePhoto: "Foto ändern",
  removePhoto: "Foto entfernen",
  photoStorageFailed: "Foto konnte nicht gespeichert werden (Speicher voll?).",
  // Gender
  genderLabels: {
    male: "Männlich",
    female: "Weiblich",
    nonbinary: "Non-binär",
  },
  // Countdown
  countdownLabel: "Countdown",
  countdownNone: "Ohne",
  countdownGo: "Los!",
  countdownPaused: "Pausiert",
  countdownTapResume: "Tippen zum Fortsetzen",
  // Field entry
  fieldEntry: "Ergebnisse eintragen",
  foul: "Fehlversuch",
  undoFoul: "Rückgängig",
  best: "Beste",
  addAttempt: "Versuch hinzufügen",
  unitLabel: "Einheit",
  fieldSaveWarning: "Folgende Athleten haben keine gültigen Ergebnisse:",
  favorites: "Favoriten",
  addFavorite: "Zu Favoriten",
  removeFavorite: "Aus Favoriten",
  // Toasts
  sessionCreated: "Session erstellt",
  sessionDeleted: "Session gelöscht",
  sessionUpdated: "Session aktualisiert",
  childAdded: "Athlet hinzugefügt",
  childRemoved: "Athlet entfernt",
  resultSaved: "Ergebnis gespeichert",
  resultsSaved: "Ergebnisse gespeichert",
  csvExported: "CSV exportiert",
  pdfExported: "PDF exportiert",
  allDataCleared: "Alle Daten gelöscht",
  // Leaderboard
  leaderboard: "Rangliste",
  leaderboardDiscipline: "Disziplin wählen",
  leaderboardBest: "Bestleistung",
  leaderboardNoResults: "Noch keine Ergebnisse in dieser Session.",
  leaderboardNoDisciplineResults: "Keine Ergebnisse für diese Disziplin.",
  leaderboardNoFilterResults: "Keine Athleten für die gewählten Filter.",
  leaderboardAgeGroupFilter: "Altersklasse",
  leaderboardAllAgeGroups: "Alle Altersklassen",
  leaderboardHeatFilter: "Lauf",
  leaderboardAllHeats: "Alle Läufe",
  leaderboardHeatLabel: "Lauf",
  // Save indicator
  savedAgo: "Gespeichert vor {time}",
  saveError: "Speichern fehlgeschlagen",
  autoSaveTooltip: "Deine Daten werden automatisch auf diesem Gerät gespeichert. Du musst nichts manuell speichern.",
  // TV Mode
  tvToggle: "TV-Modus",
  tvWaiting: "Warten auf Ergebnisse…",
  tvExitHint: "Tippen zum Beenden",
  // Landing page
  landingHero: "Alle Ergebnisse. Kein Aufwand.",
  landingHeroSub: "Zeit, Distanz, Punkte — alles in einer App. Rangliste und Export inklusive. Kostenlos und offline.",
  landingOpenApp: "App öffnen",
  landingHowTitle: "So funktioniert's",
  landingStep1: "Session erstellen",
  landingStep2: "Athleten hinzufügen",
  landingStep3: "Ergebnisse erfassen",
  landingFeaturesTitle: "Was Trackly bietet",
  landingFeatureFree: "Komplett kostenlos",
  landingFeatureOffline: "Funktioniert offline",
  landingFeatureNoAccount: "Kein Konto nötig",
  landingFeatureOpenSource: "Open Source",
  landingFeatureExport: "PDF & CSV Export",
  landingFeatureLeaderboard: "Rangliste",
  landingWhoTitle: "Für jeden Sporttag",
  landingWhoDesc: "Ob Leichtathletikverein, Schulsporttag, Trainingslager oder Eltern am Sportfest — Trackly passt überall hin.",
  landingViewGithub: "Auf GitHub ansehen",
  landingOpenSourceBadge: "Open Source",
  landingFooterPrivacy: "Kein Tracking · Kein Konto nötig · Deine Daten bleiben auf deinem Gerät",
  // How-to guide
  howToTitle: "Schnellstart",
  howToSubtitle: "In 5 Schritten zur ersten Zeitmessung.",
  howToStep1Title: "Session erstellen",
  howToStep1Desc: "Tippe auf «Neue Session» und gib einen Namen und ein Datum ein. Eine Session fasst alle Läufe und Ergebnisse eines Anlasses zusammen.",
  howToStep2Title: "Athleten hinzufügen",
  howToStep2Desc: "Füge Athleten mit Name hinzu. Jahrgang, Geschlecht und Foto sind optional, helfen aber bei Ranglisten und Export.",
  howToStep3Title: "Lauf starten",
  howToStep3Desc: "Wähle eine Disziplin, wähle die Athleten aus und starte den Countdown. Tippe auf einen Namen, sobald die Person im Ziel ist.",
  howToStep4Title: "Rangliste & TV-Modus",
  howToStep4Desc: "Öffne die Rangliste, um Bestleistungen pro Disziplin zu sehen. Im TV-Modus wird die Rangliste grossformatig für Zuschauer angezeigt.",
  howToStep5Title: "Ergebnisse exportieren",
  howToStep5Desc: "Exportiere die Ergebnisse als PDF oder CSV. Der Export enthält Rang, Name, Altersklasse und Ergebnis pro Disziplin.",
  // 404
  notFound: "Seite nicht gefunden",
  notFoundDesc: "Diese Seite existiert leider nicht.",
  goHome: "Zur Startseite",
  // Athlete profile
  athleteNotFound: "Athlet nicht gefunden",
  personalBests: "Persönliche Bestleistungen",
  sessionHistory: "Sessionverlauf",
  noResultsAthlete: "Noch keine Ergebnisse für diesen Athleten.",
  pbAchievedIn: "in",
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
  exportPdf: "PDF",
  pdfRank: "Rank",
  pdfName: "Name",
  pdfAgeGroup: "Age group",
  pdfResult: "Result",
  pdfHeat: "Heat",
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
  deleteResultDesc: "This result will be permanently deleted.",
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
  presenceLabel: "Who's here?",
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
    run_1500: "1500m Run",
    run_2000: "2000m Run",
    run_3000: "3000m Run",
    run_5000: "5000m Run",
    cooper_test: "Cooper Test",
    shuttle_run: "Shuttle Run",
    hurdles: "Hurdles",
    relay: "Relay",
    long_jump: "Long Jump",
    high_jump: "High Jump",
    triple_jump: "Triple Jump",
    standing_jump: "Standing Jump",
    pole_vault: "Pole Vault",
    ball_throw: "Ball Throw",
    shot_put: "Shot Put",
    sling_ball: "Sling Ball",
    discus: "Discus",
    javelin: "Javelin",
    vortex: "Vortex Throw",
    football: "Football",
    basketball: "Basketball",
    handball: "Handball",
    unihockey: "Unihockey",
    volleyball: "Volleyball",
    dodgeball: "Dodgeball",
    brennball: "Brennball",
    jump_rope: "Jump Rope",
    capture_flag: "Capture the Flag",
    tug_of_war: "Tug of War",
    obstacle_run: "Obstacle Run",
    custom: "Custom / Other",
  },
  // Categories
  categories: {
    sprint: "Sprint",
    endurance: "Endurance",
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
  // Avatar
  addPhoto: "Add photo",
  changePhoto: "Change photo",
  removePhoto: "Remove photo",
  photoStorageFailed: "Photo could not be saved (storage full?).",
  // Gender
  genderLabels: {
    male: "Male",
    female: "Female",
    nonbinary: "Non-binary",
  },
  // Countdown
  countdownLabel: "Countdown",
  countdownNone: "None",
  countdownGo: "Go!",
  countdownPaused: "Paused",
  countdownTapResume: "Tap to resume",
  // Field entry
  fieldEntry: "Enter results",
  foul: "Foul",
  undoFoul: "Undo",
  best: "Best",
  addAttempt: "Add attempt",
  unitLabel: "Unit",
  fieldSaveWarning: "The following athletes have no valid results:",
  favorites: "Favorites",
  addFavorite: "Add to favorites",
  removeFavorite: "Remove from favorites",
  // Toasts
  sessionCreated: "Session created",
  sessionDeleted: "Session deleted",
  sessionUpdated: "Session updated",
  childAdded: "Athlete added",
  childRemoved: "Athlete removed",
  resultSaved: "Result saved",
  resultsSaved: "Results saved",
  csvExported: "CSV exported",
  pdfExported: "PDF exported",
  allDataCleared: "All data cleared",
  // Leaderboard
  leaderboard: "Leaderboard",
  leaderboardDiscipline: "Select discipline",
  leaderboardBest: "Personal best",
  leaderboardNoResults: "No results in this session yet.",
  leaderboardNoDisciplineResults: "No results for this discipline.",
  leaderboardNoFilterResults: "No athletes match the selected filters.",
  leaderboardAgeGroupFilter: "Age group",
  leaderboardAllAgeGroups: "All age groups",
  leaderboardHeatFilter: "Heat",
  leaderboardAllHeats: "All heats",
  leaderboardHeatLabel: "Heat",
  // Save indicator
  savedAgo: "Saved {time} ago",
  saveError: "Save failed",
  autoSaveTooltip: "Your data is automatically saved on this device. No need to save manually.",
  // TV Mode
  tvToggle: "TV Mode",
  tvWaiting: "Waiting for results…",
  tvExitHint: "Tap anywhere to exit",
  // Landing page
  landingHero: "Every result. Zero effort.",
  landingHeroSub: "Time, distance, score — all in one app. Leaderboard and export included. Free and offline.",
  landingOpenApp: "Open App",
  landingHowTitle: "How it works",
  landingStep1: "Create a session",
  landingStep2: "Add athletes",
  landingStep3: "Record results",
  landingFeaturesTitle: "What you get",
  landingFeatureFree: "Completely free",
  landingFeatureOffline: "Works offline",
  landingFeatureNoAccount: "No account needed",
  landingFeatureOpenSource: "Open source",
  landingFeatureExport: "PDF & CSV export",
  landingFeatureLeaderboard: "Leaderboard",
  landingWhoTitle: "For any sports day",
  landingWhoDesc: "Youth athletics clubs, school sports days, training sessions, or parents at the track — Trackly fits anywhere.",
  landingViewGithub: "View on GitHub",
  landingOpenSourceBadge: "Open Source",
  landingFooterPrivacy: "No tracking · No account needed · Your data stays on your device",
  // How-to guide
  howToTitle: "Quick Start",
  howToSubtitle: "Get timing in 5 simple steps.",
  howToStep1Title: "Create a session",
  howToStep1Desc: "Tap \"New Session\" and enter a name and date. A session groups all heats and results for one event.",
  howToStep2Title: "Add athletes",
  howToStep2Desc: "Add athletes by name. Year of birth, gender, and photo are optional but help with leaderboards and exports.",
  howToStep3Title: "Start a heat",
  howToStep3Desc: "Pick a discipline, select the athletes, and start the countdown. Tap a name as soon as they cross the finish line.",
  howToStep4Title: "View leaderboard & TV mode",
  howToStep4Desc: "Open the leaderboard to see personal bests per discipline. TV mode shows the leaderboard in large format for spectators.",
  howToStep5Title: "Export results",
  howToStep5Desc: "Export results as PDF or CSV. The export includes rank, name, age group, and result per discipline.",
  // 404
  notFound: "Page not found",
  notFoundDesc: "This page does not exist.",
  goHome: "Go home",
  // Athlete profile
  athleteNotFound: "Athlete not found",
  personalBests: "Personal Bests",
  sessionHistory: "Session History",
  noResultsAthlete: "No results for this athlete yet.",
  pbAchievedIn: "in",
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
