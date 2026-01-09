import React from 'react';
import { FileText, LogOut, Menu, X } from 'lucide-react';

export default function Navbar({ currentUser, onLogout, showMenu, onToggleMenu }) {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleMenu}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
          >
            {showMenu ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800">CollabDoc</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <p className="text-sm font-medium text-gray-800">{currentUser?.name}</p>
            <p className="text-xs text-gray-500">{currentUser?.email}</p>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            title="Logout"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline text-sm">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}