import { FAQS } from "@/lib/site/copy";

export function FaqList() {
  return (
    <dl className="grid gap-3">
      {FAQS.map((item) => (
        <div key={item.question} className="rounded-2xl border border-border bg-surface px-5 py-5">
          <dt className="text-base font-semibold tracking-tight text-foreground">{item.question}</dt>
          <dd className="mt-2 leading-7 text-muted">{item.answer}</dd>
        </div>
      ))}
    </dl>
  );
}
