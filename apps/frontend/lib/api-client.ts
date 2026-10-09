import axios from 'axios'
import { env } from '@/lib/env'
import { handleErrorResponse } from '@/lib/errors'

export const api = axios.create({ baseURL: env.NEXT_PUBLIC_API_BASE_URL })

api.interceptors.response.use((res) => res, handleErrorResponse)
