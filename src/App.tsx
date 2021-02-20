import React from 'react'
import StockPriceInfo from './components/StockPriceInfo'
import { useWebSocketContext, WebSocketContextProvider } from './contextProviders/WebSocketContext'

interface Props {}

class App extends React.Component<Props> {
  render() {
    return (
      <>
        <h1>Stock Price Ticker</h1>
        <WebSocketContextProvider>
          <StockPriceInfo />
        </WebSocketContextProvider>
      </>
    )
  }
}

export default App
