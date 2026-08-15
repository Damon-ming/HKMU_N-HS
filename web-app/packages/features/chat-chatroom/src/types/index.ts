export interface ChatRoomMessage {
  id: string
  text: string
  sender: 'user' | 'assistant'
}
