import * as React from 'react'
import dayjs from 'dayjs'
import styled from 'styled-components'
import { useWebSocketContext } from '../contextProviders/WebSocketContext'
import PageNavigation from './PageNavigation'

const StyledSpan = styled.span`
  font-size: 18px;
  display: inline-flex;
  justify-content: flex-start;
  align-items: center;
  margin: 10px;
  flex: 1 1 auto;
  color: black;

  &:first-of-type {
    flex: 0 0 5%;
  }
  &:nth-last-of-type(1),
  &:nth-last-of-type(2),
  &:nth-last-of-type(3),
  &:nth-last-of-type(4) {
    flex: 0 0 10%;
    justify-content: flex-end;
  }
`

const StyledListRow = styled.li`
  list-item-style: none;
  width: 100%;
  display: flex;
  justify-content: space-between;
  margin: 0;
  background-color: darkgray;
  &:first-of-type span {
    font-weight: bold;
  }
  &:nth-of-type(2n) {
    background-color: lightgray;
  }
`
const currencyNumberFormatter = new Intl.NumberFormat('da-DK', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  currencyDisplay: 'symbol'
})
const percentNumberFormatter = new Intl.NumberFormat('da-DK', {
  style: 'percent',
  minimumFractionDigits: 4
})
const decimalNumberFormatter = new Intl.NumberFormat('da-DK', {
  minimumFractionDigits: 2
})

const headerRow = (
  <StyledListRow key={'ticker_name'}>
    <StyledSpan>Ticker</StyledSpan>
    <StyledSpan>Name</StyledSpan>
    <StyledSpan>Price</StyledSpan>
    <StyledSpan>Change</StyledSpan>
    <StyledSpan>Change percent</StyledSpan>
    <StyledSpan>Time</StyledSpan>
  </StyledListRow>
)

const getPage = (data) => {
  if (data) {
    try {
      const { page } = JSON.parse(data)
      return page
    } catch (e) {
      console.log(e)
    }
  }
  return null
}

const StockPriceInfo = () => {
  const { addListener } = useWebSocketContext()
  const [data, setData] = React.useState()
  const [tickers, setTickers] = React.useState()
  const tickerHistoryRef = React.useRef({})
  React.useEffect(() => {
    try {
      addListener({
        event: 'message',
        handler: (msg) => {
          const isJSON = (data: string) => {
            try {
              return !!JSON.parse(data)
            } catch (_) {
              return false
            }
          }
          if (msg.data && isJSON(msg.data)) {
            setData(msg.data)
          }
        }
      })
    } catch (err) {
      console.log(err)
    }
  }, [])

  React.useEffect(() => {
    if (data) {
      try {
        const parsedData = JSON.parse(data)
        const history = { ...tickerHistoryRef.current }
        console.log(history)
        const updatedHistory = (parsedData.tickers || []).reduce(
          (prev, { ticker, price, name, currency, updated }) => {
            const page = parsedData.page
            const newPrice = Math.max(price, 0)
            if (prev[ticker]) {
              const {
                price: oldPrice,
                color: oldColor,
                change: oldChange = 0.0,
                changePercent: oldChangePercent = 0.0
              } = prev[ticker]
              const newItem = {
                price: newPrice,
                color: oldPrice > newPrice ? 'red' : oldPrice === newPrice ? oldColor : 'green',
                page,
                name,
                currency,
                updated,
                change: oldPrice !== newPrice ? newPrice - oldPrice : oldChange,
                changePercent:
                  oldPrice !== newPrice ? (newPrice - oldPrice) / oldPrice : oldChangePercent
              }
              prev[ticker] = newItem
            } else {
              prev[ticker] = {
                price: newPrice,
                color: 'green',
                page,
                name,
                currency,
                updated,
                change: 0.0,
                changePercent: 0.0
              }
            }
            return prev
          },
          history
        )

        const tickers = Object.keys(history)
          .filter((key) => {
            const { page: historyPage } = history[key]
            return historyPage === parsedData.page
          })
          .map((key) => {
            const {
              ticker,
              name,
              currency,
              updated,
              price,
              color,
              change,
              changePercent
            } = history[key]
            return (
              <StyledListRow key={key}>
                <StyledSpan>{key}</StyledSpan>
                <StyledSpan>{name}</StyledSpan>
                <StyledSpan>{currencyNumberFormatter.format(price)}</StyledSpan>
                <StyledSpan style={{ color }}>{decimalNumberFormatter.format(change)}</StyledSpan>
                <StyledSpan style={{ color }}>
                  {percentNumberFormatter.format(changePercent)}
                </StyledSpan>
                <StyledSpan>{dayjs(new Date(updated)).format('HH:mm:ss')}</StyledSpan>
              </StyledListRow>
            )
          })

        tickerHistoryRef.current = history
        tickers.splice(0, 0, headerRow)
        setTickers(<ul>{tickers}</ul>)
      } catch (e) {
        console.log(e)
      }
    }
  }, [data, setTickers])

  return (
    <>
      <PageNavigation currentPage={getPage(data)} />
      <div>{tickers}</div>
    </>
  )
}

StockPriceInfo.displayName = 'StockPriceInfo'
export default StockPriceInfo
