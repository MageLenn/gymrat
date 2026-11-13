// GymRat starting data: the gym's equipment and the default Push/Pull/Legs plans.
// Merged into the phone's data once per SEED version; devices are matched by name,
// so nothing the user already has is duplicated or overwritten.
window.GYM_SEED = {
  version: 1,
  devices: [
    // Technogym Selection
    { name: "Technogym: Arm Curl", muscle: "Bizeps", step: 5, pic: "curl" },
    { name: "Technogym: Leg Press", muscle: "Quadrizeps", step: 5, pic: "legpress" },
    { name: "Technogym: Beinstrecker", muscle: "Quadrizeps", step: 5, pic: "legext" },
    { name: "Technogym: Beinbeuger", muscle: "Beinbeuger", step: 5, pic: "legext" },
    { name: "Technogym: Adduktor", muscle: "Adduktoren / Abduktoren", step: 5, pic: "legext" },
    { name: "Technogym: Brustpresse", muscle: "Brust", step: 5, pic: "bench" },
    { name: "Technogym: Butterfly", muscle: "Brust", step: 5, pic: "fly" },
    { name: "Technogym: Latzug", muscle: "Rücken", step: 5, pic: "pulldown" },
    { name: "Technogym: Rudern sitzend", muscle: "Rücken", step: 5, pic: "row" },
    { name: "Technogym: Bauchmaschine", muscle: "Bauch", step: 5, pic: "abs" },
    { name: "Technogym: Schulterpresse", muscle: "Schultern", step: 5, pic: "shoulder" },
    { name: "Technogym: Rückenstrecker", muscle: "Rücken", step: 5, pic: "generic" },
    { name: "Technogym: Rotary Torso", muscle: "Bauch", step: 5, pic: "abs" },
    { name: "Technogym: Glute-Maschine", muscle: "Gesäß", step: 5, pic: "legext" },
    { name: "Knee-Raise-Station: Knieheben", muscle: "Bauch", step: 2.5, pic: "abs" },
    { name: "Dip-Station: Dips", muscle: "Trizeps", step: 2.5, pic: "triceps" },
    { name: "Hyperextension: Rückenstrecken", muscle: "Rücken", step: 2.5, pic: "generic" },
    // Hammer Strength
    { name: "Hammer Strength: MTS Abdominal Crunch", muscle: "Bauch", step: 5, pic: "abs" },
    { name: "Hammer Strength: MTS Front Pulldown", muscle: "Rücken", step: 5, pic: "pulldown" },
    { name: "Hammer Strength: Select Leg Press", muscle: "Quadrizeps", step: 5, pic: "legpress" },
    { name: "Hammer Strength: MTS Shoulder Press", muscle: "Schultern", step: 5, pic: "shoulder" },
    { name: "Hammer Strength: Pectoral Fly", muscle: "Brust", step: 5, pic: "fly" },
    { name: "Hammer Strength: Rear Delt Fly", muscle: "Schultern", step: 5, pic: "fly" },
    { name: "Hammer Strength: Seated Row", muscle: "Rücken", step: 5, pic: "row" },
    // Plate-Loaded
    { name: "Plate-Loaded: Beinpresse", muscle: "Quadrizeps", step: 2.5, pic: "legpress" },
    { name: "Plate-Loaded: Brustpresse", muscle: "Brust", step: 2.5, pic: "bench" },
    { name: "Plate-Loaded: Rudern", muscle: "Rücken", step: 2.5, pic: "row" },
    { name: "Plate-Loaded: Hip Thrust", muscle: "Gesäß", step: 2.5, pic: "legpress" },
    { name: "Plate-Loaded: T-Bar-Row", muscle: "Rücken", step: 2.5, pic: "row" },
    // Freihantel
    { name: "Langhantel: Bankdrücken", muscle: "Brust", step: 2.5, pic: "barbell" },
    { name: "Langhantel: Kniebeuge", muscle: "Quadrizeps", step: 2.5, pic: "barbell" },
    { name: "Langhantel: Kreuzheben", muscle: "Rücken", step: 2.5, pic: "barbell" },
    { name: "Langhantel: Rudern vorgebeugt", muscle: "Rücken", step: 2.5, pic: "barbell" },
    { name: "Langhantel: Schulterdrücken", muscle: "Schultern", step: 2.5, pic: "barbell" },
    { name: "Langhantel: Rumänisches Kreuzheben", muscle: "Beinbeuger", step: 2.5, pic: "barbell" },
    { name: "Kurzhantel: Bankdrücken", muscle: "Brust", step: 2, pic: "dumbbell" },
    { name: "Kurzhantel: Schrägbankdrücken", muscle: "Brust", step: 2, pic: "dumbbell" },
    { name: "Kurzhantel: Schulterdrücken", muscle: "Schultern", step: 2, pic: "dumbbell" },
    { name: "Kurzhantel: Seitheben", muscle: "Schultern", step: 2, pic: "dumbbell" },
    { name: "Kurzhantel: Rudern einarmig", muscle: "Rücken", step: 2, pic: "dumbbell" },
    { name: "Kurzhantel: Bizepscurls", muscle: "Bizeps", step: 2, pic: "dumbbell" },
    { name: "Kurzhantel: Hammercurls", muscle: "Bizeps", step: 2, pic: "dumbbell" },
    { name: "Kurzhantel: Ausfallschritte", muscle: "Quadrizeps", step: 2, pic: "dumbbell" },
    { name: "Kurzhantel: Rumänisches Kreuzheben", muscle: "Beinbeuger", step: 2, pic: "dumbbell" },
    { name: "Scottbank: SZ-Curls", muscle: "Bizeps", step: 2.5, pic: "curl" },
    { name: "Kabelzug: Cable Crossover", muscle: "Brust", step: 2.5, pic: "cable" },
    { name: "Kabelzug: Seitheben", muscle: "Schultern", step: 2.5, pic: "cable" },
    { name: "Kabelzug: Face Pulls", muscle: "Schultern", step: 2.5, pic: "cable" },
    { name: "Kabelzug: Trizepsdrücken", muscle: "Trizeps", step: 2.5, pic: "triceps" },
    { name: "Kabelzug: Overhead Trizeps", muscle: "Trizeps", step: 2.5, pic: "triceps" },
    { name: "Kabelzug: Bizepscurls", muscle: "Bizeps", step: 2.5, pic: "cable" },
    // Turnecke
    { name: "Multi-Rig: Klimmzüge", muscle: "Rücken", step: 2.5, pic: "pulldown" },
    { name: "Kettlebell: Swings", muscle: "Gesäß", step: 4, pic: "generic" },
    // Cardio
    { name: "Technogym: Laufband", category: "cardio", cardioType: "treadmill" },
    { name: "Technogym: Crosstrainer", category: "cardio", cardioType: "crosstrainer" },
    { name: "Technogym: Stairclimber", category: "cardio", cardioType: "stepper" },
    { name: "Technogym: Fahrrad", category: "cardio", cardioType: "bike" },
    { name: "Air Bike", category: "cardio", cardioType: "other" },
    { name: "Battle Ropes", category: "cardio", cardioType: "other" }
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
