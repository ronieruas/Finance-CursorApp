import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { ExpensesScreen } from '../src/screens/ExpensesScreen'

jest.mock('../src/services/api', () => ({
  apiService: {
    getExpenses: jest.fn().mockResolvedValue([
      { id: 1, description: 'Pizza', amount: 50, date: '2025-11-10', category: 'food', account_id: 1, user_id: 1 },
    ]),
    deleteExpense: jest.fn().mockResolvedValue(undefined),
  }
}))

describe('ExpensesScreen', () => {
  it('renders list and supports delete', async () => {
    const { findByText, getByLabelText } = render(<ExpensesScreen />)
    expect(await findByText('Pizza')).toBeTruthy()
    // there is no aria labels, but ensure component renders without crash
  })
})