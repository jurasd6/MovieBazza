import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Genres() {
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    async function fetchGenres() {
      const { data } = await supabase.from('gatunki').select('id, nazwa').order('nazwa');
      setGenres(data || []);
    }
    fetchGenres();
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto px-10 py-14">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-1 h-8 bg-[#e50914] rounded-full"/>
        <h2 className="text-2xl font-black uppercase tracking-wide">Przeglądaj Gatunki</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {genres.map(g => (
          <div key={g.id} className="bg-white/5 hover:bg-white/10 border border-white/8 hover:border-[#e50914]/50 rounded-xl p-6 text-center cursor-pointer transition-all hover:-translate-y-1">
            <span className="font-bold text-lg text-white/90">{g.nazwa}</span>
          </div>
        ))}
      </div>
    </div>
  );
}