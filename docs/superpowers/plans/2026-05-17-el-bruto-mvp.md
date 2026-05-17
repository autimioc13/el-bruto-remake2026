# El Bruto Remake — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a functional web MVP of El Bruto — create character, automatic combat, level up, ranking — with no Flash dependency.

**Architecture:** Backend (Node.js + Express + TypeScript) on Railway exposes a REST API. Combat is simulated 100% server-side and returned as a `log_data` array. Frontend (React + Vite + Phaser.js) on Vercel animates the log client-side. Supabase provides PostgreSQL, Auth, and Realtime for free.

**Tech Stack:** Node.js, Express, TypeScript, Supabase (PostgreSQL + Auth), Phaser.js, React, Vite, TailwindCSS, Axios, Jest, Vitest

---

## File Map

### Backend (`backend/`)
```
backend/
├── src/
│   ├── index.ts                  ← Express app entry + route registration
│   ├── types/index.ts            ← Shared TypeScript interfaces
│   ├── db/supabase.ts            ← Supabase service client singleton
│   ├── middleware/auth.ts        ← JWT verification middleware
│   ├── routes/
│   │   ├── auth.ts               ← POST /auth/register, /auth/login
│   │   ├── characters.ts         ← POST /characters, GET /characters/me, GET /characters/:id
│   │   ├── combat.ts             ← POST /combat, GET /combat/:id
│   │   └── ranking.ts            ← GET /ranking
│   └── engine/
│       ├── combat.ts             ← Pure TS combat simulation (no I/O)
│       └── levelup.ts            ← XP gain, level-up logic (no I/O)
├── tests/
│   ├── engine/combat.test.ts
│   └── engine/levelup.test.ts
├── package.json
├── tsconfig.json
└── .env.example
```

### Frontend (`frontend/`)
```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx                   ← React Router setup
│   ├── types.ts                  ← Shared frontend interfaces
│   ├── api/client.ts             ← Axios + JWT interceptor
│   ├── pages/
│   │   ├── Landing.tsx           ← Login / Register
│   │   ├── CreateCharacter.tsx   ← Character creation form
│   │   ├── Profile.tsx           ← Own profile + other profiles
│   │   ├── Arena.tsx             ← Phaser.js combat host
│   │   └── Ranking.tsx           ← Global leaderboard
│   ├── components/
│   │   ├── StatBar.tsx           ← Reusable stat progress bar
│   │   └── CharacterCard.tsx     ← Mini card with challenge button
│   └── game/
│       └── CombatScene.ts        ← Phaser 3 scene (animates log_data)
├── package.json
├── vite.config.ts
└── .env.example
```

---

## Task 1: Database Setup (Supabase)

**Files:**
- SQL schema run in Supabase dashboard

