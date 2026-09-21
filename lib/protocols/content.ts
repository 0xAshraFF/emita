import type { ProtocolId } from "@/lib/triage/resolve";
import {
  AHA_BLS,
  AHA_CHOKING,
  NO_CLINICAL_CONTENT,
  STOP_THE_BLEED,
  type Provenance,
} from "./provenance";

export interface Step {
  title: string;
  detail?: string;
  /** Rendered with the strongest emphasis - the action that saves the life. */
  critical?: boolean;
}

export interface ProtocolContent {
  id: ProtocolId;
  /** Large header. The user must be able to confirm or reject the route at a glance. */
  title: string;
  subtitle: string;
  /** Show a compression metronome at 110 bpm alongside the steps. */
  metronome: boolean;
  steps: Step[];
  /** Absolute contraindications, rendered separately and in red. */
  neverDo: string[];
  provenance: Provenance;
}

const CALL_FIRST: Step = {
  title: "Call emergency services now",
  detail: "Put the phone on speaker so your hands stay free. If anyone else is nearby, send them to call and to find an AED.",
  critical: true,
};

export const PROTOCOLS: Record<ProtocolId, ProtocolContent> = {
  choking_infant: {
    id: "choking_infant",
    title: "Choking - Infant",
    subtitle: "Under 1 year old, still reacting",
    metronome: false,
    steps: [
      CALL_FIRST,
      {
        title: "Lay the baby face DOWN along your forearm",
        detail: "Sit down. Support the jaw and head with your hand. Keep the head LOWER than the chest. Rest your forearm on your thigh.",
      },
      {
        title: "Give 5 firm back slaps",
        detail: "Heel of your hand, squarely between the shoulder blades. Deliberate and firm, one at a time.",
        critical: true,
      },
      {
        title: "Turn the baby face UP",
        detail: "Support the head. Keep the head lower than the chest throughout the turn.",
      },
      {
        title: "Give 5 chest thrusts",
        detail: "Two fingers on the breastbone just below the nipple line. Press about 1.5 inches (4 cm) deep, about one thrust per second.",
        critical: true,
      },
      {
        title: "Repeat until the object comes out",
        detail: "5 back slaps, then 5 chest thrusts. Keep going as long as the baby is still reacting.",
      },
      {
        title: "If the baby stops responding, start infant CPR",
        detail: "Look inside the mouth before each set of breaths. Only remove the object if you can actually see it.",
        critical: true,
      },
    ],
    neverDo: [
      "Never give abdominal thrusts (the Heimlich manoeuvre) to a baby under 1 year old.",
      "Never sweep a finger blindly through the mouth - it can push the object deeper.",
    ],
    provenance: AHA_CHOKING,
  },

  choking_child: {
    id: "choking_child",
    title: "Choking - Child",
    subtitle: "Roughly 1 year to puberty, still reacting",
    metronome: false,
    steps: [
      {
        title: "Can they cough, speak or breathe at all?",
        detail: "If they can cough forcefully, encourage them to keep coughing and do not intervene. A strong cough is more effective than anything you can do.",
      },
      CALL_FIRST,
      {
        title: "Give 5 back blows",
        detail: "Kneel or stand behind them and lean them forward. Strike between the shoulder blades with the heel of your hand.",
        critical: true,
      },
      {
        title: "Give 5 abdominal thrusts",
        detail: "Stand behind, arms around the waist. Fist just above the navel and well below the breastbone. Grasp it with your other hand and thrust sharply inward and upward.",
        critical: true,
      },
      {
        title: "Repeat until the object comes out",
        detail: "5 back blows, then 5 abdominal thrusts. Keep alternating.",
      },
      {
        title: "If the child stops responding, start child CPR",
        detail: "Look inside the mouth before each set of breaths. Only remove the object if you can see it.",
        critical: true,
      },
    ],
    neverDo: [
      "Never sweep a finger blindly through the mouth.",
      "Never use abdominal thrusts on a baby under 1 year old - use the infant protocol instead.",
    ],
    provenance: AHA_CHOKING,
  },

  choking_adult: {
    id: "choking_adult",
    title: "Choking - Adult",
    subtitle: "Adolescent or adult, still reacting",
    metronome: false,
    steps: [
      {
        title: 'Ask: "Are you choking?"',
        detail: "If they can cough forcefully or speak, encourage coughing and do not intervene. Step in when they cannot breathe, speak or cough.",
      },
      CALL_FIRST,
      {
        title: "Give 5 back blows",
        detail: "Stand to the side and slightly behind. Lean them well forward. Strike between the shoulder blades with the heel of your hand.",
        critical: true,
      },
      {
        title: "Give 5 abdominal thrusts",
        detail: "Stand behind, arms around the waist. Fist just above the navel, well below the breastbone. Grasp it with your other hand and thrust sharply inward and upward.",
        critical: true,
      },
      {
        title: "Repeat until the object comes out",
        detail: "5 back blows, then 5 abdominal thrusts. Keep alternating.",
      },
      {
        title: "If they are pregnant or too large to reach around",
        detail: "Use chest thrusts instead: hands on the centre of the breastbone, pulling straight back.",
      },
      {
        title: "If they stop responding, start adult CPR",
        detail: "Look inside the mouth before each set of breaths. Only remove the object if you can see it.",
        critical: true,
      },
    ],
    neverDo: [
      "Never sweep a finger blindly through the mouth.",
      "Never give abdominal thrusts to someone who is coughing forcefully - let them cough.",
    ],
    provenance: AHA_CHOKING,
  },

  cpr_infant: {
    id: "cpr_infant",
    title: "CPR - Infant",
    subtitle: "Under 1 year old, not responding",
    metronome: true,
    steps: [
      {
        title: "Check for a response",
        detail: "Tap the sole of the foot and shout. Do not shake the baby.",
      },
      CALL_FIRST,
      {
        title: "Check breathing for no more than 10 seconds",
        detail: "Not breathing, or only gasping, means start CPR now.",
        critical: true,
      },
      {
        title: "Place two fingers on the breastbone",
        detail: "Just below the nipple line, in the centre of the chest.",
      },
      {
        title: "Push hard and fast",
        detail: "About 1.5 inches (4 cm) deep, or at least one third of the chest depth. 100 to 120 compressions per minute. Let the chest come all the way back up each time.",
        critical: true,
      },
      {
        title: "30 compressions, then 2 breaths",
        detail: "Cover the baby's nose AND mouth with your mouth. Give small, gentle puffs lasting about 1 second, just enough to make the chest rise. If two rescuers are present, use 15 compressions to 2 breaths.",
      },
      {
        title: "Do not stop",
        detail: "Continue until the baby starts breathing normally or emergency services take over.",
        critical: true,
      },
    ],
    neverDo: [
      "Never give full adult-sized breaths to an infant - the lungs are tiny and can be injured.",
      "Never shake a baby to check for a response.",
    ],
    provenance: AHA_BLS,
  },

  cpr_child: {
    id: "cpr_child",
    title: "CPR - Child",
    subtitle: "Roughly 1 year to puberty, not responding",
    metronome: true,
    steps: [
      {
        title: "Check for a response",
        detail: "Tap the shoulders and shout their name.",
      },
      CALL_FIRST,
      {
        title: "Check breathing for no more than 10 seconds",
        detail: "Not breathing, or only gasping, means start CPR now.",
        critical: true,
      },
      {
        title: "Place the heel of one hand on the centre of the chest",
        detail: "On the lower half of the breastbone. Use two hands if one does not achieve enough depth.",
      },
      {
        title: "Push hard and fast",
        detail: "About 2 inches (5 cm) deep, or at least one third of the chest depth. 100 to 120 compressions per minute. Full recoil between each.",
        critical: true,
      },
      {
        title: "30 compressions, then 2 breaths",
        detail: "Tilt the head back, lift the chin, pinch the nose and give breaths lasting about 1 second each until the chest rises. If two rescuers are present, use 15 compressions to 2 breaths.",
      },
      {
        title: "Use an AED as soon as one arrives",
        detail: "Use paediatric pads if available. If not, adult pads are still better than no defibrillation. Follow the voice prompts.",
      },
      {
        title: "Do not stop",
        detail: "Continue until the child starts breathing normally or emergency services take over.",
        critical: true,
      },
    ],
    neverDo: [
      "Never delay compressions to look for a pulse if you are not trained to find one.",
      "Never interrupt compressions for more than 10 seconds at a time.",
    ],
    provenance: AHA_BLS,
  },

  cpr_adult: {
    id: "cpr_adult",
    title: "CPR - Adult",
    subtitle: "Adolescent or adult, not responding",
    metronome: true,
    steps: [
      {
        title: "Check for a response",
        detail: "Tap the shoulders firmly and shout.",
      },
      CALL_FIRST,
      {
        title: "Check breathing for no more than 10 seconds",
        detail: "Not breathing, or only gasping, means start CPR now. Gasping is not breathing.",
        critical: true,
      },
      {
        title: "Place the heel of your hand on the centre of the chest",
        detail: "On the lower half of the breastbone. Put your other hand on top and interlock your fingers. Keep your arms straight and your shoulders directly above your hands.",
      },
      {
        title: "Push hard and fast",
        detail: "At least 2 inches (5 cm) deep, no more than 2.4 inches (6 cm). 100 to 120 compressions per minute. Let the chest come all the way back up between compressions.",
        critical: true,
      },
      {
        title: "If you are untrained, do compressions only",
        detail: "Hands-only CPR is effective for an adult who collapses suddenly. Do not stop to give breaths. If you are trained and willing, give 30 compressions to 2 breaths.",
      },
      {
        title: "Use an AED as soon as one arrives",
        detail: "Turn it on and follow the voice prompts exactly. It will not shock someone who does not need it.",
        critical: true,
      },
      {
        title: "Do not stop",
        detail: "Continue until they start breathing normally or emergency services take over. Swap with someone else every 2 minutes if you can - compressions get shallower as you tire.",
        critical: true,
      },
    ],
    neverDo: [
      "Never delay compressions to look for a pulse if you are not trained to find one.",
      "Never interrupt compressions for more than 10 seconds at a time.",
    ],
    provenance: AHA_BLS,
  },

  bleeding_severe: {
    id: "bleeding_severe",
    title: "Severe Bleeding",
    subtitle: "Heavy or uncontrolled blood loss",
    metronome: false,
    steps: [
      {
        title: "Make sure you are safe first",
        detail: "Do not become a second casualty. Use gloves or a barrier if anything is within reach.",
      },
      CALL_FIRST,
      {
        title: "Find where the blood is coming from",
        detail: "Open or cut away clothing so you can actually see the wound. You cannot stop bleeding you cannot find.",
        critical: true,
      },
      {
        title: "Press hard, directly on the wound",
        detail: "Both hands, cloth or gauze if you have it, your bare hands if you do not. Use your body weight. Harder than feels comfortable.",
        critical: true,
      },
      {
        title: "Do not let go to check",
        detail: "If blood soaks through, add more cloth on top and keep pressing. Never lift off the dressings already there.",
        critical: true,
      },
      {
        title: "Arm or leg, and pressure is not working? Use a tourniquet",
        detail: "Place it 2 to 3 inches (5 to 8 cm) above the wound, never over a joint. Tighten until the bleeding stops. It will hurt - that means it is tight enough. Write down the time it went on.",
        critical: true,
      },
      {
        title: "Neck, shoulder or groin? Pack the wound",
        detail: "A tourniquet cannot be used there. Push gauze or clean cloth deep into the wound, then press down hard on top of it.",
      },
      {
        title: "Keep them warm and lying flat",
        detail: "Blood loss drops body temperature fast, which makes bleeding worse. Cover them with a coat or blanket.",
      },
    ],
    neverDo: [
      "Never pull out an object stuck in a wound - press around it instead.",
      "Never remove dressings that have soaked through - add more on top.",
      "Never loosen or remove a tourniquet once it is on. Only a medical professional does that.",
    ],
    provenance: STOP_THE_BLEED,
  },

  fallback_emergency_call: {
    id: "fallback_emergency_call",
    title: "Call Emergency Services",
    subtitle: "We could not safely identify the emergency",
    metronome: false,
    steps: [
      {
        title: "Call emergency services right now",
        detail: "Tap the button above. Put the phone on speaker so your hands are free. A dispatcher can talk you through what to do.",
        critical: true,
      },
      {
        title: "Tell them where you are first",
        detail: "Location before anything else. If the call drops, they can still reach you.",
      },
      {
        title: "Then say what you see",
        detail: "Is the person awake? Are they breathing? Is there heavy bleeding? Answer exactly what the dispatcher asks - they are working through a checklist.",
      },
      {
        title: "Do not hang up",
        detail: "Stay on the line. Follow their instructions rather than anything on this screen.",
      },
    ],
    neverDo: [],
    provenance: NO_CLINICAL_CONTENT,
  },
};
