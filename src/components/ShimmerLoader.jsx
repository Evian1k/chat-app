import React from 'react';

const ShimmerLoader = ({ type = 'general' }) => {
  if (type === 'matching') {
    return (
      <div className="min-h-screen bg-transparent p-4 flex flex-col">
        <header className="flex items-center justify-between mb-4 z-10">
          <div className="w-10 h-10 bg-white/10 rounded-full shimmer"></div>
          <div className="w-28 h-6 bg-white/10 rounded shimmer"></div>
          <div className="w-10 h-10 bg-white/10 rounded-full shimmer"></div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center relative w-full">
          <div className="w-full max-w-sm h-[70vh] max-h-[550px] bg-white/10 rounded-2xl shimmer"></div>
        </main>
        <footer className="flex justify-center items-center gap-4 mt-6 z-10">
          <div className="w-16 h-16 bg-white/10 rounded-full shimmer"></div>
          <div className="w-20 h-20 bg-white/10 rounded-full shimmer"></div>
          <div className="w-16 h-16 bg-white/10 rounded-full shimmer"></div>
        </footer>
      </div>
    );
  }

  if (type === 'chat') {
    return (
      <div className="min-h-screen flex flex-col bg-transparent">
        <div className="flex-1 flex overflow-hidden">
          <aside className="hidden md:block w-80 bg-black/30 p-2 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="w-12 h-12 rounded-full bg-white/10 shimmer"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 shimmer rounded"></div>
                  <div className="h-3 w-3/4 bg-white/10 shimmer rounded"></div>
                </div>
              </div>
            ))}
          </aside>
          <main className="flex-1 flex flex-col">
            <header className="bg-black/30 p-3 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 shimmer"></div>
                <div className="space-y-1.5">
                  <div className="h-4 w-24 bg-white/10 shimmer rounded"></div>
                  <div className="h-3 w-16 bg-white/10 shimmer rounded"></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/10 shimmer"></div>
                <div className="w-8 h-8 rounded-full bg-white/10 shimmer"></div>
              </div>
            </header>
            <div className="flex-1 p-4 space-y-4">
                <div className="flex justify-start"><div className="w-2/5 h-12 bg-white/10 shimmer rounded-lg"></div></div>
                <div className="flex justify-end"><div className="w-1/2 h-16 bg-purple-500/20 shimmer rounded-lg"></div></div>
                <div className="flex justify-start"><div className="w-1/3 h-10 bg-white/10 shimmer rounded-lg"></div></div>
            </div>
            <footer className="p-4 bg-black/30 border-t border-white/10">
                <div className="h-10 bg-white/10 shimmer rounded-full"></div>
            </footer>
          </main>
        </div>
      </div>
    );
  }

  // General loader
  return (
    <div className="p-4 space-y-4">
      <div className="h-24 w-full bg-white/10 shimmer rounded-lg"></div>
      <div className="h-48 w-full bg-white/10 shimmer rounded-lg"></div>
      <div className="h-48 w-full bg-white/10 shimmer rounded-lg"></div>
    </div>
  );
};

export default ShimmerLoader;