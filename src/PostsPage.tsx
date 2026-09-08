import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

type PostsPageProps = { user: User; language: 'en' | 'ru' }
export type Post = { id: string; image?: string; title: string; description: string; location: string; date: string; comments: string[] }

type Copy = { eyebrow: string; title: string; intro: string; add: string; image: string; description: string; location: string; date: string; comment: string; commentPlaceholder: string; publish: string; posts: string; empty: string; remove: string }

export default function PostsPage({ user, language }: PostsPageProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [draft, setDraft] = useState<Partial<Post>>({})
  const [newComment, setNewComment] = useState('')
  const copy: Copy = language === 'ru' ? { eyebrow: 'ПОСТЫ', title: 'Истории, которые хочется сохранить.', intro: 'Добавляйте фотографии, впечатления и детали каждой поездки.', add: 'ДОБАВИТЬ ПОСТ', image: 'Фотография', description: 'Описание', location: 'Местоположение', date: 'Дата поездки', comment: 'Комментарий', commentPlaceholder: 'Добавьте комментарий', publish: 'Опубликовать пост', posts: 'ВАШИ ПОСТЫ', empty: 'Пока нет постов.', remove: 'Удалить' } : { eyebrow: 'POSTS', title: 'Stories worth keeping.', intro: 'Add photos, impressions, and the details of every journey.', add: 'ADD A POST', image: 'Photo', description: 'Description', location: 'Location', date: 'Trip date', comment: 'Comment', commentPlaceholder: 'Add a comment', publish: 'Publish post', posts: 'YOUR POSTS', empty: 'No posts yet.', remove: 'Remove' }

  useEffect(() => {
    getDoc(doc(db, 'users', user.uid)).then((snapshot) => setPosts((snapshot.data()?.posts as Post[] | undefined) ?? [])).catch(() => setPosts([]))
  }, [user.uid])

  const updateDraft = <K extends keyof Post>(key: K, value: Post[K]) => setDraft({ ...draft, [key]: value })
  const publish = async () => {
    if (!draft.title?.trim()) return
    const post: Post = { id: `${Date.now()}`, title: draft.title.trim(), image: draft.image, description: draft.description ?? '', location: draft.location ?? '', date: draft.date ?? '', comments: [] }
    const nextPosts = [post, ...posts]
    setPosts(nextPosts)
    setDraft({})
    await setDoc(doc(db, 'users', user.uid), { posts: nextPosts }, { merge: true })
  }
  const addComment = async (post: Post) => {
    if (!newComment.trim()) return
    const nextPosts = posts.map((item) => item.id === post.id ? { ...item, comments: [...item.comments, newComment.trim()] } : item)
    setPosts(nextPosts)
    setNewComment('')
    await setDoc(doc(db, 'users', user.uid), { posts: nextPosts }, { merge: true })
  }
  const removePost = async (postId: string) => {
    const nextPosts = posts.filter((post) => post.id !== postId)
    setPosts(nextPosts)
    await setDoc(doc(db, 'users', user.uid), { posts: nextPosts }, { merge: true })
  }

  return <section className="subpage container posts-page"><p className="eyebrow"><span /> {copy.eyebrow}</p><h1>{copy.title}</h1><p className="subpage-intro">{copy.intro}</p><section className="post-composer"><p className="section-label">{copy.add}</p><div className="post-form-grid"><label>{copy.image}<input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) updateDraft('image', URL.createObjectURL(file)) }} /></label>{draft.image && <img className="post-image-preview" src={draft.image} alt={copy.image} />}<label>{copy.description}<textarea value={draft.description ?? ''} onChange={(event) => updateDraft('description', event.target.value)} placeholder={language === 'ru' ? 'Напишите ваше впечатление об этой поездке.' : 'Write your impression of this trip.'} /></label><label>{copy.location}<input value={draft.location ?? ''} onChange={(event) => updateDraft('location', event.target.value)} /></label><label>{copy.date}<input type="date" value={draft.date ?? ''} onChange={(event) => updateDraft('date', event.target.value)} /></label><label>{language === 'ru' ? 'Название' : 'Title'}<input value={draft.title ?? ''} onChange={(event) => updateDraft('title', event.target.value)} /></label></div><button className="button button-coral" onClick={() => void publish()} type="button">{copy.publish}</button></section><section className="posts-feed"><p className="section-label">{copy.posts}</p>{posts.length === 0 && <p className="empty-state">{copy.empty}</p>}{posts.map((post) => <article className="post-card" key={post.id}>{post.image && <img src={post.image} alt={post.location || post.title} />}<div className="post-card-body"><div className="post-card-meta"><span>{post.location}</span><span>{post.date}</span></div><h2>{post.title}</h2><p>{post.description}</p><div className="post-comments"><strong>{copy.comment}</strong>{post.comments.map((comment, index) => <p key={`${post.id}-${index}`}>{comment}</p>)}<div className="comment-row"><input value={newComment} onChange={(event) => setNewComment(event.target.value)} placeholder={copy.commentPlaceholder} /><button className="nav-button" onClick={() => void addComment(post)} type="button">↗</button></div></div><button className="post-remove nav-button" onClick={() => void removePost(post.id)} type="button">{copy.remove}</button></div></article>)}</section></section>
}
