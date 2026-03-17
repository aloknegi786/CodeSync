import { useState } from "react";
import './roomcard.css';

import axios from 'axios';

const LANG_COLORS = {
  javascript: "#f7df1e",
  python:     "#3572A5",
  cpp:        "#f34b7d",
  java:       "#b07219",
  typescript: "#2b7489",
  rust:       "#dea584",
  go:         "#00ADD8",
  default:    "#6e7681",
};



function RoomCard({ room, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const copyId = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(room.room_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      const res = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/delete-room/${room.room_id}`);
      await onDelete(room.room_id);
    } catch (error) {
      console.error("Failed to delete room:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const langColor = LANG_COLORS[room.language?.toLowerCase()] || LANG_COLORS.default;

  const date = room.created_at
    ? new Date(room.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <>
      <div
        className={`room-card ${expanded ? "expanded" : ""}`}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="room-card-header">
          <div
            className="room-lang-badge"
            style={{
              background: langColor + "1a",
              color: langColor,
              border: `1px solid ${langColor}40`,
            }}
          >
            {room.language || "unknown"}
          </div>
          <span className="room-id-preview">{room.room_id.slice(0, 8)}…</span>
          <span className="room-date">{date}</span>
          <span className={`room-chevron ${expanded ? "open" : ""}`}>▾</span>
        </div>

        {expanded && (
          <div className="room-card-body" onClick={(e) => e.stopPropagation()}>
            <div className="room-id-row">
              <code className="room-id-full">{room.room_id}</code>
              <button
                className={`copy-btn ${copied ? "copied" : ""}`}
                onClick={copyId}
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
            {room.description && (
              <p className="room-description">{room.description}</p>
            )}

            {/* Delete Button */}
            <div className="room-actions">
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
              >
                🗑 Delete Room
              </button>
            </div>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="delete-confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-header">
              <h3>Delete Room?</h3>
              <button
                className="close-btn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                ✕
              </button>
            </div>
            <p className="delete-confirm-message">
              Are you sure you want to delete room <code>{room.room_id}</code>?
              This action cannot be undone.
            </p>
            <div className="delete-confirm-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-delete-btn"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default RoomCard;