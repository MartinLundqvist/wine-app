import { Link } from "react-router-dom";
import { Wine } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-primary no-underline"
          >
            <Wine className="w-5 h-5" />
            <span className="font-serif text-lg font-semibold">Wine App</span>
          </Link>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Lynden Solutions. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
