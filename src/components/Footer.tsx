
import React from 'react';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { i18n } = useTranslation();

  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-600">
              © 2024 BaSSco (Bavarian Software Solution), München
            </p>
          </div>
          
          <div className="flex space-x-6">
            <a href="/impressum" className="text-sm text-gray-600 hover:text-black">
              Impressum
            </a>
            <a href="/datenschutz" className="text-sm text-gray-600 hover:text-black">
              Datenschutz
            </a>
            <a href="/agb" className="text-sm text-gray-600 hover:text-black">
              AGB
            </a>
            <a href="/kontakt" className="text-sm text-gray-600 hover:text-black">
              Kontakt
            </a>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Kontakt: mail(at)matbakh(dot)app
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
