import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Favorites({ user, toast }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchFavorites(); }, [user]);

  async function fetchFavorites() {
    setLoading(true);
    const { data } = await supabase
      .from('ulubione')
      .select('id_filmu, filmy ( id, tytul, plakat_url, rok_produkcji, opis )')
      .eq('id_uzytkownika', user.id)
      .order('id', { ascending: false });
    setFavorites(data || []);
    setLoading(false);
  }

  async function removeFavorite(movieId) {
    await supabase.from('ulubione').delete().eq('id_uzytkownika', user.id).eq('id_filmu', movieId);
    setFavorites(prev => prev.filter(f => f.id_filmu !== movieId));
    toast?.('Usunięto z ulubionych', 'info');
  }

  if (!user) return (
    <div className="max-w-[800px] mx-auto px-10 py-32 text-center flex flex-col items-center">
      <div className="w-20 h-20 bg-[#e50914]/10 rounded-full flex items-center justify-center mb-6 border border-[#e50914]/20">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </div>
      <h2 className="text-3xl font-black mb-4">Musisz być zalogowany</h2>
      <p className="text-white/40 text-lg">Zaloguj się, żeby zobaczyć swoje ulubione filmy.</p>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto px-10 py-14">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-1 h-8 bg-[#e50914] rounded-full"/>
        <h2 className="text-2xl font-black uppercase tracking-wide">Moje Ulubione</h2>
        {!loading && <span className="text-white/20 text-sm font-normal">{favorites.length} {favorites.length === 1 ? 'film' : favorites.length < 5 ? 'filmy' : 'filmów'}</span>}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-white/3 rounded-xl aspect-[2/3] animate-pulse"/>)}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-24 flex flex-col items-center">
          <div className="w-20 h-20 bg-white/3 rounded-full flex items-center justify-center mb-6 border border-white/8">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <div className="text-white/40 text-lg font-medium mb-2">Brak ulubionych filmów</div>
          <div className="text-white/20 text-sm mb-8">Kliknij serduszko na karcie filmu żeby dodać go do ulubionych</div>
          <Link to="/" className="bg-[#e50914] hover:bg-[#f01020] text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors no-underline">
            Przeglądaj filmy
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
          {favorites.map(fav => {
            const film = fav.filmy;
            if (!film) return null;
            return (
              <div key={fav.id_filmu} className="group relative bg-[#111] rounded-xl overflow-hidden border border-white/5 hover:border-white/15 transition-all duration-300 hover:-translate-y-1">
                <Link to={`/film/${film.id}`} className="block no-underline">
                  <div className="relative w-full aspect-[2/3] overflow-hidden">
                    <img
                      src={film.plakat_url || `https://placehold.co/500x750/111/222?text=${encodeURIComponent(film.tytul)}`}
                      alt={film.tytul}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { e.target.src = `https://placehold.co/500x750/111/222?text=${encodeURIComponent(film.tytul)}`; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent"/>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-sm font-bold leading-tight text-white">{film.tytul}</h3>
                      {film.rok_produkcji && <div className="text-white/40 text-xs mt-0.5">{film.rok_produkcji}</div>}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => removeFavorite(fav.id_filmu)}
                  className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-[#e50914] flex items-center justify-center text-white shadow-lg shadow-red-900/40 hover:bg-[#cc0812] transition-colors border-none cursor-pointer z-10"
                  title="Usuń z ulubionych"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
