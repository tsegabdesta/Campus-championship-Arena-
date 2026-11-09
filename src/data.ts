/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, Tournament, GameRoom, QuizQuestion } from './types';
import { sanitizeUrl, sanitizeInteger } from './security';

export const DEFAULT_UNIVERSITIES = [
  'Addis Ababa University (AAU)',
  'Adama Science & Technology University (ASTU)',
  'Addis Ababa Science & Technology University (AASTU)',
  'Jimma University (JU)',
  'Hawassa University (HU)',
  'Bahir Dar University (BDU)',
  'Mekelle University (MU)',
  'Haramaya University (HRU)',
  'Arba Minch University (AMU)',
  'Gondar University (UoG)',
];

export const DEFAULT_USER: UserProfile = {
  // A fresh guest profile: no invented stats or badges. Real identity needs accounts (Phase 3).
  id: 'std_9021',
  username: 'Guest_Student',
  university: 'Addis Ababa University (AAU)',
  avatar: '',
  points: 0,
  wins: 0,
  losses: 0,
  achievements: [],
};

export const DEFAULT_TOURNAMENTS: Tournament[] = [
  {
    id: 'tourney_1',
    title: 'Sample: AAU Inter-Varsity EA FC 24 Clash',
    game: 'EA FC 24',
    type: 'Console / PC',
    university: 'Addis Ababa University (AAU)',
    entry: 'Free Entry (Official Student Badge)',
    participantsCount: 32,
    maxParticipants: 32,
    reward: '5,000 Campus XP + Gold Badge',
    status: 'In Progress',
    startDate: 'Today, 5:00 PM EAT',
    registeredUserIds: ['std_9021', 'std_4412'],
    bracket: {
      semiFinals: [
        { p1: 'Sample_Player_A', p2: 'Dawit_ASTU', score: '3 - 1' },
        { p1: 'Yonas_Jimma', p2: 'Kidus_AASTU', score: '2 - 0' },
      ],
      finals: [{ p1: 'Sample_Player_A', p2: 'Yonas_Jimma', score: 'Pending' }],
    },
  },
  {
    id: 'tourney_2',
    title: 'Sample: Dream League Soccer (DLS 24) Great Run',
    game: 'Dream League Soccer',
    type: 'Mobile',
    university: 'All Ethiopian Universities',
    entry: 'Free Entry',
    participantsCount: 48,
    maxParticipants: 64,
    reward: '3,500 Campus XP',
    status: 'Registration Open',
    startDate: 'Tomorrow, 7:00 PM EAT',
    registeredUserIds: [],
    bracket: null,
  },
  {
    id: 'tourney_3',
    title: 'Sample: Ethiopian Chess Blitz Championship',
    game: 'Chess',
    type: 'Web / Cross-Platform',
    university: 'ASTU & JU Joint Host',
    entry: 'Free Entry',
    participantsCount: 16,
    maxParticipants: 16,
    reward: '4,000 Campus XP + Chess Trophy',
    status: 'Live',
    startDate: 'Live Now',
    registeredUserIds: ['std_7718'],
    bracket: {
      semiFinals: [
        { p1: 'Selam_BDU', p2: 'Mulugeta_HU', score: '1 - 0' },
        { p1: 'Eyob_MU', p2: 'Nahom_JU', score: '0.5 - 1.5' },
      ],
      finals: [{ p1: 'Selam_BDU', p2: 'Nahom_JU', score: '1 - 0' }],
    },
  },
  {
    id: 'tourney_4',
    title: 'Sample: Inter-Campus General & Tech Quiz Bowl',
    game: 'Quiz Challenges',
    type: 'Web Real-Time',
    university: 'AASTU Host',
    entry: 'Free Entry',
    participantsCount: 88,
    maxParticipants: 120,
    reward: '2,500 Campus XP',
    status: 'Registration Open',
    startDate: 'Nov 12, 6:00 PM EAT',
    registeredUserIds: [],
    bracket: null,
  },
];

export const DEFAULT_ROOMS: GameRoom[] = [
  {
    id: 'AAU-8821',
    name: 'Sample: 4 Kilo Dorm 5 Chess Room',
    game: 'Chess',
    host: 'Bini_4Kilo',
    players: 2,
    max: 2,
    status: 'Playing',
  },
  {
    id: 'JU-3312',
    name: 'Sample: Jimma Tech DLS Fast Match',
    game: 'Dream League Soccer',
    host: 'Tedy_JU',
    players: 1,
    max: 2,
    status: 'Waiting',
  },
  {
    id: 'ASTU-119',
    name: 'Sample: Adama Coding & Gaming Chill',
    game: 'Tic-tac-toe',
    host: 'Hanna_ASTU',
    players: 1,
    max: 2,
    status: 'Waiting',
  },
];

