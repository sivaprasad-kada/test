import { Link2 } from "lucide-react";

const footerLinks = {
  Product: ["Features", "Integrations", "Pricing", "API Docs"],
  Resources: ["Blog", "Support", "Case Studies", "Developer Portal"],
  Company: ["About Us", "Careers", "Legal", "Privacy"],
};

const Footer = () => {
  return (
    <footer className="py-16 px-6 border-t border-border bg-card">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 font-bold text-lg mb-4">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <Link2 size={14} className="text-primary-foreground" />
              </div>
              <span>Shortly</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The world's most trusted link management platform. Built for performance and designed for simplicity.
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">© 2024 Shortly Inc. Built with love for the open web.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
