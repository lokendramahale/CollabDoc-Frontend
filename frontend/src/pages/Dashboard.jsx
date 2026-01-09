import React, { useState, useEffect } from "react";
import { Plus, Trash2, Eye, Lock } from "lucide-react";
import Navbar from "../components/Navbar";
import { documentService } from "../services/api";

export default function Dashboard({ currentUser, onLogout, onOpenDocument }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewDocForm, setShowNewDocForm] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocIsPublic, setNewDocIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [notification, setNotification] = useState("");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentService.getAllDocuments();
      // Handle both response.documents and response.data.documents
      const docs = Array.isArray(response.documents)
        ? response.documents
        : Array.isArray(response.data?.documents)
        ? response.data.documents
        : [];
      setDocuments(docs);
    } catch (err) {
      showNotification("Failed to load documents", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async (e) => {
    e.preventDefault();

    if (!newDocTitle.trim()) {
      showNotification("Please enter a document title", "error");
      return;
    }

    setCreating(true);
    try {
      const response = await documentService.createDocument(
        newDocTitle,
        newDocIsPublic
      );
      setDocuments([...documents, response.document]);
      setNewDocTitle("");
      setNewDocIsPublic(false);
      setShowNewDocForm(false);
      showNotification("Document created successfully");
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?"))
      return;

    try {
      await documentService.deleteDocument(docId);
      setDocuments(documents.filter((d) => d._id !== docId));
      showNotification("Document deleted");
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  const showNotification = (message, type = "success") => {
    setNotification(message);
    setTimeout(() => setNotification(""), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        currentUser={currentUser}
        onLogout={onLogout}
        showMenu={showMenu}
        onToggleMenu={() => setShowMenu(!showMenu)}
      />

      {notification && (
        <div
          className={`mx-4 mt-4 p-3 rounded-lg text-sm ${
            notification.includes("error")
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {notification}
        </div>
      )}

      <main className="flex-1 max-w-6xl mx-auto w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">My Documents</h2>
            <p className="text-gray-600 mt-1">
              Manage your collaborative documents
            </p>
          </div>

          <button
            onClick={() => setShowNewDocForm(!showNewDocForm)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-medium"
          >
            <Plus size={20} />
            New Document
          </button>
        </div>

        {/* New Document Form */}
        {showNewDocForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-indigo-600">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Create New Document
            </h3>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Title
                </label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Enter document title..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  disabled={creating}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={newDocIsPublic}
                  onChange={(e) => setNewDocIsPublic(e.target.checked)}
                  className="rounded"
                  disabled={creating}
                />
                Make this document public
              </label>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowNewDocForm(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition font-medium"
                >
                  {creating ? "Creating..." : "Create Document"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Documents List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 mb-4">No documents yet</p>
            <button
              onClick={() => setShowNewDocForm(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
            >
              Create your first document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div
                key={doc._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition border border-gray-200 overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition truncate">
                      {doc.title}
                    </h3>
                    {doc.isPublic && (
                      <Eye size={16} className="text-green-600 flex-shrink-0" />
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    by {doc.owner.name}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <span className="px-2 py-1 bg-gray-100 rounded">
                      {doc.collaborators.length + 1} collaborators
                    </span>
                    {!doc.isPublic && (
                      <span className="flex items-center gap-1">
                        <Lock size={12} /> Private
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 mb-6">
                    Modified: {new Date(doc.updatedAt).toLocaleDateString()}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onOpenDocument(doc._id)}
                      className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-medium text-sm"
                    >
                      Edit
                    </button>

                    {doc.owner._id === currentUser._id && (
                      <button
                        onClick={() => handleDeleteDocument(doc._id)}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition"
                        title="Delete document"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
