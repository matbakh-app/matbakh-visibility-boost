import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation('common');

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">{t('404.title', 'Seite nicht gefunden')}</h1>
        <p className="text-xl text-gray-600 mb-4">{t('404.description', 'Die angeforderte Seite existiert nicht oder wurde verschoben.')}</p>
        <Link to="/" className="text-blue-500 hover:text-blue-700 underline">
          {t('404.backToHome', 'Zurück zur Startseite')}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
