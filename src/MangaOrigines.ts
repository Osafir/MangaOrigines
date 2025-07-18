
import {
  Chapter,
  ChapterDetails,
  LanguageCode,
  Manga,
  MangaStatus,
  MangaTile,
  Plugin,
  Source
} from 'paperback-extensions-common'

const DOMAIN = 'https://mangas-origines.fr'

export const MangasOriginesFR: Source = {
  version: '1.0.0',
  name: 'Mangas Origines FR',
  icon: 'icon.png',
  author: 'Safir + ChatGPT',
  description: 'Extension corrigée pour lire depuis mangas-origines.fr',
  language: LanguageCode.FRENCH,

  async getMangaDetails(mangaId, data) {
    const url = `${DOMAIN}/oeuvre/${mangaId}/`
    const response = await data.requestManager.createRequest({ url, method: 'GET' })
    const $ = data.cheerio.load(response.data)

    return {
      id: mangaId,
      titles: [ $('h1.entry-title').text().trim() ],
      image: $('div.summary_image img').attr('src') ?? '',
      author: $('div.author-content').text().trim(),
      status: MangaStatus.ONGOING,
      description: $('div.summary__content').text().trim(),
    }
  },

  async getChapters(mangaId, data) {
    const url = `${DOMAIN}/oeuvre/${mangaId}/ajax/chapters/`
    const response = await data.requestManager.createRequest({ url, method: 'GET' })
    const $ = data.cheerio.load(response.data)

    const chapters: Chapter[] = []
    $('li.wp-manga-chapter').each((_, el) => {
      const a = $(el).find('a')
      chapters.push({
        id: a.attr('href')?.split('/chapitre-')[1]?.replace('/', '') ?? '',
        name: a.text().trim(),
        language: LanguageCode.FRENCH,
      })
    })
    return chapters
  },

  async getChapterDetails(mangaId, chapterId, data) {
    const url = `${DOMAIN}/oeuvre/${mangaId}/chapitre-${chapterId}/`
    const response = await data.requestManager.createRequest({ url, method: 'GET' })
    const $ = data.cheerio.load(response.data)

    const pages: string[] = []
    $('div.page-break img').each((_, el) => {
      const src = $(el).attr('src')
      if (src) pages.push(src)
    })

    return {
      id: chapterId,
      pages,
    }
  },

  async getSearchResults(query, data) {
    const url = `${DOMAIN}/?s=${encodeURIComponent(query.title ?? '')}&post_type=wp-manga`
    const response = await data.requestManager.createRequest({ url, method: 'GET' })
    const $ = data.cheerio.load(response.data)

    const results: MangaTile[] = []
    $('div.c-tabs-item__content').each((_, el) => {
      const title = $(el).find('h3.h4 a').text().trim()
      const img = $(el).find('img').attr('src') ?? ''
      const href = $(el).find('a').attr('href') ?? ''
      const id = href.split('/oeuvre/')[1]?.replace('/', '')

      if (id && title) {
        results.push({
          id,
          title,
          image: img,
        })
      }
    })
    return results
  }
}