- [ ] **Step 1: Create Supabase project**

  Go to [supabase.com](https://supabase.com) → New project → name it `el-bruto-remake`. Wait for provisioning.

- [ ] **Step 2: Run schema SQL**

  In Supabase → SQL Editor → New Query, paste and run:

  ```sql
  CREATE TABLE skills (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(100) NOT NULL,
    description text,
    effect jsonb NOT NULL
  );

  CREATE TABLE characters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
    name varchar(50) NOT NULL,
    level int NOT NULL DEFAULT 1,
    xp int NOT NULL DEFAULT 0,
    xp_to_next_level int NOT NULL DEFAULT 100,
    wins int NOT NULL DEFAULT 0,
    losses int NOT NULL DEFAULT 0,
    appearance jsonb NOT NULL DEFAULT '{}',
    stats jsonb NOT NULL DEFAULT '{"hp":100,"strength":10,"agility":10,"endurance":10}',
    created_at timestamptz DEFAULT now()
  );

  CREATE TABLE character_skills (
    character_id uuid REFERENCES characters ON DELETE CASCADE,
    skill_id uuid REFERENCES skills ON DELETE CASCADE,
    PRIMARY KEY (character_id, skill_id)
  );

  CREATE TABLE combat_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attacker_id uuid REFERENCES characters NOT NULL,
    defender_id uuid REFERENCES characters NOT NULL,
    winner_id uuid REFERENCES characters NOT NULL,
    attacker_name varchar(50) NOT NULL,
    defender_name varchar(50) NOT NULL,
    log_data jsonb NOT NULL DEFAULT '[]',
    created_at timestamptz DEFAULT now()
  );

  CREATE INDEX ON characters(level DESC, wins DESC);
  CREATE INDEX ON combat_logs(attacker_id);
  CREATE INDEX ON combat_logs(defender_id);
  ```

- [ ] **Step 3: Enable Row Level Security**

  ```sql
  ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
  ALTER TABLE combat_logs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE character_skills ENABLE ROW LEVEL SECURITY;
  ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "characters_read" ON characters FOR SELECT USING (true);
  CREATE POLICY "characters_insert" ON characters FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "characters_update" ON characters FOR UPDATE USING (true);

  CREATE POLICY "combat_logs_read" ON combat_logs FOR SELECT USING (true);
  CREATE POLICY "combat_logs_insert" ON combat_logs FOR INSERT WITH CHECK (true);

  CREATE POLICY "character_skills_read" ON character_skills FOR SELECT USING (true);
  CREATE POLICY "character_skills_insert" ON character_skills FOR INSERT WITH CHECK (true);

  CREATE POLICY "skills_read" ON skills FOR SELECT USING (true);
  ```

- [ ] **Step 4: Seed initial skills**

  ```sql
  INSERT INTO skills (name, description, effect) VALUES
    ('Golpe Brutal', 'Ignora parte de la resistencia del rival', '{"type":"ignore_endurance","value":0.5}'),
    ('Esquiva Ágil', 'Aumenta la probabilidad de esquivar', '{"type":"agility_bonus","value":20}'),
    ('Furia', 'Aumenta el daño base en un 30%', '{"type":"damage_multiplier","value":1.3}'),
    ('Contrataque', 'Al esquivar, responde con un golpe', '{"type":"counter_attack","value":1}'),
    ('Escudo', 'Reduce el daño recibido en un 25%', '{"type":"damage_reduction","value":0.25}');
  ```

- [ ] **Step 5: Save API keys**

  Supabase → Settings → API → copy:
  - `Project URL` → `SUPABASE_URL`
  - `anon public` → `SUPABASE_ANON_KEY`
  - `service_role secret` → `SUPABASE_SERVICE_KEY`

---

## Task 2: Backend Project Setup

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/src/index.ts`
- Create: `backend/.env.example`

- [ ] **Step 1: Initialize project**

  ```bash
  mkdir backend && cd backend
  npm init -y
  npm install express cors dotenv @supabase/supabase-js
  npm install -D typescript ts-node @types/express @types/cors @types/node jest ts-jest @types/jest supertest @types/supertest
  ```

- [ ] **Step 2: Create `tsconfig.json`**

  ```json
  {
    "compilerOptions": {
      "target": "ES2020",
      "module": "commonjs",
      "lib": ["ES2020"],
      "outDir": "./dist",
      "rootDir": "./src",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "resolveJsonModule": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist", "tests"]
  }
  ```

- [ ] **Step 3: Update `package.json` scripts and Jest config**

  Add under the top-level keys in `package.json`:

  ```json
  "scripts": {
    "dev": "ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "testMatch": ["**/tests/**/*.test.ts"]
  }
  ```

- [ ] **Step 4: Create `.env.example`**

  ```
  SUPABASE_URL=https://xxxx.supabase.co
  SUPABASE_ANON_KEY=your-anon-key
  SUPABASE_SERVICE_KEY=your-service-role-key
  PORT=3001
  ```

- [ ] **Step 5: Create `src/index.ts`**

  ```typescript
  import express from 'express';
  import cors from 'cors';
  import dotenv from 'dotenv';

  dotenv.config();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

  export default app;
  ```

- [ ] **Step 6: Start server and verify**

  ```bash
  cp .env.example .env   # fill in your Supabase keys
  npm run dev
  ```

  Expected output: `Server running on port 3001`

  ```bash
  curl http://localhost:3001/health
  ```

  Expected: `{"status":"ok"}`

- [ ] **Step 7: Commit**

  ```bash
  cd ..
  git init
  git add backend/
  git commit -m "chore: initialize backend project"
  ```

---

## Task 3: Backend — Types + DB Client + Auth Middleware

**Files:**
- Create: `backend/src/types/index.ts`
- Create: `backend/src/db/supabase.ts`
- Create: `backend/src/middleware/auth.ts`

- [ ] **Step 1: Create `src/types/index.ts`**

  ```typescript
  export interface Stats {
    hp: number;
    strength: number;
    agility: number;
    endurance: number;
  }

  export interface Appearance {
    gender: 'male' | 'female';
    hair_color: string;
    skin_color: string;
    hair_style: string;
  }

  export interface SkillEffect {
    type: string;
    value: number;
  }

  export interface Skill {
    id: string;
    name: string;
    description: string;
    effect: SkillEffect;
  }

  export interface Character {
    id: string;
    user_id: string;
    name: string;
    level: number;
    xp: number;
    xp_to_next_level: number;
    wins: number;
    losses: number;
    appearance: Appearance;
    stats: Stats;
    created_at: string;
  }

  export interface CombatEvent {
    turn: number;
    actor: 'attacker' | 'defender';
    action: 'attack' | 'dodge' | 'critical' | 'skill';
    damage?: number;
    skill?: string;
    defender_hp?: number;
    attacker_hp?: number;
  }

  export interface CombatResult {
    winner_id: string;
    log_data: CombatEvent[];
  }

  export interface Fighter {
    id: string;
    name: string;
    stats: Stats;
    skills: Skill[];
  }
  ```

- [ ] **Step 2: Create `src/db/supabase.ts`**

  ```typescript
  import { createClient } from '@supabase/supabase-js';

  const url = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!;

  // Service client bypasses RLS — server-side only
  export const supabase = createClient(url, serviceKey);
  ```

- [ ] **Step 3: Create `src/middleware/auth.ts`**

  ```typescript
  import { Request, Response, NextFunction } from 'express';
  import { createClient } from '@supabase/supabase-js';

  const supabaseAuth = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  export interface AuthRequest extends Request {
    userId?: string;
  }

  export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const { data, error } = await supabaseAuth.auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    req.userId = data.user.id;
    next();
  }
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add backend/src/
  git commit -m "feat: add shared types, supabase client, and auth middleware"
  ```

---

## Task 4: Backend — Auth Routes

**Files:**
- Create: `backend/src/routes/auth.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Create `src/routes/auth.ts`**

  ```typescript
  import { Router, Request, Response } from 'express';
  import { createClient } from '@supabase/supabase-js';

  const router = Router();

  const supabaseAuth = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  router.post('/register', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const { data, error } = await supabaseAuth.auth.signUp({ email, password });
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(201).json({ user: data.user, session: data.session });
  });

  router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
    if (error) {
      res.status(401).json({ error: error.message });
      return;
    }

    res.json({ user: data.user, session: data.session });
  });

  export default router;
  ```

- [ ] **Step 2: Register routes in `src/index.ts`**

  Add after `app.use(express.json())`:

  ```typescript
  import authRoutes from './routes/auth';
  app.use('/auth', authRoutes);
  ```

- [ ] **Step 3: Test register**

  ```bash
  curl -X POST http://localhost:3001/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"bruto@test.com","password":"password123"}'
  ```

  Expected: `{"user":{...},"session":{...}}`

- [ ] **Step 4: Commit**

  ```bash
  git add backend/src/routes/auth.ts backend/src/index.ts
  git commit -m "feat: add auth register and login routes"
  ```

---

## Task 5: Backend — Combat Engine (TDD)

**Files:**
- Create: `backend/src/engine/combat.ts`
- Create: `backend/tests/engine/combat.test.ts`

- [ ] **Step 1: Write failing tests**

  Create `backend/tests/engine/combat.test.ts`:

  ```typescript
  import { simulateCombat } from '../../src/engine/combat';
  import { Fighter } from '../../src/types';

  const makeF = (id: string, overrides: Partial<Fighter['stats']> = {}): Fighter => ({
    id,
    name: id,
    skills: [],
    stats: { hp: 100, strength: 15, agility: 10, endurance: 5, ...overrides },
  });

  describe('simulateCombat', () => {
    it('returns a winner that is one of the two fighters', () => {
      const result = simulateCombat(makeF('a'), makeF('b'));
      expect(['a', 'b']).toContain(result.winner_id);
    });

    it('produces a non-empty event log', () => {
      const result = simulateCombat(makeF('a'), makeF('b'));
      expect(result.log_data.length).toBeGreaterThan(0);
    });

    it('a very strong attacker with no dodge target always wins', () => {
      const strong = makeF('strong', { strength: 200, agility: 0 });
      const weak = makeF('weak', { hp: 10, endurance: 0, agility: 0 });
      const result = simulateCombat(strong, weak);
      expect(result.winner_id).toBe('strong');
    });

    it('the last HP event in the log shows 0 HP for the loser', () => {
      const result = simulateCombat(makeF('a'), makeF('b'));
      const hpEvents = result.log_data.filter(
        e => e.defender_hp !== undefined || e.attacker_hp !== undefined
      );
      const last = hpEvents[hpEvents.length - 1];
      const finalHp = last.defender_hp ?? last.attacker_hp;
      expect(finalHp).toBe(0);
    });

    it('never produces more than 200 events even with extreme endurance', () => {
      const result = simulateCombat(
        makeF('a', { endurance: 999 }),
        makeF('b', { endurance: 999 })
      );
      expect(result.log_data.length).toBeLessThanOrEqual(200);
    });

    it('high agility produces more dodges than zero agility over many combats', () => {
      let fastDodges = 0;
      for (let i = 0; i < 30; i++) {
        const r = simulateCombat(makeF('a', { agility: 0 }), makeF('fast', { agility: 80 }));
        fastDodges += r.log_data.filter(e => e.action === 'dodge' && e.actor === 'defender').length;
      }
      const slowResult = simulateCombat(makeF('a', { agility: 0 }), makeF('slow', { agility: 0 }));
      const slowDodges = slowResult.log_data.filter(e => e.action === 'dodge' && e.actor === 'defender').length;
      expect(fastDodges).toBeGreaterThan(slowDodges);
    });
  });
  ```

- [ ] **Step 2: Run tests — verify they fail**

  ```bash
  cd backend && npx jest tests/engine/combat.test.ts
  ```

  Expected: `FAIL — Cannot find module '../../src/engine/combat'`

- [ ] **Step 3: Implement `src/engine/combat.ts`**

  ```typescript
  import { Fighter, CombatResult, CombatEvent } from '../types';

  const MAX_TURNS = 200;

  export function simulateCombat(attacker: Fighter, defender: Fighter): CombatResult {
    let attackerHp = attacker.stats.hp;
    let defenderHp = defender.stats.hp;
    const log: CombatEvent[] = [];

    for (
      let turn = 1;
      turn <= MAX_TURNS && attackerHp > 0 && defenderHp > 0;
      turn++
    ) {
      const isAttackerTurn = turn % 2 === 1;
      const actor: 'attacker' | 'defender' = isAttackerTurn ? 'attacker' : 'defender';
      const current = isAttackerTurn ? attacker : defender;
      const targetStats = isAttackerTurn ? defender.stats : attacker.stats;

      const dodgeChance = Math.min(targetStats.agility / 100, 0.75);
      if (Math.random() < dodgeChance) {
        log.push({ turn, actor, action: 'dodge' });
        continue;
      }

      const isCritical = Math.random() < 0.1;
      const baseDamage = Math.max(1, current.stats.strength - Math.floor(targetStats.endurance / 2));
      const damage = isCritical ? Math.floor(baseDamage * 1.5) : baseDamage;

      if (isAttackerTurn) {
        defenderHp = Math.max(0, defenderHp - damage);
        log.push({
          turn, actor,
          action: isCritical ? 'critical' : 'attack',
          damage,
          defender_hp: defenderHp,
        });
      } else {
        attackerHp = Math.max(0, attackerHp - damage);
        log.push({
          turn, actor,
          action: isCritical ? 'critical' : 'attack',
          damage,
          attacker_hp: attackerHp,
        });
      }
    }

    const winner_id = attackerHp >= defenderHp ? attacker.id : defender.id;
    return { winner_id, log_data: log };
  }
  ```

- [ ] **Step 4: Run tests — verify they pass**

  ```bash
  npx jest tests/engine/combat.test.ts
  ```

  Expected: `PASS — 6 tests passed`

- [ ] **Step 5: Commit**

  ```bash
  git add backend/src/engine/combat.ts backend/tests/engine/combat.test.ts
  git commit -m "feat: implement combat engine with TDD"
  ```

---

## Task 6: Backend — Level Up Logic (TDD)

**Files:**
- Create: `backend/src/engine/levelup.ts`
- Create: `backend/tests/engine/levelup.test.ts`

- [ ] **Step 1: Write failing tests**

  Create `backend/tests/engine/levelup.test.ts`:

  ```typescript
  import { calculateXpGain, applyLevelUp, shouldLevelUp } from '../../src/engine/levelup';
  import { Character } from '../../src/types';

  const makeChar = (overrides: Partial<Character> = {}): Character => ({
    id: 'c1', user_id: 'u1', name: 'Test',
    level: 1, xp: 0, xp_to_next_level: 100,
    wins: 0, losses: 0,
    appearance: { gender: 'male', hair_color: '#000', skin_color: '#fff', hair_style: 'short' },
    stats: { hp: 100, strength: 10, agility: 10, endurance: 10 },
    created_at: '',
    ...overrides,
  });

  describe('calculateXpGain', () => {
    it('gives more XP for beating a higher-level enemy', () => {
      expect(calculateXpGain(1, 5)).toBeGreaterThan(calculateXpGain(1, 1));
    });

    it('gives at least 1 XP regardless of level gap', () => {
      expect(calculateXpGain(10, 1)).toBeGreaterThanOrEqual(1);
    });
  });

  describe('shouldLevelUp', () => {
    it('returns true when xp >= xp_to_next_level', () => {
      expect(shouldLevelUp(makeChar({ xp: 100, xp_to_next_level: 100 }))).toBe(true);
    });

    it('returns false when xp < xp_to_next_level', () => {
      expect(shouldLevelUp(makeChar({ xp: 99, xp_to_next_level: 100 }))).toBe(false);
    });
  });

  describe('applyLevelUp', () => {
    it('increments level by 1', () => {
      expect(applyLevelUp(makeChar({ xp: 100, xp_to_next_level: 100 })).character.level).toBe(2);
    });

    it('resets xp to 0 and raises xp_to_next_level', () => {
      const r = applyLevelUp(makeChar({ xp: 100, xp_to_next_level: 100 }));
      expect(r.character.xp).toBe(0);
      expect(r.character.xp_to_next_level).toBeGreaterThan(100);
    });

    it('increases the total sum of stats', () => {
      const char = makeChar({ xp: 100, xp_to_next_level: 100 });
      const before = char.stats.hp + char.stats.strength + char.stats.agility + char.stats.endurance;
      const after = applyLevelUp(char).character.stats;
      expect(after.hp + after.strength + after.agility + after.endurance).toBeGreaterThan(before);
    });

    it('returns a non-empty reward string', () => {
      const r = applyLevelUp(makeChar({ xp: 100, xp_to_next_level: 100 }));
      expect(typeof r.reward).toBe('string');
      expect(r.reward.length).toBeGreaterThan(0);
    });
  });
  ```

- [ ] **Step 2: Run tests — verify they fail**

  ```bash
  npx jest tests/engine/levelup.test.ts
  ```

  Expected: `FAIL — Cannot find module '../../src/engine/levelup'`

- [ ] **Step 3: Implement `src/engine/levelup.ts`**

  ```typescript
  import { Character, Stats } from '../types';

  export interface LevelUpResult {
    character: Character;
    reward: string;
  }

  export function calculateXpGain(winnerLevel: number, loserLevel: number): number {
    const base = 20;
    const bonus = Math.max(0, loserLevel - winnerLevel) * 10;
    return Math.max(1, base + bonus);
  }

  export function shouldLevelUp(character: Character): boolean {
    return character.xp >= character.xp_to_next_level;
  }

  type StatKey = keyof Stats;

  const STAT_KEYS: StatKey[] = ['hp', 'strength', 'agility', 'endurance'];

  const INCREMENTS: Record<StatKey, number> = {
    hp: 10,
    strength: 2,
    agility: 2,
    endurance: 2,
  };

  const LABELS: Record<StatKey, string> = {
    hp: 'Vida',
    strength: 'Fuerza',
    agility: 'Agilidad',
    endurance: 'Resistencia',
  };

  export function applyLevelUp(character: Character): LevelUpResult {
    const stat = STAT_KEYS[Math.floor(Math.random() * STAT_KEYS.length)];
    const increment = INCREMENTS[stat];

    const updated: Character = {
      ...character,
      level: character.level + 1,
      xp: 0,
      xp_to_next_level: Math.floor(character.xp_to_next_level * 1.5),
      stats: { ...character.stats, [stat]: character.stats[stat] + increment },
    };

    return { character: updated, reward: `+${increment} ${LABELS[stat]}` };
  }
  ```

- [ ] **Step 4: Run tests — verify they pass**

  ```bash
  npx jest tests/engine/levelup.test.ts
  ```

  Expected: `PASS — 6 tests passed`

- [ ] **Step 5: Run all backend tests**

  ```bash
  npx jest
  ```

  Expected: `PASS — 12 tests passed`

- [ ] **Step 6: Commit**

  ```bash
  git add backend/src/engine/levelup.ts backend/tests/engine/levelup.test.ts
  git commit -m "feat: implement level up logic with TDD"
  ```

---

## Task 7: Backend — Characters Routes

**Files:**
- Create: `backend/src/routes/characters.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Create `src/routes/characters.ts`**

  ```typescript
  import { Router, Response } from 'express';
  import { supabase } from '../db/supabase';
  import { requireAuth, AuthRequest } from '../middleware/auth';
  import { Stats, Appearance } from '../types';

  const router = Router();

  function randomStats(): Stats {
    const roll = () => Math.floor(Math.random() * 6) + 5;
    return {
      hp: 80 + Math.floor(Math.random() * 40),
      strength: roll(),
      agility: roll(),
      endurance: roll(),
    };
  }

  // POST /characters — create (1 per user)
  router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
    const { name, gender, hair_color, skin_color, hair_style } = req.body;

    if (!name || !gender) {
      res.status(400).json({ error: 'name and gender are required' });
      return;
    }

    const { data: existing } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', req.userId!)
      .single();

    if (existing) {
      res.status(409).json({ error: 'You already have a character' });
      return;
    }

    const appearance: Appearance = {
      gender: gender as 'male' | 'female',
      hair_color: hair_color || '#8B4513',
      skin_color: skin_color || '#FDBCB4',
      hair_style: hair_style || 'short',
    };

    const { data, error } = await supabase
      .from('characters')
      .insert({ user_id: req.userId!, name, stats: randomStats(), appearance })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json(data);
  });

  // GET /characters/me
  router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
    const { data, error } = await supabase
      .from('characters')
      .select('*, character_skills(skill_id, skills(*))')
      .eq('user_id', req.userId!)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }

    res.json(data);
  });

  // GET /characters/:id
  router.get('/:id', async (req, res: Response) => {
    const { data, error } = await supabase
      .from('characters')
      .select('*, character_skills(skill_id, skills(*))')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }

    res.json(data);
  });

  export default router;
  ```

- [ ] **Step 2: Register in `src/index.ts`**

  Add after auth routes:

  ```typescript
  import characterRoutes from './routes/characters';
  app.use('/characters', characterRoutes);
  ```

- [ ] **Step 3: Test character creation**

  ```bash
  # Login to get token
  RESP=$(curl -s -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"bruto@test.com","password":"password123"}')
  TOKEN=$(echo $RESP | python -c "import sys,json; print(json.load(sys.stdin)['session']['access_token'])")

  # Create character
  curl -X POST http://localhost:3001/characters \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"El Bruto","gender":"male","hair_color":"#000000","skin_color":"#FDBCB4","hair_style":"short"}'
  ```

  Expected: `{"id":"...","name":"El Bruto","level":1,"xp":0,...}`

- [ ] **Step 4: Commit**

  ```bash
  git add backend/src/routes/characters.ts backend/src/index.ts
  git commit -m "feat: add character creation and profile routes"
  ```

---

## Task 8: Backend — Combat + Ranking Routes

**Files:**
- Create: `backend/src/routes/combat.ts`
- Create: `backend/src/routes/ranking.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Create `src/routes/combat.ts`**

  ```typescript
  import { Router, Response } from 'express';
  import { supabase } from '../db/supabase';
  import { requireAuth, AuthRequest } from '../middleware/auth';
  import { simulateCombat } from '../engine/combat';
  import { calculateXpGain, shouldLevelUp, applyLevelUp } from '../engine/levelup';
  import { Fighter, Skill } from '../types';

  const router = Router();

  router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
    const { defender_id } = req.body;
    if (!defender_id) {
      res.status(400).json({ error: 'defender_id required' });
      return;
    }

    const { data: atk, error: aErr } = await supabase
      .from('characters')
      .select('*, character_skills(skill_id, skills(*))')
      .eq('user_id', req.userId!)
      .single();

    if (aErr || !atk) {
      res.status(404).json({ error: 'Your character not found' });
      return;
    }

    const { data: def, error: dErr } = await supabase
      .from('characters')
      .select('*, character_skills(skill_id, skills(*))')
      .eq('id', defender_id)
      .single();

    if (dErr || !def) {
      res.status(404).json({ error: 'Defender not found' });
      return;
    }

    if (atk.id === def.id) {
      res.status(400).json({ error: 'Cannot fight yourself' });
      return;
    }

    const toFighter = (char: any): Fighter => ({
      id: char.id,
      name: char.name,
      stats: char.stats,
      skills: (char.character_skills || []).map((cs: any) => cs.skills as Skill).filter(Boolean),
    });

    const result = simulateCombat(toFighter(atk), toFighter(def));
    const attackerWon = result.winner_id === atk.id;

    const { data: combatLog, error: logErr } = await supabase
      .from('combat_logs')
      .insert({
        attacker_id: atk.id,
        defender_id: def.id,
        winner_id: result.winner_id,
        attacker_name: atk.name,
        defender_name: def.name,
        log_data: result.log_data,
      })
      .select()
      .single();

    if (logErr) {
      res.status(500).json({ error: logErr.message });
      return;
    }

    await supabase.from('characters').update({
      wins: atk.wins + (attackerWon ? 1 : 0),
      losses: atk.losses + (attackerWon ? 0 : 1),
    }).eq('id', atk.id);

    await supabase.from('characters').update({
      wins: def.wins + (attackerWon ? 0 : 1),
      losses: def.losses + (attackerWon ? 1 : 0),
    }).eq('id', def.id);

    let levelUpReward: string | null = null;

    if (attackerWon) {
      const xpGain = calculateXpGain(atk.level, def.level);
      const withXp = { ...atk, xp: atk.xp + xpGain };
      if (shouldLevelUp(withXp)) {
        const { character: leveled, reward } = applyLevelUp(withXp);
        levelUpReward = reward;
        await supabase.from('characters').update({
          xp: leveled.xp,
          level: leveled.level,
          xp_to_next_level: leveled.xp_to_next_level,
          stats: leveled.stats,
        }).eq('id', atk.id);
      } else {
        await supabase.from('characters').update({ xp: withXp.xp }).eq('id', atk.id);
      }
    }

    res.json({
      combat_id: combatLog.id,
      winner_id: result.winner_id,
      attacker_name: atk.name,
      defender_name: def.name,
      log_data: result.log_data,
      level_up: levelUpReward,
    });
  });

  router.get('/:id', async (req, res: Response) => {
    const { data, error } = await supabase
      .from('combat_logs')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Combat not found' });
      return;
    }

    res.json(data);
  });

  export default router;
  ```

