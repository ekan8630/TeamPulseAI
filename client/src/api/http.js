import axios from 'axios'

const API_BASE_URL =
  'https://teampulseai-production.up.railway.app/api'

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
})

export function setAuthToken(token) {
  if (token) http.defaults.headers.common.Authorization = `Bearer ${token}`
  else delete http.defaults.headers.common.Authorization
}

export default http