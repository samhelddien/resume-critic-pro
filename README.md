# ResumeCritic Pro 🚀  
**Analista de Carreira Estratégico & Inteligência de Mercado com Gemini AI**

ResumeCritic Pro é uma plataforma avançada de análise de currículos e candidaturas, projetada para atuar como um **recrutador sénior virtual**. Inspirada no **design system da Apple (iOS Dark Mode)**, a aplicação combina UX premium com **inteligência artificial multimodal**, entregando feedback honesto, estratégico e acionável para o mercado global.

---

## ✨ Visão Geral

O ResumeCritic Pro utiliza o **Google Gemini 2.5 Flash** para analisar currículos, interpretar vagas, mapear competências e gerar inteligência salarial em tempo real.  
O foco é simples: **aumentar drasticamente suas chances de contratação**, com clareza e precisão.

---

## ✨ Funcionalidades Principais

### 📑 Motor de Extração Universal

Compatível com múltiplos formatos, sem perda de informação:

- **PDFs Digitais e Escaneados**
  - Leitura nativa
  - Fallback automático para OCR via **Gemini Vision**
- **Microsoft Word (.docx)**
  - Parsing com **Mammoth.js**
- **Imagens Profissionais**
  - Suporte a `.jpg` e `.png`
  - Extração inteligente de texto
- **Perfil Instantâneo**
  - Geração automática de um *Profile Card* com:
    - Nome
    - Título profissional
    - Skills principais

---

### 🎯 Dashboard de Análise Crítica

- **Match de Equivalência**
  - Percentual real de compatibilidade entre CV e vaga
- **Tradução Estratégica**
  - Decodificação do “corporativês”
  - O que a empresa *realmente* quer dizer
- **Mapeamento de Gaps**
  - Lacunas técnicas e comportamentais
  - Sugestões diretas de melhoria
- **Métricas iOS Style**
  - Senioridade
  - Soft Skills
  - Experiência Técnica

---

### ⚡ AI Power-Ups ✨

Ferramentas premium para acelerar sua contratação:

- **Otimizador de Conquistas**
  - Reescrita de bullets focada em:
    - Impacto
    - Métricas
    - Resultados reais
- **Radar Técnico**
  - Geração de perguntas técnicas avançadas
  - Baseadas na stack da vaga
- **Decodificador de Cultura**
  - Análise do tom da vaga
  - Previsão de ambiente e cultura organizacional
- **Geradores Instantâneos**
  - Carta de Apresentação
  - Simulação de Entrevista
  - Elevator Pitch (30s)

---

### 💰 Inteligência Salarial

- **Busca Web Ativa**
  - Estimativa salarial mesmo em vagas confidenciais
  - Baseada em:
    - Cargo
    - Senioridade
    - Empresa
    - Mercado global
- **Conversão Automática**
  - BRL ou moeda local do utilizador

---

## 🛠️ Stack Tecnológica

- **Core:** React.js (Functional Components & Hooks)
- **UI/UX:** Tailwind CSS  
  - Dark Mode
  - Glassmorphism
  - Alto contraste
- **IA:** Google Gemini 2.5 Flash API  
  - Multimodal (Text + Vision)
- **Parsing de Arquivos:**
  - PDF: `pdfjs-dist`
  - DOCX: `mammoth`
- **Ícones:** Lucide React

---

## 🚀 Como Rodar Localmente

### 1️⃣ Clonar o Repositório

```bash
git clone https://github.com/seu-utilizador/resumecritic-pro.git
cd resumecritic-pro
2️⃣ Instalar Dependências
bash
Copiar código
npm install
npm install lucide-react mammoth pdfjs-dist
3️⃣ Configurar Variáveis de Ambiente
Crie um ficheiro .env na raiz do projeto:

env
Copiar código
VITE_GEMINI_API_KEY=SUA_CHAVE_AQUI
4️⃣ Iniciar o Servidor de Desenvolvimento
bash
Copiar código
npm run dev
📱 Interface (UI)
Layout Centralizado

Upload e inputs em foco total

Dashboard Expansível

Resultados surgem de forma progressiva

Feedback Visual

Skeleton loaders

Animações suaves estilo iOS

Dark Mode Nativo

Inspirado no iOS / Apple Design System

📄 Licença
Este projeto está licenciado sob a MIT License.
Consulte o ficheiro LICENSE para mais informações.

🌍 Missão
Transformar a forma como profissionais se preparam para o mercado global,
unindo design de excelência, inteligência artificial e estratégia de carreira.

