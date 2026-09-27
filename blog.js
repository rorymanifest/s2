// Fetches blog posts from Sanity in the browser — no build step needed.
import {projectId, dataset, apiVersion} from './sanity-config.js'
import {toHTML} from 'https://cdn.jsdelivr.net/npm/@portabletext/to-html@2/+esm'

async function query(groq, params = {}) {
  const url = new URL(`https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}`)
  url.searchParams.set('query', groq)
  for (const [key, value] of Object.entries(params)) url.searchParams.set('$' + key, JSON.stringify(value))
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Sanity request failed (${res.status})`)
  return (await res.json()).result
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c])
}

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString('en-AU', {day: 'numeric', month: 'long', year: 'numeric'}) : ''
}

function img(url, width) {
  return `${url}?w=${width}&auto=format&fit=max`
}

function showError(el, err) {
  console.error(err)
  el.innerHTML = `<p class="blog-empty">Sorry, the blog couldn't be loaded right now. Please try again later.</p>`
}

export async function renderPostList(el) {
  try {
    const posts = await query(`*[_type == "post" && defined(slug.current) && publishedAt <= now()]
      | order(publishedAt desc) {title, "slug": slug.current, publishedAt, excerpt,
        "image": mainImage.asset->url, "alt": mainImage.alt}`)
    if (!posts.length) {
      el.innerHTML = `<p class="blog-empty">No posts yet — check back soon.</p>`
      return
    }
    el.innerHTML = posts.map((p) => `
      <a class="post-card" href="/post?slug=${encodeURIComponent(p.slug)}">
        <div class="post-card__img">${p.image ? `<img class="img-fill" src="${esc(img(p.image, 800))}" alt="${esc(p.alt)}" loading="lazy">` : ''}</div>
        <div class="post-card__body">
          <div class="post-date">${esc(formatDate(p.publishedAt))}</div>
          <h2>${esc(p.title)}</h2>
          ${p.excerpt ? `<p>${esc(p.excerpt)}</p>` : ''}
          <span class="post-card__more">Read more →</span>
        </div>
      </a>`).join('')
  } catch (err) {
    showError(el, err)
  }
}

const components = {
  types: {
    image: ({value}) => value.url
      ? `<figure><img src="${esc(img(value.url, 1400))}" alt="${esc(value.alt)}" loading="lazy">${value.caption ? `<figcaption>${esc(value.caption)}</figcaption>` : ''}</figure>`
      : '',
  },
}

export async function renderPost(el) {
  const slug = new URLSearchParams(location.search).get('slug')
  try {
    const post = slug && await query(`*[_type == "post" && slug.current == $slug][0] {
      title, publishedAt, excerpt, "image": mainImage.asset->url, "alt": mainImage.alt,
      body[]{..., _type == "image" => {..., "url": asset->url}}}`, {slug})
    if (!post) {
      el.innerHTML = `<p class="blog-empty">We couldn't find that post. <a href="/blog">See all posts</a>.</p>`
      return
    }
    document.title = `${post.title} — Skyway Cleaning`
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', `https://www.skywaycleaning.com.au/post?slug=${encodeURIComponent(slug)}`)
    if (post.excerpt) document.querySelector('meta[name="description"]')?.setAttribute('content', post.excerpt)
    el.innerHTML = `
      <div class="post-date">${esc(formatDate(post.publishedAt))}</div>
      <h1>${esc(post.title)}</h1>
      ${post.image ? `<img class="post-cover" src="${esc(img(post.image, 1600))}" alt="${esc(post.alt)}">` : ''}
      <div class="post-body">${toHTML(post.body || [], {components})}</div>
      <a class="back-link" href="/blog">← All posts</a>`
  } catch (err) {
    showError(el, err)
  }
}
