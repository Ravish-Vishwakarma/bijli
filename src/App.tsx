import "./App.css";
import { Button } from "./components/ui/button";
import { Folder, FolderPlus, RefreshCcw } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { Input } from "./components/ui/input";
import Fuse from "fuse.js";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useMemo } from "react";
function App() {
  const [memes, setMemes] = useState<
    { path: string; name: string }[]
  >([]);
  const [search, setSearch] = useState("");

  const handelClick = async () => {
    try {
      const result = await invoke<string[]>("scan_memes", {
        folderPath: "E:\\louisedrive\\Social Assets\\Memes + Sound Effects\\Indian Humour",
      });

      const formatted = result.map((path) => ({
        path,
        name: path.split("\\").pop() || "",
      }));

      setMemes(formatted);
    } catch (error) {
      console.error("Error scanning memes:", error);
    }
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
  return (
    <main className="container">
      <div>

        <div className="flex flex-row justify-evenly p-10">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} id="input-demo-api-key" placeholder="meme name.." />

          <Button variant={"outline"} size={"icon"} aria-label="Add Meme Folder">
            <FolderPlus></FolderPlus>
          </Button>
          <Button onClick={handelcheck} variant={"outline"} size={"icon"} aria-label="Open Meme Folder">
            <Folder></Folder>
          </Button>
          <Button onClick={handelClick} variant={"outline"} size={"icon"} aria-label="Open Meme Folder">
            <RefreshCcw ></RefreshCcw >
          </Button>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4 p-6">
          {filteredMemes.map((meme, index) => (
            <div key={index} className="border rounded-xl p-2">
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
