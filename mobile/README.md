# Finance Mobile App

Aplicação mobile para gerenciamento financeiro pessoal, desenvolvida com React Native e Expo.

## 🚀 Tecnologias

- **React Native** com Expo
- **TypeScript** para tipagem estática
- **Firebase** para autenticação e banco de dados
- **React Navigation** para navegação entre telas

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn
- Expo CLI (`npm install -g @expo/cli`)
- Conta no Firebase

## ⚙️ Configuração do Firebase

### 1. Criar Projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Siga os passos para criar o projeto

### 2. Configurar Authentication

1. No painel do Firebase, vá em **Authentication**
2. Clique em **Começar**
3. Na aba **Sign-in method**, habilite **Email/senha**

### 3. Configurar Firestore

1. No painel do Firebase, vá em **Firestore Database**
2. Clique em **Criar banco de dados**
3. Escolha **Iniciar no modo de teste** (para desenvolvimento)
4. Selecione uma localização

### 4. Obter Configurações

1. No painel do Firebase, vá em **Configurações do projeto** (ícone de engrenagem)
2. Na seção **Seus aplicativos**, clique em **Adicionar app** > **Web**
3. Registre o app e copie as configurações

### 5. Configurar no App

Edite o arquivo `src/config/firebase.ts` e substitua as configurações:

```typescript
const firebaseConfig = {
  apiKey: "sua-api-key-aqui",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "seu-sender-id",
  appId: "seu-app-id"
};
```

## 🏃‍♂️ Como Executar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Iniciar o Projeto

```bash
npm start
```

### 3. Executar no Dispositivo

- **iOS**: Pressione `i` no terminal ou escaneie o QR code com a câmera
- **Android**: Pressione `a` no terminal ou escaneie o QR code com o app Expo Go
- **Web**: Pressione `w` no terminal

## 📱 Funcionalidades Implementadas

### ✅ Concluídas
- [x] Estrutura inicial do projeto
- [x] Configuração do Firebase
- [x] Sistema de autenticação (login/cadastro)
- [x] Navegação básica entre telas
- [x] Tela de login responsiva
- [x] Dashboard principal

### 🚧 Em Desenvolvimento
- [ ] Gerenciamento de contas
- [ ] Registro de despesas
- [ ] Registro de receitas
- [ ] Cartões de crédito
- [ ] Relatórios e gráficos
- [ ] Sincronização offline

## 📁 Estrutura do Projeto

```
mobile/
├── src/
│   ├── config/
│   │   └── firebase.ts          # Configuração do Firebase
│   ├── contexts/
│   │   └── AuthContext.tsx      # Contexto de autenticação
│   ├── navigation/
│   │   └── AppNavigator.tsx     # Sistema de navegação
│   ├── screens/
│   │   ├── LoginScreen.tsx      # Tela de login
│   │   └── DashboardScreen.tsx  # Dashboard principal
│   └── types/
│       └── index.ts             # Definições de tipos TypeScript
├── App.tsx                      # Componente principal
└── package.json                 # Dependências do projeto
```

## 🔧 Scripts Disponíveis

- `npm start` - Inicia o servidor de desenvolvimento
- `npm run android` - Executa no Android
- `npm run ios` - Executa no iOS (requer macOS)
- `npm run web` - Executa no navegador

## 📝 Próximos Passos

1. **Implementar CRUD de Contas**: Criar, listar, editar e excluir contas
2. **Implementar CRUD de Despesas**: Gerenciar despesas com categorias
3. **Implementar CRUD de Receitas**: Gerenciar receitas recorrentes
4. **Adicionar Gráficos**: Visualizações dos dados financeiros
5. **Sincronização Offline**: Cache local com sincronização automática
6. **Notificações Push**: Lembretes de vencimentos
7. **Exportação de Dados**: Relatórios em PDF/CSV

## 🐛 Problemas Conhecidos

- A configuração do Firebase precisa ser feita manualmente
- Ainda não há sincronização com o backend existente
- Interface ainda não está totalmente responsiva para tablets

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request