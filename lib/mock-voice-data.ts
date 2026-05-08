export type CallStatusType =
  | 'forwarded'
  | 'order-intent'
  | 'reservation-intent'
  | 'robo-caller'
  | 'no-outcome';

export interface MockCall {
  id: string;
  timestamp: string;
  timeLabel: string;
  phoneNumber: string;
  statuses: CallStatusType[];
  unknownsCount: number;
  locationId: string;
  duration: string;
}

export interface MockLocation {
  id: string;
  nickname: string;
  address: string;
  city: string;
  state: string;
  belanPhone: string;
  activeOrdering: boolean;
  isOpen: boolean;
  hours: string;
}

export interface MockFAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface MockUpsell {
  id: string;
  triggerItem: string;
  suggestedItem: string;
  message: string;
  active: boolean;
}

export interface MockVoice {
  id: string;
  name: string;
  gender: 'male' | 'female';
  accent: string;
  description: string;
  emoji: string;
}

export interface MockReportingPoint {
  date: string;
  totalCalls: number;
  aiHandled: number;
  forwarded: number;
  roboBlocked: number;
}

export const mockCalls: MockCall[] = [
  {
    id: '1',
    timestamp: '2026-04-22T16:33:00',
    timeLabel: '4:33 pm',
    phoneNumber: '+1 (361) 433-2933',
    statuses: ['forwarded'],
    unknownsCount: 0,
    locationId: 'loc1',
    duration: '1m 42s',
  },
  {
    id: '2',
    timestamp: '2026-04-22T16:30:00',
    timeLabel: '4:30 pm',
    phoneNumber: '+1 (435) 896-4304',
    statuses: ['reservation-intent'],
    unknownsCount: 0,
    locationId: 'loc2',
    duration: '2m 18s',
  },
  {
    id: '3',
    timestamp: '2026-04-22T16:29:00',
    timeLabel: '4:29 pm',
    phoneNumber: '+1 (720) 213-5812',
    statuses: ['robo-caller'],
    unknownsCount: 0,
    locationId: 'loc1',
    duration: '0m 12s',
  },
  {
    id: '4',
    timestamp: '2026-04-22T16:27:00',
    timeLabel: '4:27 pm',
    phoneNumber: '+1 (501) 528-2376',
    statuses: ['no-outcome'],
    unknownsCount: 0,
    locationId: 'loc3',
    duration: '0m 47s',
  },
  {
    id: '5',
    timestamp: '2026-04-22T16:25:00',
    timeLabel: '4:25 pm',
    phoneNumber: '+1 (801) 830-1560',
    statuses: ['order-intent'],
    unknownsCount: 0,
    locationId: 'loc2',
    duration: '3m 05s',
  },
  {
    id: '6',
    timestamp: '2026-04-22T16:20:00',
    timeLabel: '4:20 pm',
    phoneNumber: '+1 (512) 448-7701',
    statuses: ['order-intent', 'forwarded'],
    unknownsCount: 0,
    locationId: 'loc1',
    duration: '4m 22s',
  },
  {
    id: '7',
    timestamp: '2026-04-22T16:14:00',
    timeLabel: '4:14 pm',
    phoneNumber: '+1 (713) 882-0023',
    statuses: ['no-outcome'],
    unknownsCount: 0,
    locationId: 'loc3',
    duration: '0m 31s',
  },
  {
    id: '8',
    timestamp: '2026-04-22T16:05:00',
    timeLabel: '4:05 pm',
    phoneNumber: '+1 (210) 554-3819',
    statuses: ['reservation-intent'],
    unknownsCount: 0,
    locationId: 'loc2',
    duration: '1m 58s',
  },
  {
    id: '9',
    timestamp: '2026-04-22T15:50:00',
    timeLabel: '3:50 pm',
    phoneNumber: '+1 (469) 730-5544',
    statuses: ['robo-caller'],
    unknownsCount: 0,
    locationId: 'loc1',
    duration: '0m 08s',
  },
  {
    id: '10',
    timestamp: '2026-04-22T15:43:00',
    timeLabel: '3:43 pm',
    phoneNumber: '+1 (832) 221-4490',
    statuses: ['order-intent'],
    unknownsCount: 0,
    locationId: 'loc3',
    duration: '2m 47s',
  },
  {
    id: '11',
    timestamp: '2026-04-22T15:30:00',
    timeLabel: '3:30 pm',
    phoneNumber: '+1 (214) 663-8823',
    statuses: ['forwarded'],
    unknownsCount: 0,
    locationId: 'loc2',
    duration: '1m 12s',
  },
  {
    id: '12',
    timestamp: '2026-04-22T15:18:00',
    timeLabel: '3:18 pm',
    phoneNumber: '+1 (903) 447-2261',
    statuses: ['order-intent'],
    unknownsCount: 0,
    locationId: 'loc1',
    duration: '3m 34s',
  },
  {
    id: '13',
    timestamp: '2026-04-22T15:05:00',
    timeLabel: '3:05 pm',
    phoneNumber: '+1 (281) 559-0017',
    statuses: ['no-outcome'],
    unknownsCount: 0,
    locationId: 'loc3',
    duration: '0m 22s',
  },
  {
    id: '14',
    timestamp: '2026-04-22T14:52:00',
    timeLabel: '2:52 pm',
    phoneNumber: '+1 (956) 112-7743',
    statuses: ['reservation-intent', 'order-intent'],
    unknownsCount: 0,
    locationId: 'loc2',
    duration: '4m 51s',
  },
  {
    id: '15',
    timestamp: '2026-04-22T14:40:00',
    timeLabel: '2:40 pm',
    phoneNumber: '+1 (737) 204-9988',
    statuses: ['robo-caller'],
    unknownsCount: 0,
    locationId: 'loc1',
    duration: '0m 05s',
  },
];