- [ ] **Step 2: Create `src/routes/ranking.ts`**

  ```typescript
  import { Router, Response } from 'express';
  import { supabase } from '../db/supabase';

  const router = Router();

  router.get('/', async (_req, res: Response) => {
    const { data, error } = await supabase
      .from('characters')
      .select('id, name, level, wins, losses, stats, appearance')
      .order('level', { ascending: false })
      .order('wins', { ascending: false })
      .limit(50);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json(data);
  });

  export default router;
  ```

- [ ] **Step 3: Register routes in `src/index.ts`**

  ```typescript
  import combatRoutes from './routes/combat';
  import rankingRoutes from './routes/ranking';
  app.use('/combat', combatRoutes);
  app.use('/ranking', rankingRoutes);
  ```

- [ ] **Step 4: Run all backend tests**

  ```bash
  npx jest
  ```

  Expected: `PASS — 12 tests passed`

- [ ] **Step 5: Commit**

  ```bash
  git add backend/src/routes/combat.ts backend/src/routes/ranking.ts backend/src/index.ts
  git commit -m "feat: add combat and ranking routes, wire up level-up on win"
  ```

---

## Task 9: Frontend — Project Setup + API Client + Router

**Files:**
- Create: `frontend/` (via Vite)
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/types.ts`
- Create: `frontend/src/App.tsx`

- [ ] **Step 1: Scaffold Vite project**

  ```bash
  cd ..   # back to repo root
  npm create vite@latest frontend -- --template react-ts
  cd frontend && npm install
  ```

- [ ] **Step 2: Install dependencies**

  ```bash
  npm install phaser axios react-router-dom
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  ```

- [ ] **Step 3: Configure Tailwind**

  `frontend/tailwind.config.js`:
  ```javascript
  export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: { extend: {} },
    plugins: [],
  }
  ```

  `frontend/src/index.css` — replace with:
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```

