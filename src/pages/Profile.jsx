import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Profile({ user, toast }) {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ recenzje: 0, ulubione: 0, komentarze: 0 });
  const [recentReviews, setRecentReviews] = useState([]);
  const [recentFavorites, setRecentFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [loginInput, setLoginInput] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (user) { fetchProfile(); fetchStats(); fetchRecentActivity(); }
  }, [user]);

  async function fetchProfile() {
    const { data } = await supabase.from('uzytkownicy').select('login, avatar_url, bio, rola').eq('id', user.id).single();
    setProfile(data);
    setBioInput(data?.bio || '');
    setLoginInput(data?.login || '');
    setLoading(false);
  }

  async function fetchStats() {
    const [{ count: recenzje }, { count: ulubione }, { count: komentarze }] = await Promise.all([
      supabase.from('recenzje').select('*', { count: 'exact', head: true }).eq('id_uzytkownika', user.id),
      supabase.from('ulubione').select('*', { count: 'exact', head: true }).eq('id_uzytkownika', user.id),
      supabase.from('komentarze').select('*', { count: 'exact', head: true }).eq('id_uzytkownika', user.id),
    ]);
    setStats({ recenzje: recenzje || 0, ulubione: ulubione || 0, komentarze: komentarze || 0 });
  }

  async function fetchRecentActivity() {
    const [{ data: reviews }, { data: favs }] = await Promise.all([
      supabase.from('recenzje').select('id, ocena, tresc, data_dodania, filmy ( id, tytul, plakat_url )').eq('id_uzytkownika', user.id).order('data_dodania', { ascending: false }).limit(4),
      supabase.from('ulubione').select('id_filmu, filmy ( id, tytul, plakat_url )').eq('id_uzytkownika', user.id).order('id', { ascending: false }).limit(6),
    ]);
    setRecentReviews(reviews || []);
    setRecentFavorites(favs || []);
  }

  async function handleSaveProfile() {
    if (!loginInput.trim()) return;
    setSaveLoading(true);
    const { error } = await supabase.from('uzytkownicy').update({ login: loginInput, bio: bioInput }).eq('id', user.id);
    if (!error) { fetchProfile(); setEditing(false); toast?.('Profil zaktualizowany!', 'success'); }
    else toast?.(error.message, 'error');
    setSaveLoading(false);
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast?.('Plik musi być mniejszy niż 2MB', 'error'); return; }

    setAvatarLoading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (uploadError) { toast?.(uploadError.message, 'error'); setAvatarLoading(false); return; }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatar_url = urlData.publicUrl + '?t=' + Date.now();

    await supabase.from('uzytkownicy').update({ avatar_url }).eq('id', user.id);
    fetchProfile();
    toast?.('Avatar zaktualizowany!', 'success');
    setAvatarLoading(false);
  }

  const getInitials = () => {
    if (profile?.login) return profile.login.slice(0, 2).toUpperCase();
    if (user?.email) return user.email.slice(0, 2).toUpperCase();
    return '?';
  };

  const ratingColor = (r) => r >= 8 ? 'text-emerald-400' : r >= 6 ? 'text-yellow-400' : 'text-orange-400';

  if (!user) return (
    <div className="max-w-[800px] mx-auto px-10 py-32 text-center flex flex-col items-center">
      <div className="w-20 h-20 bg-white/3 rounded-full flex items-center justify-center mb-6 border border-white/8">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      </div>
      <h2 className="text-3xl font-black mb-4">Musisz być zalogowany</h2>
      <p className="text-white/40 text-lg">Zaloguj się, żeby zobaczyć swój profil.</p>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-[#e50914]/30 border-t-[#e50914] rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="max-w-[1100px] mx-auto px-6 md:px-10 py-14">

      {/* ── HEADER PROFILU ── */}
      <div className="flex flex-col sm:flex-row gap-8 items-start mb-12">

        {/* AVATAR */}
        <div className="relative shrink-0">
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-white/10 bg-[#111]">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover"/>
            ) : (
              <div className="w-full h-full bg-[#e50914] flex items-center justify-center text-3xl font-black">
                {getInitials()}
              </div>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={avatarLoading}
            className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#0f0f0f] border border-white/15 flex items-center justify-center hover:border-white/30 transition-all cursor-pointer disabled:opacity-50"
            title="Zmień avatar"
          >
            {avatarLoading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"/>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload}/>
        </div>

        {/* INFO */}
        <div className="flex-1">
          {editing ? (
            <div className="flex flex-col gap-3 max-w-md">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Login</label>
                <input type="text" value={loginInput} onChange={e => setLoginInput(e.target.value)}
                  className="bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm outline-none focus:border-[#e50914]/50 w-full transition-colors"/>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Bio</label>
                <textarea value={bioInput} onChange={e => setBioInput(e.target.value)}
                  placeholder="Napisz coś o sobie..."
                  className="bg-white/5 border border-white/10 text-white placeholder-white/20 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-[#e50914]/50 w-full resize-none h-24 transition-colors"/>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveProfile} disabled={saveLoading}
                  className="bg-[#e50914] hover:bg-[#f01020] disabled:opacity-40 text-white text-sm font-bold px-5 py-2 rounded-xl border-none cursor-pointer transition-colors">
                  {saveLoading ? 'Zapisywanie...' : 'Zapisz'}
                </button>
                <button onClick={() => setEditing(false)}
                  className="bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-sm px-5 py-2 rounded-xl border-none cursor-pointer transition-colors">
                  Anuluj
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-black">{profile?.login || 'Użytkownik'}</h1>
                {profile?.rola === 'admin' && (
                  <span className="text-xs font-bold text-[#e50914] bg-[#e50914]/10 border border-[#e50914]/20 px-2.5 py-1 rounded-full uppercase tracking-wider">Admin</span>
                )}
              </div>
              <div className="text-white/30 text-sm mb-4">{user.email}</div>
              {profile?.bio ? (
                <p className="text-white/60 text-sm leading-relaxed max-w-lg mb-4">{profile.bio}</p>
              ) : (
                <p className="text-white/20 text-sm italic mb-4">Brak opisu profilu.</p>
              )}
              <button onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/20 text-white/60 hover:text-white text-sm px-4 py-2 rounded-xl border-none cursor-pointer transition-all">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edytuj profil
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── STATYSTYKI ── */}
      <div className="grid grid-cols-3 gap-4 mb-12">
        {[
          { count: stats.recenzje, label: 'Recenzji', icon: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></> },
{ count: stats.ulubione, label: 'Ulubionych', icon: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/> },
{ count: stats.komentarze, label: 'Komentarzy', icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/> },
        ].map(s => (
          <div key={s.label} className="bg-white/3 border border-white/5 rounded-2xl p-5 text-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#e50914] mx-auto mb-3">{s.icon}</svg>
            <div className="text-3xl font-black text-white mb-1">{s.count}</div>
            <div className="text-white/30 text-xs uppercase tracking-widest">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent mb-12"/>

      {/* ── OSTATNIE RECENZJE ── */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-1 h-7 bg-[#e50914] rounded-full"/>
            <h2 className="text-xl font-black uppercase tracking-wide">Ostatnie Recenzje</h2>
          </div>
          <Link to="/oceny" className="text-white/30 hover:text-white text-xs transition-colors no-underline">
            Zobacz wszystkie →
          </Link>
        </div>

        {recentReviews.length === 0 ? (
          <div className="bg-white/3 border border-white/5 rounded-2xl p-8 text-center text-white/20 text-sm">
            Nie napisałeś jeszcze żadnej recenzji.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentReviews.map(review => (
              <Link key={review.id} to={`/film/${review.filmy?.id}`}
                className="flex gap-4 bg-white/3 border border-white/5 hover:border-white/12 rounded-xl p-4 transition-all no-underline group">
                <img
                  src={review.filmy?.plakat_url || 'https://placehold.co/100x150/111/222?text=?'}
                  alt={review.filmy?.tytul}
                  className="w-12 h-16 rounded-lg object-cover shrink-0 group-hover:scale-105 transition-transform"
                  onError={e => { e.target.src = 'https://placehold.co/100x150/111/222?text=?'; }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-white/90 truncate">{review.filmy?.tytul}</span>
                    <span className={`text-xs font-black shrink-0 ${ratingColor(review.ocena)}`}>★ {review.ocena}/10</span>
                  </div>
                  <p className="text-white/40 text-xs leading-relaxed line-clamp-2">{review.tresc}</p>
                  <div className="text-white/20 text-xs mt-2">{new Date(review.data_dodania).toLocaleDateString('pl-PL')}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── OSTATNIO DODANE DO ULUBIONYCH ── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-1 h-7 bg-[#e50914] rounded-full"/>
            <h2 className="text-xl font-black uppercase tracking-wide">Ostatnio Ulubione</h2>
          </div>
          <Link to="/ulubione" className="text-white/30 hover:text-white text-xs transition-colors no-underline">
            Zobacz wszystkie →
          </Link>
        </div>

        {recentFavorites.length === 0 ? (
          <div className="bg-white/3 border border-white/5 rounded-2xl p-8 text-center text-white/20 text-sm">
            Nie masz jeszcze żadnych ulubionych filmów.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {recentFavorites.map(fav => (
              <Link key={fav.id_filmu} to={`/film/${fav.filmy?.id}`}
                className="group no-underline block">
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/5 group-hover:border-white/20 transition-all">
                  <img
                    src={fav.filmy?.plakat_url || `https://placehold.co/200x300/111/222?text=?`}
                    alt={fav.filmy?.tytul}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => { e.target.src = 'https://placehold.co/200x300/111/222?text=?'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"/>
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <div className="text-xs font-bold text-white leading-tight line-clamp-2">{fav.filmy?.tytul}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
