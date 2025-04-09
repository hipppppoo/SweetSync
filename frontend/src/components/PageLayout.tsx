import React from 'react';
import { Outlet } from 'react-router-dom';
import FallingHearts from './FallingHearts';

const PageLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen">
      <FallingHearts />
      <div className="relative z-10 pt-20">
        <Outlet />
      </div>
    </div>
  );
};

export default PageLayout; 