export const mockLocations: MockLocation[] = [
  {
    id: 'loc1',
    nickname: 'Burrito Bros Downtown',
    address: '1802 E 6th Street',
    city: 'Austin',
    state: 'TX',
    belanPhone: '+1 (512) 812-9551',
    activeOrdering: true,
    isOpen: true,
    hours: 'Mon–Sun 10am–10pm',
  },
  {
    id: 'loc2',
    nickname: 'Burrito Bros Katy',
    address: '18080 Katy Freeway',
    city: 'Houston',
    state: 'TX',
    belanPhone: '+1 (346) 550-8477',
    activeOrdering: true,
    isOpen: true,
    hours: 'Mon–Sun 11am–9pm',
  },
  {
    id: 'loc3',
    nickname: 'Burrito Bros Park Meadow',
    address: '9595 E County Line Rd',
    city: 'Centennial',
    state: 'CO',
    belanPhone: '+1 (720) 664-9514',
    activeOrdering: false,
    isOpen: false,
    hours: 'Mon–Sat 11am–8pm',
  },
  {
    id: 'loc4',
    nickname: 'Burrito Bros North Campus',
    address: '3016 Guadalupe Street',
    city: 'Austin',
    state: 'TX',
    belanPhone: '+1 (737) 258-3701',
    activeOrdering: true,
    isOpen: true,
    hours: 'Mon–Sun 10am–11pm',
  },
];

export const mockFAQs: MockFAQ[] = [
  {
    id: 'faq1',
    question: 'What are your hours of operation?',
    answer: 'We are open Monday through Sunday, 10am to 10pm. Holiday hours may vary.',
    category: 'General',
  },
  {
    id: 'faq2',
    question: 'Do you offer gluten-free options?',
    answer: 'Yes! We offer gluten-free tortillas as a substitute for any burrito. Please let your server know when ordering.',
    category: 'Menu',
  },
  {
    id: 'faq3',
    question: 'Can I make a reservation?',
    answer: 'We accept reservations for parties of 6 or more. Please call us or ask the AI to connect you with a team member.',
    category: 'Reservations',
  },
  {
    id: 'faq4',
    question: 'Do you offer catering?',
    answer: 'Absolutely! We offer catering for events of all sizes. Contact us at least 48 hours in advance to discuss your needs.',
    category: 'Catering',
  },
  {
    id: 'faq5',
    question: 'Is there parking available?',
    answer: 'Yes, we have a free parking lot with 30 spaces available. Street parking is also available nearby.',
    category: 'General',
  },
  {
    id: 'faq6',
    question: 'Do you have vegan options?',
    answer: 'Yes! We have a dedicated vegan menu section including black bean bowls, veggie burritos, and plant-based protein options.',
    category: 'Menu',
  },
  {
    id: 'faq7',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit and debit cards, Apple Pay, Google Pay, and cash.',
    category: 'Payment',
  },
  {
    id: 'faq8',
    question: 'Can I place a takeout order by phone?',
    answer: 'Yes! Our AI can take your order over the phone. Just tell it what you would like and your pickup time.',
    category: 'Ordering',
  },
  {
    id: 'faq9',
    question: 'Do you have a loyalty program?',
    answer: 'Yes, we have the Burrito Bros Rewards program. Sign up on our website to earn points on every purchase.',
    category: 'General',
  },
];

