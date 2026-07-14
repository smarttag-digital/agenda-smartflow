import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/leticia-logo.png.asset.json";
import fotoAsset from "@/assets/leticia-foto.png.asset.json";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 glass border-b border-border/60">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:py-4">
        <Link to="/" className="flex items-center gap-3 sm:gap-4 min-w-0">
          <img
            src={logoAsset.url}
            alt="Letícia Souza"
            className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 object-contain"
            draggable={false}
          />
          <div className="hidden h-8 w-px bg-border/70 sm:block" />
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={fotoAsset.url}
              alt="Foto Letícia Souza"
              className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-full object-cover ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
              draggable={false}
            />
            <div className="min-w-0 leading-tight">
              <p className="font-display text-[15px] sm:text-base font-semibold tracking-tight text-foreground truncate">
                Letícia Souza
              </p>
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Corretora · CRECI 207663
              </p>
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}
