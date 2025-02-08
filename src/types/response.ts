export interface IResponseError {
  success: boolean
  message: string
  error?: any
}

export interface IResponseSuccess {
  success: boolean
  message: string
  data?: any
}