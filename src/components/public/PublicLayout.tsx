import { Outlet, Link } from 'react-router-dom';
import { PublicTenantProvider, usePublicTenant } from '@/contexts/PublicTenantContext';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';

function PublicLayoutInner() {
  const { tenant, loading, notFound, error } = usePublicTenant();

  const themeStyles = useMemo(() => {
    if (!tenant) return {};
    const primary = tenant.theme_primary_color || '';
    const buttonPlus = tenant.theme_button_plus_color || primary || '';
    const header = tenant.theme_header_color || '';
    const pageBg = tenant.theme_background_color || tenant.theme_bg_color || '';
    const cardBg = tenant.card_background_color || '';
    const font = tenant.theme_font || '';
    const priceColor = tenant.price_color || primary || '';
    const buttonColor = tenant.button_color || primary || '';

    const vars: Record<string, string> = {};
    if (primary) vars['--brand'] = primary;
    if (buttonPlus) vars['--brand-button-plus'] = buttonPlus;
    if (header) vars['--brand-header'] = header;
    if (pageBg) vars['--brand-page-bg'] = pageBg;
    if (cardBg) vars['--brand-card-bg'] = cardBg;
    if (font) vars['--brand-font'] = `'${font}', sans-serif`;
    if (priceColor) vars['--brand-price'] = priceColor;
    if (buttonColor) vars['--brand-button'] = buttonColor;

    return vars;
  }, [tenant]);

  const fontImport = useMemo(() => {
    const f = tenant?.theme_font;
    if (f && f !== 'Plus Jakarta Sans') {
      return `https://fonts.googleapis.com/css2?family=${f.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;
    }
    return null;
  }, [tenant?.theme_font]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <span className="text-6xl block mb-4">⚠️</span>
          <h1 className="text-xl font-bold text-foreground">Erro</h1>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Link to="/">
            <Button className="mt-6 gradient-primary text-primary-foreground border-0">Voltar</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
          <p className="text-muted-foreground">Restaurante não encontrado. Verifique o link.</p>
          <Link to="/" className="text-primary mt-4 inline-block hover:underline">Voltar ao início</Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="public-theme-root min-h-screen"
      style={{
        ...themeStyles,
        backgroundColor: 'var(--brand-page-bg, hsl(var(--background)))',
        fontFamily: 'var(--brand-font, inherit)',
      } as React.CSSProperties}
    >
      {fontImport && <link rel="stylesheet" href={fontImport} />}
      <Outlet />
    </div>
  );
}

export default function PublicLayout() {
  return (
    <PublicTenantProvider>
      <PublicLayoutInner />
    </PublicTenantProvider>
  );
}
