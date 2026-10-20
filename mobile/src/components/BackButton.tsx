import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

type Props = {
  onPress?: () => void;
  color?: string;
};

/**
 * Botão de voltar padrão do app.
 * Formato único usado em todas as telas: seta grande (28) azul, alvo de toque 40x40.
 */
export const BackButton: React.FC<Props> = ({ onPress, color = '#007AFF' }) => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      accessibilityLabel="Voltar"
      accessibilityRole="button"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      onPress={onPress ?? (() => (navigation as any).goBack?.())}
      style={styles.button}
    >
      <Ionicons name="arrow-back" size={28} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
