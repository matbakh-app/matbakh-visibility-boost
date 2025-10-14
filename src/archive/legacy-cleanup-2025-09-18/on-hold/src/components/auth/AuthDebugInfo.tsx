import React from 'react';
import { useTranslation } from 'react-i18next';

interface AuthDebugInfoProps {
  show?: boolean;
}

const AuthDebugInfo: React.FC<AuthDebugInfoProps> = ({ show = process.env.NODE_ENV === 'development' }) => {
  const { i18n } = useTranslation();
  
  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-gray-100 p-2 text-xs border rounded shadow-sm">
      <div><strong>Debug Info:</strong></div>
      <div>Language: {i18n.language}</div>
      <div>Loaded Languages: {i18n.languages?.join(', ')}</div>
      <div>Namespaces: {Object.keys(i18n.reportNamespaces || {}).join(', ')}</div>
      <div>Ready: {i18n.isInitialized ? 'Yes' : 'No'}</div>
    </div>
  );
};

export default AuthDebugInfo;