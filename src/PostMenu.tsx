import { useEffect, useRef, useState } from "react";
import type { Post } from "./types";
import { useModalScrollLock } from "./lib/useModalScrollLock";

type PostMenuProps = {
  post: Post;
  isOwn: boolean;
  language: "en" | "ru";
  onEdit: (updatedPost: Post) => void;
  onToggleArchive: (post: Post) => void;
  onDelete: (postId: string) => void;
};

export default function PostMenu({
  post,
  isOwn,
  language,
  onEdit,
  onToggleArchive,
  onDelete,
}: PostMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useModalScrollLock(editModalOpen);

  // Edit draft state
  const [editTitle, setEditTitle] = useState(post.title);
  const [editDescription, setEditDescription] = useState(post.description);
  const [editLocation, setEditLocation] = useState(post.location);
  const [editDate, setEditDate] = useState(post.date);
  const [editImage, setEditImage] = useState(post.image ?? "");

  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  // If not the author who shared the post, hide completely
  if (!isOwn) return null;

  const copy =
    language === "ru"
      ? {
          edit: "Редактировать",
          archive: "Скрыть в архив",
          unarchive: "Вернуть из архива",
          delete: "Удалить пост",
          confirmDelete: "Точно удалить?",
          confirmYes: "Да, удалить",
          cancel: "Отмена",
          editModalTitle: "Редактирование поста",
          titleLabel: "Название",
          descriptionLabel: "Описание",
          locationLabel: "Местоположение",
          dateLabel: "Дата поездки",
          imageLabel: "Фотография",
          save: "Сохранить изменения",
        }
      : {
          edit: "Edit post",
          archive: "Archive post",
          unarchive: "Unarchive post",
          delete: "Delete post",
          confirmDelete: "Confirm deletion?",
          confirmYes: "Yes, delete",
          cancel: "Cancel",
          editModalTitle: "Edit Travel Post",
          titleLabel: "Title",
          descriptionLabel: "Description",
          locationLabel: "Location",
          dateLabel: "Trip date",
          imageLabel: "Photo",
          save: "Save changes",
        };

  const handleOpenEdit = () => {
    setEditTitle(post.title);
    setEditDescription(post.description);
    setEditLocation(post.location);
    setEditDate(post.date);
    setEditImage(post.image ?? "");
    setMenuOpen(false);
    setEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim()) return;
    const updated: Post = {
      ...post,
      title: editTitle.trim(),
      description: editDescription.trim(),
      location: editLocation.trim(),
      date: editDate,
      image: editImage || undefined,
    };
    onEdit(updated);
    setEditModalOpen(false);
  };

  const handleArchive = () => {
    setMenuOpen(false);
    onToggleArchive(post);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setMenuOpen(false);
    setConfirmDelete(false);
    onDelete(post.id);
  };

  return (
    <div className="post-menu-wrapper" ref={menuRef}>
      <button
        className="post-menu-trigger"
        onClick={() => {
          setMenuOpen(!menuOpen);
          setConfirmDelete(false);
        }}
        type="button"
        title={language === "ru" ? "Опции поста" : "Post options"}
        aria-label="Post options"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {menuOpen && (
        <div className="post-dropdown-menu" role="menu">
          <button
            className="post-menu-item"
            onClick={handleOpenEdit}
            type="button"
            role="menuitem"
          >
            <span className="menu-item-icon">✎</span>
            <span>{copy.edit}</span>
          </button>

          <button
            className="post-menu-item"
            onClick={handleArchive}
            type="button"
            role="menuitem"
          >
            <span className="menu-item-icon">📦</span>
            <span>{post.isArchived ? copy.unarchive : copy.archive}</span>
          </button>

          <div className="post-menu-divider" />

          {confirmDelete ? (
            <div className="confirm-delete-box">
              <span className="confirm-delete-prompt">{copy.confirmDelete}</span>
              <div className="confirm-delete-actions">
                <button
                  className="post-menu-item danger-confirm"
                  onClick={handleDelete}
                  type="button"
                >
                  {copy.confirmYes}
                </button>
                <button
                  className="post-menu-item cancel-confirm"
                  onClick={() => setConfirmDelete(false)}
                  type="button"
                >
                  {copy.cancel}
                </button>
              </div>
            </div>
          ) : (
            <button
              className="post-menu-item danger"
              onClick={handleDelete}
              type="button"
              role="menuitem"
            >
              <span className="menu-item-icon">🗑️</span>
              <span>{copy.delete}</span>
            </button>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && (
        <div
          className="auth-overlay"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setEditModalOpen(false)}
        >
          <div className="edit-post-modal" role="dialog" aria-modal="true">
            <button
              className="auth-close nav-button"
              onClick={() => setEditModalOpen(false)}
              type="button"
              aria-label={copy.cancel}
            >
              ×
            </button>

            <p className="eyebrow">
              <span /> {language === "ru" ? "РЕДАКТИРОВАНИЕ" : "EDIT POST"}
            </p>
            <h2>{copy.editModalTitle}</h2>

            <div className="edit-post-form">
              <label>
                {copy.titleLabel}
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder={copy.titleLabel}
                  required
                />
              </label>

              <div className="edit-form-grid">
                <label>
                  {copy.locationLabel}
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder={copy.locationLabel}
                  />
                </label>

                <label>
                  {copy.dateLabel}
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </label>
              </div>

              <label>
                {copy.descriptionLabel}
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  placeholder={copy.descriptionLabel}
                />
              </label>

              <label>
                {copy.imageLabel}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setEditImage(URL.createObjectURL(file));
                  }}
                />
              </label>

              {editImage && (
                <div className="edit-preview-wrap">
                  <img src={editImage} alt="Preview" className="edit-img-preview" />
                  <button
                    className="button button-outline remove-img-btn"
                    onClick={() => setEditImage("")}
                    type="button"
                  >
                    {language === "ru" ? "Удалить фото" : "Remove photo"}
                  </button>
                </div>
              )}

              <div className="edit-modal-actions">
                <button
                  className="button button-coral"
                  onClick={handleSaveEdit}
                  type="button"
                >
                  {copy.save} ↗
                </button>
                <button
                  className="button button-outline"
                  onClick={() => setEditModalOpen(false)}
                  type="button"
                >
                  {copy.cancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
