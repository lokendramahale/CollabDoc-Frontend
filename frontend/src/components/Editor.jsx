import React, { useState, useRef, useEffect } from 'react';
import { Save, Clock, RotateCcw, AlertCircle, Check, Loader } from 'lucide-react';
import { documentService } from '../services/api';

export default function Editor({ 
  document, 
  onUpdate, 
  onVersionsSaved,
  onCursorMove,
  cursorPositions = {},
  userColors = {},
  currentUserId
}) {
  const [content, setContent] = useState(document?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState(document?.versions || []);
  const [restoringVersion, setRestoringVersion] = useState(null);
  const [notification, setNotification] = useState('');
  const contentRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);

  useEffect(() => {
    setContent(document?.content || '');
    setVersions(document?.versions || []);
    setLastSaved(document?.updatedAt);
  }, [document]);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    onUpdate(newContent);

    // Auto-save after 3 seconds of inactivity
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      handleAutoSave(newContent);
    }, 3000);
  };

  const handleAutoSave = async (newContent) => {
    try {
      await documentService.updateDocument(document._id, newContent);
      setLastSaved(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Auto-save failed:', err);
      showNotification('Auto-save failed', 'error');
    }
  };

  const handleManualSave = async () => {
    if (!document?._id) return;

    setIsSaving(true);
    try {
      const response = await documentService.saveVersion(document._id, content);
      setVersions([response.version, ...versions]);
      setLastSaved(new Date().toLocaleTimeString());
      onVersionsSaved([response.version, ...versions]);
      showNotification('Version saved successfully');
    } catch (err) {
      console.error('Failed to save version:', err);
      showNotification('Failed to save version', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreVersion = async (versionId) => {
    if (!document?._id) return;

    setRestoringVersion(versionId);
    try {
      const response = await documentService.restoreVersion(document._id, versionId);
      setContent(response.document.content);
      setVersions(response.document.versions);
      onUpdate(response.document.content);
      showNotification('Version restored successfully');
      setShowVersions(false);
    } catch (err) {
      console.error('Failed to restore version:', err);
      showNotification('Failed to restore version', 'error');
    } finally {
      setRestoringVersion(null);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(''), 3000);
  };

  // Calculate line number for cursor indicator
  const getLineNumberForCursor = (position) => {
    return content.substring(0, position).split('\n').length;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Notification */}
      {notification && (
        <div className={`px-6 py-3 flex items-center gap-2 text-sm ${
          notification.type === 'error' 
            ? 'bg-red-100 text-red-700 border-b border-red-300' 
            : 'bg-green-100 text-green-700 border-b border-green-300'
        }`}>
          {notification.type === 'error' ? (
            <AlertCircle size={16} />
          ) : (
            <Check size={16} />
          )}
          {notification.message}
        </div>
      )}

      {/* Editor Toolbar */}
      <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-wrap gap-4 bg-gray-50">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800">{document?.title}</h2>
          <p className="text-sm text-gray-500 mt-1">
            by <span className="font-medium">{document?.owner?.name}</span>
            {document?.isPublic && (
              <span className="ml-3 inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                🌍 Public
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {lastSaved && (
            <div className="text-sm text-gray-600 flex items-center gap-1 px-3 py-1 bg-white rounded border border-gray-300">
              <Clock size={14} />
              <span>Saved: {lastSaved}</span>
            </div>
          )}

          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition font-medium text-sm"
            title="Save a version snapshot"
          >
            {isSaving ? (
              <>
                <Loader size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Version
              </>
            )}
          </button>

          <button
            onClick={() => setShowVersions(!showVersions)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium text-sm ${
              showVersions 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
            title="View version history"
          >
            <RotateCcw size={16} />
            History
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Text Area with Cursor Indicators */}
        <div className="flex-1 overflow-hidden relative">
          <textarea
            ref={contentRef}
            value={content}
            onChange={handleContentChange}
            onMouseMove={onCursorMove}
            onKeyUp={onCursorMove}
            placeholder="Start typing... (Auto-saves every 3 seconds)"
            className="w-full h-full p-6 border-none focus:outline-none resize-none font-mono text-sm text-gray-700 bg-white leading-relaxed"
            spellCheck="false"
          />

          {/* Cursor Position Indicators */}
          <div className="absolute top-0 right-0 p-4 pointer-events-none">
            {Object.entries(cursorPositions).map(([userId, position]) => {
              const lineNumber = getLineNumberForCursor(position);
              const color = userColors[userId] || '#ccc';
              
              return (
                <div 
                  key={userId}
                  className="text-xs font-mono text-white mb-1 px-2 py-1 rounded"
                  style={{ backgroundColor: color }}
                  title={`Line ${lineNumber}`}
                >
                  Line {lineNumber}
                </div>
              );
            })}
          </div>
        </div>

        {/* Versions Sidebar */}
        {showVersions && (
          <div className="w-96 bg-gray-50 border-l border-gray-200 overflow-y-auto flex flex-col">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Clock size={18} />
                Version History
              </h3>
              <p className="text-xs text-gray-500 mt-2">
                Total: {versions.length} versions
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {versions.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-gray-500">No versions saved yet</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Click "Save Version" to create snapshots
                  </p>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {versions.map((version, idx) => (
                    <div
                      key={version._id}
                      className="border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition overflow-hidden"
                    >
                      <button
                        onClick={() => handleRestoreVersion(version._id)}
                        disabled={restoringVersion === version._id}
                        className="w-full text-left p-4 hover:bg-indigo-50 transition disabled:bg-gray-100"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-semibold text-gray-800">
                            Version {versions.length - idx}
                          </p>
                          {restoringVersion === version._id && (
                            <Loader size={14} className="animate-spin text-indigo-600 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-1">
                          {new Date(version.savedAt).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600 mb-2">
                          by <span className="font-medium">{version.savedBy?.name}</span>
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {version.content?.length || 0} characters
                          </p>
                          <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded font-medium">
                            Restore
                          </span>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}