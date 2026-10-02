import { Instagram, MessageCircle, Music2, Youtube } from "lucide-react";

const socialNetworks = [
  { label: "Instagram", href: "https://www.instagram.com/lenin_fontella", Icon: Instagram },
  { label: "TikTok", href: "https://www.tiktok.com/@lenin_fontella", Icon: Music2 },
  { label: "YouTube", href: "https://www.youtube.com/@lenincazzeri", Icon: Youtube },
  { label: "WhatsApp", href: "#", Icon: MessageCircle },
] as const;

export function SocialIcons({
  className = "",
  itemClassName = "",
  iconClassName = "",
}: {
  className?: string;
  itemClassName?: string;
  iconClassName?: string;
}) {
  return (
    <div className={className} aria-label="Redes sociais">
      {socialNetworks.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={itemClassName}
          title={label}
          aria-label={label}
        >
          <Icon className={iconClassName} aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}
