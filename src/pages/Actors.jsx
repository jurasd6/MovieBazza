import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Actors() {
  const [actors, setActors] = useState([]);

  useEffect(() => {
    async function fetchActors() {
      const { data } = await supabase.from('aktorzy').select('id, imie_nazwisko, zdjecie_url');
      setActors(data || []);
    }
    fetchActors();
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto px-10 py-14">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-1 h-8 bg-[#e50914] rounded-full"/>
        <h2 className="text-2xl font-black uppercase tracking-wide">Gwiazdy Kina</h2>
      </div>

      {actors.length === 0 ? (
        <div className="text-center py-12 text-white/20"><div className="text-4xl mb-3">🎭</div><div className="text-sm">Brak aktorów w bazie</div></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-8">
          {actors.map(actor => (
            <div key={actor.id} className="text-center cursor-pointer group flex flex-col items-center">
              <div className="relative mb-4">
                <div className="absolute inset-0 rounded-full bg-[#e50914]/0 group-hover:bg-[#e50914]/15 transition-all duration-300 scale-110"/>
                <img src={actor.zdjecie_url || 'https://placehold.co/200x200/111/222?text=?'} alt={actor.imie_nazwisko} className="w-28 h-28 rounded-full object-cover border-2 border-white/8 group-hover:border-[#e50914]/60 transition-all duration-300 relative z-10" onError={e => { e.target.src = 'https://placehold.co/200x200/111/222?text=?'; }} />
              </div>
              <h4 className="font-bold text-sm text-white/80 group-hover:text-white transition-colors">{actor.imie_nazwisko}</h4>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}