import "./App.css";
import { Button } from "./components/ui/button";
import { FolderPlus, RefreshCcw } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { Input } from "./components/ui/input";
import Fuse from "fuse.js";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { useEffect, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useMemo } from "react";
function App() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [memes, setMemes] = useState<
    { path: string; name: string }[]
  >([]);
  const [search, setSearch] = useState("");

  const handleRefresh = async () => {
    const savedFolder = localStorage.getItem("memeFolder");

    if (!savedFolder) return;

    const result = await invoke<string[]>("scan_memes", {
      folderPath: savedFolder,
    });

    const formatted = result.map((path) => ({
      path,
      name: path.split("\\").pop() || "",
    }));

    setMemes(formatted);
  };


  const fuse = useMemo(() => {
    return new Fuse(memes, {
      keys: ["name"],
      threshold: 0.4,
    });
  }, [memes]);

  const filteredMemes = search
    ? fuse.search(search).map((r) => r.item)
    : memes;

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    const savedFolder = localStorage.getItem("memeFolder");

    if (savedFolder) {
      invoke<string[]>("scan_memes", {
        folderPath: savedFolder,
      }).then((result) => {
        const formatted = result.map((path) => ({
          path,
          name: path.split("\\").pop() || "",
        }));

        setMemes(formatted);
      });
    }
  }, []);

  const gridRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(3);
  useEffect(() => {
    const updateColumns = () => {
      if (!gridRef.current) return;

      const gridWidth = gridRef.current.offsetWidth;
      const itemWidth = 180; // same as min width
      const gap = 16; // gap-4 = 1rem = 16px

      const calculated = Math.floor(gridWidth / (itemWidth + gap));
      setColumns(calculated > 0 ? calculated : 1);
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);
  const copyMeme = async (meme: { path: string }, index: number) => {
    try {
      await invoke("copy_image", { path: meme.path });

      setCopiedIndex(index);

      setTimeout(() => {
        setCopiedIndex(null);
      }, 180);

      setSearch("");
      setSelectedIndex(0);
      inputRef.current?.focus();
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  return (
    <main className="flex items-start justify-center pt-20">
      <div className="w-[650px] backdrop-blur-xl bg-white/10 rounded-2xl p-6">
        <div className="flex flex-row justify-evenly p-10">
          <Input value={search} ref={inputRef} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} onChange={(e) => setSearch(e.target.value)} onKeyDown={async (e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              setSelectedIndex((prev) =>
                prev < filteredMemes.length - 1 ? prev + 1 : prev
              );
            }

            if (e.key === "ArrowLeft") {
              e.preventDefault();
              setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
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
              const selected = filteredMemes[selectedIndex];
              if (selected) {
                await copyMeme(selected, selectedIndex);
              }
            }
          }} id="input-demo-api-key" placeholder="meme name.." />

          <Button
            variant="outline"
            size="icon"
            aria-label="Add Meme Folder"
            onClick={async () => {
              const selected = await openDialog({
                directory: true,
                multiple: false,
              });

              if (selected && typeof selected === "string") {
                localStorage.setItem("memeFolder", selected);

                const result = await invoke<string[]>("scan_memes", {
                  folderPath: selected,
                });

                const formatted = result.map((path) => ({
                  path,
                  name: path.split("\\").pop() || "",
                }));

                setMemes(formatted);
              }
            }}
          >
            <FolderPlus />
          </Button>



          <Button onClick={handleRefresh} variant={"outline"} size={"icon"} aria-label="Open Meme Folder">
            <RefreshCcw ></RefreshCcw >
          </Button>

        </div>

        {search && (<div
          ref={gridRef}
          className="mt-6 max-h-[350px] overflow-y-auto grid gap-4 p-2 [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]"
        >
          {filteredMemes.map((meme, index) => (
            <div
              key={index}
              onClick={async () => {
                setSelectedIndex(index);
                await copyMeme(meme, index);
              }}
              className={`border rounded-xl p-2 cursor-pointer transition duration-150 ${copiedIndex === index
                ? "bg-green-400 scale-105"
                : index === selectedIndex
                  ? "bg-green-200"
                  : "hover:bg-gray-100"
                }`}
            >
              <img
                src={`${convertFileSrc(meme.path)}`}
                alt="meme"
                className="w-full h-40 object-cover rounded-lg"
              />
              <p className="text-sm mt-2 truncate">
                {meme.name}
              </p>
            </div>
          ))}
        </div>)}
      </div>
    </main>
  );
}

export default App;
