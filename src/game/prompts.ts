// Sample prompts for the prototype. Rarity is a hand-made estimate:
// 1 = common, 2 = uncommon, 3 = rare, 4 = very rare.
// Later it will come from popularity data and real player answers.

export type Tier = 0 | 1 | 2 | 3 | 4;
export const TIER_POINTS: Record<Tier, number> = { 0: 0, 1: 10, 2: 25, 3: 55, 4: 100 };
export const TIER_LABEL: Record<Tier, string> = { 0: "doesn't count", 1: 'common', 2: 'uncommon', 3: 'rare', 4: 'very rare' };
export const TIER_EMOJI: Record<Tier, string> = { 0: '⬜', 1: '🟨', 2: '🟧', 3: '🟥', 4: '🟪' };

export interface Prompt {
  text: string;
  /** Title → tier. Alternative spellings separated by |, the first one is shown. */
  answers: Record<string, Tier>;
}

export const PROMPTS: Prompt[] = [
  {
    text: 'A book with a number in its title',
    answers: {
      '1984|nineteen eighty-four': 1, 'Fahrenheit 451': 1, 'Catch-22': 1, 'Slaughterhouse-Five': 1,
      'One Hundred Years of Solitude': 1, 'The Three Musketeers': 1, 'A Tale of Two Cities': 1,
      'The Seven Husbands of Evelyn Hugo': 1, 'Around the World in Eighty Days|around the world in 80 days': 1,
      'Twenty Thousand Leagues Under the Seas|20000 leagues under the sea|twenty thousand leagues under the sea': 2,
      '2001: A Space Odyssey': 2, '11/22/63': 2, 'The Five People You Meet in Heaven': 2,
      "One Flew Over the Cuckoo's Nest": 2, 'Station Eleven': 2, 'Twelve Years a Slave': 2,
      'The Three-Body Problem|three body problem': 2, 'The 39 Steps|the thirty-nine steps': 3,
      'The Thirteenth Tale': 3, 'The Sixth Extinction': 3, 'The Second Sex': 3,
      'The 7½ Deaths of Evelyn Hardcastle|the seven deaths of evelyn hardcastle|the 7 1/2 deaths of evelyn hardcastle': 3,
      '2666': 4, 'Seven Pillars of Wisdom': 4, 'The Nine Tailors': 4, 'Three Men in a Boat': 3,
    },
  },
  {
    text: 'A book whose author used a pen name',
    answers: {
      'Animal Farm': 1, 'Adventures of Huckleberry Finn|huckleberry finn': 1,
      'The Adventures of Tom Sawyer|tom sawyer': 1, "Alice's Adventures in Wonderland|alice in wonderland": 1,
      'The Cat in the Hat': 1, 'Jane Eyre': 2, 'Wuthering Heights': 2, 'Middlemarch': 2,
      "The Cuckoo's Calling": 2, 'Candide': 2, 'My Brilliant Friend': 2,
      'The Spy Who Came in from the Cold': 2, 'Tinker Tailor Soldier Spy': 2, 'A Series of Unfortunate Events|the bad beginning': 2,
      'Silas Marner': 3, 'The Tenant of Wildfell Hall': 3, 'Agnes Grey': 3, 'The Running Man': 3, 'Thinner': 3,
      'Out of Africa': 3, 'The Red and the Black': 3, 'Atlas Shrugged': 3, 'The Fountainhead': 3,
      'The Gift of the Magi': 3, 'Sunset Song': 4, 'At Swim-Two-Birds': 4, 'The Third Policeman': 4,
      'The Book of Disquiet': 4, 'Absent in the Spring': 4,
    },
  },
  {
    text: 'A novel set on an island',
    answers: {
      'Lord of the Flies': 1, 'Robinson Crusoe': 1, 'Treasure Island': 1, 'And Then There Were None': 1,
      'Life of Pi': 2, 'Shutter Island': 2, 'Jurassic Park': 2, 'The Island of Doctor Moreau|the island of dr moreau': 2,
      'The Swiss Family Robinson|swiss family robinson': 2, 'Island of the Blue Dolphins': 2,
      'The Mysterious Island': 3, 'The Guernsey Literary and Potato Peel Pie Society': 3,
      "Captain Corelli's Mandolin": 3, 'Wide Sargasso Sea': 3, 'The Beach': 3, 'To the Lighthouse': 3,
      'The Light Between Oceans': 3, 'Island': 4, 'The Wasp Factory': 4, 'Mr Pip|mister pip': 4,
    },
  },
  {
    text: 'A book that has been banned somewhere',
    answers: {
      'Nineteen Eighty-Four|1984': 1, 'The Catcher in the Rye': 1, 'To Kill a Mockingbird': 1, 'Lolita': 1,
      'Brave New World': 1, "The Handmaid's Tale": 1, 'Animal Farm': 1, 'Ulysses': 2, 'The Satanic Verses': 2,
      "Lady Chatterley's Lover": 2, 'Of Mice and Men': 2, 'Fahrenheit 451': 2, 'Maus': 2, 'Beloved': 2,
      'The Grapes of Wrath': 2, 'Slaughterhouse-Five': 2, "Harry Potter and the Philosopher's Stone|harry potter|harry potter and the sorcerers stone": 2,
      'The Kite Runner': 3, 'Doctor Zhivago': 3, 'Madame Bovary': 3, 'Tropic of Cancer': 3,
      'The Master and Margarita': 3, 'Persepolis': 3, 'Naked Lunch': 3, "Uncle Tom's Cabin": 3,
      'American Psycho': 3, 'The Well of Loneliness': 4, 'Wild Swans': 4, 'Lajja': 4,
    },
  },
  {
    text: "A book narrated by someone who isn't human",
    answers: {
      'The Book Thief': 1, 'Black Beauty': 2, 'The Art of Racing in the Rain': 2, 'Klara and the Sun': 2,
      "A Dog's Purpose": 2, 'War Horse': 2, 'Frankenstein': 3, 'Grendel': 3,
      'Flush': 4, 'I Am a Cat': 4, 'My Name Is Red': 4, 'Watership Down': 0,
    },
  },
  {
    text: 'A book with a colour in its title',
    answers: {
      'The Color Purple|the colour purple': 1, 'The Scarlet Letter': 1, 'A Clockwork Orange': 1,
      'Fifty Shades of Grey': 1, 'The Picture of Dorian Gray': 1, 'Anne of Green Gables': 2, 'The Red Badge of Courage': 2,
      'Black Beauty': 2, 'White Fang': 2, 'The Green Mile': 2, 'The Bluest Eye': 2, 'Red Dragon': 2,
      'The Yellow Wallpaper': 2, 'Red Rising': 3, 'The Blue Castle': 3, 'The White Tiger': 3,
      'Purple Hibiscus': 3, 'White Teeth': 3, 'The Silver Chair': 3, 'Brown Girl, Brownstones': 4,
      'Blue Highways': 4, 'Black Leopard, Red Wolf': 4, 'Blue Nights': 4,
    },
  },
  {
    text: 'A book where a dog plays a major part',
    answers: {
      'The Hound of the Baskervilles': 1, 'The Call of the Wild': 1, 'White Fang': 1, 'Marley & Me|marley and me': 1,
      'The Curious Incident of the Dog in the Night-Time': 1, 'Old Yeller': 2, 'Where the Red Fern Grows': 2,
      'Lassie Come-Home|lassie': 2, 'Because of Winn-Dixie': 2, 'Cujo': 2, 'The Hundred and One Dalmatians|101 dalmatians': 2,
      'The Wonderful Wizard of Oz|the wizard of oz': 2, 'Shiloh': 3, 'Travels with Charley': 3, 'Sounder': 3,
      'Heart of a Dog|the heart of a dog': 3, 'Three Men in a Boat': 3, 'Flush': 4, 'Timbuktu': 4, 'Fifteen Dogs': 4,
    },
  },
];

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/½/g, ' 1/2')
    .replace(/[^a-z0-9/ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(the|a|an) /, '');

export interface Judgement {
  tier: Tier;
  title: string;
}

export function judge(prompt: Prompt, input: string): Judgement {
  const n = norm(input);
  if (!n) return { tier: 0, title: input };
  for (const [keys, tier] of Object.entries(prompt.answers)) {
    const variants = keys.split('|');
    if (variants.some((v) => norm(v) === n)) return { tier, title: variants[0] };
  }
  return { tier: 0, title: input.trim() };
}

export const MAX_POINTS = PROMPTS.length * TIER_POINTS[4];
