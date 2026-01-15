import React from "react";
import { Skull, Trophy } from "lucide-react";
import { MOCK_POSTS } from "../mocks";
import { SocialPost } from "../types";
const SocialPage = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-display font-bold mb-8">The Coven</h2>

      <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 mb-8 flex gap-4">
        <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400">
          <Skull size={20} />
        </div>
        <input
          type="text"
          placeholder="Broadcast your achievements..."
          className="bg-transparent flex-1 outline-none text-white placeholder-zinc-600"
        />
        <button className="text-ritual-accent font-bold text-sm uppercase">
          Post
        </button>
      </div>

      <div className="space-y-6">
        {MOCK_POSTS.map((post) => (
          <div
            key={post.id}
            className="border-l-2 border-zinc-800 pl-6 py-2 hover:border-ritual-accent transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`font-bold ${
                  post.isSystem ? "text-ritual-accent" : "text-white"
                }`}
              >
                @{post.author}
              </span>
              <span className="text-zinc-600 text-xs">• {post.timestamp}</span>
            </div>
            <p className="text-zinc-300 mb-3">{post.content}</p>
            <div className="flex gap-4 text-zinc-500 text-sm">
              <button className="hover:text-ritual-accent flex items-center gap-1">
                <Trophy size={14} /> {post.likes}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SocialPage;
