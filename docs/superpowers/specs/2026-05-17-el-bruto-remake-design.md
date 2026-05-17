# El Bruto Remake — Diseño MVP

**Fecha:** 2026-05-17
**Tipo:** Juego web multijugador asíncrono (remake de MyBrute/El Bruto)
**Alcance:** MVP funcional — crear personaje, combate automático, subida de nivel

---

## 1. Visión General

Remake fiel de El Bruto original con tecnologías web modernas (sin Flash). Los combates son 100% automáticos y calculados en el servidor. El cliente solo recibe el log de eventos y lo anima. Totalmente gratuito, sin monetización.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Hosting |
|------|-----------|---------|
| Frontend | React + Vite + Phaser.js + TailwindCSS | Vercel (free) |
| Backend | Node.js + Express + TypeScript | Railway (free) |
| Base de datos | Supabase (PostgreSQL + Auth + Realtime) | Supabase (free) |

Dos repositorios separados comunicados via REST API + WebSockets.

---

## 3. Arquitectura General

```
CLIENTE (Vercel)
├── React + Vite        → UI, menús, perfiles, ranking
└── Phaser.js           → Animación del combate 2D
        │
        │ REST API + WebSocket
        ▼
SERVIDOR (Railway)
└── Node.js + Express + TypeScript
    ├── Auth
    ├── Personajes
    ├── Motor de combate (server-side puro)
    └── Subida de nivel
        │
        ▼
BASE DE DATOS (Supabase)
└── PostgreSQL + Auth + Realtime
```

**Principio clave:** El motor de combate vive 100% en el servidor. El cliente recibe un `log_data` con la secuencia completa y lo reproduce. Esto elimina cualquier posibilidad de trampas.

---

## 4. Base de Datos

### Tablas

```sql
-- Gestionado por Supabase Auth
users (id uuid, email, created_at)

characters (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  name varchar(50),
  level int DEFAULT 1,
  xp int DEFAULT 0,
  xp_to_next_level int DEFAULT 100,
  wins int DEFAULT 0,
  losses int DEFAULT 0,
  appearance jsonb,   -- { hair_color, skin_color, gender, hair_style }
  stats jsonb         -- { hp, strength, agility, endurance }
)

skills (
  id uuid PRIMARY KEY,
  name varchar(100),
  description text,
  effect jsonb        -- { type: "damage_bonus", value: 15 }
)

character_skills (
  character_id uuid REFERENCES characters,
  skill_id uuid REFERENCES skills,
  PRIMARY KEY (character_id, skill_id)
)

combat_logs (
  id uuid PRIMARY KEY,
  attacker_id uuid REFERENCES characters,
  defender_id uuid REFERENCES characters,
  winner_id uuid REFERENCES characters,
  log_data jsonb,     -- array de eventos para la animación
  created_at timestamptz DEFAULT now()
)
```

### Decisiones de diseño
- `stats` y `appearance` en `jsonb` para flexibilidad sin alterar el schema al agregar features
- `log_data` guarda la secuencia completa lista para reproducir la animación en cualquier momento
- Un personaje por usuario en el MVP

---

## 5. Motor de Combate

### Flujo

```
1. POST /combat { defender_id }
   └── Carga stats de attacker y defender desde DB

2. Simulación por turnos (TypeScript puro)
   ├── Turnos alternos entre atacante y defensor
   ├── Por turno:
   │   ├── ¿Esquiva? → agility vs random roll
   │   ├── ¿Crítico? → luck factor
   │   ├── Daño = strength + weapon_bonus - endurance
   │   └── ¿Skill activa? → efecto especial
   └── Cada evento se agrega al log_data

3. Fin del combate
   ├── Gana quien deje al rival en 0 HP
   ├── Calcula XP ganada
   ├── Actualiza wins/losses en DB
   ├── Si xp >= xp_to_next_level → Level Up
   │   └── Asigna stats/skill ALEATORIOS (fiel al original)
   └── Guarda combat_log en DB

4. Respuesta
   └── Devuelve { winner_id, log_data, level_up? }
```

