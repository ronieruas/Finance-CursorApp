import appLogo from './logo.png';

// Carrega todas as logos de bancos/cartões de ./banks automaticamente.
// Para adicionar um novo banco, basta colocar o arquivo PNG nesta pasta
// com o nome correspondente (ex.: "Nubank.png", "C6 invest.png").
const bankContext = require.context('./banks', false, /\.png$/i);

const normalize = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const tokenize = (value) => normalize(value).split(/[^a-z0-9]+/).filter(Boolean);

// Chave = nome do arquivo sem extensão (ex.: "C6 invest.png" -> "C6 invest")
const BANK_LOGOS = bankContext.keys().reduce((acc, key) => {
  const fileName = key.replace(/^\.\//, '').replace(/\.png$/i, '');
  const mod = bankContext(key);
  acc[fileName] = mod && mod.default ? mod.default : mod;
  return acc;
}, {});

/**
 * Retorna a URL da logo cujas palavras estejam todas presentes no nome
 * informado, independente da ordem. Prefere a chave mais específica.
 * Retorna null quando não há correspondência.
 */
export const getBankLogo = (name) => {
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

export { appLogo };
