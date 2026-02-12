import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { videoService } from "../services/api.service";

const TOPIC_FILTERS = [
  "All",
  "Podcasts",
  "Music",
  "News",
  "Gaming",
  "Comedy",
  "Movies",
  "Documentary",
];

const MODE_SELECTION = ["Cinematic", "Creator", "Watch Party"];

const SIDEBAR_ITEMS = [
  { label: "Discover", icon: "DS" },
  { label: "Live Now", icon: "LV" },
  { label: "Originals", icon: "OR" },
  { label: "Watchlist", icon: "WL" },
  { label: "Bounty Hub", icon: "BN" },
  { label: "Settings", icon: "ST" },
];

const WATCH_PARTY_MEMBERS = [
  { name: "Aman", mood: "Reacting" },
  { name: "Noah", mood: "In sync" },
  { name: "Ashutosh", mood: "Chatting" },
  { name: "virat", mood: "Invited" },
];

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeMode, setActiveMode] = useState("Cinematic");

  const resolveOwnerData = (video) => {
    if (!video) return {};
    const owner = video.owner;
    const ownerLooksLikeProfile =
      owner && typeof owner === "object" && (owner.username || owner.fullName || owner.avatar);
    if (ownerLooksLikeProfile) return owner;
    return video.ownerDetails || {};
  };

  const getAvatarSrc = (avatar, name = "User") => {
    if (avatar) return avatar;
    const initials =
      name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("") || "U";
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#1C2128'/><stop offset='100%' stop-color='#101419'/></linearGradient></defs><rect width='100%' height='100%' rx='40' fill='url(#g)'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='30' font-family='Inter, Arial' fill='#00F0FF'>${initials}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await videoService.getAllVideos(page, 18);
        const payload = res?.data?.data;
        const list = Array.isArray(payload) ? payload : payload?.videos;
        setVideos(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Failed to fetch videos:", err);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [page]);

  const filteredVideos = useMemo(() => {
    if (activeFilter === "All") return videos;
    const term = activeFilter.toLowerCase();
    return videos.filter((video) => {
      const title = (video?.title || "").toLowerCase();
      const description = (video?.description || "").toLowerCase();
      return title.includes(term) || description.includes(term);
    });
  }, [videos, activeFilter]);

  const heroVideo = filteredVideos[0];
  const feedVideos = heroVideo ? filteredVideos.slice(1) : filteredVideos;

  const formatViews = (views = 0) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
    return `${views} views`;
  };

  const formatDate = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (hours < 1) return "just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  };

  const formatDuration = (duration = 0) => {
    const mins = Math.floor(duration / 60);
    const secs = String(Math.floor(duration % 60)).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <section className="-mx-4 px-4 py-6 lg:py-8 min-h-[calc(100vh-120px)] text-white bg-[linear-gradient(160deg,#080A0C_0%,#0f141a_45%,#080A0C_100%)] rounded-[30px] relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-20 w-[360px] h-[360px] rounded-full bg-[#39FF14]/15 blur-[90px]" />
      <div className="pointer-events-none absolute top-[18%] right-[-80px] w-[320px] h-[320px] rounded-full bg-[#00F0FF]/18 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[-140px] left-[35%] w-[340px] h-[340px] rounded-full bg-[#00FF94]/12 blur-[100px]" />

      <div className="relative grid grid-cols-1 xl:grid-cols-[250px_minmax(0,1fr)_320px] gap-6">
        <aside className="hidden xl:block">
          <div className="sticky top-24 p-4 rounded-[24px] border border-white/10 bg-white/[0.08] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
            <h2 className="font-sora text-lg font-semibold mb-4">Watchnest</h2>
            <nav className="space-y-2">
              {SIDEBAR_ITEMS.map((item) => (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-white/10 transition"
                >
                  <span className="w-8 h-8 rounded-lg bg-[#1C2128] text-[#00F0FF] text-[11px] font-bold flex items-center justify-center">
                    {item.icon}
                  </span>
                  <span className="text-sm text-white/90">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main>
          <div className="rounded-[24px] p-5 md:p-7 border border-white/10 bg-[#1C2128]/80 backdrop-blur-xl shadow-[0_28px_60px_rgba(0,0,0,0.45)] relative overflow-hidden">
            <div className="absolute -top-16 right-0 w-[240px] h-[240px] rounded-full bg-[#00F0FF]/20 blur-3xl" />
            <div className="absolute -bottom-24 left-[30%] w-[280px] h-[280px] rounded-full bg-[#39FF14]/18 blur-3xl" />

            {heroVideo ? (
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-center">
                <div>
                  <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#00F0FF]">
                    <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
                    Trending Premiere
                  </p>
                  <h1 className="font-sora text-2xl md:text-4xl leading-tight mt-3 max-w-2xl">
                    {heroVideo.title}
                  </h1>
                  <p className="text-white/75 mt-3 line-clamp-2 max-w-2xl">
                    {heroVideo.description || "A cinematic featured experience curated for your stream session."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      to={`/watch/${heroVideo._id}`}
                      className="px-5 py-2.5 rounded-xl bg-[#39FF14] text-black font-semibold hover:brightness-110 transition"
                    >
                      Play Now
                    </Link>
                    <button className="px-5 py-2.5 rounded-xl bg-white/10 text-[#00F0FF] border border-[#00F0FF]/40 hover:bg-white/15 transition">
                      + Add to Watchlist
                    </button>
                  </div>
                </div>
                <Link to={`/watch/${heroVideo._id}`} className="group block">
                  <div className="rounded-[22px] overflow-hidden border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
                    <img
                      src={heroVideo.thumbnail || "/placeholder.png"}
                      alt={heroVideo.title}
                      className="w-full aspect-video object-cover group-hover:scale-105 transition duration-500"
                    />
                  </div>
                </Link>
              </div>
            ) : (
              <p className="text-white/70">No featured video available right now.</p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {MODE_SELECTION.map((mode) => (
              <button
                key={mode}
                onClick={() => setActiveMode(mode)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  activeMode === mode
                    ? "bg-[#00F0FF] text-black"
                    : "bg-white/10 text-white/90 hover:bg-white/15"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="mt-4 mb-6 overflow-x-auto">
            <div className="flex gap-3 min-w-max">
              {TOPIC_FILTERS.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                    activeFilter === filter
                      ? "bg-white text-black"
                      : "bg-[#1C2128] text-white/90 hover:bg-[#252d37]"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center min-h-[320px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39FF14]"></div>
            </div>
          ) : feedVideos.length === 0 ? (
            <div className="text-center py-16 rounded-[24px] bg-white/5 border border-white/10">
              <h3 className="text-xl font-semibold">No videos found</h3>
              <p className="text-white/70 mt-2">Switch your mode or topic filter to explore more.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
                {feedVideos.map((video) => {
                  const owner = resolveOwnerData(video);
                  const ownerDisplay = owner.fullName || owner.username || "Unknown creator";
                  const ownerUsername = owner.username ? `@${owner.username}` : "@unknown";

                  return (
                    <article
                      key={video._id}
                      className="rounded-[24px] border border-white/10 bg-[#1C2128]/92 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.42)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_70px_rgba(0,0,0,0.5)]"
                    >
                      <Link to={`/watch/${video._id}`} className="group block">
                        <div className="rounded-[20px] overflow-hidden bg-black">
                          <img
                            src={video.thumbnail || "/placeholder.png"}
                            alt={video.title}
                            className="w-full aspect-video object-cover group-hover:scale-[1.03] transition duration-300"
                          />
                        </div>
                      </Link>

                      <div className="mt-3 flex gap-3">
                        <img
                          src={getAvatarSrc(owner.avatar, ownerDisplay)}
                          alt={ownerDisplay}
                          className="w-8 h-8 rounded-full object-cover border border-white/20"
                        />
                        <div className="min-w-0">
                          <h3 className="font-semibold leading-tight line-clamp-2">{video.title}</h3>
                          <p className="text-sm text-[#00F0FF] truncate mt-1">{ownerUsername}</p>
                          <p className="text-sm text-white/65 truncate">
                            {formatViews(video.views || 0)} | {formatDate(video.createdAt)} | {formatDuration(video.duration || 0)}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="flex justify-center gap-2 mt-9">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 disabled:opacity-50 transition"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-white/80">Page {page}</span>
                <button
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </main>

        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-[24px] p-4 border border-[#00F0FF]/30 bg-white/[0.07] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between">
                <h3 className="font-sora text-lg">Watch Party</h3>
                <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-[#39FF14] text-black">LIVE</span>
              </div>
              <p className="text-sm text-white/70 mt-1">Invite friends and sync playback in real-time.</p>

              <div className="mt-4 space-y-3">
                {WATCH_PARTY_MEMBERS.map((member) => (
                  <div
                    key={member.name}
                    className="flex items-center justify-between rounded-xl bg-white/10 border border-white/10 px-3 py-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white/10 border border-[#00F0FF]/40 backdrop-blur-xl flex items-center justify-center text-xs text-[#00F0FF]">
                        {member.name.slice(0, 1)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-white/65">{member.mood}</p>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-[#00FF94]" />
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 px-4 py-2 rounded-xl bg-[#00F0FF] text-black font-semibold hover:brightness-110 transition">
                Start Watch Party
              </button>
            </div>

            <div className="rounded-[24px] p-4 border border-[#00FF94]/30 bg-[#1C2128]/90 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
              <p className="text-xs uppercase tracking-[0.18em] text-[#00FF94]">Bounty</p>
              <h4 className="font-sora text-lg mt-1">Earn Rewards</h4>
              <p className="text-sm text-white/70 mt-2">
                Complete 2 watch-party sessions and unlock a Spring Green bounty drop.
              </p>
              <div className="mt-3 w-full h-2 rounded-full bg-black/30 overflow-hidden">
                <div className="h-full w-2/3 bg-[#39FF14]" />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
