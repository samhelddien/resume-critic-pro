ResumeCritic Pro 🚀
Analista de Carreira Estratégico & Inteligência de Mercado com Gemini AI

O ResumeCritic Pro é uma plataforma de análise de candidaturas inspirada no design system da Apple (iOS Dark Mode). Utilizando o modelo Gemini 2.5 Flash, o aplicativo atua como um recrutador sênior virtual, fornecendo críticas honestas, mapeamento de competências e inteligência salarial em tempo real.
✨ Funcionalidades Principais

📑 Motor de Extração Universal
Suporte total para diversos formatos de currículo, garantindo que nenhum dado seja perdido:
PDFs Digitais e Escaneados: Leitura nativa e fallback automático para OCR (Visão Computacional) se o documento for uma imagem.
Microsoft Word (.docx): Processamento de documentos Office via Mammoth.js.
Imagens Profissionais: Carregue fotos do seu currículo (.jpg, .png) e deixe a IA extrair o texto.
Perfil Instantâneo: Geração automática de um card de perfil profissional (Nome, Headline, Skills) após o upload.

🎯 Dashboard de Análise Crítica
Match de Equivalência: Uma percentagem real baseada no confronto entre o seu histórico e os requisitos da vaga.
Tradução Estratégica: A IA decifra o "corporativês" e explica o que a empresa realmente procura.
Mapeamento de Gaps: Identificação clara de lacunas de competência e pontos de melhoria.
Métricas iOS Style: Widgets detalhados para avaliação de Senioridade, Soft Skills e Experiência Técnica.

⚡ AI Power-Ups ✨
Recursos exclusivos para acelerar a sua contratação:
Otimizador de Conquistas: Reescreve os seus pontos do CV focando em métricas de impacto.
Radar Técnico: Gera perguntas técnicas avançadas sobre a stack específica da vaga.
Decodificador de Cultura: Analisa o tom da vaga para prever o ambiente da empresa.
Geradores Instantâneos: Carta de Apresentação, Simulado de Entrevista e Elevator Pitch de 30s.

💰 Inteligência Salarial
Busca Web Ativa: Se a vaga for confidencial, a IA utiliza o Google Search para estimar o salário com base no cargo e empresa, convertendo automaticamente para Real (BRL).

🛠️ Stack Tecnológica
Frontend: React.js (Hooks, Context, Functional Components).
Estilização: Tailwind CSS com foco em Glassmorphism e Dark Mode.
Inteligência Artificial: Google Gemini 2.5 Flash API (Text, Vision & Search Tools).
Bibliotecas de Documentos: PDF.js, Mammoth.js.

Iconografia: Lucide React.

🚀 Como Rodar Localmente
Siga os passos abaixo para configurar o projeto no seu VS Code:

Clone o Repositório:
git clone [https://github.com/seu-utilizador/resumecritic-pro.git](https://github.com/seu-utilizador/resumecritic-pro.git)


Instale as Dependências:
npm install
npm install lucide-react mammoth pdfjs-dist


Configure as Variáveis de Ambiente:
Crie um ficheiro .env na raiz do projeto e adicione a sua chave:

VITE_GEMINI_API_KEY=SUA_CHAVE_AQUI


Inicie o Servidor de Desenvolvimento:
npm run dev


📱 Interface (UI)
O design foi concebido para oferecer uma experiência de utilizador fluida e elegante:
Layout Centralizado: Foco total na entrada de dados (CV e Vaga) no topo do ecrã.
Dashboard Expansível: Os resultados surgem abaixo de forma orgânica, facilitando a comparação.
Feedback Visual: Skeletons de carregamento, indicadores de progresso e animações iOS.

📄 Licença
Este projeto está sob a licença MIT. Consulte o ficheiro LICENSE para mais detalhes.
Desenvolvido para transformar a forma como candidatos se preparam para o mercado global.
