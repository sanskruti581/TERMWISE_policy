import { Mail, MessageCircle } from 'lucide-react';

const ContactPage = () => (
  <div className="mx-auto max-w-3xl">
    <section className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/70 md:p-8">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
        <MessageCircle size={16} />
        Contact Us
      </div>

      <h1 className="text-3xl font-black text-slate-950 dark:text-white">Get in touch</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
        Questions, feedback, or support requests for TermsWise can be sent directly by email.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</p>
        <a
          href="mailto:sanskrutishinde581@gmail.com"
          className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
        >
          <Mail size={18} />
          sanskrutishinde581@gmail.com
        </a>
      </div>
    </section>
  </div>
);

export default ContactPage;
