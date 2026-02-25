import "./App.css";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useEffect, useRef, useState, useMemo } from "react";
import Fuse from "fuse.js";
import { RefreshCw, FolderPlus } from "lucide-react";

function App() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [memes, setMemes] = useState<{ path: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(4);

  const fuse = useMemo(
    () => new Fuse(memes, { keys: ["name"], threshold: 0.4 }),
    [memes]
  );

  const filteredMemes = search
    ? fuse.search(search).map((r) => r.item)
    : memes;

  useEffect(() => { setSelectedIndex(0); }, [search]);

  useEffect(() => {
    const savedFolder = localStorage.getItem("memeFolder");
    if (savedFolder) {
      invoke<string[]>("scan_memes", { folderPath: savedFolder }).then((result) => {
        setMemes(result.map((path) => ({ path, name: path.split("\\").pop() || "" })));
      });
    }
  }, []);

  useEffect(() => {
    const updateColumns = () => {
      if (!gridRef.current) return;
      const calculated = Math.floor(gridRef.current.offsetWidth / (160 + 10));
      setColumns(calculated > 0 ? calculated : 1);
    };
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  const handleRefresh = async () => {
    const savedFolder = localStorage.getItem("memeFolder");
    if (!savedFolder) return;
    const result = await invoke<string[]>("scan_memes", { folderPath: savedFolder });
    setMemes(result.map((path) => ({ path, name: path.split("\\").pop() || "" })));
  };

  const handleCopy = async (path: string) => {
    await invoke("copy_image", { path });
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background-color: rgba(0, 0, 0, 0.45);
          font-family: 'Space Mono', monospace;
           overflow: hidden;
        }

        :root {
          --accent: #e8ff47;
          --glass: rgba(255,255,255,0.04);
          --glass-border: rgba(255,255,255,0.08);
          --muted: rgba(255,255,255,0.35);
          --text: rgba(255,255,255,0.9);
        }

        .app {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .container {
          width: 100%;
          max-width: 720px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .header {
          display: flex;
          align-items: baseline;
          gap: 10px;
          padding: 0 2px;
        }

        .title {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: var(--accent);
          letter-spacing: -0.5px;
        }

        .subtitle {
          font-size: 10px;
          color: var(--muted);
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .search-row {
          display: flex;
          gap: 8px;
          align-items: stretch;
        }

        .search-wrap {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-wrap svg {
          position: absolute;
          left: 14px;
          color: var(--muted);
          width: 14px;
          height: 14px;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          background: var(--glass);
          border: 1px solid var(--glass-border);
          border-radius: 10px;
          padding: 11px 14px 11px 40px;
          color: var(--text);
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          outline: none;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
          backdrop-filter: blur(12px);
        }

        .search-input::placeholder { color: var(--muted); }

        .search-input:focus {
          border-color: rgba(232,255,71,0.6);
          background: rgba(232,255,71,0.04);
          box-shadow: 0 0 0 3px rgba(232,255,71,0.07);
        }

        .icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          min-width: 42px;
          background: var(--glass);
          border: 1px solid var(--glass-border);
          border-radius: 10px;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.15s;
          backdrop-filter: blur(12px);
        }

        .icon-btn:hover {
          border-color: rgba(255,255,255,0.2);
          color: var(--text);
          background: rgba(255,255,255,0.07);
        }

        .icon-btn:active { transform: scale(0.95); }
        .icon-btn svg { width: 16px; height: 16px; }

        .status-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2px;
        }

        .status-count {
          font-size: 10px;
          color: var(--muted);
          letter-spacing: 1px;
        }

        .hints {
          display: flex;
          gap: 8px;
          align-items: center;
          font-size: 10px;
          color: var(--muted);
        }

        .kbd {
          display: inline-block;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px;
          padding: 1px 5px;
          font-size: 9px;
          color: rgba(255,255,255,0.45);
          font-family: 'Space Mono', monospace;
          margin-right: 3px;
        }

        .grid-wrap {
          background: var(--glass);
          border: 1px solid var(--glass-border);
          border-radius: 14px;
          padding: 10px;
          backdrop-filter: blur(16px);
          max-height: 480px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .grid-wrap::-webkit-scrollbar { width: 4px; }
        .grid-wrap::-webkit-scrollbar-track { background: transparent; }
        .grid-wrap::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .grid-wrap::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

        .meme-grid {
          display: grid;
          gap: 6px;
        }

        .meme-item {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          border: 1.5px solid transparent;
          transition: border-color 0.12s, transform 0.12s, box-shadow 0.12s;
          background: rgba(255,255,255,0.04);
          aspect-ratio: 1;
        }

        .meme-item:hover {
          border-color: rgba(255,255,255,0.18);
          transform: scale(1.03);
        }

        .meme-item.selected {
          border-color: rgba(232,255,71,0.65);
          box-shadow: 0 0 0 2px rgba(232,255,71,0.15), 0 4px 20px rgba(232,255,71,0.1);
          transform: scale(1.03);
        }

        .meme-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .meme-label {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          padding: 20px 6px 5px;
          font-size: 8px;
          color: rgba(255,255,255,0.85);
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%);
          opacity: 0;
          transition: opacity 0.15s;
        }

        .meme-item:hover .meme-label,
        .meme-item.selected .meme-label { opacity: 1; }

        .check-badge {
          position: absolute;
          top: 5px; right: 5px;
          width: 16px; height: 16px;
          background: var(--accent);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.12s;
        }

        .meme-item.selected .check-badge { opacity: 1; }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 56px 24px;
          gap: 10px;
          color: var(--muted);
          grid-column: 1/-1;
        }

        .empty-icon { font-size: 32px; opacity: 0.4; }
        .empty-text { font-size: 11px; letter-spacing: 1px; text-transform: uppercase; }

        .toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%) translateY(20px);
          background: var(--accent);
          color: #000;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          padding: 8px 20px;
          border-radius: 100px;
          letter-spacing: 1px;
          text-transform: uppercase;
          opacity: 0;
          transition: opacity 0.2s, transform 0.2s;
          pointer-events: none;
          z-index: 999;
        }

        .toast.show {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      `}</style>

      <div className="app">
        <div className="container">
          {/* Header */}
          <div className="header">
            <span className="title">BIJLI</span>
            <span className="subtitle">/ pick &amp; copy</span>
          </div>

          {/* Search Row */}
          <div className="search-row">
            <div className="search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "ArrowRight") {
                    e.preventDefault();
                    setSelectedIndex((prev) => prev < filteredMemes.length - 1 ? prev + 1 : prev);
                  }
                  if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    setSelectedIndex((prev) => prev > 0 ? prev - 1 : prev);
                  }
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelectedIndex((prev) => {
                      const next = prev + columns;
                      return next < filteredMemes.length ? next : prev;
                    });
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelectedIndex((prev) => {
                      const next = prev - columns;
                      return next >= 0 ? next : prev;
                    });
                  }
                  if (e.key === "Enter") {
                    const sel = filteredMemes[selectedIndex];
                    if (sel) await handleCopy(sel.path);
                  }
                }}
                placeholder="meme name.."
                autoFocus
              />
            </div>

            <button
              className="icon-btn"
              title="Pick folder"
              onClick={async () => {
                const selected = await open({ directory: true, multiple: false });
                if (selected && typeof selected === "string") {
                  localStorage.setItem("memeFolder", selected);
                  const result = await invoke<string[]>("scan_memes", { folderPath: selected });
                  setMemes(result.map((path) => ({ path, name: path.split("\\").pop() || "" })));
                }
              }}
            >
              <FolderPlus />
            </button>

            <button className="icon-btn" title="Refresh" onClick={handleRefresh}>
              <RefreshCw />
            </button>
          </div>

          {/* Status */}
          <div className="status-bar">
            <span className="status-count">{filteredMemes.length} meme{filteredMemes.length !== 1 ? "s" : ""}</span>
            <span className="hints">
              <span><span className="kbd">↑↓←→</span>navigate</span>
              <span><span className="kbd">↵</span>copy</span>
            </span>
          </div>

          {/* Grid */}
          <div className="grid-wrap">
            <div
              ref={gridRef}
              className="meme-grid"
              style={{ gridTemplateColumns: `repeat(auto-fill, minmax(150px, 1fr))` }}
            >
              {filteredMemes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🙃</div>
                  <div className="empty-text">no memes found</div>
                </div>
              ) : (
                filteredMemes.map((meme, index) => (
                  <div
                    key={meme.path}
                    className={`meme-item ${index === selectedIndex ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedIndex(index);
                      handleCopy(meme.path);
                    }}
                  >
                    <img src={convertFileSrc(meme.path)} alt={meme.name} />
                    <div className="meme-label">{meme.name}</div>
                    <div className="check-badge">
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="#000">
                        <path d="M10 3L5 8.5 2 5.5l-.7.7 3.7 3.7L10.7 3.7z" />
                      </svg>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={`toast ${copied ? "show" : ""}`}>copied!</div>
    </>
  );
}

export default App;