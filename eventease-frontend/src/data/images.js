// ====== Event photos ======
// Hosted on Unsplash so the project stays small. Every <Img> falls back to the built-in SVG artwork
// if a photo cannot load (offline / blocked). To use your own pictures, put files in /public/images
// and replace a line with '/images/wedding.jpg'.
const U = (id, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

export const PHOTO = {
  Wedding: U('1519741497674-611481863552'),
  Birthday: U('1530103862676-de8c9debad1d'),
  Corporate: U('1511578314322-379afb476865'),
  Conference: U('1540575467063-178a50c2df87'),
  Concert: U('1470229722913-7c0e2dbbafd3'),
  Other: U('1505236858219-8359eb29e329'),
  Party: U('1492684223066-81342ee5ff30'),
  Festival: U('1429962714451-bb934ecdc4ec'),
  Venue: U('1511795409834-ef04bbd61622')
};

export const coverFor = type => PHOTO[type] || PHOTO.Other;

// Big sliding hero on the landing page
export const HERO_SLIDES = [
  { src: U('1492684223066-81342ee5ff30', 1800), type: 'Birthday', label: 'Parties that people remember' },
  { src: U('1470229722913-7c0e2dbbafd3', 1800), type: 'Concert', label: 'Concerts and live shows' },
  { src: U('1519741497674-611481863552', 1800), type: 'Wedding', label: 'Weddings, planned stress-free' },
  { src: U('1540575467063-178a50c2df87', 1800), type: 'Conference', label: 'Conferences and summits' }
];

// Endless sliding strip
export const GALLERY = [
  { src: PHOTO.Venue, type: 'Wedding' }, { src: PHOTO.Festival, type: 'Concert' }, { src: PHOTO.Corporate, type: 'Corporate' },
  { src: PHOTO.Birthday, type: 'Birthday' }, { src: PHOTO.Conference, type: 'Conference' }, { src: PHOTO.Wedding, type: 'Wedding' },
  { src: PHOTO.Concert, type: 'Concert' }, { src: PHOTO.Party, type: 'Birthday' }
];

export const CATEGORY_CARDS = [
  { type: 'Wedding', text: 'Venue, catering, guests and decoration in one plan.' },
  { type: 'Birthday', text: 'Themes, cakes, games and a guest list that behaves.' },
  { type: 'Corporate', text: 'Dinners, retreats and launches with a clean budget.' },
  { type: 'Conference', text: 'Sessions, speakers, registration and schedules.' },
  { type: 'Concert', text: 'Artists, crew, ticketing and crowd planning.' }
];
