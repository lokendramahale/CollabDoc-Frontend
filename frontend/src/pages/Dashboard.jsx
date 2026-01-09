import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const [docs, setDocs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/documents")
      .then((res) => {
        // handle both array and object response
        const data = Array.isArray(res.data) ? res.data : res.data.documents;
        setDocs(data || []);
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to load documents");
      });
  }, []);

  const createDoc = async () => {
  try {
    const res = await API.post("/documents");

    console.log("Create doc response:", res.data);

    const docId = res.data._id || res.data.document?._id;

    if (!docId) {
      throw new Error("Invalid document response");
    }

    navigate(`/doc/${docId}`);
  } catch (err) {
    console.error("Create document error:", err);
    alert("Failed to create document");
  }
};


  return (
    <>
      <Navbar />
      <div className="p-10">
        <button className="btn mb-6" onClick={createDoc}>
          + New Document
        </button>

        {docs.length === 0 ? (
          <p>No documents yet</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {docs.map((doc) => (
              <div
                key={doc._id}
                className="border p-4 rounded cursor-pointer hover:bg-gray-100"
                onClick={() => navigate(`/doc/${doc._id}`)}
              >
                {doc.title || "Untitled Document"}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
