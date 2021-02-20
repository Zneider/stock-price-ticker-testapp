import * as React from 'react'

interface Props {
  children: React.Node
  url?: string
}

interface State {
  msg: string
  sendMsg: boolean
  socketReady: boolean
  ws: WebSocket | null
  eventListeners: Array<{ event: string; handler: Function }>
  closingSocket: boolean
}

interface Context {
  addListener: Function
  sendMessage: Function
}

const WebSocketContext = React.createContext<?Context>()

const initialState: State = {
  msg: '',
  sendMsg: false,
  socketReady: false,
  ws: null,
  eventListeners: [],
  closingSocket: false
}

const reducer = (state: State, action: { type: string; payload?: any }): State => {
  switch (action.type) {
    case 'SEND_MSG': {
      return { ...state, msg: action.payload, sendMsg: true }
    }
    case 'MSG_SENT': {
      return { ...state, msg: '', sendMsg: false }
    }
    case 'ADD_EVENTLISTENER': {
      return { ...state, eventListeners: [...state.eventListeners, action.payload] }
    }
    case 'WS_OPEN': {
      return { ...state, ws: action.payload, socketReady: true }
    }
    case 'WS_CLOSE': {
      return { ...state, closingSocket: true }
    }
    case 'WS_CLOSED': {
      return initialState
    }
  }
}

const WebSocketContextProvider = ({ url = 'ws://localhost:8999', children }: Props) => {
  const [state, dispatch] = React.useReducer(reducer, initialState)

  React.useEffect(() => {
    if (state.closingSocket) {
      state.eventListeners.length &&
        state.eventListeners.forEach(({ event, handler }) => {
          state.ws.removeEventListener(event, handler)
        })
      state.ws.close()
      dispatch({ type: 'WS_CLOSED' })
    }
  }, [state.closingSocket, state.ws, state.eventListeners])

  React.useEffect(() => {
    let ws
    let openHandler

    const getOpenHandler = (ws) => () => {
      state.eventListeners.length &&
        state.eventListeners.forEach(({ event, handler }) => {
          ws.addEventListener(event, handler)
        })
      dispatch({ type: 'WS_OPEN', payload: ws })
    }

    const closeHandler = () => {
      dispatch({ type: 'WS_CLOSED' })
    }

    const connectHandler = () => {
      try {
        ws = new WebSocket(url)
        openHandler = getOpenHandler(ws)
        ws.addEventListener('open', openHandler)
        ws.addEventListener('close', closeHandler)
      } catch (err) {
        console.log(err)
      }
    }

    if (!state.ws) {
      connectHandler()
    }
    return () => {
      if (ws) {
        ws.removeEventListener('open', openHandler)
        ws.removeEventListener('close', closeHandler)
        state.eventListeners.forEach(({ event, handler }) => {
          ws.removeEventListener(event, handler)
        })
      }
    }
  }, [url, dispatch, state.eventListeners, state.ws])

  React.useEffect(() => {
    const { sendMsg, sendingMsg, msg, socketReady, ws } = state
    if (sendMsg && msg && socketReady) {
      try {
        ws.send(msg)
        dispatch({ type: 'MSG_SENT' })
      } catch (err) {
        console.log('Send error: ', err)
      }
    }
  }, [state.sendMsg, state.msg])

  React.useEffect(() => {
    if (state.eventListeners.length) {
      const [{ event, handler }] = state.eventListeners.slice(-1)
      state.ws && event && handler && state.ws.addEventListener(event, handler)
    }
  }, [state.eventListeners, state.ws])

  const value = {
    addListener: ({ event, handler }: { event: string; handler: Function }) => {
      dispatch({ type: 'ADD_EVENTLISTENER', payload: { event, handler } })
    },
    sendMessage: (message: string) => {
      dispatch({ type: 'SEND_MSG', payload: message })
    }
  }

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}

const useWebSocketContext = () => {
  const context = React.useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocketContext must be use within <WebSocketContextProvider>')
  }

  return context
}

export { WebSocketContextProvider, useWebSocketContext }
