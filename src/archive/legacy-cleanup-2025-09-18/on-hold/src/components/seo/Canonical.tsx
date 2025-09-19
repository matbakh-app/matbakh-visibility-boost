import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const stripWww = (host: string) => host.replace(/^www\./, '');
const PRIMARY_HOST = 'matbakh.app';

export default function Canonical() {
  const { pathname, search } = useLocation();
  const canonicalUrl = `https://${PRIMARY_HOST}${pathname}${search || ''}`;
  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
}