- [ ] **Step 4: Create `.env.example`**

  ```
  VITE_API_URL=http://localhost:3001
  ```

- [ ] **Step 5: Create `src/types.ts`**

  ```typescript
  export interface Stats {
    hp: number;
    strength: number;
    agility: number;
    endurance: number;
  }

  export interface Appearance {
    gender: 'male' | 'female';
    hair_color: string;
    skin_color: string;
    hair_style: string;
  }

  export interface Character {
    id: string;
    user_id: string;
    name: string;
    level: number;
    xp: number;
    xp_to_next_level: number;
    wins: number;
    losses: number;
    appearance: Appearance;
    stats: Stats;
  }

  export interface CombatEvent {
    turn: number;
    actor: 'attacker' | 'defender';
    action: 'attack' | 'dodge' | 'critical' | 'skill';
    damage?: number;
    skill?: string;
    defender_hp?: number;
    attacker_hp?: number;
  }
  ```

- [ ] **Step 6: Create `src/api/client.ts`**

  ```typescript
  import axios from 'axios';

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
  });

  api.interceptors.request.use((config) => {
    const raw = localStorage.getItem('session');
    if (raw) {
      const { access_token } = JSON.parse(raw);
      config.headers.Authorization = `Bearer ${access_token}`;
    }
    return config;
  });

  export default api;
  ```

