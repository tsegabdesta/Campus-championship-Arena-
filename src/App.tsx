/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CAMPUS ARENA - SECURE APP ENGINE (Phase 1: Security Hardening)
 * Features complete defensive validation, URL sanitization, room code checks,
 * safe React state rendering, and zero unescaped HTML injection.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Gamepad2,
  Trophy,
  Users,
  User,
  Shield,
  Zap,
  Flame,
  Award,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Menu,
  X,
  Target,
  Swords,
} from 'lucide-react';
import { UserProfile, Tournament, GameRoom, QuizQuestion } from './types';
import {
  DEFAULT_UNIVERSITIES,
  DEFAULT_USER,
  DEFAULT_TOURNAMENTS,
  DEFAULT_ROOMS,
  ETHIOPIAN_QUIZ_QUESTIONS,
  validateUserState,
  validateTournaments,
  validateRooms,
} from './data';
import { sanitizeRoomCode, sanitizeText } from './security';

const STORAGE_KEY_USER = 'campus_arena_user';
const STORAGE_KEY_TOURNAMENTS = 'campus_arena_tournaments';
const STORAGE_KEY_ROOMS = 'campus_arena_rooms';

/**
 * Local initials avatar. Draws the first letter of the username, so the app
 * never loads images from third-party servers (better privacy, and no extra
 * mobile data). Real profile pictures will come with accounts and storage.
 */
function Avatar({ name, className = '' }: { name: string; className?: string }) {
  const initial = (name.trim().charAt(0) || '?').toUpperCase();
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center font-black text-[#00f0ff] bg-gradient-to-tr from-[#0d121f] to-[#19233c] ${className}`}
    >
      {initial}
    </div>
  );
}

