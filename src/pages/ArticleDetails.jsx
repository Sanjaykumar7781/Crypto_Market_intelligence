import { Link, useParams } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import { articles } from '../data/articles.js';

export default function ArticleDetails() {
  const { slug } = useParams();
  const article = articles.find((item) => item.slug === slug) || articles[0];
  const related = articles.filter((item) => item.slug !== article.slug);

  return (
    <PageShell>
      <article className="mx-auto max-w-4xl">
        <div className="flex flex-wrap gap-2">
          {article.tags.map((tag) => <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-cyanGlow">{tag}</span>)}
        </div>
        <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">{article.title}</h1>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
          <span>{article.author}</span>
          <span>{article.date}</span>
          <span>{article.readingTime}</span>
        </div>
        <div className="mt-8 glass rounded-lg p-6 text-lg leading-8 text-slate-300">
          <p>{article.body}</p>
          <p className="mt-5">
            For better results, combine sentiment, liquidity, exchange flows, and time horizon before making allocation decisions. Crypto Market keeps these signals in one dashboard so research stays focused.
          </p>
        </div>
      </article>
      <section className="mx-auto mt-8 max-w-4xl">
        <h2 className="mb-4 text-xl font-extrabold">Related Articles</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {related.map((item) => (
            <Link key={item.slug} to={`/articles/${item.slug}`} className="glass rounded-lg p-4 hover:border-cyanGlow/40">
              <h3 className="font-extrabold">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{item.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
