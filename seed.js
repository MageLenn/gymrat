// GymRat starting data: the gym's equipment and the default Push/Pull/Legs plans.
// Merged into the phone's data once per SEED version; devices are matched by name,
// so nothing the user already has is duplicated. A newer version only fills in
// explanations that are still empty.
window.GYM_SEED = {
  version: 2,
  devices: [
    // Technogym Selection
    { name: "Technogym: Arm Curl", muscle: "Bizeps", pic: "curl", info: "Oberarme aufs Polster legen, Griffe kontrolliert zu den Schultern beugen. Ellenbogen bleiben liegen." },
    { name: "Technogym: Leg Press", muscle: "Quadrizeps", pic: "legpress", info: "Füße schulterbreit auf die Platte, Knie bis ca. 90° beugen und wieder strecken, ohne sie ganz durchzudrücken." },
    { name: "Technogym: Beinstrecker", muscle: "Quadrizeps", pic: "legext", info: "Knie auf Höhe der Drehachse, Polster über den Fußgelenken. Beine strecken, kurz halten, langsam absenken." },
    { name: "Technogym: Beinbeuger", muscle: "Beinbeuger", pic: "legext", info: "Polster über den Fersen, Knie an der Drehachse. Fersen Richtung Po ziehen, langsam zurück." },
    { name: "Technogym: Adduktor", muscle: "Adduktoren / Abduktoren", pic: "legext", info: "Polster an den Innenseiten der Knie, Beine gegen den Widerstand zusammendrücken. Oberkörper aufrecht." },
    { name: "Technogym: Brustpresse", muscle: "Brust", pic: "bench", info: "Griffe auf Brusthöhe, Schulterblätter zusammen. Arme nach vorn strecken, kontrolliert zurück." },
    { name: "Technogym: Butterfly", muscle: "Brust", pic: "fly", info: "Arme leicht gebeugt, Griffe vor der Brust zusammenführen. Langsam öffnen, bis die Brust gedehnt ist." },
    { name: "Technogym: Latzug", muscle: "Rücken", pic: "pulldown", info: "Stange breit greifen, zur oberen Brust ziehen, Brust raus. Langsam nach oben lassen." },
    { name: "Technogym: Rudern sitzend", muscle: "Rücken", pic: "row", info: "Brust ans Polster, Griffe zum Bauch ziehen, Schulterblätter zusammen. Kontrolliert nach vorn." },
    { name: "Technogym: Bauchmaschine", muscle: "Bauch", pic: "abs", info: "Oberkörper gegen den Widerstand nach vorn einrollen, Bauch anspannen. Nicht mit den Armen ziehen." },
    { name: "Technogym: Schulterpresse", muscle: "Schultern", pic: "shoulder", info: "Griffe auf Schulterhöhe, über den Kopf drücken ohne Hohlkreuz. Langsam zurück." },
    { name: "Technogym: Rückenstrecker", muscle: "Rücken", pic: "generic", info: "Polster am oberen Rücken, Oberkörper kontrolliert nach hinten strecken. Kein Schwung." },
    { name: "Technogym: Rotary Torso", muscle: "Bauch", pic: "abs", info: "Oberkörper gegen den Widerstand zur Seite drehen, Hüfte bleibt fest. Beide Seiten trainieren." },
    { name: "Technogym: Glute-Maschine", muscle: "Gesäß", pic: "legext", info: "Bein gegen das Polster nach hinten strecken, Gesäß oben fest anspannen. Seiten wechseln." },
    { name: "Knee-Raise-Station: Knieheben", muscle: "Bauch", pic: "abs", info: "Unterarme auf die Polster, Rücken an die Lehne. Knie zur Brust ziehen, langsam senken." },
    { name: "Dip-Station: Dips", muscle: "Trizeps", pic: "triceps", info: "Arme strecken, Körper absenken bis Oberarme waagerecht, hochdrücken. Aufrecht = mehr Trizeps." },
    { name: "Hyperextension: Rückenstrecken", muscle: "Rücken", pic: "generic", info: "Hüfte am Polster, Oberkörper absenken und bis zur geraden Linie aufrichten. Nicht überstrecken." },
    // Hammer Strength
    { name: "Hammer Strength: MTS Abdominal Crunch", muscle: "Bauch", pic: "abs", info: "Griffe neben dem Kopf, Oberkörper einrollen. Jede Seite arbeitet einzeln." },
    { name: "Hammer Strength: MTS Front Pulldown", muscle: "Rücken", pic: "pulldown", info: "Griffe nach unten zur Brust ziehen, Ellenbogen nach unten führen. Arme arbeiten einzeln." },
    { name: "Hammer Strength: Select Leg Press", muscle: "Quadrizeps", pic: "legpress", info: "Füße schulterbreit, Knie bis ca. 90° beugen, über die ganze Fußsohle wegdrücken." },
    { name: "Hammer Strength: MTS Shoulder Press", muscle: "Schultern", pic: "shoulder", info: "Griffe auf Schulterhöhe, nach oben drücken. Beide Arme arbeiten unabhängig." },
    { name: "Hammer Strength: Pectoral Fly", muscle: "Brust", pic: "fly", info: "Rücken an die Lehne, Arme leicht gebeugt vor der Brust zusammenführen. Langsam öffnen." },
    { name: "Hammer Strength: Rear Delt Fly", muscle: "Schultern", pic: "fly", info: "Brust an die Lehne, Arme seitlich nach hinten öffnen. Trainiert die hintere Schulter." },
    { name: "Hammer Strength: Seated Row", muscle: "Rücken", pic: "row", info: "Brust ans Polster, Griffe zum Körper ziehen, Ellenbogen nah am Körper. Langsam nach vorn." },
    // Plate-Loaded
    { name: "Plate-Loaded: Beinpresse", muscle: "Quadrizeps", pic: "legpress", info: "Mit Scheiben beladen. Füße schulterbreit, Knie bis ca. 90°, Sicherung erst nach dem Satz einlegen." },
    { name: "Plate-Loaded: Brustpresse", muscle: "Brust", pic: "bench", info: "Mit Scheiben beladen. Griffe auf Brusthöhe, nach vorn drücken, kontrolliert zurück." },
    { name: "Plate-Loaded: Rudern", muscle: "Rücken", pic: "row", info: "Mit Scheiben beladen. Brust ans Polster, Griffe zum Körper ziehen, Schulterblätter zusammen." },
    { name: "Plate-Loaded: Hip Thrust", muscle: "Gesäß", pic: "legpress", info: "Oberer Rücken an die Lehne, Polster über der Hüfte. Hüfte nach oben strecken, oben Gesäß anspannen." },
    { name: "Plate-Loaded: T-Bar-Row", muscle: "Rücken", pic: "row", info: "Brust aufs Polster, Griffe zum Bauch ziehen. Rücken bleibt gerade." },
    // Freihantel
    { name: "Langhantel: Bankdrücken", muscle: "Brust", pic: "barbell", info: "Schulterblätter zusammen, Stange zur unteren Brust senken und hochdrücken. Mit Partner oder Sicherung." },
    { name: "Langhantel: Kniebeuge", muscle: "Quadrizeps", pic: "barbell", info: "Im Rack, Stange auf dem oberen Rücken. Hüfte nach hinten, mindestens bis Oberschenkel waagerecht." },
    { name: "Langhantel: Kreuzheben", muscle: "Rücken", pic: "barbell", info: "Stange nah am Schienbein, Rücken gerade. Aus Beinen und Hüfte hochziehen, oben aufrecht stehen." },
    { name: "Langhantel: Rudern vorgebeugt", muscle: "Rücken", pic: "barbell", info: "Oberkörper ca. 45° vorgebeugt, Rücken gerade. Stange zum Bauchnabel ziehen." },
    { name: "Langhantel: Schulterdrücken", muscle: "Schultern", pic: "barbell", info: "Stehend, Stange von der oberen Brust über den Kopf drücken. Bauch und Po fest." },
    { name: "Langhantel: Rumänisches Kreuzheben", muscle: "Beinbeuger", pic: "barbell", info: "Knie leicht gebeugt, Hüfte nach hinten schieben, Stange an den Beinen entlang senken. Dehnung hinten spüren." },
    { name: "Kurzhantel: Bankdrücken", muscle: "Brust", pic: "dumbbell", info: "Flachbank, Hanteln neben der Brust, nach oben drücken. Mehr Bewegungsfreiheit als mit der Stange." },
    { name: "Kurzhantel: Schrägbankdrücken", muscle: "Brust", pic: "dumbbell", info: "Bank auf 30–45°, Hanteln von der oberen Brust nach oben drücken. Betont die obere Brust." },
    { name: "Kurzhantel: Schulterdrücken", muscle: "Schultern", pic: "dumbbell", info: "Sitzend mit Lehne, Hanteln von Schulterhöhe über den Kopf drücken." },
    { name: "Kurzhantel: Seitheben", muscle: "Schultern", pic: "dumbbell", info: "Arme leicht gebeugt seitlich bis Schulterhöhe heben. Leichtes Gewicht, kein Schwung." },
    { name: "Kurzhantel: Rudern einarmig", muscle: "Rücken", pic: "dumbbell", info: "Knie und Hand auf der Bank, Hantel zur Hüfte ziehen. Rücken bleibt gerade." },
    { name: "Kurzhantel: Bizepscurls", muscle: "Bizeps", pic: "dumbbell", info: "Ellenbogen am Körper, Hanteln mit nach oben zeigenden Handflächen zu den Schultern beugen." },
    { name: "Kurzhantel: Hammercurls", muscle: "Bizeps", pic: "dumbbell", info: "Wie Bizepscurls, aber Daumen zeigen nach oben. Trainiert auch den Unterarm." },
    { name: "Kurzhantel: Ausfallschritte", muscle: "Quadrizeps", pic: "dumbbell", info: "Großer Schritt nach vorn, hinteres Knie Richtung Boden. Vom vorderen Fuß wieder hochdrücken." },
    { name: "Kurzhantel: Rumänisches Kreuzheben", muscle: "Beinbeuger", pic: "dumbbell", info: "Hanteln vor den Beinen, Hüfte nach hinten schieben, Rücken gerade. Dehnung in den Beinbeugern." },
    { name: "Scottbank: SZ-Curls", muscle: "Bizeps", pic: "curl", info: "Oberarme aufs Pult, SZ-Stange hochbeugen. Unten nicht ganz durchstrecken." },
    { name: "Kabelzug: Cable Crossover", muscle: "Brust", pic: "cable", info: "Rollen oben, Griffe in leichtem Bogen vor dem Körper zusammenführen. Leicht vorgebeugt stehen." },
    { name: "Kabelzug: Seitheben", muscle: "Schultern", pic: "cable", info: "Rolle unten, Griff mit der anderen Hand. Arm seitlich bis Schulterhöhe heben. Gleichmäßige Spannung." },
    { name: "Kabelzug: Face Pulls", muscle: "Schultern", pic: "cable", info: "Seil auf Augenhöhe, zum Gesicht ziehen, Ellenbogen hoch und nach außen. Gut für hintere Schulter." },
    { name: "Kabelzug: Trizepsdrücken", muscle: "Trizeps", pic: "triceps", info: "Rolle oben, Ellenbogen am Körper, Griff/Seil nach unten strecken. Nur die Unterarme bewegen sich." },
    { name: "Kabelzug: Overhead Trizeps", muscle: "Trizeps", pic: "triceps", info: "Rücken zum Turm, Seil hinter dem Kopf, Arme nach vorn-oben strecken. Dehnt den langen Trizepskopf." },
    { name: "Kabelzug: Bizepscurls", muscle: "Bizeps", pic: "cable", info: "Rolle unten, Stange oder Seil zu den Schultern beugen. Ellenbogen bleiben am Körper." },
    // Turnecke
    { name: "Multi-Rig: Klimmzüge", muscle: "Rücken", pic: "pulldown", info: "An der Stange hängen, Brust zur Stange ziehen. Gewicht 0 = Körpergewicht, Zusatzgewicht eintragen." },
    { name: "Kettlebell: Swings", muscle: "Gesäß", pic: "generic", info: "Kettlebell zwischen den Beinen schwingen, Hüfte explosiv strecken. Kraft kommt aus der Hüfte, nicht den Armen." },
    // Cardio
    { name: "Technogym: Laufband", category: "cardio", cardioType: "treadmill", info: "Geschwindigkeit und Steigung einstellen. Notaus-Clip an der Kleidung befestigen." },
    { name: "Technogym: Crosstrainer", category: "cardio", cardioType: "crosstrainer", info: "Gelenkschonendes Ganzkörper-Cardio. Stufe über das Display einstellen." },
    { name: "Technogym: Stairclimber", category: "cardio", cardioType: "stepper", info: "Treppensteigen auf Stufen. Aufrecht bleiben, Geländer nur leicht halten." },
    { name: "Technogym: Fahrrad", category: "cardio", cardioType: "bike", info: "Sattel so einstellen, dass das Bein unten fast gestreckt ist. Stufe 1–20." },
    { name: "Air Bike", category: "cardio", cardioType: "other", info: "Rad mit Luftwiderstand, Arme und Beine arbeiten mit. Je schneller, desto schwerer." },
    { name: "Battle Ropes", category: "cardio", cardioType: "other", info: "Seile im Wechsel oder gleichzeitig schlagen. Gut für kurze Intervalle." }
  ],
  plans: [
    { id: "push", name: "Push", sub: "Brust · Schultern · Trizeps", devices: [
      "Langhantel: Bankdrücken", "Kurzhantel: Schrägbankdrücken", "Hammer Strength: MTS Shoulder Press",
      "Hammer Strength: Pectoral Fly", "Kabelzug: Seitheben", "Kabelzug: Trizepsdrücken", "Dip-Station: Dips"] },
    { id: "pull", name: "Pull", sub: "Rücken · Bizeps", devices: [
      "Hammer Strength: MTS Front Pulldown", "Hammer Strength: Seated Row", "Plate-Loaded: T-Bar-Row",
      "Kabelzug: Face Pulls", "Hammer Strength: Rear Delt Fly", "Scottbank: SZ-Curls", "Kurzhantel: Hammercurls"] },
    { id: "legs", name: "Legs", sub: "Beine · Gesäß · Bauch", devices: [
      "Hammer Strength: Select Leg Press", "Kurzhantel: Rumänisches Kreuzheben", "Technogym: Beinstrecker",
      "Technogym: Beinbeuger", "Plate-Loaded: Hip Thrust", "Technogym: Adduktor", "Knee-Raise-Station: Knieheben"] }
  ]
};
