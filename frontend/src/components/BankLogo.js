import React from 'react';
import { getBankLogo } from '../assets/logos';

/**
 * Logo do banco/cartão ao lado do nome.
 * Não renderiza nada quando não há correspondência.
 *
 * Props:
 *  - name: nome do banco ou do cartão (ex.: "Nubank", "Cartão C6")
 *  - size: tamanho em px (padrão 22)
 */
function BankLogo({ name, size = 22, style }) {
  const src = getBankLogo(name);
  if (!src) return null;

  return (
    <img
      src={src}
      alt={name || ''}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        borderRadius: 4,
        flexShrink: 0,
        verticalAlign: 'middle',
        ...style,
      }}
    />
  );
}

export default BankLogo;
