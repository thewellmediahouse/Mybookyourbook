import { FAQS } from "@/lib/site/copy";

export function FaqList({ className }: { className?: string }) {
  return (
    <div className={className}>
      {FAQS.map((item) => (
        <details
          key={item.question}
          className="group border-b border-[#111A31]/10 py-2 first:border-t first:border-[#111A31]/10"
        >
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-left text-base font-semibold tracking-tight text-[#111A31] [&::-webkit-details-marker]:hidden">
            {item.question}
            <span className="shrink-0 text-lg text-[#2787FF] group-open:rotate-45" aria-hidden>
              +
            </span>
          </summary>
          <p className="pb-4 text-base leading-7 text-[#5A6480]">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
