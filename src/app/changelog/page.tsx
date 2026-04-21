import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Novidades — Knowala',
  description: 'Acompanhe as atualizações e melhorias do Knowala.',
}

interface ChangelogEntry {
  date: string
  label: string
  title: string
  items: string[]
  isLaunch?: boolean
}

const entries: ChangelogEntry[] = [
  {
    date: '21 de abril de 2026',
    label: 'Conquistas',
    title: '18 conquistas com tiers progressivos',
    items: [
      'Novas badges para quem vota, responde, comenta e convida pessoas.',
      'Cada categoria tem níveis — quanto mais você participa, mais conquistas desbloqueia.',
      'Quem já tinha atividade recebeu as conquistas retroativamente.',
    ],
  },
  {
    date: '19 de abril de 2026',
    label: 'Guardar & Buscar',
    title: 'Salve itens e encontre qualquer conteúdo',
    items: [
      'Salve perguntas, respostas e comentários para ler quando quiser.',
      'Nova página /guardados com tudo que você salvou.',
      'Busca full-text disponível no menu: encontre qualquer pergunta ou resposta da plataforma.',
    ],
  },
  {
    date: '17 de abril de 2026',
    label: 'Notificações',
    title: 'Resumo semanal e controle de e-mails',
    items: [
      'Novo resumo semanal toda semana no domingo: destaques, sua atividade e perguntas abertas.',
      'Página /notificações para controlar separadamente o e-mail diário e o semanal.',
      'Você pode cancelar cada tipo de e-mail de forma independente.',
    ],
  },
  {
    date: '15 de abril de 2026',
    label: 'Convites',
    title: 'Traga amigos para o Knowala',
    items: [
      'Seus links de convite ficam disponíveis diretamente no menu — sem precisar fazer nada.',
      'Compartilhe pelo app em mobile ou copie o link.',
    ],
  },
  {
    date: '10 de abril de 2026',
    label: 'Edição',
    title: 'Edite o que você escreveu',
    items: [
      'Agora você pode editar respostas e comentários depois de publicar.',
      'Publicações editadas mostram "editado há X" para manter transparência.',
      'A caixa de texto cresce automaticamente enquanto você digita.',
    ],
  },
  {
    date: '1 de abril de 2026',
    label: 'Lançamento',
    title: 'Knowala está no ar',
    isLaunch: true,
    items: [
      'Pergunta do dia: uma nova pergunta toda manhã às 08h.',
      'Responda, vote e comente nas respostas da comunidade.',
      'E-mail diário com a pergunta do dia (opcional).',
      'Perfil com histórico de atividade e primeiras conquistas.',
      'Acesso por convite para garantir uma comunidade de qualidade.',
    ],
  },
]

const LABEL_COLORS: Record<string, string> = {
  Conquistas:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Guardar & Buscar': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Notificações: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Convites:     'bg-green-500/10 text-green-400 border-green-500/20',
  Edição:       'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Lançamento:   'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20',
}

export default function ChangelogPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Novidades</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Atualizações e melhorias do Knowala, do lançamento até hoje.
        </p>
      </div>

      <div className="relative">
        {/* linha vertical */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[var(--border)]" />

        <div className="space-y-10">
          {entries.map((entry) => (
            <div key={entry.date} className="relative pl-8">
              {/* bolinha na timeline */}
              <div
                className={`absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-2 ${
                  entry.isLaunch
                    ? 'border-[var(--accent)] bg-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--bg-primary)]'
                }`}
              />

              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs text-[var(--text-secondary)]">{entry.date}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                    LABEL_COLORS[entry.label] ?? 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)]'
                  }`}
                >
                  {entry.label}
                </span>
              </div>

              <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">
                {entry.title}
              </h2>

              <ul className="space-y-1.5">
                {entry.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--border)] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
