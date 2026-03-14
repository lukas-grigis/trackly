import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="track-pattern flex flex-col items-center justify-center py-24 text-center gap-4 rounded-2xl">
      <div className="font-display text-8xl font-black text-primary">404</div>
      <h1 className="text-2xl font-bold">{t.notFound}</h1>
      <p className="text-muted-foreground">{t.notFoundDesc}</p>
      <Button render={<Link to="/" />}>{t.goHome}</Button>
    </div>
  );
}
