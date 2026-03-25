import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function MyRatings({ user }) {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pobieramy oceny za każdym razem, gdy zmieni się/załaduje użytkownik
  useEffect(() => {
    if (user) {
      fetchMyRatings();
    }
  }, [user]);

  async function fetchMyRatings() {
    setLoading(true);
    // Pobieramy recenzje zalogowanego usera wraz z danymi przypisanego do nich filmu
    const { data, error } = await supabase
      .from('recenzje')
      .select(`
        id, 
        ocena, 
        tresc, 
        data_dodania,
        filmy ( id, tytul, plakat_url, rok_produkcji )
      `)
      .eq('id_uzytkownika', user.id)
      .order('data_dodania', { ascending: false });

    if (error) {
      console.error('Błąd pobierania ocen:', error.message);
    }
    setRatings(data || []);
    setLoading(false);
  }

  // Zabezpieczenie dla niezalogowanych (to już mieliśmy)
  if (!user) {
    return (
      <div className="max-w-[800px] mx-auto px-10 py-32 text-center flex flex-col items-center">
        <div className="w-20 h-20 bg-[#e50914]/10 rounded-full flex items-center justify-center mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h2 className="text-3xl font-black mb-4">Odmowa dostępu</h2>
        <p className="text-white/50 text-lg mb-8">Musisz się zalogować lub zarejestrować, aby zobaczyć swoje oceny i recenzje.</p>
        <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-xl text-sm text-white/70">
          Użyj przycisku profilu w prawym górnym rogu ekranu, aby się zalogować.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-10 py-14">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-1 h-8 bg-[#e50914] rounded-full"/>
        <h2 className="text-2xl font-black uppercase tracking-wide">Moje Oceny i Recenzje</h2>
      </div>

      {loading ? (
        <div className="text-center text-white/50 py-20 text-lg">Ładowanie Twoich ocen...</div>
      ) : ratings.length === 0 ? (
        <div className="text-white/40 bg-white/5 border border-white/10 rounded-xl p-10 text-center">
          Jeszcze nie oceniłeś żadnego filmu. Wróć do listy filmów i dodaj swoją pierwszą recenzję!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ratings.map(rating => (
            <div key={rating.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col hover:border-white/20 transition-all">
              
              {/* Górna sekcja: Plakat i tytuł */}
              <div className="flex p-5 gap-5 border-b border-white/5">
                <Link to={`/film/${rating.filmy?.id}`} className="w-20 shrink-0 group">
                  <img 
                    src={rating.filmy?.plakat_url || `https://placehold.co/500x750/111/222?text=${encodeURIComponent(rating.filmy?.tytul || '?')}`} 
                    alt={rating.filmy?.tytul} 
                    className="w-full rounded-lg object-cover aspect-[2/3] group-hover:scale-105 transition-transform"
                    onError={e => { e.target.src = `https://placehold.co/500x750/111/222?text=?`; }}
                  />
                </Link>
                
                <div className="flex-1">
                  <Link to={`/film/${rating.filmy?.id}`} className="font-bold text-lg hover:text-[#e50914] transition-colors line-clamp-2">
                    {rating.filmy?.tytul}
                  </Link>
                  <div className="text-white/40 text-xs mb-3">{rating.filmy?.rok_produkcji}</div>
                  
                  <div className="flex items-center gap-2">
                    <span className="bg-[#e50914]/10 text-[#e50914] font-black border border-[#e50914]/20 px-2.5 py-1 rounded text-sm shadow-sm">
                      {rating.ocena} / 10
                    </span>
                    <span className="text-white/30 text-xs">
                      {new Date(rating.data_dodania).toLocaleDateString('pl-PL')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dolna sekcja: Treść recenzji */}
              <div className="p-5 text-white/70 text-sm italic leading-relaxed flex-1 bg-black/20">
                "{rating.tresc}"
              </div>
              
            </div>
          ))}
        </div>
      )}
    </div>
  );
}