import "./App.css";
import { Button } from "./components/ui/button";
import { Folder, FolderPlus, RefreshCcw } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { Input } from "./components/ui/input";
import Fuse from "fuse.js";
import { open } from "@tauri-apps/plugin-dialog";
import { useEffect, useState } from "react";
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

  const handelcheck = () => {
    console.log(filteredMemes)
  }

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

  const columns = 3;
  return (
    <main className="container">
      <div>

        <div className="flex flex-row justify-evenly p-10">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={async (e) => {
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
                await invoke("copy_image", { path: selected.path });
              }
            }
          }} id="input-demo-api-key" placeholder="meme name.." />

          <Button
            variant="outline"
            size="icon"
            aria-label="Add Meme Folder"
            onClick={async () => {
              const selected = await open({
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
          <Button onClick={handelcheck} variant={"outline"} size={"icon"} aria-label="Open Meme Folder">
            <Folder></Folder>
          </Button>
          <Button onClick={handleRefresh} variant={"outline"} size={"icon"} aria-label="Open Meme Folder">
            <RefreshCcw ></RefreshCcw >
          </Button>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4 p-6">
          {filteredMemes.map((meme, index) => (
            <div key={index} className={`border rounded-xl p-2 ${index === selectedIndex ? "bg-green-200" : ""}`}>
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
        </div>
      </div>
    </main>
  );
}

export default App;
