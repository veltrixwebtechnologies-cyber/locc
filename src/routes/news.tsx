import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ChevronRight, Newspaper, Clock, User, ArrowRight, BookOpen } from "lucide-react";
import { m } from "motion/react";
import { NEWS_ARTICLES, type NewsArticle } from "@/lib/platform-data";

export const Route = createFileRoute("/news")({ component: NewsPage });

const catColor: Record<NewsArticle["category"], string> = {
  launch: "bg-emerald-100 text-emerald-800",
  seller_story: "bg-amber-100 text-amber-800",
  brand: "bg-purple-100 text-purple-800",
  guide: "bg-sky-100 text-sky-800",
  community: "bg-rose-100 text-rose-800",
  update: "bg-indigo-100 text-indigo-800",
  travel: "bg-teal-100 text-teal-800",
};

const catLabel: Record<NewsArticle["category"], string> = {
  launch: "Launch", seller_story: "Seller Story", brand: "Brand",
  guide: "Guide", community: "Community", update: "Update", travel: "Travel",
};

function NewsPage() {
  const [filter, setFilter] = useState<"all" | NewsArticle["category"]>("all");
  const categories: ("all" | NewsArticle["category"])[] = ["all", "launch", "seller_story", "brand", "guide", "community", "update"];

  const filtered = filter === "all" ? NEWS_ARTICLES : NEWS_ARTICLES.filter((a) => a.category === filter);
  const featured = NEWS_ARTICLES.find((a) => a.featured);
  const rest = filtered.filter((a) => a.id !== featured?.id);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 pb-12">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" search={{ category: undefined, q: undefined }} className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-foreground">News</span>
        </div>

        {/* Hero */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white shadow-xl sm:p-8"
        >
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-purple-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-purple-300">LocalShore Stories</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
            News, stories & updates
          </h1>
          <p className="mt-2 max-w-lg text-sm text-slate-300">
            Stay updated with the latest from LocalShore — launches, seller stories, guides, and community highlights.
          </p>
        </m.div>

        {/* Filters */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold capitalize transition ${
                filter === c ? "bg-purple-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-purple-50"
              }`}
            >
              {c === "all" ? "All" : catLabel[c]}
            </button>
          ))}
        </div>

        {/* Featured Article */}
        {featured && filter === "all" && (
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md"
          >
            <div className="flex flex-col sm:flex-row">
              <div className="relative aspect-[16/10] sm:aspect-auto sm:w-1/2 shrink-0 overflow-hidden">
                <img src={featured.imageUrl} alt={featured.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute top-3 left-3 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-bold text-slate-900">
                  Featured
                </span>
              </div>
              <div className="flex flex-col justify-center p-5 sm:p-6">
                <span className={`inline-block w-fit rounded-full px-2.5 py-0.5 text-[10px] font-bold ${catColor[featured.category]}`}>
                  {catLabel[featured.category]}
                </span>
                <h2 className="mt-2 font-display text-xl font-extrabold text-slate-900">{featured.title}</h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{featured.excerpt}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><User className="h-3 w-3" /> {featured.author}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {featured.readingTime} min read</span>
                  <span>{new Date(featured.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                </div>
                <button className="mt-4 flex items-center gap-1 text-sm font-bold text-purple-700 hover:underline">
                  Read more <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </m.div>
        )}

        {/* Article Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((article, i) => (
            <m.div
              key={article.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img src={article.imageUrl} alt={article.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-4">
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${catColor[article.category]}`}>
                  {catLabel[article.category]}
                </span>
                <h3 className="mt-2 text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-purple-700 transition-colors">
                  {article.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">{article.excerpt}</p>
                <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-400">
                  <span>{article.author}</span>
                  <span className="flex items-center gap-0.5"><BookOpen className="h-3 w-3" /> {article.readingTime} min</span>
                  <span>{new Date(article.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                </div>
              </div>
            </m.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500">No articles in this category yet.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