export const mockUpsells: MockUpsell[] = [
  {
    id: 'up1',
    triggerItem: 'Burrito Bowl',
    suggestedItem: 'Guacamole Add-On',
    message: "Would you like to add fresh guacamole to your bowl for just $2.50?",
    active: true,
  },
  {
    id: 'up2',
    triggerItem: 'Any Entree',
    suggestedItem: 'Horchata',
    message: 'Can I add a freshly made horchata to your order today?',
    active: true,
  },
  {
    id: 'up3',
    triggerItem: 'Quesadilla',
    suggestedItem: 'Queso Dip',
    message: 'Our queso dip pairs perfectly with the quesadilla — want to add it?',
    active: true,
  },
  {
    id: 'up4',
    triggerItem: 'Chips & Salsa',
    suggestedItem: 'Queso Dip',
    message: 'Would you like to upgrade to our chips, salsa & queso combo?',
    active: false,
  },
  {
    id: 'up5',
    triggerItem: 'Tacos (3)',
    suggestedItem: 'Side of Rice & Beans',
    message: 'Add a side of rice and beans for just $3 to complete your meal?',
    active: true,
  },
  {
    id: 'up6',
    triggerItem: 'Kids Meal',
    suggestedItem: 'Churro',
    message: 'Would the little one like a churro for dessert today?',
    active: true,
  },
];

export const mockVoices: MockVoice[] = [
  {
    id: 'voice1',
    name: 'Rosa',
    gender: 'female',
    accent: 'American English',
    description: 'Warm & friendly',
    emoji: '👩',
  },
  {
    id: 'voice2',
    name: 'Marco',
    gender: 'male',
    accent: 'American English',
    description: 'Calm & professional',
    emoji: '👨',
  },
  {
    id: 'voice3',
    name: 'Sofia',
    gender: 'female',
    accent: 'Bilingual (EN/ES)',
    description: 'Energetic & welcoming',
    emoji: '👩‍🦱',
  },
  {
    id: 'voice4',
    name: 'James',
    gender: 'male',
    accent: 'Southern US',
    description: 'Relaxed & trustworthy',
    emoji: '🧔',
  },
];

export const mockReportingData: MockReportingPoint[] = [
  { date: 'Apr 16', totalCalls: 38, aiHandled: 29, forwarded: 7, roboBlocked: 2 },
  { date: 'Apr 17', totalCalls: 51, aiHandled: 40, forwarded: 8, roboBlocked: 3 },
  { date: 'Apr 18', totalCalls: 44, aiHandled: 35, forwarded: 7, roboBlocked: 2 },
  { date: 'Apr 19', totalCalls: 62, aiHandled: 50, forwarded: 9, roboBlocked: 3 },
  { date: 'Apr 20', totalCalls: 71, aiHandled: 55, forwarded: 12, roboBlocked: 4 },
  { date: 'Apr 21', totalCalls: 58, aiHandled: 46, forwarded: 10, roboBlocked: 2 },
  { date: 'Apr 22', totalCalls: 43, aiHandled: 34, forwarded: 7, roboBlocked: 2 },
];

export const mockMenuItems: string[] = [
  'Burrito Bowl',
  'Burrito',
  'Tacos (3)',
  'Quesadilla',
  'Nachos',
  'Chips & Salsa',
  'Kids Meal',
  'Guacamole Add-On',
  'Queso Dip',
  'Side of Rice & Beans',
  'Horchata',
  'Agua Fresca',
  'Churro',
  'Any Entree',
];

export const mockGreeting =
  "Hi, thanks for calling Burrito Bros! I'm Belan, your virtual assistant. Would you like to place an order, make a reservation, or be connected to a team member?";

export const mockForwardingNumber = '+1 (512) 489-2563';
