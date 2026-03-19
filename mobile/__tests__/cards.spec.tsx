import React from 'react'
import { render } from '@testing-library/react-native'
import { CreditCardsScreen } from '../src/screens/CreditCardsScreen'

jest.mock('../src/services/api', () => ({
  apiService: {
    getCardSummary: jest.fn().mockResolvedValue([
      { card_id: 1, card_name: 'Visa Gold', gastos_mes: 1000, fatura_atual: 800, fatura_fechada_valor: 200, fatura_fechada_status: 'paga' },
    ]),
    getCreditCards: jest.fn().mockResolvedValue([{ id:1, name:'Visa Gold', brand:'Visa', bank:'Banco X', due_day:10, closing_day:2 }]),
  }
}))

describe('CreditCardsScreen', () => {
  it('renders card name and brand/bank meta', async () => {
    const { findByText } = render(<CreditCardsScreen />)
    expect(await findByText('Visa Gold')).toBeTruthy()
    expect(await findByText(/Cartão • Visa/)).toBeTruthy()
  })
})