import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import logo from "@/assets/getsemani-logo.png";

const footerLinks = [
  { to: "/", label: "Início" },
  { to: "/manifestar", label: "Manifestar" },
  { to: "/visualizar", label: "Visualizar" },
  { to: "/meditar", label: "Meditar" },
  { to: "/diario", label: "Diário" },
  { to: "/configuracoes", label: "Ajustes" },
] as const;

export function DesktopFooter() {
  return (
    <footer className="desktop-footer font-sans-g" aria-label="Rodapé">
      <div className="desktop-footer-inner">
        <div className="desktop-footer-divider" aria-hidden="true">
          <span />
          <Sparkles />
          <span />
        </div>

        <Link to="/" aria-label="Getsêmani — página inicial">
          <img className="desktop-footer-logo" src={logo} alt="Getsêmani" />
        </Link>

        <p className="desktop-footer-tagline font-serif-g">
          Manifeste aquilo que deseja, como se já fosse seu.
        </p>

        <nav className="desktop-footer-nav" aria-label="Navegação do rodapé">
          {footerLinks.map(({ to, label }) => (
            <Link key={to} to={to}>
              {label}
            </Link>
          ))}
        </nav>

        <p className="desktop-footer-copyright">
          © {new Date().getFullYear()} Getsêmani. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
