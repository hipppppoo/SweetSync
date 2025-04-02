import React from 'react';
import FallingHearts from './FallingHearts';

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen">
      <FallingHearts />
      <div className="relative z-10 pt-20">
        {children}
      </div>
    </div>
  );
};

export default PageLayout; 