export const ETHIOPIAN_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: 'Which Ethiopian university is historically known for pioneering engineering in Bishoftu/Adama?',
    options: ['ASTU', 'Arba Minch University', 'Bahir Dar University', 'Wollo University'],
    answer: 0,
    category: 'Campus Trivia',
  },
  {
    question: 'What is the ancient obelisk city located in Tigray, Ethiopia?',
    options: ['Lalibela', 'Axum', 'Gondar', 'Harar'],
    answer: 1,
    category: 'History',
  },
  {
    question: 'The Grand Ethiopian Renaissance Dam (GERD) is constructed along which major river?',
    options: ['Awash River', 'Omo River', 'Abay (Blue Nile)', 'Wabe Shebelle'],
    answer: 2,
    category: 'Geography',
  },
  {
    question: "Which of the following is Ethiopia's top-level domain on the internet?",
    options: ['.et', '.ea', '.eth', '.ep'],
    answer: 0,
    category: 'Tech',
  },
  {
    question: 'In what year was Addis Ababa University originally founded as University College of Addis Ababa?',
    options: ['1950', '1960', '1974', '1935'],
    answer: 0,
    category: 'Campus Trivia',
  },
];

/**
 * Defensive localStorage validation function for user profiles
 */
export function validateUserState(raw: unknown): UserProfile {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_USER };
  }
  const obj = raw as Partial<UserProfile>;
  return {
    id: typeof obj.id === 'string' && obj.id.trim() ? obj.id.slice(0, 32) : DEFAULT_USER.id,
    username:
      typeof obj.username === 'string' && obj.username.trim()
        ? obj.username.trim().slice(0, 30)
        : DEFAULT_USER.username,
    university:
      typeof obj.university === 'string' && obj.university.trim()
        ? obj.university.trim().slice(0, 80)
        : DEFAULT_USER.university,
    avatar: sanitizeUrl(obj.avatar),
    points: sanitizeInteger(obj.points, DEFAULT_USER.points, 0, 1000000),
    wins: sanitizeInteger(obj.wins, 0, 0, 100000),
    losses: sanitizeInteger(obj.losses, 0, 0, 100000),
    achievements: Array.isArray(obj.achievements)
      ? obj.achievements.map((a) => ({
          title: typeof a?.title === 'string' ? a.title.slice(0, 40) : 'Gamer',
          icon: typeof a?.icon === 'string' ? a.icon.slice(0, 8) : '🎮',
        }))
      : [...DEFAULT_USER.achievements],
  };
}

/**
 * Defensive localStorage validation for tournament records
 */
export function validateTournaments(raw: unknown): Tournament[] {
  if (!Array.isArray(raw)) return DEFAULT_TOURNAMENTS;
  return raw.map((item, idx) => {
    if (!item || typeof item !== 'object') {
      return DEFAULT_TOURNAMENTS[idx % DEFAULT_TOURNAMENTS.length];
    }
    const t = item as Partial<Tournament>;
    return {
      id: typeof t.id === 'string' ? t.id.slice(0, 40) : `tourney_${idx}`,
      title: typeof t.title === 'string' ? t.title.slice(0, 80) : 'Campus Cup',
      game: typeof t.game === 'string' ? t.game.slice(0, 40) : 'Casual',
      type: typeof t.type === 'string' ? t.type.slice(0, 40) : 'Invitational',
      university: typeof t.university === 'string' ? t.university.slice(0, 80) : 'Ethiopian Campus',
      entry: typeof t.entry === 'string' ? t.entry.slice(0, 40) : 'Free Entry',
      participantsCount: sanitizeInteger(t.participantsCount, 1, 0, 500),
      maxParticipants: sanitizeInteger(t.maxParticipants, 32, 2, 500),
      reward: typeof t.reward === 'string' ? t.reward.slice(0, 60) : 'Virtual XP',
      status: (['In Progress', 'Registration Open', 'Live', 'Completed'].includes(t.status as string)
        ? t.status
        : 'Registration Open') as Tournament['status'],
      startDate: typeof t.startDate === 'string' ? t.startDate.slice(0, 40) : 'TBD',
      registeredUserIds: Array.isArray(t.registeredUserIds)
        ? t.registeredUserIds.filter((id) => typeof id === 'string')
        : [],
      bracket:
        t.bracket && typeof t.bracket === 'object'
          ? {
              semiFinals: Array.isArray(t.bracket.semiFinals) ? t.bracket.semiFinals : [],
              finals: Array.isArray(t.bracket.finals) ? t.bracket.finals : [],
            }
          : null,
    };
  });
}

/**
 * Defensive localStorage validation for game rooms
 */
export function validateRooms(raw: unknown): GameRoom[] {
  if (!Array.isArray(raw)) return DEFAULT_ROOMS;
  return raw.map((item, idx) => {
    if (!item || typeof item !== 'object') {
      return DEFAULT_ROOMS[idx % DEFAULT_ROOMS.length];
    }
    const r = item as Partial<GameRoom>;
    return {
      id: typeof r.id === 'string' ? r.id.slice(0, 20) : `ROOM-${idx}`,
      name: typeof r.name === 'string' ? r.name.slice(0, 60) : 'Student Room',
      game: typeof r.game === 'string' ? r.game.slice(0, 40) : 'Chess',
      host: typeof r.host === 'string' ? r.host.slice(0, 30) : 'Host',
      players: sanitizeInteger(r.players, 1, 1, 4),
      max: sanitizeInteger(r.max, 2, 2, 4),
      status: r.status === 'Playing' ? 'Playing' : 'Waiting',
    };
  });
}
