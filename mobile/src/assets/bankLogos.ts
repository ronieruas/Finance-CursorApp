import { ImageSourcePropType } from 'react-native';

// Logos de bancos/cartões (colocadas em `mobile/assets/banks/`).
// A chave é comparada com o nome do banco/cartão por palavras, sem
// diferenciar maiúsculas/acentos. Ex.: a chave "nubank" casa com
// "Nubank", "Cartão Nubank"; "c6 invest" casa com "C6 Invest".
import brb from '../../assets/banks/BRB.png';
import c6 from '../../assets/banks/C6.png';
import c6Cartao from '../../assets/banks/C6 cartão.png';
import c6Invest from '../../assets/banks/C6 invest.png';
import mercadoPago from '../../assets/banks/Mercado Pago.png';
import nomad from '../../assets/banks/Nomad.png';
import nomadReal from '../../assets/banks/Nomad Real.png';
import nuCaixinha from '../../assets/banks/nu caixinha.png';
import nuDolares from '../../assets/banks/Nu dólares.png';
import nubank from '../../assets/banks/nubank.png';
import nubankCartao from '../../assets/banks/nubank cartão.png';
import wise from '../../assets/banks/Wise.png';

export const BANK_LOGOS: Record<string, ImageSourcePropType> = {
  nubank,
  'nubank cartao': nubankCartao,
  'nu caixinha': nuCaixinha,
  'nu dolares': nuDolares,
  'c6 cartao': c6Cartao,
  'c6 invest': c6Invest,
  c6,
  'nomad real': nomadReal,
  nomad,
  wise,
  'mercado pago': mercadoPago,
  brb,
};
