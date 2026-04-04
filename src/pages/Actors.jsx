import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Actors() {
  const [actors, setActors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActors() {
      const { data } = await supabase
        .from('aktorzy')
        .select('id, imie_nazwisko, zdjecie_url')
        .order('imie_nazwisko');
      setActors(data || []);
      setLoading(false);
    }
    fetchActors();
  }, []);

  const filtered = actors.filter(a =>
    a.imie_nazwisko.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-[1600px] mx-auto px-10 py-14">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-1 h-8 bg-[#e50914] rounded-full"/>
          <h2 className="text-2xl font-black uppercase tracking-wide">Gwiazdy Kina</h2>
        </div>
        {/* WYSZUKIWARKA */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Szukaj aktora..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white/5 border border-white/8 text-white placeholder-white/25 pl-9 pr-4 py-2 rounded-xl text-sm outline-none focus:border-white/25 transition-colors w-52" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-8">
          {[...Array(14)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className="w-28 h-28 rounded-full bg-white/3 animate-pulse"/>
              <div className="w-20 h-3 bg-white/3 rounded animate-pulse"/>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-white/20">
          <div className="text-4xl mb-3">🎭</div>
          <div className="text-sm">{search ? `Brak wyników dla "${search}"` : 'Brak aktorów w bazie'}</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-8">
          {filtered.map(actor => (
            <Link
              key={actor.id}
              to={`/aktor/${actor.id}`}
              className="text-center group flex flex-col items-center no-underline"
            >
              <div className="relative mb-4">
                <div className="absolute inset-0 rounded-full bg-[#e50914]/0 group-hover:bg-[#e50914]/15 transition-all duration-300 scale-110"/>
                <img
                  src={actor.zdjecie_url || 'https://placehold.co/200x200/111/222?text=?'}
                  alt={actor.imie_nazwisko}
                  className="w-28 h-28 rounded-full object-cover border-2 border-white/8 group-hover:border-[#e50914]/60 transition-all duration-300 relative z-10"
                  onError={e => { e.target.src = 'https://placehold.co/200x200/111/222?text=?'; }}
                />
              </div>
              <h4 className="font-bold text-sm text-white/80 group-hover:text-white transition-colors leading-tight">
                {actor.imie_nazwisko}
              </h4>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
