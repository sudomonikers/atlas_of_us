import type { Script } from '../personality';

// The Soap House: an inheritance in Aleppo
// The player's father has died and left the family's hundred-year-old olive oil soap house to his three children in
// equal thirds. Credit given to the wrong sibling at the mourning, an argument over what's fair, a buyer who needs all
// three signatures (the choice branches), the soap-maker who owns nothing, the family seal, and a feud between the two
// others; then a recall about the player's own experience of sharing what can't be split evenly.
// Built for the traits the other scenes measure worst: fairness, cooperation, altruism and modesty, with choices that
// are trade-offs rather than one obviously kind option.

const RANA = 'Rana';
const KARIM = 'Karim';
const UMM_FADI = 'Umm Fadi';
const NOTARY = 'The notary';
const HADDAD = 'Mr. Haddad';
const ABU_SAMIR = 'Abu Samir';

export const soapHouse: Script = {
  id: 'soap_house',
  title: 'The Soap House',
  facets: ['Fairness', 'Cooperation', 'Altruism', 'Modesty', 'Sympathy', 'Assertiveness'],
  start: 'opening',
  sections: {
    // -------------------------------------------------------------------------
    // the soap house, and the mourning
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'The Soap House', animation: 'title_card' },
        { text: 'Aleppo, in winter. The souq is waking up: shutters rattling, coffee on, and the smell of laurel drifting from a low door at the end of the lane.', animation: 'souq' },
        { text: "Behind that door is your family's soap house. Your great-grandfather built it. Every bar that has left it in a hundred years has been pressed with the same brass seal.", animation: 'workshop' },
        { text: 'Olive oil and laurel oil boil for days in the great vat, then set on the floor, are cut by hand, stamped, and stacked in hollow towers to cure for years.', animation: 'stacks' },
        { text: 'Last week your father died. Your sister Rana nursed him through six years of illness and ran the vats while she did. Your brother Karim lives in Hamburg, and sent money every month. You live in Damascus, and came when you could.', animation: 'family' },
        { text: 'Last year, when the orders dried up, you set up the online shop that sold the soap to Europe. It kept the doors open.', animation: 'workshop' },
        { text: "Now it's the aza, the three days of mourning. The courtyard of the family house is full of chairs, bitter coffee and neighbours.", animation: 'aza' },
        { speaker: UMM_FADI, text: "Your father would be so proud of you. If it weren't for you and your little website, that soap house would be shut. You saved it!", animation: 'aza_praise' },
        { text: 'Rana is standing right beside you with the coffee pot. She opened that door every morning for six years.', animation: 'aza_praise' },
        {
          id: 'the_praise',
          prompt: 'Everyone near you heard. What do you say?',
          animation: 'aza_praise',
          facets: ['Modesty', 'Fairness', 'Self-Consciousness'],
        },
      ],
      next: 'the_will',
    },

    the_will: {
      steps: [
        { text: "After the aza, the three of you meet at the notary's office. Karim joins on a laptop propped against a pile of files.", animation: 'notary' },
        { speaker: NOTARY, text: 'The will is simple. The soap house, the stacks and the family house, in three equal shares.', animation: 'notary' },
        { speaker: RANA, text: 'Equal. I fed him every meal for six years. I ran the vats while you two were away.', animation: 'notary' },
        { speaker: KARIM, text: 'And I paid for his medicine for six years. A will is a will, Rana.', animation: 'notary_call' },
        {
          id: 'the_will',
          prompt: 'They both look at you. What do you think is fair here, and what do you say?',
          animation: 'notary',
          facets: ['Fairness', 'Cooperation', 'Sympathy'],
        },
      ],
      next: 'the_buyer',
    },

    // -------------------------------------------------------------------------
    // the buyer
    // -------------------------------------------------------------------------
    the_buyer: {
      steps: [
        { text: 'Two days later, Fuad Haddad comes to the soap house. He owns three soap factories and a shop in Dubai.', animation: 'haddad' },
        { speaker: HADDAD, text: "I'll buy all of it: the building, the stacks and the seal. More than it's worth. But only if all three of you sign this month.", animation: 'haddad' },
        { speaker: KARIM, text: "Our baby's due in March and the lease on the café is up. I need this. Please.", animation: 'notary_call' },
        { speaker: RANA, text: "If we sell, it's over. A hundred years, and it ends with us.", animation: 'haddad' },
        { text: 'Two of them want different things, and your third decides it.', animation: 'haddad' },
        {
          id: 'the_sale',
          prompt: 'Mr. Haddad is waiting for an answer. What do you do?',
          animation: 'haddad',
          facets: ['Cooperation', 'Altruism', 'Fairness'],
          choices: [
            { label: "Sell. Karim needs it, and Rana can't carry the place alone forever.", next: 'sold' },
            { label: 'Keep it. Rana kept it alive, and she should get to keep it.', next: 'kept' },
            { label: "Keep it, and buy out Karim's share over time, from my own savings if I have to.", next: 'bought_out' },
          ],
        },
      ],
    },

    sold: {
      steps: [
        { text: 'You sign. Rana signs last, without a word. Mr. Haddad shakes your hand for a long time.', animation: 'notary' },
        { text: 'The money arrives within a week. Karim sends a photo of a cot, still in its box.', animation: 'notary_call' },
      ],
      next: 'abu_samir',
    },

    kept: {
      steps: [
        { text: 'You tell Mr. Haddad no. On the phone, Karim goes quiet, then hangs up without saying goodbye.', animation: 'haddad' },
        { text: "Rana makes coffee for everyone. Her hands are shaking, and she won't let you see her face.", animation: 'workshop' },
      ],
      next: 'abu_samir',
    },

    bought_out: {
      steps: [
        { text: "You tell Mr. Haddad no, and you tell Karim he'll have his share, a little every month, starting with your own savings. It will take years.", animation: 'notary_call' },
        { speaker: KARIM, text: 'Fine.', animation: 'notary_call' },
        { text: "He doesn't sound fine. Rana squeezes your arm, hard.", animation: 'workshop' },
      ],
      next: 'abu_samir',
    },

    // -------------------------------------------------------------------------
    // the soap-maker, and the seal
    // -------------------------------------------------------------------------
    abu_samir: {
      steps: [
        { text: 'Abu Samir has stirred the vat here for forty years. He taught your father to cut soap. He owns none of it, and the will never mentions him.', animation: 'samir' },
        { text: "He's sixty-eight, and whatever happens to the soap house, there's nowhere else for him to go.", animation: 'samir' },
        { speaker: ABU_SAMIR, text: "Don't you worry about me, habibi. God provides.", animation: 'samir' },
        {
          id: 'abu_samir',
          prompt: 'Do you give Abu Samir anything from your own share? What, if anything, and why?',
          animation: 'samir',
          facets: ['Altruism', 'Fairness', 'Sympathy'],
        },
      ],
      next: 'the_seal',
    },

    the_seal: {
      steps: [
        { text: "On your last day, you open your father's desk. Inside is the brass seal, worn smooth by a hundred years of hands.", animation: 'seal' },
        { speaker: KARIM, text: "I want the seal. I'll start our name again in Hamburg. Our soap, on shelves all over Germany.", animation: 'seal' },
        { speaker: RANA, text: 'That seal belongs on soap made here, in these vats. Nowhere else.', animation: 'seal' },
        {
          id: 'the_seal',
          prompt: 'There is one seal. Who should have it?',
          animation: 'seal',
          facets: ['Fairness', 'Cooperation', 'Modesty'],
          choices: [
            { label: 'Rana. It belongs with the vats.', next: 'seal_rana' },
            { label: 'Karim. The name should travel.', next: 'seal_karim' },
            { label: 'Neither. It stays in the desk until they agree.', next: 'seal_desk' },
            { label: "Me, for now. I'm the one in the middle.", next: 'seal_mine' },
          ],
        },
      ],
    },

    seal_rana: {
      steps: [{ text: "You put the seal in Rana's hand. Karim says nothing. His camera turns off.", animation: 'seal' }],
      next: 'the_rift',
    },

    seal_karim: {
      steps: [{ text: "You wrap the seal in a cloth for Karim, to post to Hamburg. Rana walks out of the room.", animation: 'seal' }],
      next: 'the_rift',
    },

    seal_desk: {
      steps: [{ text: 'You close the drawer and lock it. Both of them look at you as if you have taken a side.', animation: 'seal' }],
      next: 'the_rift',
    },

    seal_mine: {
      steps: [{ text: "You put the seal in your own pocket. It's heavier than it looks. Neither of them is pleased, which is almost fair.", animation: 'seal' }],
      next: 'the_rift',
    },

    // -------------------------------------------------------------------------
    // the rift, and the roof
    // -------------------------------------------------------------------------
    the_rift: {
      steps: [
        { text: 'That night the video call ends with Rana shouting and Karim hanging up. Afterwards each of them messages you, separately.', animation: 'night' },
        { speaker: RANA, text: 'You saw how he talks to me. Tell him.', animation: 'night' },
        { speaker: KARIM, text: "She's never forgiven me for leaving. You know I'm right.", animation: 'night' },
        {
          id: 'the_rift',
          prompt: 'They each want you on their side. What do you do?',
          animation: 'night',
          facets: ['Cooperation', 'Assertiveness', 'Anger'],
        },
      ],
      next: 'roof',
    },

    roof: {
      steps: [
        { text: 'Before you go back to Damascus, you climb to the top of the curing towers. The bars at the very top were stamped the year you were born.', animation: 'roof' },
        { text: 'Below you, the lanes of the souq are lighting up for the evening, and the citadel turns gold.', animation: 'roof' },
        {
          id: 'your_share',
          prompt: "Away from Aleppo now. Think of a time you had to share something that couldn't be split evenly: money, work, credit, or someone's time and care. How did you split it, and did everyone think it was fair?",
          animation: 'roof',
          facets: ['Fairness', 'Cooperation', 'Altruism'],
        },
      ],
      next: 'closing',
    },

    closing: {
      steps: [
        { text: 'In the morning, the vat is lit again. Somewhere in the towers, your year is still curing.', animation: 'workshop' },
        { text: 'The End', animation: 'the_end' },
      ],
    },
  },
};
