"use client"

import { useChat } from "@/lib/chat-context"
import ChatWidget from "./chat-widget"

export default function GlobalChatWidget() {
  const { 
    isGlobalChatOpen, 
    globalChatProduct, 
    globalChatSeller, 
    closeChatWidget 
  } = useChat()

  if (!isGlobalChatOpen || !globalChatProduct || !globalChatSeller) {
    return null
  }

  return (
    <ChatWidget
      product={globalChatProduct}
      seller={globalChatSeller}
      onClose={closeChatWidget}
      isGeneralChat={false}
    />
  )
}
