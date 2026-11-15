/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * University metadata used by the preview app. Keep this registry as the single
 * source for university names and stable IDs. Do not add estimated statistics
 * or other unverified metadata here.
 */
export interface UniversityRecord {
  /** Stable application ID; do not derive this from the display name at runtime. */
  readonly id: string;
  /** Canonical name shown in profile and registration selectors. */
  readonly displayName: string;
  /** Existing abbreviation, retained as written in the original university list. */
  readonly shortName: string;
}

export interface Achievement {
  title: string;
  icon: string;
}

export interface UserProfile {
  id: string;
  username: string;
  university: string;
  avatar: string;
  points: number;
  wins: number;
  losses: number;
  achievements: Achievement[];
}

export interface TournamentMatch {
  p1: string;
  p2: string;
  score?: string;
}

export interface TournamentBracket {
  semiFinals: TournamentMatch[];
  finals: TournamentMatch[];
}

export interface Tournament {
  id: string;
  title: string;
  game: string;
  type: string;
  university: string;
  entry: string;
  participantsCount: number;
  maxParticipants: number;
  reward: string;
  status: 'In Progress' | 'Registration Open' | 'Live' | 'Completed';
  startDate: string;
  bracket: TournamentBracket | null;
  registeredUserIds?: string[];
}

export interface GameRoom {
  id: string;
  name: string;
  game: string;
  host: string;
  players: number;
  max: number;
  status: 'Waiting' | 'Playing';
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  category: string;
}
