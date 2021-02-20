import React from 'react'
import { useWebSocketContext } from '../contextProviders/WebSocketContext'

interface Props {
  currentPage: number | null
}

const PageNavigation = ({ currentPage }: Props) => {
  const { sendMessage } = useWebSocketContext()

  const prevHandler = () => {
    sendMessage('PREV_PAGE')
  }

  const nextHandler = () => {
    sendMessage('NEXT_PAGE')
  }

  return (
    <div>
      <div>Current page: {currentPage}</div>
      <button onClick={prevHandler}>Prev</button>
      <button onClick={nextHandler}>Next</button>
    </div>
  )
}

PageNavigation.displayName = 'PageNavigation'
export default PageNavigation