### Formato log_data

```json
[
  { "turn": 1, "actor": "attacker", "action": "attack", "damage": 12, "defender_hp": 88 },
  { "turn": 2, "actor": "defender", "action": "dodge" },
  { "turn": 3, "actor": "attacker", "action": "skill", "skill": "Golpe Brutal", "damage": 25 },
  { "turn": 4, "actor": "defender", "action": "attack", "damage": 8, "defender_hp": 55 }
]
```

### Subida de nivel
Al subir de nivel, el servidor asigna **aleatoriamente** una de estas opciones:
- +stat (hp / strength / agility / endurance)
- nueva skill
- nueva arma

El jugador no elige — fiel al espíritu del original.

---

## 6. API REST

```
AUTH
POST /auth/register    → Crea usuario
POST /auth/login       → Devuelve JWT

PERSONAJES
POST /characters       → Crea personaje (1 por usuario)
GET  /characters/:id   → Perfil de un personaje
GET  /characters       → Lista para el ranking

COMBATE
POST /combat           → Inicia combate { defender_id }
GET  /combat/:id       → Obtiene combate guardado

RANKING
GET  /ranking          → Top personajes por nivel/victorias
```

Todas las rutas excepto `/auth/*` requieren JWT de Supabase en el header `Authorization`.

---

## 7. Frontend — Pantallas MVP

```
/                    → Landing (login / registro)
/create-character    → Creador de personaje
                       ├── Nombre
                       ├── Apariencia (pelo, piel, género)
                       └── Stats iniciales aleatorios
/profile             → Perfil propio
                       ├── Stats y habilidades
                       ├── Historial de combates
                       └── Botón "Buscar rival"
/arena/:combat_id    → Pantalla de combate (Phaser.js)
                       ├── Animación 2D del combate
                       ├── Barras de HP
                       └── Resultado + XP ganada
/ranking             → Lista de los mejores Brutos
```

### Integración React + Phaser.js

React gestiona toda la UI. En `/arena`, monta un `<canvas>` donde Phaser.js toma el control para animar el combate. Al terminar la animación, React vuelve a mostrar el resultado.

---

## 8. Estructura de Carpetas

### Backend
```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── characters.ts
│   │   ├── combat.ts
│   │   └── ranking.ts
│   ├── engine/
│   │   ├── combat.ts        ← Motor de combate puro
│   │   └── levelup.ts       ← Lógica de subida de nivel
│   ├── middleware/
│   │   └── auth.ts          ← Verifica JWT de Supabase
│   ├── db/
│   │   └── supabase.ts      ← Cliente de Supabase
│   └── index.ts
└── package.json
```

### Frontend
```
frontend/
├── src/
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── CreateCharacter.tsx
│   │   ├── Profile.tsx
│   │   ├── Arena.tsx
│   │   └── Ranking.tsx
│   ├── game/
│   │   └── CombatScene.ts   ← Escena Phaser.js
│   ├── components/          ← Componentes React reutilizables
│   ├── api/
│   │   └── client.ts        ← Axios + interceptores JWT
│   └── main.tsx
└── package.json
```

---

## 9. Features MVP (en orden de implementación)

1. Registro y login (Supabase Auth)
2. Crear personaje con stats aleatorios y apariencia personalizable
3. Ver perfil propio con stats y habilidades
4. Ver perfiles de otros jugadores
5. Iniciar combate contra otro jugador
6. Animación del combate con Phaser.js
7. Subida de nivel automática con stats/skill aleatorios
8. Ranking global

## 10. Features Post-MVP (backlog)

- Sistema de pupilos (link de reclutamiento)
- Torneos diarios/semanales
- Clanes
- Mascotas
- Chat entre jugadores
- Notificaciones cuando te retan
