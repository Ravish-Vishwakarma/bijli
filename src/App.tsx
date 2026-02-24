import "./App.css";
import { Button } from "./components/ui/button";
import { Folder, FolderPlus } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { Input } from "./components/ui/input";

function App() {

  const handelClick = async () => {
    try {
      const result = await invoke("scan_memes", {
        folderPath: "E:\\louisedrive\\Social Assets\\Memes + Sound Effects\\Indian Humour",
      });

      console.log(result);
      // setMemes(result as string[]);
    } catch (error) {
      console.error("Error scanning memes:", error);
    }
  };

  return (
    <main className="container">
      <div>

        <div className="flex justify-center">
          <Input id="input-demo-api-key" type="password" placeholder="meme name.." />

          <Button variant={"outline"} size={"icon"} aria-label="Add Meme Folder">
            <FolderPlus></FolderPlus>
          </Button>
          <Button variant={"outline"} size={"icon"} aria-label="Open Meme Folder">
            <Folder></Folder>
          </Button>
        </div>
      </div>
    </main>
  );
}

export default App;