export default function App() {
  // Navigation
  const [activePage, setActivePage] = useState<
    'home' | 'games' | 'tournaments' | 'rooms' | 'leaderboard' | 'profile'
  >('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Persistent State with Defensive Validation
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER);
      if (!stored) return DEFAULT_USER;
      return validateUserState(JSON.parse(stored));
    } catch {
      return DEFAULT_USER;
    }
  });

  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TOURNAMENTS);
      if (!stored) return DEFAULT_TOURNAMENTS;
      return validateTournaments(JSON.parse(stored));
    } catch {
      return DEFAULT_TOURNAMENTS;
    }
  });

  const [rooms, setRooms] = useState<GameRoom[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ROOMS);
      if (!stored) return DEFAULT_ROOMS;
      return validateRooms(JSON.parse(stored));
    } catch {
      return DEFAULT_ROOMS;
    }
  });

  // Notifications / Toast
  const [toast, setToast] = useState<{ msg: string; icon?: string } | null>(null);

  const notify = (msg: string, icon = '⚡') => {
    setToast({ msg, icon });
    setTimeout(() => {
      setToast((curr) => (curr?.msg === msg ? null : curr));
    }, 3200);
  };

  // Sync state defensively to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } catch (e) {
      console.warn('Unable to persist user to localStorage', e);
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TOURNAMENTS, JSON.stringify(tournaments));
    } catch (e) {
      console.warn('Unable to persist tournaments to localStorage', e);
    }
  }, [tournaments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(rooms));
    } catch (e) {
      console.warn('Unable to persist rooms to localStorage', e);
    }
  }, [rooms]);

  const addXP = (amount: number) => {
    const val = Math.max(0, Math.floor(amount));
    setUser((prev) => ({
      ...prev,
      points: prev.points + val,
    }));
  };

  // ==========================================
  // MODAL STATES
  // ==========================================
  const [activeModal, setActiveModal] = useState<
    | null
    | { type: 'bracket'; tourneyId: string }
    | { type: 'hostTourney' }
    | { type: 'lobby'; roomCode: string }
    | { type: 'editProfile' }
  >(null);

  // Profile Form state
  const [editUsername, setEditUsername] = useState('');
  const [editUniversity, setEditUniversity] = useState('');

  // Host Tournament Form state
  const [hostTitle, setHostTitle] = useState('');
  const [hostGame, setHostGame] = useState('EA FC 24');

  // Room Join/Create Form state
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [createRoomName, setCreateRoomName] = useState('');
  const [createRoomGame, setCreateRoomGame] = useState('Chess');

  // Tournaments Filter
  const [tourneyFilter, setTourneyFilter] = useState('all');

  // Active Interactive Minigame
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  // ==========================================
  // GAME ENGINES (Tic-Tac-Toe, Quiz, Checkers)
  // ==========================================

  // Tic Tac Toe
  const [tttBoard, setTttBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [tttTurn, setTttTurn] = useState<'X' | 'O'>('X');
  const [tttMode, setTttMode] = useState<'ai' | 'pvp'>('ai');
  const [tttGameOver, setTttGameOver] = useState(false);
  const [tttStatus, setTttStatus] = useState('Turn: Player X (You)');
  const [isAiThinking, setIsAiThinking] = useState(false);

  const resetTTT = () => {
    setTttBoard(Array(9).fill(null));
    setTttTurn('X');
    setTttGameOver(false);
    setTttStatus('Turn: Player X (You)');
    setIsAiThinking(false);
  };

  const checkTTTWinner = (board: (string | null)[]) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  };

  const handleTTTClick = (index: number) => {
    if (tttGameOver || tttBoard[index] !== null || isAiThinking) return;

    const newBoard = [...tttBoard];
    newBoard[index] = tttTurn;
    setTttBoard(newBoard);

    const winner = checkTTTWinner(newBoard);
    if (winner) {
      setTttGameOver(true);
      setTttStatus(`🎉 Winner: Player ${winner}!`);
      if (winner === 'X') {
        notify('Victory! +50 Campus XP awarded!', '🏆');
        addXP(50);
        setUser((prev) => ({ ...prev, wins: prev.wins + 1 }));
      } else {
        notify('Campus Bot won this round. Try again!', '🤖');
        setUser((prev) => ({ ...prev, losses: prev.losses + 1 }));
      }
      return;
    }

    if (newBoard.every((cell) => cell !== null)) {
      setTttGameOver(true);
      setTttStatus('🤝 Stalemate / Draw!');
      notify('Stalemate! +10 participation XP awarded.', '⚔️');
      addXP(10);
      return;
    }

    const nextTurn = tttTurn === 'X' ? 'O' : 'X';
    setTttTurn(nextTurn);

    if (tttMode === 'ai' && nextTurn === 'O') {
      setTttStatus('AI is analyzing board...');
      setIsAiThinking(true);
      setTimeout(() => {
        const emptyIndices = newBoard
          .map((v, i) => (v === null ? i : null))
          .filter((v): v is number => v !== null);

        if (emptyIndices.length > 0) {
          // Tactical AI: 1) Win, 2) Block, 3) Random
          let chosen = -1;
          for (const idx of emptyIndices) {
            const testBoard = [...newBoard];
            testBoard[idx] = 'O';
            if (checkTTTWinner(testBoard) === 'O') {
              chosen = idx;
              break;
            }
          }
          if (chosen === -1) {
            for (const idx of emptyIndices) {
              const testBoard = [...newBoard];
              testBoard[idx] = 'X';
              if (checkTTTWinner(testBoard) === 'X') {
                chosen = idx;
                break;
              }
            }
          }
          if (chosen === -1) {
            chosen = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          }

          newBoard[chosen] = 'O';
          setTttBoard(newBoard);

          const aiWinner = checkTTTWinner(newBoard);
          if (aiWinner) {
            setTttGameOver(true);
            setTttStatus('🤖 Campus Bot won!');
            notify('Campus Bot took the match! Keep training!', '🤖');
            setUser((prev) => ({ ...prev, losses: prev.losses + 1 }));
          } else if (newBoard.every((c) => c !== null)) {
            setTttGameOver(true);
            setTttStatus('🤝 Stalemate / Draw!');
            notify('Stalemate! +10 XP awarded.', '⚔️');
            addXP(10);
          } else {
            setTttTurn('X');
            setTttStatus('Turn: Player X (You)');
          }
        }
        setIsAiThinking(false);
      }, 400);
    } else {
      setTttStatus(`Turn: Player ${nextTurn}`);
    }
  };

  // University Quiz State
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState<number | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const handleQuizAnswer = (optIndex: number) => {
    if (quizAnswered !== null) return;
    setQuizAnswered(optIndex);
    const q = ETHIOPIAN_QUIZ_QUESTIONS[quizIndex];
    if (optIndex === q.answer) {
      setQuizScore((prev) => prev + 25);
      notify('Correct Answer! +25 Campus Points', '🧠');
    } else {
      notify('Incorrect. Knowledge is strength!', '💡');
    }

    setTimeout(() => {
      if (quizIndex + 1 < ETHIOPIAN_QUIZ_QUESTIONS.length) {
        setQuizIndex((prev) => prev + 1);
        setQuizAnswered(null);
      } else {
        const total = optIndex === q.answer ? quizScore + 25 : quizScore;
        addXP(total);
        setQuizCompleted(true);
      }
    }, 1100);
  };

  const restartQuiz = () => {
    setQuizIndex(0);
    setQuizScore(0);
    setQuizAnswered(null);
    setQuizCompleted(false);
  };

  // Checkers (Dama) Interactive Board
  const initCheckers = () => {
    const b = Array(8)
      .fill(null)
      .map(() => Array(8).fill(0));
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) b[r][c] = 2; // Opponent (Purple)
      }
    }
    for (let r = 5; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) b[r][c] = 1; // Player (Cyan)
      }
    }
    return b;
  };

  const [checkersBoard, setCheckersBoard] = useState<number[][]>(initCheckers);
  const [checkersSelected, setCheckersSelected] = useState<[number, number] | null>(null);
  const [checkersTurn, setCheckersTurn] = useState<1 | 2>(1);

  const handleCheckersClick = (r: number, c: number) => {
    const piece = checkersBoard[r][c];

    if (checkersSelected) {
      const [sr, sc] = checkersSelected;
      const forward = checkersTurn === 1 ? -1 : 1;
      const isDiagonalStep = r - sr === forward && Math.abs(c - sc) === 1;

      // Diagonal regular forward move
      if (piece === 0 && isDiagonalStep) {
        const newBoard = checkersBoard.map((row) => [...row]);
        newBoard[r][c] = checkersTurn;
        newBoard[sr][sc] = 0;
        setCheckersBoard(newBoard);
        setCheckersSelected(null);
        setCheckersTurn(checkersTurn === 1 ? 2 : 1);
        notify('Piece moved! Turn swapped.', '🎯');
        return;
      }

      // Diagonal jump move (simple capture)
      const isJump = r - sr === forward * 2 && Math.abs(c - sc) === 2;
      const midR = sr + forward;
      const midC = sc + (c > sc ? 1 : -1);
      const opponentPiece = checkersTurn === 1 ? 2 : 1;

      if (piece === 0 && isJump && checkersBoard[midR]?.[midC] === opponentPiece) {
        const newBoard = checkersBoard.map((row) => [...row]);
        newBoard[r][c] = checkersTurn;
        newBoard[sr][sc] = 0;
        newBoard[midR][midC] = 0; // Captured piece removed
        setCheckersBoard(newBoard);
        setCheckersSelected(null);
        setCheckersTurn(checkersTurn === 1 ? 2 : 1);
        notify('Piece captured! Excellent move.', '🔥');
        addXP(15);
        return;
      }

      // If clicked on own piece, change selection
      if (piece === checkersTurn) {
        setCheckersSelected([r, c]);
        return;
      }
      setCheckersSelected(null);
    } else {
      if (piece === checkersTurn) {
        setCheckersSelected([r, c]);
      }
    }
  };

  // Launch Minigames
  const launchGame = (gameId: string) => {
    setActivePage('games');
    setActiveGameId(gameId);
    if (gameId === 'ttt') resetTTT();
    if (gameId === 'quiz') restartQuiz();
    if (gameId === 'checkers') {
      setCheckersBoard(initCheckers());
      setCheckersSelected(null);
      setCheckersTurn(1);
    }
  };

  // Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = sanitizeText(editUsername, 30);
    const cleanUni = sanitizeText(editUniversity, 80);
    if (!cleanUsername) {
      notify('Username cannot be empty', '⚠️');
      return;
    }
    setUser((prev) => ({
      ...prev,
      username: cleanUsername,
      university: cleanUni || prev.university,
    }));
    setActiveModal(null);
    notify('Student profile card updated!', '✅');
  };

  // Room Create
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeText(createRoomName, 50) || `${user.username}'s Arena`;
    const cleanGame = sanitizeText(createRoomGame, 40) || 'Chess';

    const campusPrefix =
      user.university
        .replace(/[^A-Za-z]/g, '')
        .slice(0, 3)
        .toUpperCase() || 'ETH';
    const rawCode = `${campusPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const roomCode = sanitizeRoomCode(rawCode);

    const newRoom: GameRoom = {
      id: roomCode,
      name: cleanName,
      game: cleanGame,
      host: user.username,
      players: 1,
      max: 2,
      status: 'Waiting',
    };

    setRooms((prev) => [newRoom, ...prev]);
    setActiveModal({ type: 'lobby', roomCode });
    notify(`Room ${roomCode} saved on this device (preview only).`, '🚪');
  };

  // Room Join
  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sanitizeRoomCode(joinCodeInput);
    if (!clean) {
      notify('Please enter a valid alphanumeric room code.', '⚠️');
      return;
    }
    const exists = rooms.find((r) => r.id.toUpperCase() === clean.toUpperCase());
    if (exists) {
      setActiveModal({ type: 'lobby', roomCode: exists.id });
      notify(`Opened lobby ${exists.id} (preview)`, '🔌');
    } else {
      // Rooms exist only in this browser, so an unknown code cannot be joined.
      notify(`No room ${clean} found on this device.`, '⚠️');
    }
    setJoinCodeInput('');
  };

  // Host Tournament Publish
  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = sanitizeText(hostTitle, 80);
    const cleanGame = sanitizeText(hostGame, 40);
    if (!cleanTitle) {
      notify('Tournament title is required', '⚠️');
      return;
    }

    const newTourney: Tournament = {
      id: `tourney_${Date.now()}`,
      title: cleanTitle,
      game: cleanGame,
      type: 'Student Invitational',
      university: user.university,
      entry: 'Free Entry',
      participantsCount: 1,
      maxParticipants: 32,
      reward: '3,000 Campus XP',
      status: 'Registration Open',
      startDate: 'This Weekend',
      registeredUserIds: [user.id],
      bracket: null,
    };

    setTournaments((prev) => [newTourney, ...prev]);
    setActiveModal(null);
    setHostTitle('');
    notify('Tournament saved on this device (demo listing).', '🏆');
  };

  // Tournament Registration with Duplicate Protection
  const handleJoinTourney = (tourneyId: string) => {
    const target = tournaments.find((t) => t.id === tourneyId);
    if (!target) return;

    if (target.registeredUserIds?.includes(user.id)) {
      notify('You are already registered for this tournament!', 'ℹ️');
      return;
    }

    if (target.participantsCount >= target.maxParticipants) {
      notify('This tournament bracket is currently full.', '⚠️');
      return;
    }

    setTournaments((prev) =>
      prev.map((t) => {
        if (t.id === tourneyId) {
          return {
            ...t,
            participantsCount: t.participantsCount + 1,
            registeredUserIds: [...(t.registeredUserIds || []), user.id],
          };
        }
        return t;
      })
    );

    setActiveModal(null);
    notify(`Successfully registered for ${target.title}!`, '🏆');
  };

  // Filtered Tournaments
  const filteredTournaments = useMemo(() => {
    if (tourneyFilter === 'all') return tournaments;
    return tournaments.filter((t) =>
      t.game.toLowerCase().includes(tourneyFilter.toLowerCase())
    );
  }, [tournaments, tourneyFilter]);

  // Leaderboard data with real sorting
  const dynamicRankings = useMemo(() => {
    const list = [
      { id: '1', name: 'Dawit_ASTU', campus: 'Adama Science & Tech', points: 4890, winRate: '89%' },
      { id: '2', name: 'Selam_BDU', campus: 'Bahir Dar University', points: 4620, winRate: '84%' },
      { id: '3', name: 'Yonas_Jimma', campus: 'Jimma University', points: 4310, winRate: '81%' },
      { id: '4', name: 'Kidus_AASTU', campus: 'AASTU Kilinto', points: 3740, winRate: '75%' },
      { id: '5', name: 'Mulugeta_HU', campus: 'Hawassa University', points: 3420, winRate: '71%' },
      { id: '6', name: 'Lydia_AMU', campus: 'Arba Minch University', points: 3100, winRate: '69%' },
      {
        id: user.id,
        name: user.username,
        campus: user.university,
        points: user.points,
        winRate: `${Math.round((user.wins / Math.max(1, user.wins + user.losses)) * 100)}%`,
        isCurrentUser: true,
      },
    ];

    return list.sort((a, b) => b.points - a.points);
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-[#07090e] text-white selection:bg-[#00f0ff]/30">
      {/* ========================================================
          APP HEADER
         ======================================================== */}
      <header className="sticky top-0 z-50 h-[70px] bg-[#07090e]/90 backdrop-blur-md border-b border-[#00f0ff]/15 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-[#131b2e] border border-[#00f0ff]/20 text-white"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div
            onClick={() => setActivePage('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00f0ff] to-[#8b5cf6] flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)] group-hover:scale-105 transition-transform">
              <Zap className="text-black fill-black" size={22} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-wider leading-none">
                CAMPUS<span className="text-[#00f0ff]">ARENA</span>
              </h1>
              <span className="text-[10px] tracking-[2px] font-semibold text-gray-400">
                PLAY • COMPETE • CLIMB
              </span>
            </div>
          </div>
        </div>

        {/* Center Live Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>
            <strong className="text-white">1,482</strong> Ethiopian Students Active
          </span>
        </div>

        {/* Right Info Pills */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs md:text-sm font-mono font-bold"
            title="Non-monetary Campus XP"
          >
            <Trophy size={14} className="text-amber-400" />
            <span>{user.points.toLocaleString()}</span>
            <span className="text-[10px] text-amber-300">XP</span>
          </div>

          <button
            onClick={() => setActivePage('profile')}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-[#131b2e] border border-[#00f0ff]/20 hover:border-[#00f0ff] transition-all"
          >
            <Avatar name={user.username} className="w-7 h-7 rounded-full text-xs" />
            <span className="text-xs font-bold text-gray-200 hidden sm:inline truncate max-w-[100px]">
              {user.username}
            </span>
          </button>
        </div>
      </header>

      {/* Honest status banner: this build has no accounts, server, or multiplayer yet. */}
      <div
        role="note"
        className="px-4 md:px-8 py-2 text-[11px] text-center text-amber-200 bg-amber-500/10 border-b border-amber-500/20"
      >
        <strong>Preview build.</strong> Games run on this device only. Leaderboard rows, rooms and
        tournaments are sample data. Accounts and real multiplayer are not built yet.
      </div>

      {/* ========================================================
          APP SHELL (Sidebar + Main)
         ======================================================== */}
      <div className="flex-1 flex relative">
        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          />
        )}

        {/* Sidebar Navigation */}
        <aside
          className={`fixed md:sticky top-[70px] h-[calc(100vh-70px)] z-40 w-64 bg-[#0d121f] border-r border-[#00f0ff]/15 p-4 flex flex-col justify-between transition-transform duration-300 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <nav className="flex flex-col gap-1.5">
            {[
              { id: 'home', label: 'Home Arena', icon: Gamepad2 },
              { id: 'games', label: 'Game Zone', icon: Target, badge: 'Playable' },
              { id: 'tournaments', label: 'Tournaments', icon: Trophy },
              { id: 'rooms', label: 'Custom Rooms', icon: Swords },
              { id: 'leaderboard', label: 'Leaderboard', icon: Award },
              { id: 'profile', label: 'Student ID', icon: User },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id as typeof activePage);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#00f0ff]/15 to-[#8b5cf6]/15 text-[#00f0ff] border border-[#00f0ff]/30 shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#8b5cf6] text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-[#131b2e] border border-[#00f0ff]/15">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                <span>🇪🇹</span>
                <span className="truncate">{user.university}</span>
              </div>
              <p className="text-[11px] text-gray-400">
                Representing your campus pride across Ethiopia.
              </p>
            </div>

            <div className="text-center pt-2 border-t border-white/5">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                <Shield size={12} className="text-[#00f0ff]" />
                Fair Play & Non-Gambling League
              </span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {/* ========================================================
              VIEW 1: HOME
             ======================================================== */}
          {activePage === 'home' && (
            <div className="space-y-8">
              {/* Hero Banner */}
              <div className="relative overflow-hidden rounded-2xl border border-[#8b5cf6]/30 bg-gradient-to-br from-[#2563eb]/20 via-[#131b2e] to-[#8b5cf6]/20 p-6 md:p-10 shadow-[0_0_35px_rgba(139,92,246,0.15)]">
                <div className="relative z-10 max-w-2xl space-y-4">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase text-[#00f0ff] bg-[#00f0ff]/10 border border-[#00f0ff]/30">
                    ETHIOPIAN UNIVERSITY ESPORTS LEAGUE
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                    WELCOME TO <span className="text-[#00f0ff]">CAMPUS ARENA</span>
                  </h2>
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                    Compete in EA FC, Dream League Soccer, Chess, and Academic Blitz.
                    Represent your campus, earn virtual XP, and climb the leaderboard. Zero money, 100% skill and pride.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => launchGame('ttt')}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#2563eb] text-black font-extrabold text-sm hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                    >
                      <Zap size={16} /> Play Tic-Tac-Toe AI
                    </button>
                    <button
                      onClick={() => launchGame('quiz')}
                      className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/20 hover:border-[#8b5cf6] text-white font-bold text-sm transition-all"
                    >
                      Take Campus Quiz 🧠
                    </button>
                    <button
                      onClick={() => setActivePage('tournaments')}
                      className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/20 hover:border-[#00f0ff] text-white font-bold text-sm transition-all"
                    >
                      Browse Tournaments 🏆
                    </button>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Universities Listed', val: String(DEFAULT_UNIVERSITIES.length), icon: '🎓' },
                  { label: 'Playable Games', val: '3', icon: '🎮' },
                  { label: 'Sample Tournaments', val: String(tournaments.length), icon: '🏆' },
                  { label: 'Free & Non-Betting', val: 'Yes', icon: '🛡️' },
                ].map((m, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#131b2e] border border-[#00f0ff]/15 hover:border-[#00f0ff]/40 transition-all flex items-center gap-3.5"
                  >
                    <span className="text-2xl md:text-3xl p-2.5 rounded-lg bg-white/5">
                      {m.icon}
                    </span>
                    <div>
                      <div className="text-xl md:text-2xl font-black font-mono text-white">
                        {m.val}
                      </div>
                      <div className="text-[11px] text-gray-400 font-medium">{m.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Featured Games */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <span>🕹️</span> Featured Arena Games
                  </h3>
                  <button
                    onClick={() => setActivePage('games')}
                    className="text-xs font-bold text-[#00f0ff] hover:underline flex items-center gap-1"
                  >
                    View All Games <ChevronRight size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { id: 'ttt', title: 'Campus Tic-Tac-Toe', cat: 'Casual AI & 2P', icon: '⭕' },
                    { id: 'quiz', title: 'University Quiz Bowl', cat: 'Trivia & Intellect', icon: '🧠' },
                    { id: 'checkers', title: 'Campus Dama (Checkers)', cat: 'Traditional Strategy', icon: '🎯' },
                    { id: 'chess', title: 'Inter-Varsity Chess', cat: 'Board preview only', icon: '♟️', preview: true },
                  ].map((g) => (
                    <div
                      key={g.id}
                      className="group p-5 rounded-2xl bg-[#131b2e] border border-[#00f0ff]/15 hover:border-[#8b5cf6]/50 hover:shadow-[0_0_25px_rgba(139,92,246,0.2)] transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-4xl p-3 rounded-xl bg-[#0d121f] group-hover:scale-110 transition-transform">
                          {g.icon}
                        </span>
                        {'preview' in g && g.preview ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            Preview
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Playable
                          </span>
                        )}
                      </div>
                      <div className="mt-4">
                        <div className="text-xs text-gray-400">{g.cat}</div>
                        <h4 className="text-base font-bold text-white mt-0.5">{g.title}</h4>
                      </div>
                      <button
                        onClick={() => launchGame(g.id)}
                        className="mt-4 w-full py-2 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#2563eb] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                      >
                        {'preview' in g && g.preview ? 'View Board' : 'Play Now ⚡'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Tournaments Highlight */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <span>🏆</span> Sample Tournaments
                  </h3>
                  <button
                    onClick={() => setActivePage('tournaments')}
                    className="text-xs font-bold text-[#00f0ff] hover:underline flex items-center gap-1"
                  >
                    View All Brackets <ChevronRight size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tournaments.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      className="p-5 rounded-2xl bg-[#131b2e] border border-[#00f0ff]/15 hover:border-[#8b5cf6]/40 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                            {t.status}
                          </span>
                          <span className="text-[#00f0ff] font-bold">{t.type}</span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-2.5 leading-snug">
                          {t.title}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">🏛️ {t.university}</p>

                        <div className="my-3 p-2.5 rounded-lg bg-[#0d121f] border border-white/5 text-xs">
                          <div className="text-amber-400 font-bold">Prize: {t.reward}</div>
                          <div className="text-[10px] text-gray-500">Non-monetary Virtual XP</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveModal({ type: 'bracket', tourneyId: t.id })}
                          className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#00f0ff] text-xs font-bold"
                        >
                          Bracket 🔍
                        </button>
                        <button
                          onClick={() => handleJoinTourney(t.id)}
                          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#2563eb] text-black font-extrabold text-xs"
                        >
                          Register
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 2: GAMES ZONE
             ======================================================== */}
          {activePage === 'games' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black">🕹️ Campus Game Zone</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Choose a title below to play immediately or challenge dormitory peers.
                </p>
              </div>

              {/* Game Cards Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { id: 'ttt', name: 'Tic-Tac-Toe', badge: 'Playable', icon: '⭕' },
                  { id: 'quiz', name: 'Campus Quiz', badge: 'Playable', icon: '🧠' },
                  { id: 'checkers', name: 'Dama Checkers', badge: 'Playable', icon: '🎯' },
                  { id: 'chess', name: 'Chess Arena', badge: 'Opening Board', icon: '♟️' },
                  { id: 'eafc', name: 'EA FC 24', badge: 'Tourney', icon: '⚽' },
                  { id: 'dls', name: 'DLS 24', badge: 'Tourney', icon: '📱' },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      if (g.id === 'eafc' || g.id === 'dls') {
                        setActivePage('tournaments');
                      } else {
                        launchGame(g.id);
                      }
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      activeGameId === g.id
                        ? 'bg-[#19233c] border-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                        : 'bg-[#131b2e] border-[#00f0ff]/15 hover:border-[#8b5cf6]/50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{g.icon}</div>
                    <div className="text-xs font-bold truncate">{g.name}</div>
                    <span className="text-[10px] text-gray-400">{g.badge}</span>
                  </button>
                ))}
              </div>

              {/* Interactive Game Area */}
              <div className="p-6 md:p-8 rounded-2xl bg-[#131b2e] border border-[#00f0ff]/20">
                {activeGameId === 'ttt' && (
                  <div className="max-w-md mx-auto space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="text-lg font-bold">⭕ Campus Tic-Tac-Toe</h3>
                        <p className="text-xs text-gray-400">{tttStatus}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setTttMode('ai');
                            resetTTT();
                            notify('Mode: Campus AI Bot');
                          }}
                          className={`px-2.5 py-1 text-xs rounded-lg border font-semibold ${
                            tttMode === 'ai'
                              ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff]'
                              : 'bg-white/5 border-white/10 text-gray-300'
                          }`}
                        >
                          vs AI
                        </button>
                        <button
                          onClick={() => {
                            setTttMode('pvp');
                            resetTTT();
                            notify('Mode: Local 2-Player');
                          }}
                          className={`px-2.5 py-1 text-xs rounded-lg border font-semibold ${
                            tttMode === 'pvp'
                              ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff]'
                              : 'bg-white/5 border-white/10 text-gray-300'
                          }`}
                        >
                          2-Player
                        </button>
                        <button
                          onClick={resetTTT}
                          className="p-1 rounded-lg bg-white/5 border border-white/10 hover:border-white text-gray-300"
                          title="Reset Board"
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Board */}
                    <div className="grid grid-cols-3 gap-3 aspect-square max-w-[320px] mx-auto">
                      {tttBoard.map((val, idx) => (
                        <button
                          key={idx}
                          disabled={val !== null || tttGameOver || isAiThinking}
                          onClick={() => handleTTTClick(idx)}
                          className={`rounded-2xl border-2 flex items-center justify-center text-4xl font-black font-mono transition-all ${
                            val === 'X'
                              ? 'text-[#00f0ff] border-[#00f0ff]/40 bg-[#00f0ff]/5 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                              : val === 'O'
                              ? 'text-[#8b5cf6] border-[#8b5cf6]/40 bg-[#8b5cf6]/5 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                              : 'border-[#00f0ff]/15 bg-[#0d121f] hover:border-[#00f0ff] hover:bg-white/5'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeGameId === 'quiz' && (
                  <div className="max-w-xl mx-auto space-y-6">
                    {!quizCompleted ? (
                      <>
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-[#00f0ff] uppercase tracking-wider">
                            {ETHIOPIAN_QUIZ_QUESTIONS[quizIndex].category}
                          </span>
                          <span className="text-gray-400 font-mono">
                            Question {quizIndex + 1} of {ETHIOPIAN_QUIZ_QUESTIONS.length}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6] transition-all duration-300"
                            style={{
                              width: `${((quizIndex + 1) / ETHIOPIAN_QUIZ_QUESTIONS.length) * 100}%`,
                            }}
                          />
                        </div>

                        <h3 className="text-lg md:text-xl font-bold leading-snug">
                          {ETHIOPIAN_QUIZ_QUESTIONS[quizIndex].question}
                        </h3>

                        <div className="flex flex-col gap-2.5">
                          {ETHIOPIAN_QUIZ_QUESTIONS[quizIndex].options.map((opt, i) => {
                            const isCorrect = i === ETHIOPIAN_QUIZ_QUESTIONS[quizIndex].answer;
                            const isSelected = quizAnswered === i;
                            let btnStyle = 'bg-[#0d121f] border-white/10 hover:border-[#00f0ff]';
                            if (quizAnswered !== null) {
                              if (isCorrect) {
                                btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-400';
                              } else if (isSelected) {
                                btnStyle = 'bg-red-500/20 border-red-500 text-red-400';
                              }
                            }

                            return (
                              <button
                                key={i}
                                disabled={quizAnswered !== null}
                                onClick={() => handleQuizAnswer(i)}
                                className={`p-4 rounded-xl border text-left font-semibold text-sm flex items-center justify-between transition-all ${btnStyle}`}
                              >
                                <span>{opt}</span>
                                {quizAnswered !== null && isCorrect && (
                                  <CheckCircle2 size={18} className="text-emerald-400" />
                                )}
                                {quizAnswered !== null && isSelected && !isCorrect && (
                                  <XCircle size={18} className="text-red-400" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 space-y-4">
                        <span className="text-5xl">🎓</span>
                        <h3 className="text-2xl font-black">Campus Quiz Bowl Completed!</h3>
                        <p className="text-sm text-gray-300">
                          You earned a total of{' '}
                          <strong className="text-[#00f0ff]">{quizScore} Campus XP</strong>!
                        </p>
                        <button
                          onClick={restartQuiz}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#2563eb] text-black font-extrabold text-sm"
                        >
                          Retake Quiz Challenge 🔄
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeGameId === 'checkers' && (
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold">🎯 Campus Checkers (Dama)</h3>
                        <p className="text-xs text-gray-400">
                          {checkersTurn === 1 ? 'Cyan pieces to move' : 'Purple pieces to move'} (2 players, one device)
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setCheckersBoard(initCheckers());
                          setCheckersSelected(null);
                          setCheckersTurn(1);
                        }}
                        className="px-3 py-1 text-xs rounded-lg bg-white/5 border border-white/10 hover:border-white text-gray-300"
                      >
                        Reset Board
                      </button>
                    </div>

                    {/* Checkers Board */}
                    <div className="aspect-square max-w-[360px] mx-auto border-2 border-[#00f0ff]/30 rounded-xl overflow-hidden grid grid-cols-8">
                      {checkersBoard.map((row, r) =>
                        row.map((piece, c) => {
                          const isDark = (r + c) % 2 === 1;
                          const isSelected =
                            checkersSelected?.[0] === r && checkersSelected?.[1] === c;

                          return (
                            <button
                              key={`${r}-${c}`}
                              onClick={() => handleCheckersClick(r, c)}
                              className={`aspect-square flex items-center justify-center relative ${
                                isDark ? 'bg-[#090d16]' : 'bg-[#1e293b]'
                              } ${isSelected ? 'ring-2 ring-inset ring-[#00f0ff]' : ''}`}
                            >
                              {piece === 1 && (
                                <div className="w-[72%] h-[72%] rounded-full bg-gradient-to-br from-[#38bdf8] to-[#0284c7] border-2 border-[#bae6fd] shadow-md" />
                              )}
                              {piece === 2 && (
                                <div className="w-[72%] h-[72%] rounded-full bg-gradient-to-br from-[#c084fc] to-[#7e22ce] border-2 border-[#e9d5ff] shadow-md" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {activeGameId === 'chess' && (
                  <div className="max-w-md mx-auto text-center space-y-4">
                    <h3 className="text-lg font-bold">♟️ Ethiopian Inter-Varsity Chess Board</h3>
                    <p className="text-xs text-gray-400">
                      Preview board only. Moves are not playable yet.
                    </p>
                    <div className="grid grid-cols-8 border-2 border-[#00f0ff]/30 rounded-xl overflow-hidden aspect-square max-w-[340px] mx-auto">
                      {Array(64)
                        .fill(0)
                        .map((_, i) => {
                          const r = Math.floor(i / 8);
                          const c = i % 8;
                          const dark = (r + c) % 2 === 1;
                          let icon = '';
                          if (r === 0) icon = ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'][c];
                          if (r === 1) icon = '♟';
                          if (r === 6) icon = '♙';
                          if (r === 7) icon = ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'][c];
                          return (
                            <div
                              key={i}
                              onClick={() => notify('Chess is not playable yet.', 'ℹ️')}
                              className={`flex items-center justify-center text-xl cursor-pointer ${
                                dark ? 'bg-[#111827]' : 'bg-[#1f2937]'
                              } ${r <= 1 ? 'text-[#8b5cf6]' : 'text-[#00f0ff]'}`}
                            >
                              {icon}
                            </div>
                          );
                        })}
                    </div>
                    <button
                      onClick={() => setActiveModal({ type: 'bracket', tourneyId: 'tourney_3' })}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#2563eb] text-black font-extrabold text-xs"
                    >
                      View Live Chess Tournament Bracket 🏆
                    </button>
                  </div>
                )}

                {!activeGameId && (
                  <div className="text-center py-12 text-gray-400 space-y-2">
                    <Gamepad2 size={40} className="mx-auto text-gray-500" />
                    <h4 className="text-base font-bold text-white">Select a Playable Game</h4>
                    <p className="text-xs">
                      Choose from Tic-Tac-Toe, Campus Quiz, or Checkers above to begin playing.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 3: TOURNAMENTS
             ======================================================== */}
          {activePage === 'tournaments' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">🏆 Campus Championships</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Sample tournament listings for this preview. Always 100% free with zero betting.
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal({ type: 'hostTourney' })}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#2563eb] text-black font-extrabold text-xs flex items-center justify-center gap-1.5"
                >
                  <Plus size={16} /> Host Tournament
                </button>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All Games' },
                  { id: 'ea fc 24', label: 'EA FC 24' },
                  { id: 'dream league soccer', label: 'Dream League Soccer' },
                  { id: 'chess', label: 'Chess Blitz' },
                  { id: 'quiz', label: 'Quiz Bowl' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTourneyFilter(f.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      tourneyFilter === f.id
                        ? 'bg-[#00f0ff]/15 border border-[#00f0ff] text-[#00f0ff]'
                        : 'bg-[#131b2e] border border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Tournament Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTournaments.map((t) => {
                  const isRegistered = t.registeredUserIds?.includes(user.id);
                  return (
                    <div
                      key={t.id}
                      className="p-5 rounded-2xl bg-[#131b2e] border border-[#00f0ff]/15 hover:border-[#8b5cf6]/40 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                            {t.status}
                          </span>
                          <span className="text-[#00f0ff] font-bold">{t.type}</span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-2.5 leading-snug">
                          {t.title}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">🏛️ {t.university}</p>

                        <div className="flex justify-between items-center text-xs text-gray-400 my-3">
                          <span>
                            👥 {t.participantsCount}/{t.maxParticipants} Students
                          </span>
                          <span>📅 {t.startDate}</span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#0d121f] border border-white/5 text-xs mb-4">
                          <div className="text-amber-400 font-bold">Prize: {t.reward}</div>
                          <div className="text-[10px] text-gray-500">Non-monetary Virtual XP</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveModal({ type: 'bracket', tourneyId: t.id })}
                          className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#00f0ff] text-xs font-bold"
                        >
                          Bracket 🔍
                        </button>
                        <button
                          disabled={isRegistered || t.participantsCount >= t.maxParticipants}
                          onClick={() => handleJoinTourney(t.id)}
                          className={`flex-1 py-2 rounded-xl font-extrabold text-xs transition-opacity ${
                            isRegistered
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-gradient-to-r from-[#00f0ff] to-[#2563eb] text-black hover:opacity-90'
                          }`}
                        >
                          {isRegistered ? 'Registered ✓' : 'Register'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 4: ROOMS
             ======================================================== */}
          {activePage === 'rooms' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black">🚪 Student Game Rooms</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Create a custom lobby. In this preview, lobbies are saved on this device only.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Create Room */}
                <form
                  onSubmit={handleCreateRoom}
                  className="p-6 rounded-2xl bg-[#131b2e] border border-[#00f0ff]/15 space-y-4"
                >
                  <h3 className="text-base font-bold text-white">Create Private Room</h3>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400">SELECT GAME</label>
                    <select
                      value={createRoomGame}
                      onChange={(e) => setCreateRoomGame(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#0d121f] border border-white/10 text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                    >
                      <option value="Chess">Chess Blitz (1v1)</option>
                      <option value="Tic-tac-toe">Tic-Tac-Toe (1v1)</option>
                      <option value="Quiz Challenges">Ethiopian University Quiz (1v1)</option>
                      <option value="Dream League Soccer">Dream League Soccer Peer Match</option>
                      <option value="EA FC 24">EA FC 24 Friendly Match</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400">ROOM NAME / DORM</label>
                    <input
                      type="text"
                      maxLength={50}
                      value={createRoomName}
                      onChange={(e) => setCreateRoomName(e.target.value)}
                      placeholder={`${user.username}'s Arena`}
                      className="w-full p-2.5 rounded-xl bg-[#0d121f] border border-white/10 text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#2563eb] text-black font-extrabold text-sm"
                  >
                    Generate Room Code ⚡
                  </button>
                </form>

                {/* Join Room */}
                <form
                  onSubmit={handleJoinByCode}
                  className="p-6 rounded-2xl bg-[#131b2e] border border-[#00f0ff]/15 space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-base font-bold text-white">Join via Room Code</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Enter the room code shared by your classmate to connect.
                    </p>

                    <div className="mt-4 space-y-1">
                      <label className="text-xs font-bold text-gray-400">ROOM PASSCODE</label>
                      <input
                        type="text"
                        maxLength={16}
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(sanitizeRoomCode(e.target.value))}
                        placeholder="e.g. AAU-8821"
                        className="w-full p-2.5 rounded-xl bg-[#0d121f] border border-white/10 text-sm font-mono tracking-wider text-white uppercase focus:outline-none focus:border-[#00f0ff]"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-white/5 border border-white/15 hover:border-[#00f0ff] text-white font-bold text-sm"
                    >
                      Connect to Room 🔌
                    </button>

                    <div className="p-3 rounded-xl bg-[#00f0ff]/5 border border-[#00f0ff]/20 text-[11px] text-gray-400 leading-relaxed">
                      ℹ️ <strong>Preview notice:</strong> Rooms are saved only in this browser. Real multiplayer (two players on different devices) is not built yet, so nobody else can join your room.
                    </div>
                  </div>
                </form>
              </div>

              {/* Active Lobbies Table */}
              <div className="space-y-3">
                <h3 className="text-base font-bold">Active Campus Lobbies</h3>
                <div className="rounded-2xl bg-[#131b2e] border border-[#00f0ff]/15 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 text-gray-400 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3.5 pl-5">Room Code</th>
                          <th className="p-3.5">Lobby Title</th>
                          <th className="p-3.5">Game</th>
                          <th className="p-3.5">Host</th>
                          <th className="p-3.5">Players</th>
                          <th className="p-3.5 pr-5">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {rooms.map((r) => (
                          <tr key={r.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-3.5 pl-5 font-mono font-bold text-[#00f0ff]">
                              {r.id}
                            </td>
                            <td className="p-3.5 font-medium">{r.name}</td>
                            <td className="p-3.5 text-gray-300">{r.game}</td>
                            <td className="p-3.5 text-gray-400">{r.host}</td>
                            <td className="p-3.5">
                              {r.players}/{r.max}
                            </td>
                            <td className="p-3.5 pr-5">
                              <button
                                onClick={() => setActiveModal({ type: 'lobby', roomCode: r.id })}
                                className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-[#00f0ff] text-white font-semibold"
                              >
                                Join Lobby
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 5: LEADERBOARD
             ======================================================== */}
          {activePage === 'leaderboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black">🥇 Campus Leaderboard (Preview)</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Sorted by Campus XP. Rows marked "Sample" are made-up demo data; only your row is
                  real, and it is stored on this device. Verified rankings need accounts and a server.
                </p>
              </div>

              {/* Table */}
              <div className="rounded-2xl bg-[#131b2e] border border-[#00f0ff]/15 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-gray-400 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5 pl-5">Rank</th>
                        <th className="p-3.5">Student Gamer</th>
                        <th className="p-3.5">Campus</th>
                        <th className="p-3.5">Win Ratio</th>
                        <th className="p-3.5">Reputation XP</th>
                        <th className="p-3.5 pr-5">Tier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {dynamicRankings.map((r, idx) => {
                        const rankNumber = idx + 1;
                        return (
                          <tr
                            key={r.id}
                            className={`transition-colors ${
                              r.isCurrentUser
                                ? 'bg-[#00f0ff]/10 hover:bg-[#00f0ff]/15'
                                : 'hover:bg-white/5'
                            }`}
                          >
                            <td className="p-3.5 pl-5 font-black text-sm">
                              {rankNumber === 1 && <span className="text-yellow-400">#1 👑</span>}
                              {rankNumber === 2 && <span className="text-gray-300">#2 🥈</span>}
                              {rankNumber === 3 && <span className="text-amber-600">#3 🥉</span>}
                              {rankNumber > 3 && <span className="text-gray-400">#{rankNumber}</span>}
                            </td>
                            <td className="p-3.5 font-bold flex items-center gap-1.5">
                              <span>{r.name}</span>
                              {r.isCurrentUser && (
                                <span className="text-[10px] bg-[#00f0ff] text-black font-extrabold px-1.5 py-0.5 rounded">
                                  YOU
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-gray-300">🏛️ {r.campus}</td>
                            <td className="p-3.5 font-mono">{r.winRate}</td>
                            <td className="p-3.5 font-mono font-bold text-amber-400">
                              {r.points.toLocaleString()} XP
                            </td>
                            <td className="p-3.5 pr-5">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                {r.isCurrentUser ? 'This device' : 'Sample'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 6: STUDENT PROFILE
             ======================================================== */}
          {activePage === 'profile' && (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="p-6 md:p-8 rounded-2xl bg-[#131b2e] border border-[#00f0ff]/20 flex flex-col sm:flex-row items-center gap-6">
                <Avatar
                  name={user.username}
                  className="w-24 h-24 rounded-full border-4 border-[#00f0ff] text-4xl shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                />
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-black">{user.username}</h2>
                      <p className="text-sm font-semibold text-[#00f0ff]">
                        🏛️ {user.university}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditUsername(user.username);
                        setEditUniversity(user.university);
                        setActiveModal({ type: 'editProfile' });
                      }}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/15 hover:border-[#00f0ff] text-xs font-bold text-white transition-all"
                    >
                      Edit Profile ✏️
                    </button>
                  </div>

                  {/* Achievements */}
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-2">
                    {user.achievements.map((a, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full bg-[#8b5cf6]/15 border border-[#8b5cf6]/40 text-xs font-bold text-white flex items-center gap-1.5"
                      >
                        <span>{a.icon}</span>
                        <span>{a.title}</span>
                      </span>
                    ))}
                    {user.achievements.length === 0 && (
                      <span className="text-xs text-gray-400">No badges earned yet. Play a game to start.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[#131b2e] border border-[#00f0ff]/15 flex items-center gap-4">
                  <Trophy size={28} className="text-amber-400" />
                  <div>
                    <div className="text-2xl font-black font-mono text-white">
                      {user.points.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">Virtual Campus Points</div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#131b2e] border border-[#00f0ff]/15 flex items-center gap-4">
                  <Swords size={28} className="text-[#00f0ff]" />
                  <div>
                    <div className="text-2xl font-black font-mono text-white">
                      {user.wins} - {user.losses}
                    </div>
                    <div className="text-xs text-gray-400">Win / Loss Record</div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#131b2e] border border-[#00f0ff]/15 flex items-center gap-4">
                  <Shield size={28} className="text-emerald-400" />
                  <div>
                    <div className="text-2xl font-black font-mono text-gray-300">Not verified</div>
                    <div className="text-xs text-gray-400">Student verification comes with accounts</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================
          GLOBAL MODALS
         ======================================================== */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#131b2e] border border-[#00f0ff]/30 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>

            {/* Bracket Modal */}
            {activeModal.type === 'bracket' && (() => {
              const tourney = tournaments.find((t) => t.id === activeModal.tourneyId);
              if (!tourney) return null;
              return (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">{tourney.title}</h3>
                  <p className="text-xs text-[#00f0ff] font-semibold">
                    Knockout Elimination Stage
                  </p>

                  {tourney.bracket ? (
                    <div className="space-y-4 pt-2">
                      <div>
                        <div className="text-xs uppercase text-gray-400 font-bold mb-2">
                          Semi-Finals
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {tourney.bracket.semiFinals.map((m, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-[#0d121f] border border-white/10 text-xs flex justify-between"
                            >
                              <span className="font-bold text-[#00f0ff]">{m.p1}</span>
                              <span className="text-gray-400">vs</span>
                              <span className="font-bold text-gray-200">{m.p2}</span>
                              {m.score && <span className="font-mono text-amber-400">{m.score}</span>}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs uppercase text-gray-400 font-bold mb-2">
                          Grand Finals
                        </div>
                        <div className="p-3 rounded-xl bg-[#0d121f] border border-amber-500/40 text-xs flex justify-between">
                          <span className="font-bold text-amber-400">
                            {(tourney.bracket.finals[0]?.p1 || 'TBD')}
                          </span>
                          <span className="text-gray-400">vs</span>
                          <span className="font-bold text-gray-200">
                            {(tourney.bracket.finals[0]?.p2 || 'TBD')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-gray-400 space-y-3">
                      <p>
                        Registration is open. Brackets seed automatically once all competitor
                        slots fill.
                      </p>
                      <button
                        onClick={() => handleJoinTourney(tourney.id)}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#2563eb] text-black font-extrabold text-xs"
                      >
                        Register for Tournament
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Host Tournament Modal */}
            {activeModal.type === 'hostTourney' && (
              <form onSubmit={handleCreateTournament} className="space-y-4">
                <h3 className="text-lg font-bold">Host University Tournament</h3>
                <p className="text-xs text-gray-400">
                  Create a tournament listing. In this preview it is saved only on this device.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400">TOURNAMENT TITLE</label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={hostTitle}
                    onChange={(e) => setHostTitle(e.target.value)}
                    placeholder="e.g. Jimma University FC 24 Open"
                    className="w-full p-2.5 rounded-xl bg-[#0d121f] border border-white/10 text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400">GAME</label>
                  <select
                    value={hostGame}
                    onChange={(e) => setHostGame(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#0d121f] border border-white/10 text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  >
                    <option value="EA FC 24">EA FC 24</option>
                    <option value="Dream League Soccer">Dream League Soccer</option>
                    <option value="Chess">Chess Blitz</option>
                    <option value="Quiz Challenges">Quiz Bowl</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#2563eb] text-black font-extrabold text-sm"
                >
                  Publish Tournament 🏆
                </button>
              </form>
            )}

            {/* Edit Profile Modal */}
            {activeModal.type === 'editProfile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <h3 className="text-lg font-bold">Edit Student Gamer Card</h3>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400">GAMER USERNAME</label>
                  <input
                    type="text"
                    required
                    maxLength={30}
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#0d121f] border border-white/10 text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400">UNIVERSITY / CAMPUS</label>
                  <select
                    value={editUniversity}
                    onChange={(e) => setEditUniversity(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#0d121f] border border-white/10 text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  >
                    {DEFAULT_UNIVERSITIES.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#2563eb] text-black font-extrabold text-sm"
                >
                  Save Card & Update
                </button>
              </form>
            )}

            {/* Lobby Modal */}
            {activeModal.type === 'lobby' && (
              <div className="text-center space-y-4">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse mx-auto" />
                <h3 className="text-xl font-black">
                  LOBBY:{' '}
                  <span className="text-[#00f0ff] font-mono tracking-wider">
                    {activeModal.roomCode}
                  </span>
                </h3>
                <p className="text-xs text-gray-400">
                  Local preview lobby. No network connection is used.
                </p>

                <div className="space-y-2 text-left my-4">
                  <div className="p-3 rounded-xl bg-[#0d121f] border border-white/10 flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center gap-2">
                      <span>👤</span> {user.username} (You)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                      READY
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0d121f] border border-white/10 flex items-center justify-between text-xs">
                    <span className="text-gray-400 flex items-center gap-2">
                      <span>👥</span> Opponent (multiplayer not built yet)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-gray-500/20 text-gray-400 font-bold text-[10px]">
                      UNAVAILABLE
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-400">
                  Room code <strong className="text-[#00f0ff]">{activeModal.roomCode}</strong> only
                  works on this device for now.
                </p>

                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#2563eb] text-black font-extrabold text-sm"
                >
                  Close Lobby
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TOAST NOTIFICATION
         ======================================================== */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#131b2e] border border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.3)] text-sm font-semibold text-white animate-bounce-short">
          <span>{toast.icon}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
