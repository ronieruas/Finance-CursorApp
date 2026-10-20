import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import C6NotificationListener, { CapturedNotification } from '../../modules/c6-notification-listener';
import { apiService, CreditCard } from '../services/api';
import { BackButton } from '../components/BackButton';

type ParsedNotification = {
  bankKey: 'c6' | 'nubank' | null;
  bankLabel: string;
  amount: number | null;
  description: string | null;
  purchaseDate: string;
  rawText: string;
};

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const formatDateBR = (timestamp: number) => {
  const d = new Date(timestamp);
  return d.toLocaleDateString('pt-BR');
};

const parseCurrency = (input: string): number | null => {
  const match = input.match(/R\$\s*([\d.]+,\d{2})/i);
  if (!match) return null;
  const value = Number(match[1].replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) ? value : null;
};

const parseCapturedNotification = (item: CapturedNotification): ParsedNotification => {
  const title = item.title || '';
  const text = item.text || '';
  const subText = item.subText || '';
  const combined = `${item.appLabel} ${item.packageName} ${title} ${text} ${subText}`;
  const normalized = normalizeText(combined);

  const bankKey =
    normalized.includes('nubank') || normalized.includes('nupay')
      ? 'nubank'
      : normalized.includes('c6')
        ? 'c6'
        : null;

  let description: string | null = null;

  const c6Match = text.match(/,\s*em\s+(.+?),(?:\s*foi\s+aprovad[ao]|$)/i);
  if (c6Match?.[1]) {
    description = c6Match[1].trim();
  }

  if (!description) {
    const nubankMatch = text.match(/aprovado\s+em\s+(.+?)(?:\.|$)/i);
    if (nubankMatch?.[1]) {
      description = nubankMatch[1].trim();
    }
  }

  if (!description) {
    const genericMatch = text.match(/\bem\s+(.+?)(?:,|\.)\s*(?:foi\s+aprovad[ao]|$)/i);
    if (genericMatch?.[1]) {
      description = genericMatch[1].trim();
    }
  }

  const explicitDate = text.match(/\bdia\s+(\d{2}\/\d{2}\/\d{4})\b/i)?.[1];
  const purchaseDate = explicitDate || formatDateBR(item.postedAt);

  return {
    bankKey,
    bankLabel: bankKey === 'c6' ? 'C6 Bank' : bankKey === 'nubank' ? 'Nubank' : 'Desconhecido',
    amount: parseCurrency(combined),
    description,
    purchaseDate,
    rawText: text || title || subText || '',
  };
};

const findMatchingCard = (cards: CreditCard[], bankKey: ParsedNotification['bankKey']) => {
  if (!bankKey) return null;
  return (
    cards.find((card) => {
      const haystack = normalizeText(`${card.name} ${card.bank ?? ''}`);
      return bankKey === 'nubank'
        ? haystack.includes('nubank')
        : haystack.includes('c6');
    }) || null
  );
};

