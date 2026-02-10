import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/features/auth/stores/useAuthStore";
import { Shield, User as UserIcon, Edit2, Save, X } from "lucide-react";

const ProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const currentUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    avatar_url: "",
  });

  // TODO: Fetch user data if username !== currentUser.username
  // For now, simpler implementation assuming current user or placeholder

  const isCurrentUser =
    !username || (currentUser && currentUser.username === username);
  const displayUser = isCurrentUser ? currentUser : null; // Replace null with fetched user

  if (!displayUser) {
    return (
      <div className="text-white">
        Cargando perfil o usuario no encontrado...
      </div>
    );
  }

  const startEditing = () => {
    setEditForm({
      avatar_url: displayUser.avatar_url || "",
    });
    setIsEditing(true);
  };

  const saveProfile = () => {
    if (!currentUser) return;

    setUser({
      ...currentUser,
      avatar_url: editForm.avatar_url,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header del Perfil */}
      <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-r from-zinc-900 to-zinc-800 border border-zinc-800">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent flex items-end gap-6">
          <div className="w-24 h-24 rounded-full bg-zinc-950 border-4 border-zinc-900 flex items-center justify-center text-4xl font-display font-bold text-ritual-accent shadow-xl overflow-hidden relative group">
            {displayUser.avatar_url ? (
              <img
                src={displayUser.avatar_url}
                alt={displayUser.username}
                className="w-full h-full object-cover"
              />
            ) : (
              displayUser.username.charAt(0).toUpperCase()
            )}

            {isEditing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Edit2 size={20} className="text-white" />
              </div>
            )}
          </div>

          <div className="mb-2 flex-1">
            <h1 className="text-3xl font-display font-bold text-white flex items-center gap-2">
              {displayUser.username}
              {displayUser.isAdmin && (
                <Shield size={20} className="text-yellow-500" />
              )}
            </h1>
            <p className="text-zinc-400 text-sm flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-xs uppercase tracking-wider text-ritual-accent">
                {displayUser.rank}
              </span>
              <span>•</span>
              <span>
                Unido en {new Date(displayUser.created_at).toLocaleDateString()}
              </span>
            </p>
          </div>

          {isCurrentUser && !isEditing && (
            <button
              onClick={startEditing}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Edit2 size={16} /> Editar Perfil
            </button>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl animate-fade-in-up">
          <h3 className="text-lg font-bold text-white mb-4">Editar Perfil</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-sm mb-2">
                URL del Avatar
              </label>
              <input
                type="text"
                value={editForm.avatar_url}
                onChange={(e) =>
                  setEditForm({ ...editForm, avatar_url: e.target.value })
                }
                placeholder="https://example.com/image.jpg"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-ritual-accent outline-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={saveProfile}
                className="bg-ritual-accent text-black font-bold px-6 py-2 rounded-lg hover:bg-emerald-400"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
          <h3 className="text-zinc-500 uppercase text-xs font-bold tracking-wider mb-2">
            Esencia Total
          </h3>
          <p className="text-3xl font-mono text-white">{displayUser.essence}</p>
        </div>
        {/* Add more stats here */}
      </div>
    </div>
  );
};

export default ProfilePage;
