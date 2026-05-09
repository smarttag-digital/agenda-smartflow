import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";

const DISMISS_KEY = "sf_install_dismissed_v1";

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferred, setDeferred] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-ignore iOS
      window.navigator.standalone === true;
    if (standalone) return;
    const ua = window.navigator.userAgent;
    const mobile = /Android|iPhone|iPad|iPod/i.test(ua);
    if (!mobile) return;
    const ios = /iPhone|iPad|iPod/i.test(ua);
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (ios) {
      const t = setTimeout(() => setShow(true), 1500);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  const install = async () => {
    if (deferred) {
      deferred.prompt();
      await deferred.userChoice;
      dismiss();
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="fixed inset-x-3 bottom-3 z-50 sm:left-auto sm:right-4 sm:max-w-sm"
        >
          <div className="glass shadow-soft rounded-2xl border p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-soft-gradient p-2">
                <Logo size={36} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Instalar SmartFlow Agenda</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {isIOS ? (
                    <>
                      Toque em <Share className="inline h-3 w-3" /> e depois{" "}
                      <span className="font-medium">Adicionar à Tela de Início</span>{" "}
                      <Plus className="inline h-3 w-3" />
                    </>
                  ) : (
                    "Acesso rápido como aplicativo, em tela cheia."
                  )}
                </p>
                {!isIOS && deferred && (
                  <Button onClick={install} size="sm" className="mt-3 bg-brand-gradient text-white hover:opacity-95">
                    Instalar app
                  </Button>
                )}
              </div>
              <button
                onClick={dismiss}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
