"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import PreConstructionBasePage from '@/components/PreCon/PreConstructionBasePage';

const LandscapeArchitectPage: React.FC = () => {
  const params = useParams();
  const slug = params?.slug as string || '';

  return <PreConstructionBasePage slug={slug} pageType="landscape-architect" teamType="landscape-architect" />;
};

export default LandscapeArchitectPage;

