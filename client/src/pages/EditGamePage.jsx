import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getGame, updateGame } from '../api/client';
import GameForm from '../components/GameForm';

export default function EditGamePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getGame(id).then(setGame).catch((err) => setError(err.message));
  }, [id]);

  const handleSubmit = async (data) => {
    try {
      await updateGame(id, data);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  if (error) return <div style={{ color: '#dc2626' }}>{error}</div>;
  if (!game) return <div>Loading…</div>;

  return (
    <div>
      <h1>Edit: {game.title}</h1>
      <GameForm initial={game} onSubmit={handleSubmit} submitLabel="Save Changes" />
    </div>
  );
}
