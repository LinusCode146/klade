// Prompt pool. Each prompt's answer set is built from the catalogue by a rule,
// plus hand-picked `include`s, minus `exclude`s. `tiers` overrides the rarity
// estimate (1 common … 4 very rare, 0 = does not count).
// Titles may be given as "Title|Author" to disambiguate.

const words = (list) => `\\b(${list.join('|')})\\b`;

export const NUMBER_WORDS = [
  '\\d+', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'thirty',
  'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'hundred', 'thousand', 'million', 'billion',
  'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
  'eleventh', 'twelfth', 'thirteenth', 'hundredth', 'thousandth', 'dozen', 'half', 'double', 'twice',
];

export const PROMPT_DEFS = [
  {
    id: 'number',
    text: 'A book with a number in its title',
    rule: { type: 'titleRegex', pattern: words(NUMBER_WORDS) },
    exclude: ['The Second Coming'],
  },
  {
    id: 'colour',
    text: 'A book with a colour in its title',
    rule: {
      type: 'titleRegex',
      pattern: words([
        'red', 'blue', 'bluest', 'green', 'yellow', 'orange', 'purple', 'violet', 'pink', 'black', 'white',
        'grey', 'gray', 'brown', 'scarlet', 'crimson', 'golden', 'gold', 'silver', 'indigo', 'amber', 'azure',
        'ivory', 'emerald', 'lavender', 'magenta', 'maroon', 'turquoise', 'vermilion', 'ochre', 'sapphire',
      ]),
    },
  },
  {
    id: 'animal',
    text: 'A book with an animal in its title',
    rule: {
      type: 'titleRegex',
      pattern: words([
        'cats?', 'dogs?', 'wol(f|ves)', 'birds?', 'mockingbird', 'blackbird', 'horses?', 'lions?', 'tigers?',
        'bears?', 'foxe?s?', 'rabbits?', 'hares?', 'mice', 'mouse', 'rats?', 'owls?', 'eagles?', 'hawks?',
        'falcon', 'crows?', 'ravens?', 'doves?', 'sparrows?', 'swans?', 'geese', 'goose', 'ducks?', 'pigs?',
        'sheep', 'lambs?', 'goats?', 'cows?', 'bulls?', 'oxen', 'elephants?', 'whales?', 'dolphins?', 'sharks?',
        'fish', 'snakes?', 'serpents?', 'dragons?', 'spiders?', 'bees?', 'butterfl(y|ies)', 'moths?', 'flies',
        'ants?', 'frogs?', 'toads?', 'turtles?', 'monkeys?', 'apes?', 'gorillas?', 'deer', 'stags?', 'mules?',
        'donkeys?', 'camels?', 'leopards?', 'panthers?', 'jaguars?', 'hounds?', 'kittens?', 'puppies', 'ponies',
        'pony', 'penguins?', 'parrots?', 'peacocks?', 'nightingales?', 'larks?', 'crocodiles?', 'zebras?',
        'giraffes?', 'otters?', 'badgers?', 'weasels?', 'moles?', 'squirrels?', 'hedgehogs?', 'bats?', 'unicorns?',
        'octopus', 'squid', 'crabs?', 'lobsters?', 'herons?', 'cranes?', 'kingfisher', 'cuckoos?',
      ]),
    },
    exclude: ['Mole People', 'The Bat'],
  },
  {
    id: 'body',
    text: 'A book with a body part in its title',
    rule: {
      type: 'titleRegex',
      pattern: words([
        'hearts?', 'hands?', 'eyes?', 'bones?', 'skin', 'heads?', 'faces?', 'teeth', 'tooth', 'mouth', 'feet',
        'foot', 'fingers?', 'hair', 'tongues?', 'lips', 'skull', 'blood', 'brains?', 'arms', 'legs?', 'knees?',
        'shoulders?', 'necks?', 'thumbs?', 'ears?', 'nose', 'belly', 'spine', 'ribs?',
      ]),
    },
    exclude: ['Arms and the Man'],
  },
  {
    id: 'weather',
    text: 'A book with weather in its title',
    rule: {
      type: 'titleRegex',
      pattern: words(['rain', 'rains', 'snow', 'snows', 'storms?', 'stormy', 'wind', 'winds', 'thunder', 'clouds?', 'fog', 'mist', 'lightning', 'hail', 'frost', 'tempest', 'hurricane', 'tornado', 'blizzard', 'drought', 'rainbow', 'sunshine', 'monsoon', 'gale']),
    },
  },
  {
    id: 'season',
    text: 'A book with a season or month in its title',
    rule: {
      type: 'titleRegex',
      pattern: words(['summer', 'winter', 'autumn', 'springtime', 'midsummer', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']),
    },
    exclude: ['The Long March', 'March'],
  },
  {
    id: 'night',
    text: 'A book with "night" in its title',
    rule: { type: 'titleRegex', pattern: words(['night', 'nights', 'nighttime', 'midnight', 'tonight']) },
  },
  {
    id: 'oneword',
    text: 'A book with a one-word title',
    rule: { type: 'oneWord' },
  },
  {
    id: 'penname',
    text: 'A book whose author used a pen name',
    rule: { type: 'sparql', query: 'penname' },
    include: [
      'Jane Eyre', 'Wuthering Heights', 'Agnes Grey', 'The Tenant of Wildfell Hall', 'Thinner', 'The Running Man|Stephen King',
      'Rage|Stephen King', 'The Long Walk', 'Roadwork', "The Cuckoo's Calling", 'The Silkworm', 'Absent in the Spring',
    ],
    exclude: [],
  },
  {
    id: 'island',
    text: 'A novel set on an island',
    rule: { type: 'sparql', query: 'island' },
    exclude: ["Harry Potter and the Philosopher's Stone", 'Book of Revelation'],
    include: ['Lord of the Flies', 'Robinson Crusoe', 'Treasure Island', 'And Then There Were None', 'Life of Pi', 'Shutter Island', 'Jurassic Park', 'The Island of Doctor Moreau', 'The Swiss Family Robinson', 'Island of the Blue Dolphins', 'The Mysterious Island', 'The Guernsey Literary and Potato Peel Pie Society', "Captain Corelli's Mandolin", 'Wide Sargasso Sea', 'The Beach', 'To the Lighthouse', 'The Light Between Oceans', 'Island|Aldous Huxley', 'The Wasp Factory', 'Mister Pip'],
  },
  {
    id: 'nobel',
    text: 'A book by a Nobel Prize in Literature winner',
    rule: { type: 'sparql', query: 'nobel' },
  },
  {
    id: 'film',
    text: 'A book that was made into a film',
    rule: { type: 'sparql', query: 'film' },
  },
  {
    id: 'russian',
    text: 'A book originally written in Russian',
    rule: { type: 'sparql', query: 'russian' },
  },
  {
    id: 'french',
    text: 'A book originally written in French',
    rule: { type: 'sparql', query: 'french' },
  },
  {
    id: 'japanese',
    text: 'A book originally written in Japanese',
    rule: { type: 'sparql', query: 'japanese' },
  },
  {
    id: 'pre1800',
    text: 'A book first published before 1800',
    rule: { type: 'year', before: 1800 },
  },
  {
    id: 'thiscentury',
    text: 'A book first published in the 21st century',
    rule: { type: 'year', from: 2001 },
  },
  {
    id: 'banned',
    text: 'A book that has been banned somewhere',
    rule: { type: 'list' },
    include: [
      'Nineteen Eighty-Four', 'The Catcher in the Rye', 'To Kill a Mockingbird', 'Lolita', 'Brave New World', "The Handmaid's Tale",
      'Animal Farm', 'Ulysses|James Joyce', 'The Satanic Verses', "Lady Chatterley's Lover", 'Of Mice and Men', 'Fahrenheit 451', 'Maus',
      'Beloved|Toni Morrison', 'The Grapes of Wrath', 'Slaughterhouse-Five', "Harry Potter and the Philosopher's Stone", 'The Kite Runner',
      'Doctor Zhivago', 'Madame Bovary', 'Tropic of Cancer', 'The Master and Margarita', 'Persepolis', 'Naked Lunch', "Uncle Tom's Cabin",
      'American Psycho', 'The Well of Loneliness', 'Wild Swans', 'Lajja', 'The Color Purple', 'Gender Queer', 'Candide', 'The Gulag Archipelago',
      'One Day in the Life of Ivan Denisovich', 'All Quiet on the Western Front', 'The Adventures of Huckleberry Finn', 'Howl', 'Fanny Hill',
      'The Diary of a Young Girl', 'Brokeback Mountain', 'Ruslan and Ludmila', 'We|Yevgeny Zamyatin', 'Les Fleurs du mal', 'Lord of the Flies',
    ],
  },
  {
    id: 'nonhuman',
    text: "A book narrated by someone who isn't human",
    rule: { type: 'list' },
    include: [
      'The Book Thief', 'Black Beauty', 'The Art of Racing in the Rain', 'Klara and the Sun', "A Dog's Purpose", 'War Horse',
      'Grendel|John Gardner', 'Flush|Virginia Woolf', 'I Am a Cat', 'My Name Is Red', 'Timbuktu|Paul Auster',
    ],
  },
  {
    id: 'dog',
    text: 'A book where a dog plays a major part',
    rule: { type: 'list' },
    include: [
      'The Hound of the Baskervilles', 'The Call of the Wild', 'White Fang', 'Marley & Me', 'The Curious Incident of the Dog in the Night-Time',
      'Old Yeller', 'Where the Red Fern Grows', 'Lassie Come-Home', 'Because of Winn-Dixie', 'Cujo', 'The Hundred and One Dalmatians',
      "The Wonderful Wizard of Oz", 'Shiloh|Phyllis Reynolds Naylor', 'Travels with Charley', 'Sounder', 'Heart of a Dog', 'Three Men in a Boat',
      'Flush|Virginia Woolf', 'Timbuktu|Paul Auster', 'Fifteen Dogs', 'The Art of Racing in the Rain', "A Dog's Purpose", 'Clifford the Big Red Dog',
      'Hachi: A Dog\'s Tale', 'Lad: A Dog', 'Big Red', 'Ribsy', 'Harry the Dirty Dog',
    ],
  },
];
