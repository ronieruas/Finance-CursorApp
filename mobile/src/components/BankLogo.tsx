import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BANK_LOGOS } from '../assets/bankLogos';

type Props = {
  /** Nome do banco ou do cartão (ex: "Nubank", "C6 Bank", "Cartão Nubank") */
  name?: string | null;
  size?: number;
};

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const tokenize = (value: string) =>
  normalize(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/**
 * Procura no registro a chave cujas palavras estejam todas presentes no nome
 * informado, independente da ordem. Prefere a chave mais específica.
 */
const resolveLogo = (name?: string | null): ImageSourcePropType | null => {
  if (!name) return null;
  const haystack = tokenize(name);
  if (haystack.length === 0) return null;
  const match = Object.keys(BANK_LOGOS)
    .filter((key) => {
      const tokens = tokenize(key);
      return tokens.length > 0 && tokens.every((token) => haystack.includes(token));
    })
    .sort((a, b) => tokenize(b).length - tokenize(a).length)[0];
  return match ? BANK_LOGOS[match] : null;
};

/**
 * Logo do banco/cartão. Cai em um ícone genérico quando a imagem não está cadastrada.
 */
export const BankLogo: React.FC<Props> = ({ name, size = 40 }) => {
  const source = resolveLogo(name);

  if (!source) {
    return (
      <View style={[styles.fallback, { width: size, height: size, borderRadius: size * 0.25 }]}>
        <Ionicons name="card-outline" size={size * 0.55} color="#6B7280" />
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={{ width: size, height: size, borderRadius: size * 0.25 }}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