export const NotificationImportsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [captured, setCaptured] = useState<CapturedNotification[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const access = C6NotificationListener.isNotificationAccessGranted();
      setHasAccess(access);
      if (access) {
        try {
          await C6NotificationListener.syncActiveNotifications();
        } catch (syncError) {
          console.warn('Falha ao ler notificações em exibição:', syncError);
        }
      }
      const [items, creditCards] = await Promise.all([
        C6NotificationListener.getCapturedNotifications(),
        apiService.getCreditCards(),
      ]);
      setCaptured(items);
      setCards(creditCards);
    } catch (error) {
      console.error('Erro ao carregar importações:', error);
      Alert.alert('Importações', 'Não foi possível carregar as notificações capturadas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const parsedItems = useMemo(
    () =>
      captured.map((item) => {
        const parsed = parseCapturedNotification(item);
        const card = findMatchingCard(cards, parsed.bankKey);
        return { item, parsed, card };
      }),
    [captured, cards]
  );

  const handleRemove = async (id: string) => {
    await C6NotificationListener.removeCapturedNotification(id);
    await loadData();
  };

  const confirmImport = (entry: { item: CapturedNotification; parsed: ParsedNotification; card: CreditCard | null }) => {
    const { item, parsed, card } = entry;
    if (!parsed.amount || !parsed.description || !card) {
      Alert.alert(
        'Importações',
        'Ainda não consegui identificar cartão, valor ou estabelecimento com segurança nessa notificação.'
      );
      return;
    }
    const confirmedAmount = parsed.amount;
    const confirmedDescription = parsed.description;

    Alert.alert(
      'Confirmar importação',
      `${card.name}\n${confirmedDescription}\n${parsed.purchaseDate}\nR$ ${confirmedAmount.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
      })}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Importar',
          onPress: async () => {
            try {
              setImportingId(item.id);
              await apiService.createCardExpense({
                card,
                description: confirmedDescription,
                amount: confirmedAmount,
                purchase_date: parsed.purchaseDate,
                category: 'other',
                status: 'pendente',
                installment_total: 1,
              });
              await C6NotificationListener.removeCapturedNotification(item.id);
              await loadData();
              Alert.alert('Importações', 'Despesa importada com sucesso.');
            } catch (error: any) {
              const message = String(error?.message || '');
              if (message.includes('duplicada') || message.includes('409')) {
                Alert.alert(
                  'Importações',
                  'Essa despesa já parece ter sido lançada. Vou manter a confirmação para você decidir.',
                  [
                    { text: 'Manter', style: 'cancel' },
                    {
                      text: 'Descartar captura',
                      style: 'destructive',
                      onPress: async () => {
                        await handleRemove(item.id);
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Importações', message || 'Falha ao importar despesa.');
              }
            } finally {
              setImportingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title}>Importações</Text>
        <TouchableOpacity onPress={loadData} style={styles.headerAction}>
          <Text style={styles.headerActionText}>Atualizar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Carregando importações...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Leitura de notificações</Text>
            <Text style={styles.infoText}>
              O app captura novas notificações com `R$` de C6/Nubank em tempo real e também lê as que ainda estão
              sendo exibidas no aparelho. O lançamento continua exigindo sua confirmação.
            </Text>
            <Text style={[styles.infoBadge, hasAccess ? styles.infoBadgeOk : styles.infoBadgeWarn]}>
              {hasAccess ? 'Acesso concedido' : 'Acesso pendente'}
            </Text>
            {!hasAccess ? (
              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 12 }]}
                onPress={() => C6NotificationListener.openNotificationAccessSettings()}
              >
                <Text style={styles.primaryButtonText}>Abrir configurações</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.secondaryButton, { marginTop: 12 }]}
                onPress={async () => {
                  try {
                    await C6NotificationListener.syncActiveNotifications();
                    await loadData();
                    Alert.alert('Importações', 'Notificações em exibição verificadas.');
                  } catch (error: any) {
                    Alert.alert('Importações', error?.message || 'Falha ao ler notificações exibidas.');
                  }
                }}
              >
                <Text style={styles.secondaryButtonText}>Ler notificações exibidas agora</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.actionsRow}>
            <Text style={styles.sectionTitle}>Capturas ({parsedItems.length})</Text>
            {parsedItems.length > 0 ? (
              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Importações', 'Limpar todas as capturas?', [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Limpar',
                      style: 'destructive',
                      onPress: async () => {
                        await C6NotificationListener.clearCapturedNotifications();
                        await loadData();
                      },
                    },
                  ])
                }
              >
                <Text style={styles.clearText}>Limpar tudo</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {parsedItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nenhuma captura ainda</Text>
              <Text style={styles.emptyText}>
                Depois que o app nativo estiver instalado e com acesso liberado, as notificações aparecerão aqui.
              </Text>
            </View>
          ) : null}

          {parsedItems.map(({ item, parsed, card }) => (
            <View key={item.id} style={styles.captureCard}>
              <View style={styles.captureHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.captureBank}>{parsed.bankLabel}</Text>
                  <Text style={styles.captureMeta}>
                    {item.appLabel || item.packageName} • {new Date(item.postedAt).toLocaleString('pt-BR')}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleRemove(item.id)}>
                  <Text style={styles.discardText}>Descartar</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.rawTitle}>{item.title}</Text>
              <Text style={styles.rawText}>{item.text}</Text>

              <View style={styles.previewBox}>
                <Text style={styles.previewLabel}>Cartão</Text>
                <Text style={styles.previewValue}>{card ? card.name : 'Não identificado'}</Text>

                <Text style={styles.previewLabel}>Descrição</Text>
                <Text style={styles.previewValue}>{parsed.description || 'Aguardando validação'}</Text>

                <View style={styles.previewRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewLabel}>Valor</Text>
                    <Text style={styles.previewValue}>
                      {parsed.amount !== null
                        ? `R$ ${parsed.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : 'Aguardando validação'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewLabel}>Data</Text>
                    <Text style={styles.previewValue}>{parsed.purchaseDate}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (!parsed.amount || !parsed.description || !card || importingId === item.id) && styles.primaryButtonDisabled,
                ]}
                disabled={!parsed.amount || !parsed.description || !card || importingId === item.id}
                onPress={() => confirmImport({ item, parsed, card })}
              >
                <Text style={styles.primaryButtonText}>
                  {importingId === item.id ? 'Importando...' : 'Confirmar importação'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: { padding: 8 },
  backText: { fontSize: 22, color: '#111827' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  headerAction: { padding: 8 },
  headerActionText: { color: '#2563EB', fontWeight: '600' },
  scrollView: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, color: '#6B7280' },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  infoText: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  infoBadge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
  },
  infoBadgeOk: { backgroundColor: '#DCFCE7', color: '#166534' },
  infoBadgeWarn: { backgroundColor: '#FEF3C7', color: '#92400E' },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  clearText: { color: '#DC2626', fontWeight: '600' },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 },
  emptyText: { color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  captureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  captureHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  captureBank: { fontSize: 16, fontWeight: '700', color: '#111827' },
  captureMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  discardText: { color: '#DC2626', fontWeight: '600' },
  rawTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 },
  rawText: { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 12 },
  previewBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  previewLabel: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  previewValue: { fontSize: 14, color: '#111827', fontWeight: '600', marginBottom: 10 },
  previewRow: { flexDirection: 'row', gap: 12 },
  primaryButton: {
    marginTop: 12,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonDisabled: { backgroundColor: '#93C5FD' },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  secondaryButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#1D4ED8', fontWeight: '700' },
});
