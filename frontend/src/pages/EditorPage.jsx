import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Editor from "../components/Editor";
import Navbar from "../components/Navbar";
import API from "../services/api";
import socket from "../services/socket";

export default function EditorPage() {
  const { id } = useParams();
  const [title, setTitle] = useState("Loading...");

  // Fetch document title
  useEffect(() => {
    API.get(`/documents/${id}`).then(res => {
      setTitle(res.data.title || "Untitled Document");
    });
  }, [id]);

  // Leave socket room on exit
  useEffect(() => {
    return () => {
      socket.emit("leave-document", id);
    };
  }, [id]);

  // Save version
  const saveVersion = async () => {
    await API.post(`/documents/${id}/versions`);
    alert("Version saved successfully!");
  };

  return (
    <>
      <Navbar />

      <div className="flex justify-between items-center px-10 py-4 border-b">
        <h1 className="text-xl font-bold">{title}</h1>

        <button
          onClick={saveVersion}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Save Version
        </button>
      </div>

      <Editor documentId={id} />
    </>
  );
}
