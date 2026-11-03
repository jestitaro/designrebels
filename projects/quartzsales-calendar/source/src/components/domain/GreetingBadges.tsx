import { MessageSquareOff } from 'lucide-react';
import type { Greeting, GreetingStatus } from '../../types';
import { parseSlack } from '../../lib/slackFormat';
import { Badge } from '../ui/Badge';
import { bestGreetingStatus, GREETING_STATUS_META } from './greetingMeta';
import { cn } from '../../lib/cn';

export function GreetingStatusBadge({ status, prefix }: { status: GreetingStatus; prefix?: string }) {
  const meta = GREETING_STATUS_META[status];
  return (
    <Badge tone={meta.tone} icon={meta.icon}>
      {prefix ? `${prefix}: ${meta.label.toLowerCase()}` : meta.label}
    </Badge>
  );
}

/** Estado del saludo más avanzado de un evento, o "Sin saludo". */
export function EventGreetingBadge({ greetings }: { greetings: Greeting[] | undefined }) {
  const status = bestGreetingStatus((greetings ?? []).map((g) => g.status));
  if (!status) return <Badge icon={MessageSquareOff}>Sin saludo</Badge>;
  return <GreetingStatusBadge status={status} prefix="Saludo" />;
}

/** Vista previa con formato tipo Slack (sin HTML inyectado). */
export function SlackPreview({ text, className }: { text: string; className?: string }) {
  const tokens = parseSlack(text);
  return (
    <div className={cn('text-[15px] leading-relaxed break-words text-text', className)}>
      {tokens.map((t, i) => {
        switch (t.type) {
          case 'break': return <br key={i} />;
          case 'bold': return <strong key={i} className="font-semibold">{t.text}</strong>;
          case 'italic': return <em key={i}>{t.text}</em>;
          case 'strike': return <s key={i}>{t.text}</s>;
          case 'code': return <code key={i} className="rounded-xs bg-surface-3 px-1 py-0.5 font-mono text-[13px] text-danger-fg">{t.text}</code>;
          default: return <span key={i}>{t.text}</span>;
        }
      })}
    </div>
  );
}
