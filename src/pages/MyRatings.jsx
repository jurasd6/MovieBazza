export default function MyRatings({ user }) {
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
        <h2 className="text-2xl font-black uppercase tracking-wide">Moje Oceny</h2>
      </div>
      <div className="text-white/40 bg-white/5 border border-white/10 rounded-xl p-10 text-center">
        Tutaj w przyszłości pojawią się Twoje ocenione filmy!
      </div>
    </div>
  );
}