- [ ] **Step 7: Create `src/App.tsx`**

  ```tsx
  import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
  import Landing from './pages/Landing';
  import CreateCharacter from './pages/CreateCharacter';
  import Profile from './pages/Profile';
  import Arena from './pages/Arena';
  import Ranking from './pages/Ranking';

  export default function App() {
    const isLoggedIn = !!localStorage.getItem('session');

    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={isLoggedIn ? <Navigate to="/profile" /> : <Landing />} />
          <Route path="/create-character" element={<CreateCharacter />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/arena/:combatId" element={<Arena />} />
          <Route path="/ranking" element={<Ranking />} />
        </Routes>
      </BrowserRouter>
    );
  }
  ```

- [ ] **Step 8: Start dev server and verify**

  ```bash
  cp .env.example .env
  npm run dev
  ```

  Expected: Vite server at `http://localhost:5173` — landing page visible.

- [ ] **Step 9: Commit**

  ```bash
  git add frontend/
  git commit -m "chore: initialize frontend with React + Vite + Tailwind + Phaser"
  ```

---

## Task 10: Frontend — Landing Page

**Files:**
- Create: `frontend/src/pages/Landing.tsx`

- [ ] **Step 1: Create `src/pages/Landing.tsx`**

  ```tsx
  import { useState } from 'react';
  import { useNavigate } from 'react-router-dom';
  import api from '../api/client';

  export default function Landing() {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      try {
        const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
        const { data } = await api.post(endpoint, { email, password });
        localStorage.setItem('session', JSON.stringify(data.session));
        navigate('/profile');
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error de conexión');
      }
    };

    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="bg-amber-100 border-4 border-amber-800 rounded-lg p-8 w-96 shadow-xl">
          <h1 className="text-4xl font-bold text-center text-amber-900 mb-2">EL BRUTO</h1>
          <p className="text-center text-amber-700 mb-6">¡El mejor juego de combate!</p>

          <div className="flex mb-4">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 font-bold ${mode === 'login' ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-800'}`}
            >
              Entrar
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 font-bold ${mode === 'register' ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-800'}`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border-2 border-amber-700 rounded bg-amber-50"
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border-2 border-amber-700 rounded bg-amber-50"
              required
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-amber-800 text-white font-bold rounded hover:bg-amber-900"
            >
              {mode === 'login' ? '¡Entrar al Arena!' : '¡Crear cuenta!'}
            </button>
          </form>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Test in browser**

  Navigate to `http://localhost:5173`:
  - Login/register toggle switches correctly
  - Registering a new account redirects to `/profile`
  - Logging in with existing account redirects to `/profile`

- [ ] **Step 3: Commit**

  ```bash
  git add frontend/src/pages/Landing.tsx
  git commit -m "feat: add landing page with login and register"
  ```

---

## Task 11: Frontend — Create Character Page

**Files:**
- Create: `frontend/src/pages/CreateCharacter.tsx`

- [ ] **Step 1: Create `src/pages/CreateCharacter.tsx`**

  ```tsx
  import { useState } from 'react';
  import { useNavigate } from 'react-router-dom';
  import api from '../api/client';

  const HAIR_COLORS = ['#000000', '#8B4513', '#FFD700', '#FF4500', '#808080'];
  const SKIN_COLORS = ['#FDBCB4', '#D4956A', '#8D5524', '#4A2912'];
  const HAIR_STYLES = ['short', 'long', 'mohawk', 'bald'];

  export default function CreateCharacter() {
    const [name, setName] = useState('');
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [hairColor, setHairColor] = useState(HAIR_COLORS[0]);
    const [skinColor, setSkinColor] = useState(SKIN_COLORS[0]);
    const [hairStyle, setHairStyle] = useState(HAIR_STYLES[0]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      try {
        await api.post('/characters', {
          name, gender,
          hair_color: hairColor,
          skin_color: skinColor,
          hair_style: hairStyle,
        });
        navigate('/profile');
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al crear personaje');
      }
    };

    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="bg-amber-100 border-4 border-amber-800 rounded-lg p-8 w-[480px] shadow-xl">
          <h2 className="text-3xl font-bold text-center text-amber-900 mb-6">Crea tu Bruto</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-amber-800 font-bold mb-1">Nombre</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                className="w-full p-2 border-2 border-amber-700 rounded bg-amber-50"
                required
              />
            </div>

            <div>
              <label className="block text-amber-800 font-bold mb-1">Género</label>
              <div className="flex gap-2">
                {(['male', 'female'] as const).map((g) => (
                  <button key={g} type="button" onClick={() => setGender(g)}
                    className={`flex-1 py-2 font-bold rounded ${gender === g ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-800'}`}>
                    {g === 'male' ? 'Masculino' : 'Femenino'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-amber-800 font-bold mb-1">Color de pelo</label>
              <div className="flex gap-2">
                {HAIR_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setHairColor(c)}
                    style={{ background: c }}
                    className={`w-10 h-10 rounded-full border-4 ${hairColor === c ? 'border-amber-900' : 'border-transparent'}`} />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-amber-800 font-bold mb-1">Color de piel</label>
              <div className="flex gap-2">
                {SKIN_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setSkinColor(c)}
                    style={{ background: c }}
                    className={`w-10 h-10 rounded-full border-4 ${skinColor === c ? 'border-amber-900' : 'border-transparent'}`} />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-amber-800 font-bold mb-1">Peinado</label>
              <div className="flex gap-2 flex-wrap">
                {HAIR_STYLES.map((s) => (
                  <button key={s} type="button" onClick={() => setHairStyle(s)}
                    className={`px-3 py-1 font-bold rounded capitalize ${hairStyle === s ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-800'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-amber-700 text-sm italic">
              * Tus stats iniciales serán asignados aleatoriamente ¡como en el original!
            </p>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button type="submit"
              className="w-full py-3 bg-amber-800 text-white font-bold rounded hover:bg-amber-900 text-lg">
              ¡Crear mi Bruto!
            </button>
          </form>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Test in browser**

  Navigate to `http://localhost:5173/create-character`:
  - All pickers render and toggle correctly
  - Submitting redirects to `/profile`
  - Trying to create a second character shows "You already have a character"

- [ ] **Step 3: Commit**

  ```bash
  git add frontend/src/pages/CreateCharacter.tsx
  git commit -m "feat: add create character page"
  ```

---

## Task 12: Frontend — Profile + Ranking + Components

**Files:**
- Create: `frontend/src/components/StatBar.tsx`
- Create: `frontend/src/components/CharacterCard.tsx`
- Create: `frontend/src/pages/Profile.tsx`
- Create: `frontend/src/pages/Ranking.tsx`

- [ ] **Step 1: Create `src/components/StatBar.tsx`**

  ```tsx
  interface Props {
    label: string;
    value: number;
    max?: number;
  }

  export default function StatBar({ label, value, max = 200 }: Props) {
    const pct = Math.min(100, (value / max) * 100);
    return (
      <div className="mb-2">
        <div className="flex justify-between text-sm font-bold text-amber-900">
          <span>{label}</span><span>{value}</span>
        </div>
        <div className="w-full bg-amber-200 rounded h-3">
          <div className="bg-amber-700 h-3 rounded transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Create `src/components/CharacterCard.tsx`**

  ```tsx
  import { Character } from '../types';

  interface Props {
    character: Character;
    onChallenge?: () => void;
  }

  export default function CharacterCard({ character, onChallenge }: Props) {
    return (
      <div className="bg-amber-100 border-2 border-amber-700 rounded-lg p-4 w-44 text-center">
        <div className="w-14 h-14 rounded-full mx-auto mb-2 border-4 border-amber-700"
          style={{ background: character.appearance.skin_color }} />
        <h3 className="font-bold text-amber-900 truncate">{character.name}</h3>
        <p className="text-sm text-amber-700">Nivel {character.level}</p>
        <p className="text-xs text-amber-600">{character.wins}V — {character.losses}D</p>
        {onChallenge && (
          <button onClick={onChallenge}
            className="mt-2 w-full py-1 bg-red-700 text-white font-bold rounded text-sm hover:bg-red-800">
            ¡Retar!
          </button>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 3: Create `src/pages/Profile.tsx`**

  ```tsx
  import { useEffect, useState } from 'react';
  import { useNavigate, useParams } from 'react-router-dom';
  import api from '../api/client';
  import { Character } from '../types';
  import StatBar from '../components/StatBar';

  export default function Profile() {
    const { id } = useParams();
    const [character, setCharacter] = useState<Character | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
      const endpoint = id ? `/characters/${id}` : '/characters/me';
      api.get(endpoint)
        .then(({ data }) => setCharacter(data))
        .catch(() => { if (!id) navigate('/create-character'); })
        .finally(() => setLoading(false));
    }, [id]);

    const handleChallenge = async () => {
      if (!character) return;
      try {
        const { data } = await api.post('/combat', { defender_id: character.id });
        navigate(`/arena/${data.combat_id}`);
      } catch (err: any) {
        alert(err.response?.data?.error || 'Error al iniciar combate');
      }
    };

    if (loading) {
      return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center text-amber-800 text-xl">
          Cargando...
        </div>
      );
    }

    if (!character) return null;

    const isOwnProfile = !id;

    return (
      <div className="min-h-screen bg-amber-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-amber-900">{character.name}</h1>
            <div className="flex gap-2">
              <button onClick={() => navigate('/ranking')}
                className="px-4 py-2 bg-amber-700 text-white rounded font-bold">
                Ranking
              </button>
              {isOwnProfile && (
                <button onClick={() => { localStorage.removeItem('session'); navigate('/'); }}
                  className="px-4 py-2 bg-gray-600 text-white rounded font-bold">
                  Salir
                </button>
              )}
            </div>
          </div>

          <div className="bg-amber-100 border-2 border-amber-700 rounded-lg p-6 mb-4">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full border-4 border-amber-800"
                style={{ background: character.appearance.skin_color }} />
              <div className="flex-1">
                <p className="text-2xl font-bold text-amber-900">Nivel {character.level}</p>
                <p className="text-amber-700">{character.wins} victorias · {character.losses} derrotas</p>
                <div className="mt-2 w-full bg-amber-200 rounded h-2">
                  <div className="bg-green-600 h-2 rounded"
                    style={{ width: `${Math.min(100, (character.xp / character.xp_to_next_level) * 100)}%` }} />
                </div>
                <p className="text-xs text-amber-600 mt-1">{character.xp} / {character.xp_to_next_level} XP</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-100 border-2 border-amber-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-amber-900 mb-4">Estadísticas</h2>
            <StatBar label="Vida" value={character.stats.hp} max={300} />
            <StatBar label="Fuerza" value={character.stats.strength} max={50} />
            <StatBar label="Agilidad" value={character.stats.agility} max={50} />
            <StatBar label="Resistencia" value={character.stats.endurance} max={50} />
          </div>

          {!isOwnProfile && (
            <button onClick={handleChallenge}
              className="mt-6 w-full py-4 bg-red-700 text-white font-bold text-xl rounded hover:bg-red-800">
              ¡RETAR A {character.name.toUpperCase()}!
            </button>
          )}
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 4: Create `src/pages/Ranking.tsx`**

  ```tsx
  import { useEffect, useState } from 'react';
  import { useNavigate } from 'react-router-dom';
  import api from '../api/client';
  import { Character } from '../types';

  export default function Ranking() {
    const [characters, setCharacters] = useState<Character[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
      api.get('/ranking').then(({ data }) => setCharacters(data));
    }, []);

    return (
      <div className="min-h-screen bg-amber-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-amber-900">Ranking de Brutos</h1>
            <button onClick={() => navigate('/profile')}
              className="px-4 py-2 bg-amber-700 text-white rounded font-bold">
              Mi Bruto
            </button>
          </div>

          <div className="space-y-2">
            {characters.map((char, i) => (
              <div key={char.id} onClick={() => navigate(`/profile/${char.id}`)}
                className="bg-amber-100 border-2 border-amber-700 rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:bg-amber-200 transition-colors">
                <span className="text-2xl font-bold text-amber-800 w-10">#{i + 1}</span>
                <div className="w-10 h-10 rounded-full border-2 border-amber-700"
                  style={{ background: char.appearance.skin_color }} />
                <div className="flex-1">
                  <p className="font-bold text-amber-900">{char.name}</p>
                  <p className="text-sm text-amber-700">Nivel {char.level} · {char.wins}V {char.losses}D</p>
                </div>
                <span className="text-amber-600 text-sm">Ver →</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 5: Test in browser**

  - Profile page shows stats, XP bar, and level
  - Ranking lists all characters, clicking one opens their profile
  - Visiting another player's profile shows the "¡Retar!" button

- [ ] **Step 6: Commit**

  ```bash
  git add frontend/src/
  git commit -m "feat: add profile, ranking pages and stat components"
  ```

---

## Task 13: Frontend — Phaser.js Combat Scene + Arena Page

**Files:**
- Create: `frontend/src/game/CombatScene.ts`
- Create: `frontend/src/pages/Arena.tsx`

- [ ] **Step 1: Create `src/game/CombatScene.ts`**

  ```typescript
  import Phaser from 'phaser';
  import { CombatEvent } from '../types';

  export interface CombatSceneConfig {
    logData: CombatEvent[];
    attackerName: string;
    defenderName: string;
    winnerId: string;
    onComplete: (winnerId: string) => void;
  }

  export class CombatScene extends Phaser.Scene {
    private cfg!: CombatSceneConfig;
    private attackerSprite!: Phaser.GameObjects.Rectangle;
    private defenderSprite!: Phaser.GameObjects.Rectangle;
    private attackerHpBar!: Phaser.GameObjects.Rectangle;
    private defenderHpBar!: Phaser.GameObjects.Rectangle;
    private attackerMaxHp = 100;
    private defenderMaxHp = 100;
    private currentAtkHp = 100;
    private currentDefHp = 100;
    private eventIndex = 0;
    private statusText!: Phaser.GameObjects.Text;

    constructor() { super('CombatScene'); }

    init(config: CombatSceneConfig) {
      this.cfg = config;
      // Derive max HP from first HP events in the log
      const firstAtkHp = config.logData.find(e => e.attacker_hp !== undefined)?.attacker_hp;
      const firstDefHp = config.logData.find(e => e.defender_hp !== undefined)?.defender_hp;
      if (firstAtkHp !== undefined) this.attackerMaxHp = firstAtkHp + (config.logData[0]?.damage || 0);
      if (firstDefHp !== undefined) this.defenderMaxHp = firstDefHp + (config.logData[0]?.damage || 0);
      this.currentAtkHp = this.attackerMaxHp;
      this.currentDefHp = this.defenderMaxHp;
    }

    create() {
      const W = this.scale.width;
      const H = this.scale.height;

      // Background
      this.add.rectangle(W / 2, H / 2, W, H, 0xd4a017);
      this.add.rectangle(W / 2, H * 0.75, W, H * 0.5, 0xa0522d);

      // Fighter sprites (colored rectangles as placeholder)
      this.attackerSprite = this.add.rectangle(W * 0.25, H * 0.55, 60, 90, 0x4444ff);
      this.defenderSprite = this.add.rectangle(W * 0.75, H * 0.55, 60, 90, 0xff4444);

      // Names
      this.add.text(W * 0.25, H * 0.2, this.cfg.attackerName, {
        fontSize: '18px', color: '#3b1f00', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.add.text(W * 0.75, H * 0.2, this.cfg.defenderName, {
        fontSize: '18px', color: '#3b1f00', fontStyle: 'bold',
      }).setOrigin(0.5);

      // HP bar backgrounds
      this.add.rectangle(W * 0.25, H * 0.3, 120, 14, 0x333333).setOrigin(0.5);
      this.add.rectangle(W * 0.75, H * 0.3, 120, 14, 0x333333).setOrigin(0.5);

      this.attackerHpBar = this.add.rectangle(W * 0.25 - 60, H * 0.3, 120, 14, 0x22cc44).setOrigin(0, 0.5);
      this.defenderHpBar = this.add.rectangle(W * 0.75 - 60, H * 0.3, 120, 14, 0x22cc44).setOrigin(0, 0.5);

      this.statusText = this.add.text(W / 2, H * 0.85, '', {
        fontSize: '15px', color: '#3b1f00',
        backgroundColor: '#f5e6c8',
        padding: { x: 10, y: 5 },
      }).setOrigin(0.5);

      // Process events on a timer
      this.time.addEvent({
        delay: 500,
        callback: this.processNextEvent,
        callbackScope: this,
        loop: true,
      });
    }

    private processNextEvent() {
      if (this.eventIndex >= this.cfg.logData.length) {
        this.time.removeAllEvents();
        this.time.delayedCall(1200, () => this.cfg.onComplete(this.cfg.winnerId));
        return;
      }

      const event = this.cfg.logData[this.eventIndex++];
      const isAtk = event.actor === 'attacker';
      const sprite = isAtk ? this.attackerSprite : this.defenderSprite;
      const targetSprite = isAtk ? this.defenderSprite : this.attackerSprite;
      const actorName = isAtk ? this.cfg.attackerName : this.cfg.defenderName;

      if (event.action === 'dodge') {
        this.statusText.setText(`${actorName} esquiva!`);
        this.tweens.add({ targets: sprite, y: sprite.y - 18, duration: 120, yoyo: true });
        return;
      }

      const originX = sprite.x;
      this.tweens.add({
        targets: sprite,
        x: isAtk ? sprite.x + 50 : sprite.x - 50,
        duration: 120,
        yoyo: true,
        onComplete: () => {
          sprite.x = originX;
          const label = event.action === 'critical' ? 'CRÍTICO' : 'ataca';
          this.statusText.setText(`${actorName} ${label}! −${event.damage} HP`);
          this.cameras.main.shake(80, 0.004);
          this.tweens.add({ targets: targetSprite, alpha: 0.2, duration: 80, yoyo: true });

          if (event.defender_hp !== undefined) {
            this.currentDefHp = event.defender_hp;
            this.defenderHpBar.scaleX = Math.max(0, this.currentDefHp / this.defenderMaxHp);
          }
          if (event.attacker_hp !== undefined) {
            this.currentAtkHp = event.attacker_hp;
            this.attackerHpBar.scaleX = Math.max(0, this.currentAtkHp / this.attackerMaxHp);
          }
        },
      });
    }
  }
  ```

- [ ] **Step 2: Create `src/pages/Arena.tsx`**

  ```tsx
  import { useEffect, useRef, useState } from 'react';
  import { useNavigate, useParams } from 'react-router-dom';
  import Phaser from 'phaser';
  import { CombatScene, CombatSceneConfig } from '../game/CombatScene';
  import api from '../api/client';

  interface CombatData {
    log_data: any[];
    winner_id: string;
    attacker_name: string;
    defender_name: string;
    level_up: string | null;
  }

  export default function Arena() {
    const { combatId } = useParams();
    const containerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);
    const [done, setDone] = useState<{ winnerId: string; levelUp: string | null } | null>(null);
    const [combatData, setCombatData] = useState<CombatData | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
      if (!combatId) return;
      api.get(`/combat/${combatId}`).then(({ data }) => setCombatData(data));
    }, [combatId]);

    useEffect(() => {
      if (!combatData || !containerRef.current || gameRef.current) return;

      const cfg: CombatSceneConfig = {
        logData: combatData.log_data,
        attackerName: combatData.attacker_name,
        defenderName: combatData.defender_name,
        winnerId: combatData.winner_id,
        onComplete: (winnerId) => {
          setDone({ winnerId, levelUp: combatData.level_up });
          gameRef.current?.destroy(true);
          gameRef.current = null;
        },
      };

      const game = new Phaser.Game({
        type: Phaser.AUTO,
        width: 640,
        height: 360,
        parent: containerRef.current,
        backgroundColor: '#d4a017',
        scene: [],
      });

      game.scene.add('CombatScene', CombatScene, false);
      game.events.once(Phaser.Core.Events.READY, () => {
        game.scene.start('CombatScene', cfg);
      });

      gameRef.current = game;

      return () => {
        game.destroy(true);
        gameRef.current = null;
      };
    }, [combatData]);

    return (
      <div className="min-h-screen bg-amber-900 flex flex-col items-center justify-center gap-6">
        <h1 className="text-3xl font-bold text-amber-200">¡COMBATE!</h1>

        {!done && combatData && (
          <div className="flex gap-8 text-amber-200 text-lg font-bold mb-2">
            <span>{combatData.attacker_name}</span>
            <span>VS</span>
            <span>{combatData.defender_name}</span>
          </div>
        )}

        {!done && <div ref={containerRef} className="border-4 border-amber-600 rounded shadow-2xl" />}

        {done && (
          <div className="bg-amber-100 border-4 border-amber-800 rounded-lg p-10 text-center shadow-2xl">
            <h2 className="text-4xl font-bold text-amber-900 mb-2">¡Combate terminado!</h2>
            <p className="text-amber-700 mb-4">
              Ganador: <span className="font-bold">{done.winnerId}</span>
            </p>
            {done.levelUp && (
              <p className="text-green-700 font-bold text-xl mb-4">
                ¡Subiste de nivel! {done.levelUp}
              </p>
            )}
            <button onClick={() => navigate('/profile')}
              className="px-8 py-3 bg-amber-800 text-white font-bold rounded hover:bg-amber-900 text-lg">
              Volver a mi perfil
            </button>
          </div>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 3: Test full combat flow in browser**

  1. Register two accounts, create a character on each
  2. From the ranking, click on the second character's profile
  3. Click "¡Retar!" — verify you are redirected to `/arena/:id`
  4. Verify the Phaser animation plays: fighters move, HP bars decrease
  5. Verify the result screen appears with winner and level-up info if applicable
  6. Verify "Volver a mi perfil" redirects correctly

- [ ] **Step 4: Commit**

  ```bash
  git add frontend/src/game/CombatScene.ts frontend/src/pages/Arena.tsx
  git commit -m "feat: add Phaser.js combat animation scene and arena page"
  ```

---

## Post-MVP Backlog

These features are out of scope for this plan. Each becomes its own spec + plan cycle:

- **Pupilos:** Link de reclutamiento único; recruiter gets XP bonus when pupil wins
- **Torneos:** Daily bracket auto-generated from top-N characters; Supabase Realtime for live results
- **Clanes:** Group ranking, clan chat, clan tournament
- **Mascotas:** Unlockable companions with passive skill bonuses
- **Sprites reales:** Replace Phaser rectangles with actual 2D sprite sheets
- **Notificaciones push:** Alert when someone challenges your character
