import fetch from 'isomorphic-fetch'
import {green} from 'colors'
const BASE_URL = 'http://warcraftlogs.com/v1'
const API_KEY = '8c93754f2cc86280cd419150352ad4bf'


export async function requester<T = unknown>(url: string, i : RequestInit & {query?: Record<string, any>} = {}) {
  const queryObj = i.query || {}
  queryObj.api_key = API_KEY
  const query = Object.entries(queryObj).map(([k, v]) => {
    return encodeURIComponent(k) + '=' + encodeURIComponent(v)
  }).join('&')
  delete i.query
  const formedUrl = BASE_URL + url + (query.length && '?' || '') + query
  console.log(green('req: '), formedUrl)
  const response = await fetch(formedUrl, i)
  const json = await response.json()
  return json as T
}