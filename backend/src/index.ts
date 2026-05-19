import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import characterRoutes from './routes/characters';
import combatRoutes from './routes/combat';
import rankingRoutes from './routes/ranking';
import weaponRoutes from './routes/weapons';
import petRoutes from './routes/pets';
import clanRoutes from './routes/clans';
import missionRoutes from './routes/missions';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/characters', characterRoutes);
app.use('/combat', combatRoutes);
app.use('/ranking', rankingRoutes);
app.use('/weapons', weaponRoutes);
app.use('/pets', petRoutes);
app.use('/clans', clanRoutes);
app.use('/missions', missionRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
