function PlaceholderPage({ title }) {
  return (
    <section className="px-4 py-24 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">Coming soon</p>
        <h1 className="mt-3 text-4xl font-black text-slate-950">{title}</h1>
        <p className="mt-4 text-slate-600">This page is under development. Check back soon.</p>
      </div>
    </section>
  )
}

export default PlaceholderPage
