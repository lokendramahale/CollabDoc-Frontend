import React, { useState, useEffect } from 'react';
import { ArrowLeft, Share2, Users, Loader, X, Check, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Editor from '../components/Editor';
import { documentService } from '../services/api';
import { socketManager } from '../services/socket';

export default function EditorPage({ currentUser, docId, onLogout, onBack }) {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collaborators, setCollaborators] = useState([]);
  const [showAddCollaborator, setShowAddCollaborator] = useState(false);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [notification, setNotification] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [addingCollaborator, setAddingCollaborator] = useState(false);
  
  // Cursor tracking state
  const [cursorPositions, setCursorPositions] = useState({});
  const [userColors, setUserColors] = useState({});

  useEffect(() => {
    fetchDocument();
    
    const token = localStorage.getItem('token');
    if (!socketManager.isConnected) {
      socketManager.connect(token).catch(err => {
        console.error('Socket connection error:', err);
      });
    }
  }, [docId]);

  useEffect(() => {
    if (docId && socketManager.isConnected) {
      socketManager.joinDocument(docId);
      
      // Listen for cursor position updates
      socketManager.on('cursor-update', (data) => {
        if (data.userId !== currentUser._id) {
          setCursorPositions(prev => ({
            ...prev,
            [data.userId]: data.position
          }));
        }
      });

      // Listen for active users
      socketManager.on('active-users', (users) => {
        setActiveUsers(users.filter(u => u._id !== currentUser._id));
        
        // Assign colors to users
        const colors = {};
        users.forEach((user, idx) => {
          colors[user._id] = `hsl(${(idx * 360 / users.length) % 360}, 70%, 60%)`;
        });
        setUserColors(colors);
      });
    }

    return () => {
      if (docId) {
        socketManager.emit('leave-document', { documentId: docId });
      }
    };
  }, [docId, currentUser._id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await documentService.getDocumentById(docId);
      setDocument(response.document);
      setCollaborators(response.document.collaborators || []);
    } catch (err) {
      showNotification('Failed to load document', 'error');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpdate = (newContent) => {
    if (document) {
      setDocument({ ...document, content: newContent });
      socketManager.broadcastEdit(docId, newContent);
    }
  };

  const handleVersionsSaved = (versions) => {
    if (document) {
      setDocument({ ...document, versions });
    }
  };

  // Handle cursor position sharing
  const handleCursorMove = (e) => {
    const textarea = e.target;
    const position = textarea.selectionStart;
    
    socketManager.shareCursorPosition(docId, {
      userId: currentUser._id,
      userName: currentUser.name,
      position,
      lineNumber: textarea.value.substring(0, position).split('\n').length - 1
    });
  };

  const handleAddCollaborator = async (e) => {
    e.preventDefault();

    if (!newCollaboratorEmail.trim()) {
      showNotification('Please enter an email', 'error');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newCollaboratorEmail)) {
      showNotification('Please enter a valid email', 'error');
      return;
    }

    setAddingCollaborator(true);
    try {
      const response = await documentService.addCollaborator(docId, newCollaboratorEmail);
      setCollaborators([...collaborators, response.collaborator]);
      setNewCollaboratorEmail('');
      setShowAddCollaborator(false);
      showNotification('Collaborator added successfully');
      
      socketManager.notifyCollaboratorAdded(docId, response.collaborator);
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setAddingCollaborator(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(''), 3000);
  };

  // Check if current user is the owner
  const isOwner = document && currentUser && (document.owner._id === currentUser._id);

  // Debug log
  useEffect(() => {
    if (document && currentUser) {
      console.log('Document Owner ID:', document.owner._id);
      console.log('Current User ID:', currentUser._id);
      console.log('Is Owner:', document.owner._id === currentUser._id);
    }
  }, [document, currentUser]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar 
        currentUser={currentUser} 
        onLogout={onLogout}
        showMenu={showMenu}
        onToggleMenu={() => setShowMenu(!showMenu)}
      />

      {/* Notification */}
      {notification && (
        <div className={`mx-4 mt-4 p-4 rounded-lg text-sm flex items-center gap-2 ${
          notification.type === 'error' 
            ? 'bg-red-100 text-red-700 border border-red-300' 
            : 'bg-green-100 text-green-700 border border-green-300'
        }`}>
          {notification.type === 'error' ? (
            <AlertCircle size={18} />
          ) : (
            <Check size={18} />
          )}
          {notification.message}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Main Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader size={48} className="mx-auto mb-4 text-indigo-600 animate-spin" />
                <p className="text-gray-600">Loading document...</p>
              </div>
            </div>
          ) : document ? (
            <Editor 
              document={document}
              onUpdate={handleDocumentUpdate}
              onVersionsSaved={handleVersionsSaved}
              onCursorMove={handleCursorMove}
              cursorPositions={cursorPositions}
              userColors={userColors}
              currentUserId={currentUser._id}
            />
          ) : null}
        </div>

        {/* Right Sidebar - Collaborators & Active Users */}
        <aside className={`${showMenu ? 'block' : 'hidden'} lg:block w-80 bg-white border-l border-gray-200 overflow-y-auto shadow-lg`}>
          <div className="p-6 space-y-6">
            {/* Back Button (Mobile) */}
            <button
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium lg:hidden"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </button>

            {/* Active Users Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Active Users ({activeUsers.length})
              </h3>
              <div className="space-y-2">
                {activeUsers.length === 0 ? (
                  <p className="text-sm text-gray-500">You're editing alone</p>
                ) : (
                  activeUsers.map(user => (
                    <div 
                      key={user._id} 
                      className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200 hover:bg-green-100 transition"
                    >
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: userColors[user._id] || '#ccc' }}
                      ></div>
                      <p className="text-sm font-medium text-gray-800">{user.name}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Collaborators Section */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Share2 size={18} />
                  Team
                </h3>
                {isOwner && (
                  <button
                    onClick={() => setShowAddCollaborator(!showAddCollaborator)}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition font-medium flex items-center gap-1"
                    title="Add a new collaborator"
                  >
                    <span>+</span>
                    Add
                  </button>
                )}
              </div>

              {/* Add Collaborator Form */}
              {showAddCollaborator && isOwner && (
                <div className="mb-4 p-4 bg-indigo-50 border border-indigo-300 rounded-lg">
                  <p className="text-xs text-gray-600 mb-3">
                    Enter the email address of the person you want to invite
                  </p>
                  <form onSubmit={handleAddCollaborator} className="space-y-3">
                    <div>
                      <input
                        type="email"
                        value={newCollaboratorEmail}
                        onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                        placeholder="collaborator@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        disabled={addingCollaborator}
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={addingCollaborator}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm py-2 rounded-lg transition font-medium flex items-center justify-center gap-1"
                      >
                        {addingCollaborator ? (
                          <>
                            <Loader size={14} className="animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Check size={14} />
                            Add
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCollaborator(false);
                          setNewCollaboratorEmail('');
                        }}
                        disabled={addingCollaborator}
                        className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded-lg transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Collaborators List */}
              <div className="space-y-2">
                {/* Owner */}
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border-2 border-indigo-500">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: userColors[document?.owner?._id] || '#4f46e5' }}
                  >
                    {document?.owner?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {document?.owner?.name}
                    </p>
                    <p className="text-xs text-indigo-600 font-medium">Owner</p>
                  </div>
                  {document?.owner._id === currentUser._id && (
                    <span className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-full">
                      You
                    </span>
                  )}
                </div>

                {/* Other Collaborators */}
                {collaborators.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-sm text-gray-500">
                      {isOwner 
                        ? 'No collaborators yet. Invite someone to get started!' 
                        : 'No other collaborators'}
                    </p>
                  </div>
                ) : (
                  collaborators.map(collab => (
                    <div 
                      key={collab._id} 
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition"
                    >
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: userColors[collab._id] || '#9ca3af' }}
                      >
                        {collab.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {collab.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{collab.email}</p>
                      </div>
                      {activeUsers.some(u => u._id === collab._id) && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Document Info */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Document Info</h4>
              <div className="space-y-2 text-xs text-gray-600">
                <div>
                  <p className="font-medium text-gray-700">Created</p>
                  <p>{new Date(document?.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Last Modified</p>
                  <p>{new Date(document?.updatedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Total Versions</p>
                  <p>{document?.versions?.length || 0} saved</p>
                </div>
                {document?.isPublic && (
                  <div className="pt-2 border-t border-gray-300">
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                      🌍 Public Document
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}