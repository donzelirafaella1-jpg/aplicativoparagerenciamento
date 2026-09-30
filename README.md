# Move Log TMS - Gestão Operacional de Transporte, Pátio e Docas

Sistema completo e profissional de **TMS (Transportation Management System)**, **YMS (Yard Management System)** e gestão de docas para o Centro de Distribuição da **Move Log**.

Projetado especificamente para as restrições operacionais do Centro de Distribuição:
- **32 caminhões por dia**
- **14 docas** de carga e descarga
- **Capacidade máxima de 8 veículos simultâneos** no pátio
- **Horários de operação:** 07:00–11:00 e 12:00–16:00
- **Intervalo obrigatório (11:00–12:00):** Bloqueio estrito no agendamento e nas docas

---

## 🚀 Principais Funcionalidades

1. **Controle Estrito de Capacidade do Pátio (8 Vagas)**
   - O sistema calcula a sobreposição contínua dos períodos de permanência considerando horário agendado, tempo de descarregamento e tempo estimado de permanência.
   - Quando um agendamento novo ou alterado provocar ocupação superior a 8 veículos em qualquer minuto, bloqueia a confirmação e exibe:
     > *"Horário indisponível. A capacidade máxima do pátio será atingida neste período."*
   - Sugestão automática dos próximos horários disponíveis dentro das janelas permitidas.
   - Autorização de sobrecarga manual para Gestores e Administradores com registro compulsório de justificativa na trilha de auditoria.

2. **Bloqueio do Intervalo Operacional (11:00 às 12:00)**
   - O intervalo é destacado visualmente com hachuras de bloqueio na agenda e na grade horária.
   - Validação algorítmica impede agendamentos que comecem, terminem ou atravessem este intervalo.

3. **Otimização Inteligente da Agenda ("Otimizar Agenda")**
   - Analisa todos os 32 caminhões do dia e redistribui horários e docas.
   - Enforça ocupação segura de pátio abaixo do limite de 8 (evitando gargalos).
   - Apresenta **modal de prévia comparativa** (horários atuais vs sugeridos, doca sugerida, redução de tempo de espera e pico de pátio) antes de qualquer aplicação.

4. **Painel de Controle Operacional (Dashboard)**
   - Monitoramento em tempo real:
     - Caminhões agendados, aguardando chegada, no pátio, aguardando doca, em descarregamento e finalizados
     - Ocupação do pátio (X/8) e vagas disponíveis
     - Docas ocupadas (X/14) e livres
     - Próxima vaga operacional disponível
     - Atrasos e chegadas antecipadas
     - Alerta visual imediato quando o pátio atinge 8/8
     - Tempos médios de espera, descarregamento e permanência

5. **Agenda Logística Interativa**
   - Visualização diária e semanal com clara separação dos turnos (07:00–11:00 e 12:00–16:00).
   - Cartões com placa, motorista, transportadora, tipo de carga, prioridade, status, doca e tempos estimados.
   - Status: Agendado, No Pátio, Aguardando Doca, Em Descarregamento, Finalizado, Atrasado, Cancelado.

6. **Check-in na Portaria com Cálculo de Delta**
   - Cálculo automático de desvio:
     - *"Veículo chegou 35 minutos após o horário agendado"* (Atraso)
     - *"Veículo chegou 20 minutos antes do horário agendado"* (Antecipado)
     - *"Veículo chegou pontualmente no horário agendado"*
   - Direcionamento automático para a próxima vaga livre (P01–P08).

7. **Gestão das 14 Docas (01 a 14)**
   - Status individual: Disponível, Aguardando Veículo, Em Descarregamento, Finalizada.
   - Controle de tempo decorrido, restante e barra de progresso.
   - Validação que impede a presença de dois veículos simultâneos na mesma doca.
   - Alocação manual e automática com liberação e avanço da fila.

8. **Fila de Espera Dinâmica**
   - Ordenação ponderada por prioridade (Urgente > Alta > Média > Baixa) e tempo de espera.
   - Alocação rápida quando uma doca é liberada.

9. **Relatórios Gerenciais e Análises**
   - Histograma de concentração horária (07:00 às 16:00).
   - Comparativo de volume Manhã (07:00–11:00) vs Tarde (12:00–16:00).
   - Desempenho e pontualidade por Transportadora.
   - Distribuição por Tipo de Carga e Prioridade.
   - Exportação em CSV e impressão formatada.

10. **Perfis de Acesso (RBAC)**
    - Administrador
    - Gestor Logístico
    - Operador de Pátio
    - Operador de Doca
    - Usuário Somente Leitura

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion.
- **Backend:** Node.js, Express, TypeScript (`tsx`).
- **Build & Dev:** Vite com middlewares integrados no servidor Express.
- **Gerenciador de Pacotes:** `npm`.

---

## 💻 Instalação e Execução

### 1. Instalar dependências
```bash
npm install
```

### 2. Executar em modo de desenvolvimento
```bash
npm run dev
```
O servidor iniciará em `http://localhost:3000` (ou na porta configurada).

### 3. Verificar tipagem e linting
```bash
npm run lint
```

### 4. Compilar para produção
```bash
npm run build
```

### 5. Iniciar em produção
```bash
npm run start
```
