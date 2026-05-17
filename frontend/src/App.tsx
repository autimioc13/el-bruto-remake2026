import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import CreateCharacter from './pages/CreateCharacter';
import Profile from './pages/Profile';
import Arena from './pages/Arena';
import Ranking from './pages/Ranking';
import Replay from './pages/Replay';
import Clans from './pages/Clans';

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
        <Route path="/replay/:combatId" element={<Replay />} />
        <Route path="/clans" element={<Clans />} />
      </Routes>
    </BrowserRouter>
  );
}
