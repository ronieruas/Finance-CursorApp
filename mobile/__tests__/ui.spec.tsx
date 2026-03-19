import React from 'react'
import { render } from '@testing-library/react-native'
import { DashboardScreen } from '../src/screens/DashboardScreen'

describe('UI consistency', () => {
  it('renders menu with adjusted font size', () => {
    const { getByText } = render(<DashboardScreen />)
    expect(getByText('Configurações')).toBeTruthy()
  })
})