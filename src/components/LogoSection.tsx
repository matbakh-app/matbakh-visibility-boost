
import React from 'react';
import Logo from './Logo';

const LogoSection: React.FC = () => {
  return (
    <section className="py-12 px-4 bg-white">
      <div className="max-w-7xl mx-auto text-center">
        <Logo size="hero" className="mx-auto" />
      </div>
    </section>
  );
};

export default LogoSection;
